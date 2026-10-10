import { Carta, tipo, valorPos } from './cartas';

// Todos os jogos possíveis: trincas (3 cartas) e dobras (4 cartas).
export interface Jogo {
  id: number;
  tam: 3 | 4;
  slots: Carta[]; // a dobra de iguais repete um tipo
  seq: boolean;
  naipe: number; // só sequência
  pos: number; // só sequência: posição da primeira carta (1..14, 14 = Ás alto)
  valor: number; // só iguais
}

function criar(): Jogo[] {
  const lista: Omit<Jogo, 'id'>[] = [];
  for (let n = 0; n < 4; n++) {
    for (let p = 1; p <= 12; p++)
      lista.push({ tam: 3, slots: [0, 1, 2].map(i => tipo(valorPos(p + i), n)), seq: true, naipe: n, pos: p, valor: 0 });
    for (let p = 1; p <= 11; p++)
      lista.push({ tam: 4, slots: [0, 1, 2, 3].map(i => tipo(valorPos(p + i), n)), seq: true, naipe: n, pos: p, valor: 0 });
  }
  for (let v = 1; v <= 13; v++) {
    for (let fora = 0; fora < 4; fora++) {
      const tres = [0, 1, 2, 3].filter(n => n !== fora);
      lista.push({ tam: 3, slots: tres.map(n => tipo(v, n)), seq: false, naipe: -1, pos: 0, valor: v });
      for (const rep of tres)
        lista.push({ tam: 4, slots: [...tres.map(n => tipo(v, n)), tipo(v, rep)], seq: false, naipe: -1, pos: 0, valor: v });
    }
  }
  return lista.map((j, id) => ({ ...j, id }));
}

export const JOGOS: Jogo[] = criar();
export const TRINCAS = JOGOS.filter(j => j.tam === 3);
export const DOBRAS = JOGOS.filter(j => j.tam === 4);

// jogos que têm a carta t
export const TRINCAS_POR_CARTA: Jogo[][] = Array.from({ length: 52 }, (_, t) => TRINCAS.filter(j => j.slots.includes(t)));
export const DOBRAS_POR_CARTA: Jogo[][] = Array.from({ length: 52 }, (_, t) => DOBRAS.filter(j => j.slots.includes(t)));

