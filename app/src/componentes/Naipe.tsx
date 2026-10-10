import { Fragment, ReactNode } from 'react';

// Pintas desenhadas em SVG (alguns celulares mostram ♥ e ♦ como emoji).
const CAMINHOS = [
  // espadas
  'M12 1.5c-2.6 3.7-8.6 7-8.6 11.6 0 2.9 2.2 4.8 4.7 4.8 1.4 0 2.6-.6 3.3-1.5-.3 2.2-1.2 3.9-2.7 5.1h6.6c-1.5-1.2-2.4-2.9-2.7-5.1.7.9 1.9 1.5 3.3 1.5 2.5 0 4.7-1.9 4.7-4.8 0-4.6-6-7.9-8.6-11.6z',
  // copas
  'M12 21.6S2.4 15.8 2.4 9c0-3.2 2.4-5.6 5.4-5.6 1.9 0 3.4 1 4.2 2.5.8-1.5 2.3-2.5 4.2-2.5 3 0 5.4 2.4 5.4 5.6 0 6.8-9.6 12.6-9.6 12.6z',
  // paus
  'M12 1.8a4.6 4.6 0 0 0-4.4 6 4.6 4.6 0 1 0 1.6 8.1c.6-.3 1.1-.7 1.5-1.2-.2 2.6-1.2 4.7-2.8 6h8.2c-1.6-1.3-2.6-3.4-2.8-6 .4.5.9.9 1.5 1.2a4.6 4.6 0 1 0 1.6-8.1 4.6 4.6 0 0 0-4.4-6z',
  // ouros
  'M12 1.2 20.4 12 12 22.8 3.6 12z',
];

export const corDoNaipe = (n: number) => (n % 2 === 1 ? 'var(--vermelho-carta)' : 'var(--preto-carta)');

export function Naipe({ n, tam = '1em', cor }: { n: number; tam?: string | number; cor?: string }) {
  return (
    <svg className="naipe" viewBox="0 0 24 24" width={tam} height={tam} aria-hidden="true" style={{ color: cor ?? corDoNaipe(n) }}>
      <path d={CAMINHOS[n]} fill="currentColor" />
    </svg>
  );
}

const SIMBOLOS = '♠♥♣♦';

// Texto que troca ♠ ♥ ♣ ♦ pelas pintas desenhadas.
export function ComNaipes({ children }: { children: string }) {
  const partes: ReactNode[] = [];
  let buf = '';
  for (const ch of children) {
    const n = SIMBOLOS.indexOf(ch);
    if (n < 0) { buf += ch; continue; }
    if (buf) partes.push(buf);
    buf = '';
    partes.push(<Naipe key={partes.length} n={n} tam="0.95em" cor={n % 2 ? 'var(--vermelho-texto)' : 'currentColor'} />);
  }
  if (buf) partes.push(buf);
  return <>{partes.map((p, i) => <Fragment key={i}>{p}</Fragment>)}</>;
}
