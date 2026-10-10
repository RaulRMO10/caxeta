import { CSSProperties, useMemo } from 'react';

const CORES = ['#f2c14e', '#ffffff', '#c8102e', '#7dd3fc', '#c084fc', '#22c55e'];

export function Confete({ quantidade = 60 }: { quantidade?: number }) {
  const pedacos = useMemo(() => Array.from({ length: quantidade }, () => ({
    x: Math.random() * 100,
    atraso: Math.random() * 0.6,
    duracao: 1.8 + Math.random() * 1.6,
    giro: (Math.random() - 0.5) * 1440,
    deriva: (Math.random() - 0.5) * 160,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    largura: 6 + Math.random() * 6,
    redondo: Math.random() < 0.3,
  })), [quantidade]);
  return (
    <div className="confete" aria-hidden="true">
      {pedacos.map((p, i) => (
        <span key={i} style={{
          left: `${p.x}%`, background: p.cor, width: p.largura, height: p.redondo ? p.largura : p.largura * 1.8,
          borderRadius: p.redondo ? '50%' : 2, animationDelay: `${p.atraso}s`, animationDuration: `${p.duracao}s`,
          '--giro': `${p.giro}deg`, '--deriva': `${p.deriva}px`,
        } as CSSProperties} />
      ))}
    </div>
  );
}
