import { CAMINHOS_NAIPE } from './Naipe';

// Ilustração das figuras (rei, dama e valete), com duas cabeças como no baralho de verdade.
// Cada metade é desenhada numa caixa de 50 x 50; a de baixo é a mesma, girada.

const LINHA = '#2b1d0e';
const PELE = '#f6d6ae';
const OURO = '#e8b23a';
const OURO_ESCURO = '#b98418';
const AZUL = '#24418f';
const VERMELHO = '#c8102e';
const BRANCO = '#fffaf0';

interface Cores {
  roupa: string; // cor principal da roupa
  detalhe: string; // pedras, flor, boina
  naipe: string; // cor da pinta
}

const traco = { stroke: LINHA, strokeWidth: 0.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function PintaNoCanto({ n, cor }: { n: number; cor: string }) {
  return <path d={CAMINHOS_NAIPE[n]} fill={cor} transform="translate(2.6 2.6) scale(0.32)" />;
}

function Rei({ c }: { c: Cores }) {
  const barba = '#8a5a2b';
  return (
    <g>
      {/* manto e faixa dourada */}
      <path d="M3.5 50 5 41.5C6.5 37.6 10 35.6 16 35h18c6 .6 9.5 2.6 11 6.5l1.5 8.5Z" fill={c.roupa} {...traco} />
      <path d="M22 35h6l1 15h-8Z" fill={OURO} {...traco} />
      <path d="M8.6 50l.9-7.4M41.4 50l-.9-7.4" fill="none" stroke={OURO} strokeWidth="1.2" />
      {/* gola de arminho */}
      <path d="M14 36c4-4 18-4 22 0-4 3-18 3-22 0Z" fill={BRANCO} {...traco} />
      <circle cx="19" cy="36.4" r=".75" fill={LINHA} />
      <circle cx="25" cy="35.6" r=".75" fill={LINHA} />
      <circle cx="31" cy="36.4" r=".75" fill={LINHA} />
      {/* rosto, cabelo e barba */}
      <path d="M17.4 20c-.9-5 .9-8 3.6-8.6v2.8c-1.6 1-2 3-2 6Z M32.6 20c.9-5-.9-8-3.6-8.6v2.8c1.6 1 2 3 2 6Z" fill={barba} />
      <ellipse cx="25" cy="19.6" rx="7" ry="7.6" fill={PELE} {...traco} />
      <path d="M17.6 21c0 8 3.4 13 7.4 13.6 4-.6 7.4-5.6 7.4-13.6-2.6 3.2-12.2 3.2-14.8 0Z" fill={barba} {...traco} />
      <path d="M21 24.2c2-1.6 3.4-1.2 4-.4.6-.8 2-1.2 4 .4-2 .5-3 .7-4 .3-1 .4-2 .2-4-.3Z" fill="#5e3a18" />
      <path d="M23.4 26.6c1 .5 2.2.5 3.2 0" fill="none" stroke={LINHA} strokeWidth=".55" />
      <circle cx="22.4" cy="19.2" r=".8" fill={LINHA} />
      <circle cx="27.6" cy="19.2" r=".8" fill={LINHA} />
      <path d="M20.8 17.2c.9-.6 1.9-.6 2.6-.1M26.6 17.1c.7-.5 1.7-.5 2.6.1" fill="none" stroke={LINHA} strokeWidth=".5" />
      {/* coroa */}
      <path d="M16.5 13 17.6 4.4 21 8.4 25 2.4l4 6 3.4-4 1.1 8.6Z" fill={OURO} {...traco} />
      <rect x="16.4" y="11.4" width="17.2" height="2.8" rx=".8" fill={OURO_ESCURO} {...traco} />
      <circle cx="25" cy="2.4" r="1.3" fill={c.detalhe} {...traco} />
      <circle cx="17.6" cy="4.4" r="1" fill={c.detalhe} {...traco} />
      <circle cx="32.4" cy="4.4" r="1" fill={c.detalhe} {...traco} />
      <circle cx="21" cy="12.8" r=".75" fill={c.detalhe} />
      <circle cx="25" cy="12.8" r=".9" fill={BRANCO} />
      <circle cx="29" cy="12.8" r=".75" fill={c.detalhe} />
      {/* cetro */}
      <path d="M41 49V23" stroke={OURO_ESCURO} strokeWidth="1.7" />
      <circle cx="41" cy="20.6" r="2.5" fill={OURO} {...traco} />
      <path d="M41 18.1v-2.8M39.6 16.6h2.8" fill="none" stroke={LINHA} strokeWidth=".8" />
      <ellipse cx="41" cy="40.4" rx="2.2" ry="1.9" fill={PELE} {...traco} />
    </g>
  );
}

function Dama({ c }: { c: Cores }) {
  const cabelo = '#b8742a';
  return (
    <g>
      {/* cabelo comprido atrás */}
      <path d="M15 31c-2-10 1-21 10-21s12 11 10 21c-2 2-4 2-5 1V22H20v10c-1 1-3 1-5-1Z" fill={cabelo} {...traco} />
      {/* vestido, decote e pérolas */}
      <path d="M4 50 5.6 42c1.6-3.8 5.2-6 11.4-6.5h16c6.2.5 9.8 2.7 11.4 6.5L46 50Z" fill={c.roupa} {...traco} />
      <path d="M9 50l.9-7.6M41 50l-.9-7.6" fill="none" stroke={OURO} strokeWidth="1.2" />
      <path d="M17.6 35.5c3 5 11.8 5 14.8 0Z" fill={PELE} {...traco} />
      {[[19.6, 36.9], [21.4, 38.3], [23.2, 39.1], [25, 39.4], [26.8, 39.1], [28.6, 38.3], [30.4, 36.9]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r=".75" fill={BRANCO} stroke={LINHA} strokeWidth=".3" />
      ))}
      <path d="M22.5 41.5h5l-.8 8.5h-3.4Z" fill={OURO} {...traco} />
      {/* rosto */}
      <ellipse cx="25" cy="21" rx="6.4" ry="7.2" fill={PELE} {...traco} />
      <path d="M18.6 19.4c.4-5 3.4-6.9 6.4-6.9s6 1.9 6.4 6.9c-2.4-2.6-4.4-3-6.4-2.1-2-.9-4-.5-6.4 2.1Z" fill={cabelo} {...traco} />
      <circle cx="21.4" cy="23.8" r="1.2" fill="#f19a9a" opacity=".55" />
      <circle cx="28.6" cy="23.8" r="1.2" fill="#f19a9a" opacity=".55" />
      <circle cx="22.7" cy="21.2" r=".75" fill={LINHA} />
      <circle cx="27.3" cy="21.2" r=".75" fill={LINHA} />
      <path d="M21.6 19.6c.7-.4 1.5-.4 2.1 0M26.3 19.6c.6-.4 1.4-.4 2.1 0" fill="none" stroke={LINHA} strokeWidth=".45" />
      <path d="M23.4 25.4c1 .8 2.2.8 3.2 0" fill="none" stroke={VERMELHO} strokeWidth="1" />
      {/* tiara */}
      <path d="M18.6 12.8c.4-3.4 1.9-4.6 2.9-4.6l1.5 2 2-4.6 2 4.6 1.5-2c1 0 2.5 1.2 2.9 4.6Z" fill={OURO} {...traco} />
      <circle cx="25" cy="5.4" r="1.2" fill={c.detalhe} {...traco} />
      <circle cx="21.3" cy="11.3" r=".7" fill={c.detalhe} />
      <circle cx="28.7" cy="11.3" r=".7" fill={c.detalhe} />
      {/* rosa na mão */}
      <path d="M9.6 46c.6-6 1.6-11 2.6-15" fill="none" stroke="#2f7a3a" strokeWidth="1.1" />
      <path d="M11.4 37c-2.6-.6-3.6-2.2-3.4-3.2 1.8.2 3.2 1.4 3.4 3.2Z" fill="#2f7a3a" />
      <circle cx="12.4" cy="29.6" r="2.7" fill={c.detalhe === AZUL ? '#d63a5a' : c.detalhe} {...traco} />
      <path d="M11.1 29.5c.8-1 2-1 2.5.1M11.8 30.8c.6.4 1.4.3 1.8-.2" fill="none" stroke={LINHA} strokeWidth=".45" />
      <ellipse cx="10.6" cy="40.4" rx="2.1" ry="1.8" fill={PELE} {...traco} />
    </g>
  );
}

function Valete({ c }: { c: Cores }) {
  const cabelo = '#8a5426';
  return (
    <g>
      {/* túnica e gola franzida */}
      <path d="M4 50 5.6 42.4c1.6-3.8 5.2-5.9 11.4-6.4h16c6.2.5 9.8 2.6 11.4 6.4L46 50Z" fill={c.roupa} {...traco} />
      <path d="M23 36h4l.6 14h-5.2Z" fill={OURO} {...traco} />
      <path d="M9 50l.9-7.4M41 50l-.9-7.4" fill="none" stroke={OURO} strokeWidth="1.2" />
      <path d="M15 36.6 17 33.8l2 2.5 2-2.5 2 2.5 2-2.5 2 2.5 2-2.5 2 2.5 2-2.5 2 2.8c-5 2.2-15 2.2-20 0Z" fill={BRANCO} {...traco} />
      {/* rosto e cabelo */}
      <circle cx="18.6" cy="25" r="1.8" fill={cabelo} {...traco} />
      <circle cx="31.4" cy="25" r="1.8" fill={cabelo} {...traco} />
      <ellipse cx="25" cy="22.6" rx="6.3" ry="7" fill={PELE} {...traco} />
      <path d="M18.4 21.6c-1.2-4.6 1-8.2 6.6-8.2s7.8 3.6 6.6 8.2c-1-1.8-2.2-3-3.2-3.4h-6.8c-1 .4-2.2 1.6-3.2 3.4Z" fill={cabelo} {...traco} />
      <circle cx="22.8" cy="22.4" r=".75" fill={LINHA} />
      <circle cx="27.2" cy="22.4" r=".75" fill={LINHA} />
      <path d="M21.7 20.7c.6-.3 1.3-.3 1.9 0M26.4 20.7c.6-.3 1.3-.3 1.9 0" fill="none" stroke={LINHA} strokeWidth=".45" />
      <path d="M23.5 26.4c1 .8 2 .8 3 0" fill="none" stroke={LINHA} strokeWidth=".6" />
      {/* boina com pena */}
      <path d="M14.8 15.6c0-6 5.2-8.6 11.2-8.6s10 2.6 10 6.6c-3 1.6-14 3.1-21.2 2Z" fill={c.detalhe} {...traco} />
      <path d="M15.3 15.6c6.7 1.2 15.7.2 20.5-2v1.6c-4.8 2.2-13.8 3.2-20.6 2Z" fill={OURO} {...traco} />
      <path d="M30 8c3-5 8.6-7 14-6-3.5 1.5-6.5 4-8.5 8-1.5-.5-3.5-1-5.5-2Z" fill={BRANCO} {...traco} />
      <path d="M31 8.2c4-2.7 8-4.6 12-5.8" fill="none" stroke={LINHA} strokeWidth=".4" />
      {/* lança */}
      <path d="M41.5 50V21" stroke="#7a5230" strokeWidth="1.4" />
      <path d="M41.5 13.4 44 19.6l-2.5 2-2.5-2Z" fill="#cdd2da" {...traco} />
      <ellipse cx="41.5" cy="40.6" rx="2.1" ry="1.8" fill={PELE} {...traco} />
    </g>
  );
}

export function ArteFigura({ valor, naipe }: { valor: number; naipe: number }) {
  const vermelho = naipe % 2 === 1;
  const cores: Cores = {
    roupa: vermelho ? VERMELHO : AZUL,
    detalhe: vermelho ? AZUL : VERMELHO,
    naipe: vermelho ? VERMELHO : '#1c1c22',
  };
  const Pessoa = valor === 13 ? Rei : valor === 12 ? Dama : Valete;
  const metade = (
    <>
      <Pessoa c={cores} />
      <PintaNoCanto n={naipe} cor={cores.naipe} />
    </>
  );
  return (
    <svg className="figura-arte" viewBox="-3 -1 56 102" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g>{metade}</g>
      <g transform="rotate(180 25 50)">{metade}</g>
      <path d="M-3 50h56" stroke={OURO_ESCURO} strokeWidth=".6" />
    </svg>
  );
}
