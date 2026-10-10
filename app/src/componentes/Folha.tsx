import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icone } from './Icone';

// Painel que sobe de baixo (ou ocupa a tela toda), com animação de entrada e saída.
export function Folha({ aberta, aoFechar, titulo, children, cheia = false, rodape }: {
  aberta: boolean;
  aoFechar: () => void;
  titulo?: ReactNode;
  children: ReactNode;
  cheia?: boolean;
  rodape?: ReactNode;
}) {
  const [montada, setMontada] = useState(aberta);
  useEffect(() => {
    if (aberta) { setMontada(true); return; }
    const t = setTimeout(() => setMontada(false), 260);
    return () => clearTimeout(t);
  }, [aberta]);
  if (!montada) return null;
  // vai direto no body para nunca ficar presa dentro de outra tela
  return createPortal(
    <div className={`folha-fundo ${aberta ? 'entrando' : 'saindo'}`} onClick={aoFechar}>
      <div className={`folha ${cheia ? 'folha-cheia' : ''}`} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="folha-topo">
          <div className="folha-alca" />
          {titulo && <h2 className="folha-titulo">{titulo}</h2>}
          <button className="botao-icone folha-fechar" onClick={aoFechar} aria-label="Fechar"><Icone nome="fechar" /></button>
        </div>
        <div className="folha-corpo">{children}</div>
        {rodape && <div className="folha-rodape">{rodape}</div>}
      </div>
    </div>,
    document.body,
  );
}
