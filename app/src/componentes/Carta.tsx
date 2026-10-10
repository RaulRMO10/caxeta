import { CSSProperties } from 'react';
import { Carta as TipoCarta, JOKER, naipeDe, nomeCarta, valorDe, VALORES } from '../motor/cartas';
import { Naipe } from './Naipe';

// Posição das pintas no meio da carta (em %), para cartas grandes.
const PIPS: Record<number, [number, number][]> = {
  2: [[50, 18], [50, 82]],
  3: [[50, 18], [50, 50], [50, 82]],
  4: [[30, 18], [70, 18], [30, 82], [70, 82]],
  5: [[30, 18], [70, 18], [50, 50], [30, 82], [70, 82]],
  6: [[30, 18], [70, 18], [30, 50], [70, 50], [30, 82], [70, 82]],
  7: [[30, 18], [70, 18], [50, 34], [30, 50], [70, 50], [30, 82], [70, 82]],
  8: [[30, 18], [70, 18], [50, 34], [30, 50], [70, 50], [50, 66], [30, 82], [70, 82]],
  9: [[30, 16], [70, 16], [30, 39], [70, 39], [50, 50], [30, 61], [70, 61], [30, 84], [70, 84]],
  10: [[30, 16], [70, 16], [50, 28], [30, 39], [70, 39], [30, 61], [70, 61], [50, 72], [30, 84], [70, 84]],
};

interface Props {
  c: TipoCarta | null; // null = vaga vazia
  tam?: number; // largura em px
  coringa?: boolean; // é coringa nesta rodada
  vale?: TipoCarta | null; // está no lugar desta carta
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  titulo?: string;
}

export function Carta({ c, tam = 56, coringa, vale, className = '', style, onClick, titulo }: Props) {
  const estilo = { ...style, '--w': `${tam}px` } as CSSProperties;
  const pequena = tam < 46;
  const classes = `carta ${pequena ? 'carta-pequena' : ''} ${coringa ? 'carta-coringa' : ''} ${onClick ? 'carta-clicavel' : ''} ${className}`;
  const Tag = onClick ? 'button' : 'div';

  if (c === null) return <Tag className={`${classes} carta-vazia`} style={estilo} onClick={onClick} aria-label="vaga vazia" />;

  if (c === JOKER) {
    return (
      <Tag className={`${classes} carta-joker`} style={estilo} onClick={onClick} aria-label={titulo ?? 'Joker'}>
        <span className="joker-canto">J<br />O<br />K<br />E<br />R</span>
        <span className="joker-estrela">✦</span>
        {!pequena && <span className="joker-canto baixo">J<br />O<br />K<br />E<br />R</span>}
        {vale != null && <span className="carta-vale">{nomeCarta(vale)}</span>}
      </Tag>
    );
  }

  const v = valorDe(c), n = naipeDe(c);
  const vermelha = n % 2 === 1;
  const rotulo = VALORES[v - 1];
  const figura = v >= 11;
  const canto = (
    <>
      <span className="carta-valor">{rotulo}</span>
      <Naipe n={n} tam="0.78em" />
    </>
  );

  let centro;
  if (pequena) centro = <Naipe n={n} tam={tam * 0.5} />;
  else if (v === 1) centro = <Naipe n={n} tam={tam * 0.56} />;
  else if (figura) {
    centro = (
      <div className="carta-figura">
        <span className="figura-letra">{rotulo}</span>
        <Naipe n={n} tam={tam * 0.26} />
      </div>
    );
  } else if (tam >= 76) {
    centro = (
      <div className="carta-pips">
        {PIPS[v].map(([x, y], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%)${y > 50 ? ' rotate(180deg)' : ''}` }}>
            <Naipe n={n} tam={tam * 0.19} />
          </span>
        ))}
      </div>
    );
  } else centro = <Naipe n={n} tam={tam * 0.42} />;

  return (
    <Tag className={`${classes} ${vermelha ? 'carta-vermelha' : 'carta-preta'}`} style={estilo} onClick={onClick} aria-label={titulo ?? nomeCarta(c)}>
      <span className="carta-canto">{canto}</span>
      <span className="carta-centro">{centro}</span>
      {!pequena && <span className="carta-canto baixo">{canto}</span>}
      {coringa && <span className="carta-estrela" aria-label="coringa">★</span>}
      {vale != null && <span className="carta-vale">{nomeCarta(vale)}</span>}
    </Tag>
  );
}

// Várias cartas lado a lado, um pouco sobrepostas.
export function Leque({ cartas, tam = 44, sobrepor = 0.38, coringa }: { cartas: TipoCarta[]; tam?: number; sobrepor?: number; coringa?: (c: TipoCarta) => boolean }) {
  return (
    <div className="leque" style={{ '--sob': `${-tam * sobrepor}px` } as CSSProperties}>
      {cartas.map((c, i) => <Carta key={i} c={c} tam={tam} coringa={coringa?.(c)} />)}
    </div>
  );
}
