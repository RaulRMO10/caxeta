import { useEffect, useState } from 'react';

// Tela cheia (quando o navegador deixa).
export function useTelaCheia() {
  const [cheia, setCheia] = useState(() => !!document.fullscreenElement);
  useEffect(() => {
    const f = () => setCheia(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', f);
    return () => document.removeEventListener('fullscreenchange', f);
  }, []);
  const suportada = typeof document.documentElement.requestFullscreen === 'function';
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch {
      // o navegador recusou: segue normal
    }
  };
  return { cheia, suportada, alternar };
}

// Mantém a tela do celular ligada enquanto tem partida.
export function useTelaLigada(ativo: boolean) {
  useEffect(() => {
    if (!ativo || !('wakeLock' in navigator)) return;
    let trava: WakeLockSentinel | null = null;
    const pedir = async () => {
      try { trava = await navigator.wakeLock.request('screen'); } catch { /* sem permissão */ }
    };
    const aoVoltar = () => { if (document.visibilityState === 'visible') pedir(); };
    pedir();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      document.removeEventListener('visibilitychange', aoVoltar);
      trava?.release().catch(() => {});
    };
  }, [ativo]);
}

// Número que sobe/desce animado até o valor.
export function useContador(valor: number, duracao = 700) {
  const [mostrado, setMostrado] = useState(valor);
  useEffect(() => {
    const inicio = performance.now();
    const de = mostrado;
    if (de === valor) return;
    let id = 0;
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracao);
      const suave = 1 - Math.pow(1 - p, 3);
      setMostrado(Math.round(de + (valor - de) * suave));
      if (p < 1) id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [valor]); // só reage ao valor novo; o ponto de partida é o número já mostrado
  return mostrado;
}
