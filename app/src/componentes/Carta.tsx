import { CSSProperties } from 'react';
import { Carta as TipoCarta, JOKER, naipeDe, nomeCarta, valorDe, VALORES } from '../motor/cartas';
import { ArteFigura } from './Figuras';
import { Naipe } from './Naipe';

// Posição das pintas na carta (em % da carta), como no baralho de verdade:
// duas colunas afastadas dos cantos, para não encostar no número.
const E = 33, D = 67, M = 50;
const PIPS: Record<number, [number, number][]> = {
  2: [[M, 20], [M, 80]],
  3: [[M, 20], [M, 50], [M, 80]],
  4: [[E, 20], [D, 20], [E, 80], [D, 80]],
  5: [[E, 20], [D, 20], [M, 50], [E, 80], [D, 80]],
  6: [[E, 20], [D, 20], [E, 50], [D, 50], [E, 80], [D, 80]],
  7: [[E, 20], [D, 20], [M, 35], [E, 50], [D, 50], [E, 80], [D, 80]],
  8: [[E, 20], [D, 20], [M, 35], [E, 50], [D, 50], [M, 65], [E, 80], [D, 80]],
  9: [[E, 20], [D, 20], [E, 40], [D, 40], [M, 50], [E, 60], [D, 60], [E, 80], [D, 80]],
  10: [[E, 20], [D, 20], [M, 30], [E, 40], [D, 40], [E, 60], [D, 60], [M, 70], [E, 80], [D, 80]],
};

const OURO_FIGURA = '#e2a92b';

// Coroa do rei, tiara da dama e chapéu com pena do valete.
function SimboloFigura({ valor, tam }: { valor: number; tam: number }) {
  return (
    <svg className="figura-simbolo" viewBox="0 0 24 24" width={tam} height={tam} aria-hidden="true">
      {valor === 13 && (
        <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
          <path d="M3 17.5 4.6 7.6 9 11.6 12 4.6 15 11.6 19.4 7.6 21 17.5Z" fill={OURO_FIGURA} />
          <rect x="3" y="17.5" width="18" height="3.2" rx="1" fill="currentColor" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="4.5" cy="7" r="1.2" fill="currentColor" />
          <circle cx="19.5" cy="7" r="1.2" fill="currentColor" />
        </g>
      )}
      {valor === 12 && (
        <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
          <path d="M4 18c0-6 2-8 4-8l2 3 2-6 2 6 2-3c2 0 4 2 4 8Z" fill={OURO_FIGURA} />
          <rect x="4" y="18" width="16" height="2.8" rx="1.4" fill="currentColor" />
          <circle cx="12" cy="5.6" r="1.7" fill="currentColor" />
          <circle cx="12" cy="14.6" r="1.3" fill="#fffdf6" />
        </g>
      )}
      {valor === 11 && (
        <g stroke="currentColor" strokeWidth="1" strokeLinejoin="round">
          <path d="M12.6 8.4c1-4 4.2-6.2 8.8-6-2 1.4-4 3.6-5.2 6.2" fill="currentColor" />
          <path d="M3.5 17c1-6.5 5-9 9.5-9s7 2.5 7.5 7v2Z" fill={OURO_FIGURA} />
          <rect x="3" y="17" width="18" height="3" rx="1.2" fill="currentColor" />
        </g>
      )}
    </svg>
  );
}

// J, Q e K: moldura com filete dourado; nas cartas grandes, o desenho da figura com duas cabeças.
function Figura({ valor, n, tam }: { valor: number; n: number; tam: number }) {
  const letra = VALORES[valor - 1];
  if (tam < 50) {
    return (
      <div className="carta-figura">
        <SimboloFigura valor={valor} tam={tam * 0.24} />
        <span className="figura-letra" style={{ fontSize: tam * 0.28 }}>{letra}</span>
        <Naipe n={n} tam={tam * 0.15} />
      </div>
    );
  }
  return (
    <div className="carta-figura com-arte">
      <ArteFigura valor={valor} naipe={n} />
    </div>
  );
}

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

function ChapeuJoker({ tam }: { tam: number }) {
  return (
    <svg className="joker-chapeu" viewBox="0 0 64 64" width={tam} height={tam} aria-hidden="true">
      <g stroke="#2a1060" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M16 42C10 32 7 23 5 14c10 4 17 14 21 28Z" fill="#ffd56b" />
        <path d="M24 42c2-14 5-25 8-35 3 10 6 21 8 35Z" fill="#e0455d" />
        <path d="M38 42c4-14 11-24 21-28-2 9-5 18-11 28Z" fill="#ffd56b" />
        <circle cx="5" cy="13" r="4" fill="#ffd56b" />
        <circle cx="32" cy="6" r="4" fill="#ffd56b" />
        <circle cx="59" cy="13" r="4" fill="#ffd56b" />
        <rect x="13" y="41" width="38" height="9" rx="3" fill="#e0455d" />
      </g>
      <circle cx="22" cy="45.5" r="1.7" fill="#ffd56b" />
      <circle cx="32" cy="45.5" r="1.7" fill="#ffd56b" />
      <circle cx="42" cy="45.5" r="1.7" fill="#ffd56b" />
      <path d="M24 55q8 6 16 0" fill="none" stroke="#ffd56b" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Carta({ c, tam = 56, coringa, vale, className = '', style, onClick, titulo }: Props) {
  const estilo = { ...style, '--w': `${tam}px` } as CSSProperties;
  const pequena = tam < 46;
  const classes = `carta ${pequena ? 'carta-pequena' : ''} ${coringa ? 'carta-coringa' : ''} ${onClick ? 'carta-clicavel' : ''} ${className}`;
  const Tag = onClick ? 'button' : 'div';

  if (c === null) return <Tag className={`${classes} carta-vazia`} style={estilo} onClick={onClick} aria-label="vaga vazia" />;

  if (c === JOKER) {
    const letras = <>J<br />O<br />K<br />E<br />R</>;
    return (
      <Tag className={`${classes} carta-joker`} style={estilo} onClick={onClick} aria-label={titulo ?? 'Joker'}>
        <span className="joker-canto">{letras}</span>
        <span className="joker-centro"><ChapeuJoker tam={tam * (pequena ? 0.7 : 0.6)} /></span>
        {!pequena && <span className="joker-canto baixo">{letras}</span>}
        {vale != null && <span className="carta-vale">{nomeCarta(vale)}</span>}
      </Tag>
    );
  }

  const v = valorDe(c), n = naipeDe(c);
  const vermelha = n % 2 === 1;
  const canto = (
    <>
      <span className={`carta-valor ${v === 10 ? 'dez' : ''}`}>{VALORES[v - 1]}</span>
      <Naipe n={n} tam="0.74em" />
    </>
  );

  let centro;
  if (pequena) centro = <span className="carta-centro"><Naipe n={n} tam={tam * 0.5} /></span>;
  else if (v === 1) {
    centro = (
      <span className="carta-centro carta-as">
        <span className="as-anel" />
        <Naipe n={n} tam={tam * (n === 0 ? 0.5 : 0.44)} />
      </span>
    );
  } else if (v >= 11) centro = <Figura valor={v} n={n} tam={tam} />;
  else if (tam >= 52) {
    centro = (
      <span className="carta-pips">
        {PIPS[v].map(([x, y], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%)${y > 50 ? ' rotate(180deg)' : ''}` }}>
            <Naipe n={n} tam={tam * (tam >= 76 ? 0.18 : 0.16)} />
          </span>
        ))}
      </span>
    );
  } else centro = <span className="carta-centro"><Naipe n={n} tam={tam * 0.42} /></span>;

  return (
    <Tag className={`${classes} ${vermelha ? 'carta-vermelha' : 'carta-preta'}`} style={estilo} onClick={onClick} aria-label={titulo ?? nomeCarta(c)}>
      <span className="carta-canto">{canto}</span>
      {centro}
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
