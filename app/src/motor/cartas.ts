// Cartas: tipo = (valor - 1) * 4 + naipe, com valor 1..13 (A=1, J=11, Q=12, K=13).
// O Joker é o 52 (a cor dele não importa).

export type Carta = number;

export const NAIPES = ['♠', '♥', '♣', '♦'] as const;
export const NOMES_NAIPES = ['Espadas', 'Copas', 'Paus', 'Ouros'] as const;
export const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export const JOKER: Carta = 52;
export const NT = 52;

export const tipo = (valor: number, naipe: number): Carta => (valor - 1) * 4 + naipe;
export const valorDe = (c: Carta) => (c >> 2) + 1;
export const naipeDe = (c: Carta) => c & 3;
export const ehVermelho = (naipe: number) => naipe % 2 === 1;
export const valorPos = (p: number) => (p === 14 ? 1 : p); // posição 14 = Ás depois do K

export const nomeCarta = (c: Carta) =>
  c === JOKER ? 'Joker' : `${VALORES[valorDe(c) - 1]}${NAIPES[naipeDe(c)]}`;

export function carta(txt: string): Carta {
  if (txt === 'Jk' || txt === 'Joker') return JOKER;
  const naipe = NAIPES.indexOf(txt.slice(-1) as (typeof NAIPES)[number]);
  const valor = VALORES.indexOf(txt.slice(0, -1) as (typeof VALORES)[number]) + 1;
  if (naipe < 0 || valor < 1) throw new Error('carta inválida: ' + txt);
  return tipo(valor, naipe);
}

export const cartas = (txt: string) => txt.trim().split(/\s+/).map(carta);

// Coringas da rodada: as cartas de valor seguinte ao da vira, na cor da vira (2 tipos,
// 2 cópias de cada), mais o espelho (a outra cópia da vira).
// O Joker vale uma das cartas do coringa (valor seguinte, na cor da vira).
export interface Contexto {
  vira: Carta;
  valorCoringa: number;
  jokerVale: [Carta, Carta];
  coringas: Carta[]; // os 3 tipos que são coringa
  ehCoringa: (c: Carta) => boolean;
}

export function contextoDaVira(vira: Carta): Contexto {
  const v = valorDe(vira);
  const cor = naipeDe(vira) & 1;
  const valorCoringa = v === 13 ? 1 : v + 1;
  const jt1 = tipo(valorCoringa, cor);
  const jt2 = tipo(valorCoringa, cor + 2);
  const coringas = [jt1, jt2, vira];
  return {
    vira,
    valorCoringa,
    jokerVale: [jt1, jt2],
    coringas,
    ehCoringa: c => c !== JOKER && coringas.includes(c),
  };
}

// Quantas cópias de cada carta existem para quem está jogando (a vira fica na mesa).
export function copiasDisponiveis(c: Carta, vira: Carta | null) {
  if (c === JOKER) return 4;
  return c === vira ? 1 : 2;
}
