import { describe, expect, it } from 'vitest';
import { arranjosPossiveis, formaJogo } from './arranjo';
import { carta, cartas, contextoDaVira, JOKER, nomeCarta } from './cartas';
import { DOBRAS, TRINCAS } from './jogos';
import { calcularBatida, CONFIG_PADRAO, Roleta, roletaTemCoringa, sortearRoleta } from './premios';
import { aplicarBatida, novaPartida, reduzir, funcoes, Partida } from '../estado/partida';

const ctx = (v: string) => contextoDaVira(carta(v));
const semRoleta: Roleta = { trincas: [], quadra: null, sorteio: 1 };
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
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣'))).toEqual(['Batida de 9:10', 'Escada colorida:20']);
    expect(nomes(calc('A♥ 2♥ 3♥ 4♥ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', 'K♣'))).toEqual(['Batida de 10:20', 'Escadão colorido:45']);
    expect(nomes(calc('3♣ 4♣ 5♣ 6♣ 7♣ 8♣ 9♣ 10♣ J♣', 'K♥'))).toEqual(['Batida de 9:10', 'Escada:40']);
    // na batida de 10 o mesmo prêmio vale mais
    expect(nomes(calc('3♣ 4♣ 5♣ 6♣ 7♣ 8♣ 9♣ 10♣ J♣ Q♣', 'K♥'))).toEqual(['Batida de 10:20', 'Escada:60']);
    // Escadão: na de 9 vale pontos, na de 10 ganha a partida
    expect(nomes(calc('A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠', 'J♥'))).toEqual(['Batida de 9:10', 'Escadão:60']);
    expect(calc('A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠', 'J♥')!.ganhaPartida).toBe(false);
    expect(calc('A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ 10♠', 'J♥')!.ganhaPartida).toBe(true);
  });
  it('coringa desconta 5 de cada prêmio', () => {
    // vira J♥: Q♥ é coringa no lugar do 5♠
    expect(nomes(calc('3♠ 4♠ Q♥ 6♠ 7♠ 8♠ 9♠ 10♠ J♠', 'J♥'))).toEqual(['Batida de 9:10', 'Escada:35']);
  });
  it('coringa no lugar dele mesmo não desconta', () => {
    // vira 4♠: 5♠ é coringa, mas entra como 5♠
    expect(nomes(calc('3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ 10♠ J♠', '4♣'))).toEqual(['Batida de 9:10', 'Escada:40']);
  });
  it('outros prêmios', () => {
    expect(nomes(calc('2♥ 3♥ 4♥ 7♦ 8♦ 9♦ J♥ Q♥ K♥', '5♠'))).toEqual(['Batida de 9:10', 'Cor única:10']);
    expect(nomes(calc('2♣ 3♣ 4♣ 7♣ 8♣ 9♣ J♣ Q♣ K♣', '5♥'))).toEqual(['Batida de 9:10', 'Uma pinta só:20']);
    expect(nomes(calc('7♣ 8♣ 9♣ 7♣ 8♣ 9♣ 5♠ 5♥ 5♦', 'J♥'))).toEqual(['Batida de 9:10', 'Gêmeas:30']);
    expect(nomes(calc('4♥ 5♥ 6♥ 4♠ 5♠ 6♠ 4♦ 5♦ 6♦', 'J♣'))).toContain('Bandeira:40');
    expect(nomes(calc('J♥ Q♥ K♥ A♠ A♣ A♦ Q♦ K♦ A♦', '5♠'))).toEqual(['Batida de 9:10', 'Figuras:10']);
  });
  it('ajuste pelo tamanho da mesa', () => {
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣', semRoleta, 2))).toEqual(['Batida de 9:10', 'Escada colorida:10']);
    expect(nomes(calc('3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', 'K♣', semRoleta, 6))).toEqual(['Batida de 9:10', 'Escada colorida:25']);
  });
});

describe('roleta', () => {
  const a23 = TRINCAS.find(j => j.slots.join() === cartas('A♥ 2♥ 3♥').join())!.id;
  it('trinca sorteada sem coringa vale', () => {
    expect(nomes(calc('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '7♣', { trincas: [a23], quadra: null, sorteio: 1 }))).toEqual(['Batida de 9:10', 'Trinca da roleta:10']);
  });
  it('com coringa não vale', () => {
    // vira 2♦: 3♦ é coringa no lugar do 2♥
    expect(nomes(calc('A♥ 3♦ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '2♦', { trincas: [a23], quadra: null, sorteio: 1 }))).toEqual(['Batida de 9:10']);
  });
  const dobra = (txt: string) => DOBRAS.find(d => [...d.slots].sort().join() === [...cartas(txt)].sort().join())!.id;
  it('quadra sorteada: só as 4 cartas exatas, sem coringa', () => {
    const q = dobra('9♠ 9♠ 9♥ 9♦');
    expect(nomes(calc('9♠ 9♠ 9♥ 9♦ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♣', { trincas: [], quadra: q, sorteio: 1 }))).toEqual(['Batida de 10:20', 'Quadra da roleta:20']);
    // outra quadra de 9 não vale
    expect(nomes(calc('9♣ 9♣ 9♥ 9♦ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♠', { trincas: [], quadra: q, sorteio: 1 }))).toEqual(['Batida de 10:20']);
    // sequência de 4 sorteada
    const s = dobra('4♥ 5♥ 6♥ 7♥');
    expect(nomes(calc('4♥ 5♥ 6♥ 7♥ 5♠ 6♠ 7♠ 2♦ 3♦ 4♦', 'J♣', { trincas: [], quadra: s, sorteio: 1 }))).toEqual(['Batida de 10:20', 'Quadra da roleta:20']);
    // vira 6♠: 7♠ é coringa no lugar do 7♥, não vale
    expect(nomes(calc('4♥ 5♥ 6♥ 7♠ 5♣ 6♣ 7♣ 2♦ 3♦ 4♦', '6♠', { trincas: [], quadra: s, sorteio: 1 }))).toEqual(['Batida de 10:20']);
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

describe('roleta sorteada depois da vira', () => {
  it('nunca usa carta que é coringa na rodada', () => {
    for (let v = 0; v < 52; v++) {
      const ctx = contextoDaVira(v);
      for (let k = 0; k < 20; k++) {
        const r = sortearRoleta(3, true, ctx);
        expect(r.trincas.length).toBe(3);
        expect(r.quadra).not.toBeNull();
        expect(roletaTemCoringa(r, ctx)).toBe(false);
      }
    }
  });
  it('só gira quando a vira é informada, e não gira se a vira veio na hora da batida', () => {
    let p: Partida | null = novaPartida(CONFIG_PADRAO, ['A', 'B'].map(nome => ({ nome, cor: '#fff' })), 0);
    expect(p.rodada.roleta.sorteio).toBe(0);
    p = reduzir(p, { tipo: 'vira', carta: carta('6♠') });
    const primeira = p!.rodada.roleta;
    expect(primeira.sorteio).not.toBe(0);
    // corrigir a vira para uma que não dá conflito mantém a roleta
    const semConflito = [...Array(52).keys()].find(v => !roletaTemCoringa(primeira, contextoDaVira(v)))!;
    p = reduzir(p, { tipo: 'vira', carta: semConflito });
    expect(p!.rodada.roleta).toBe(primeira);
    // corrigir para uma vira que deixa coringa na roleta sorteia de novo
    const comConflito = [...Array(52).keys()].find(v => roletaTemCoringa(primeira, contextoDaVira(v)))!;
    p = reduzir(p, { tipo: 'vira', carta: comConflito });
    expect(roletaTemCoringa(p!.rodada.roleta, contextoDaVira(comConflito))).toBe(false);
    // próxima rodada começa sem roleta; vira informada na batida não sorteia
    p = reduzir(p, { tipo: 'bateu', vencedorId: p!.jogadores[0].id, tam: 9, mao: null, linhas: [], total: 10, ganhaPartida: false });
    expect(p!.rodada.roleta.sorteio).toBe(0);
    p = reduzir(p, { tipo: 'vira', carta: carta('K♥'), sortear: false });
    expect(p!.rodada.roleta.sorteio).toBe(0);
  });
});

describe('mão marcada por jogo', () => {
  const g = (...txts: string[]) => txts.map(cartas);
  it('reconhece cada jogo marcado', () => {
    expect(formaJogo(cartas('4♥ 5♥ 6♥'), ctx('2♣'))?.seq).toBe(true);
    expect(formaJogo(cartas('9♠ 9♥ 9♦'), ctx('2♣'))?.seq).toBe(false);
    expect(formaJogo(cartas('9♠ 9♠ 9♥ 9♦'), ctx('2♣'))?.tam).toBe(4);
    expect(formaJogo(cartas('4♥ 5♠ 6♥'), ctx('2♣'))).toBeNull();
    // vira 6♠: 7♣ é coringa e completa a sequência
    expect(formaJogo(cartas('A♥ 2♥ 7♣'), ctx('6♠'))).not.toBeNull();
  });
  it('usa o jeito marcado quando ele fecha', () => {
    const r = calcularBatida(cartas('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦'), ctx('7♣'), semRoleta, CONFIG_PADRAO, 4, g('A♥ 2♥ 3♥', '5♠ 5♥ 5♣', '9♦ 10♦ J♦'))!;
    expect(r.arrumacao).toBe('marcada');
  });
  it('avisa quando o jeito marcado não fecha', () => {
    const r = calcularBatida(cartas('A♥ 2♥ 5♠ 3♥ 5♥ 5♣ 9♦ 10♦ J♦'), ctx('7♣'), semRoleta, CONFIG_PADRAO, 4, g('A♥ 2♥ 5♠', '3♥ 5♥ 5♣', '9♦ 10♦ J♦'))!;
    expect(r.arrumacao).toBe('corrigida');
  });
  it('troca para um jeito que vale mais', () => {
    // marcadas como 3 trincas de iguais (sem prêmio), mas as mesmas cartas fazem a Bandeira
    const r = calcularBatida(cartas('4♥ 4♠ 4♦ 5♥ 5♠ 5♦ 6♥ 6♠ 6♦'), ctx('J♣'), semRoleta, CONFIG_PADRAO, 4, g('4♥ 4♠ 4♦', '5♥ 5♠ 5♦', '6♥ 6♠ 6♦'))!;
    expect(r.arrumacao).toBe('melhor');
    expect(nomes(r)).toContain('Bandeira:40');
  });
});
