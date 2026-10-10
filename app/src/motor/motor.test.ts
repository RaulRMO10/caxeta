import { describe, expect, it } from 'vitest';
import { arranjosPossiveis } from './arranjo';
import { carta, cartas, contextoDaVira, JOKER, nomeCarta } from './cartas';
import { DOBRAS, TRINCAS } from './jogos';
import { calcularBatida, CONFIG_PADRAO, Roleta } from './premios';
import { aplicarBatida, novaPartida, reduzir, funcoes, Partida } from '../estado/partida';

const ctx = (v: string) => contextoDaVira(carta(v));
const semRoleta: Roleta = { trincas: [], quadra: null };
const calc = (mao: string, vira: string, roleta = semRoleta, n = 4) =>
  calcularBatida(cartas(mao), ctx(vira), roleta, CONFIG_PADRAO, n);
const nomes = (r: ReturnType<typeof calc>) => r!.linhas.map(l => `${l.rotulo}:${l.ganha ? 'ganha' : l.pontos}`);

describe('jogos e coringas', () => {
  it('tem 100 trincas e 200 dobras', () => {
    expect(TRINCAS.length).toBe(100);
    expect(DOBRAS.length).toBe(200);
  });
  it('coringas da vira', () => {
    expect(ctx('6♠').coringas.map(nomeCarta).sort()).toEqual(['6♠', '7♠', '7♣'].sort());
    expect(ctx('K♥').coringas.map(nomeCarta).sort()).toEqual(['A♥', 'A♦', 'K♥'].sort());
    expect(ctx('7♥').jokerVale.map(nomeCarta)).toEqual(['8♥', '8♦']);
  });
});

describe('batida', () => {
  it('reconhece batida de 9 e de 10', () => {
    expect(calc('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '2♣')?.total).toBe(10);
    expect(calc('A♥ 2♥ 3♥ 4♥ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣')).not.toBeNull();
    expect(calc('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ K♠', '2♣')).toBeNull();
  });
  it('K-A-2 não vale, Q-K-A vale', () => {
    expect(calc('K♠ A♠ 2♠ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '7♣')).toBeNull();
    expect(calc('Q♠ K♠ A♠ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '7♣')).not.toBeNull();
  });
  it('dobra de iguais precisa repetir uma pinta', () => {
    expect(calc('9♠ 9♠ 9♥ 9♦ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣')).not.toBeNull();
    expect(calc('9♠ 9♣ 9♥ 9♦ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣')).toBeNull();
  });
  it('coringa e Joker', () => {
    // vira 6♠: 7♣ é coringa no lugar do 3♥
    expect(calc('A♥ 2♥ 7♣ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '6♠')).not.toBeNull();
    // vira 7♥: Joker vale 8♥ ou 8♦
    expect(calc('Jk Jk 8♠ A♣ 2♣ 3♣ 4♠ 5♠ 6♠', '7♥')).not.toBeNull();
    expect(calc('4♠ 5♠ Jk A♣ 2♣ 3♣ 4♥ 5♥ 6♥', '7♥')).toBeNull();
  });
  it('três coringas formam um jogo qualquer', () => {
    // vira 6♠: 7♠ 7♣ 6♠ são coringas
    expect(calc('7♠ 7♣ 6♠ 2♥ 3♥ 4♥ 9♦ 10♦ J♦', '6♠')).not.toBeNull();
  });
});

describe('prêmios', () => {
  it('escadas e hierarquia', () => {
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣'))).toEqual(['Batida de 9:10', 'Escada colorida:60']);
    expect(nomes(calc('A♥ 2♥ 3♥ 4♥ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', 'K♣'))).toEqual(['Batida de 10:20', 'Escadão colorido:80']);
    expect(nomes(calc('3♣ 4♣ 5♣ 6♣ 7♣ 8♣ 9♣ 10♣ J♣', 'K♥'))).toEqual(['Batida de 9:10', 'Escada:120']);
    const lenda = calc('A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠', 'J♥')!;
    expect(lenda.ganhaPartida).toBe(true);
  });
  it('coringa desconta 10 de cada prêmio', () => {
    // vira J♥: Q♥ é coringa no lugar do 5♠
    expect(nomes(calc('3♠ 4♠ Q♥ 6♠ 7♠ 8♠ 9♠ 10♠ J♠', 'J♥'))).toEqual(['Batida de 9:10', 'Escada:110']);
  });
  it('coringa no lugar dele mesmo não desconta', () => {
    // vira 4♠: 5♠ é coringa, mas entra como 5♠
    expect(nomes(calc('3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ 10♠ J♠', '4♣'))).toEqual(['Batida de 9:10', 'Escada:120']);
  });
  it('outros prêmios', () => {
    expect(nomes(calc('2♥ 3♥ 4♥ 7♦ 8♦ 9♦ J♥ Q♥ K♥', '5♠'))).toEqual(['Batida de 9:10', 'Cor única:40']);
    expect(nomes(calc('2♣ 3♣ 4♣ 7♣ 8♣ 9♣ J♣ Q♣ K♣', '5♥'))).toEqual(['Batida de 9:10', 'Uma pinta só:60']);
    expect(nomes(calc('7♣ 8♣ 9♣ 7♣ 8♣ 9♣ 5♠ 5♥ 5♦', 'J♥'))).toEqual(['Batida de 9:10', 'Gêmeas:80']);
    expect(nomes(calc('4♥ 5♥ 6♥ 4♠ 5♠ 6♠ 4♦ 5♦ 6♦', 'J♣'))).toContain('Bandeira:120');
    expect(nomes(calc('J♥ Q♥ K♥ A♠ A♣ A♦ Q♦ K♦ A♦', '5♠'))).toEqual(['Batida de 9:10', 'Figuras:40']);
  });
  it('ajuste pelo tamanho da mesa', () => {
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣', semRoleta, 2))).toEqual(['Batida de 9:10', 'Escada colorida:30']);
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣', semRoleta, 6))).toEqual(['Batida de 9:10', 'Escada colorida:80']);
  });
});

describe('roleta', () => {
  const a23 = TRINCAS.find(j => j.slots.join() === cartas('A♥ 2♥ 3♥').join())!.id;
  it('trinca sorteada sem coringa vale', () => {
    expect(nomes(calc('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '7♣', { trincas: [a23], quadra: null }))).toEqual(['Batida de 9:10', 'Trinca da roleta:10']);
  });
  it('com coringa não vale', () => {
    // vira 2♦: 3♦ é coringa no lugar do 2♥
    expect(nomes(calc('A♥ 3♦ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '2♦', { trincas: [a23], quadra: null }))).toEqual(['Batida de 9:10']);
  });
  const dobra = (txt: string) => DOBRAS.find(d => [...d.slots].sort().join() === [...cartas(txt)].sort().join())!.id;
  it('quadra sorteada: só as 4 cartas exatas, sem coringa', () => {
    const q = dobra('9♠ 9♠ 9♥ 9♦');
    expect(nomes(calc('9♠ 9♠ 9♥ 9♦ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♣', { trincas: [], quadra: q }))).toEqual(['Batida de 10:20', 'Quadra da roleta:20']);
    // outra quadra de 9 não vale
    expect(nomes(calc('9♣ 9♣ 9♥ 9♦ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♠', { trincas: [], quadra: q }))).toEqual(['Batida de 10:20']);
    // sequência de 4 sorteada
    const s = dobra('4♥ 5♥ 6♥ 7♥');
    expect(nomes(calc('4♥ 5♥ 6♥ 7♥ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♣', { trincas: [], quadra: s }))).toEqual(['Batida de 10:20', 'Quadra da roleta:20']);
    // vira 6♠: 7♠ é coringa no lugar do 7♥, não vale
    expect(nomes(calc('4♥ 5♥ 6♥ 7♠ 5♣ 6♣ 7♣ 2♦ 3♦ 4♦', '6♠', { trincas: [], quadra: s }))).toEqual(['Batida de 10:20']);
  });
});

describe('arranjos', () => {
  it('acha jogo feito só de coringas', () => {
    const arr = arranjosPossiveis(cartas('7♠ 7♣ 6♠ 2♥ 3♥ 4♥ 9♦ 10♦ J♦'), ctx('6♠'));
    expect(arr.length).toBeGreaterThan(50);
  });
  it('mostra o Joker no lugar certo', () => {
    const r = calc('Jk Jk 8♠ A♣ 2♣ 3♣ 4♠ 5♠ 6♠', '7♥')!;
    const jokers = r.vagas.flat().filter(v => v.carta === JOKER);
    expect(jokers.map(v => nomeCarta(v.representa)).sort()).toEqual(['8♥', '8♦']);
  });
});

describe('subida e descida', () => {
  const nova = () => novaPartida(CONFIG_PADRAO, ['A', 'B', 'C', 'D'].map(nome => ({ nome, cor: '#fff' })), 0);
  const ids = (p: Partida) => p.jogadores.map(j => j.id);
  it('exemplo do REGRAS.txt (em tentos x10)', () => {
    let p = nova();
    p = { ...p, meio: 10, jogadores: p.jogadores.map((j, i) => ({ ...j, pontos: i < 3 ? 20 : 0 })) };
    const r = aplicarBatida(p, ids(p)[3], 20, false);
    expect(r.jogadores.map(j => j.pontos)).toEqual([10, 10, 10, 10]);
    expect(r.meio).toBe(0);
    expect(r.jogadores.every(j => j.vivo)).toBe(true);
  });
  it('quem está sem ponto quando o meio acaba sai', () => {
    let p = nova();
    p = { ...p, meio: 10, jogadores: p.jogadores.map((j, i) => ({ ...j, pontos: i === 0 ? 90 : 0 })) };
    const r = aplicarBatida(p, ids(p)[1], 10, false);
    expect(r.jogadores.map(j => j.vivo)).toEqual([true, true, false, false]);
  });
  it('descida tira de cada um e define o campeão', () => {
    let p = nova();
    p = { ...p, meio: 0, jogadores: p.jogadores.map((j, i) => ({ ...j, pontos: [30, 20, 10, 10][i] })) };
    const r = aplicarBatida(p, ids(p)[1], 30, false);
    expect(r.jogadores.map(j => j.pontos)).toEqual([0, 20, 0, 0]);
    expect(r.campeaoId).toBe(ids(p)[1]);
  });
  it('rodízio: quem começou passa a embaralhar', () => {
    let p: Partida | null = nova();
    expect(funcoes(p!)).toEqual({ embaralha: ids(p!)[0], corta: ids(p!)[3], comeca: ids(p!)[1] });
    p = reduzir(p, { tipo: 'bateu', vencedorId: ids(p!)[2], tam: 9, mao: null, linhas: [], total: 10, ganhaPartida: false });
    expect(funcoes(p!)).toEqual({ embaralha: ids(p!)[1], corta: ids(p!)[0], comeca: ids(p!)[2] });
  });
});
