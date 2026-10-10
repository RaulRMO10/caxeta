import { Carta, Contexto, JOKER, NT } from './cartas';
import { DOBRAS, DOBRAS_POR_CARTA, Jogo, TRINCAS, TRINCAS_POR_CARTA } from './jogos';

// Uma forma de arrumar a mão da batida em jogos (2 trincas + dobra na de 10, 3 trincas na de 9).
// Os coringas e o Joker preenchem as vagas que faltam.
export interface Arranjo {
  jogos: Jogo[];
  substitutos: number; // coringas e Jokers usados no lugar de outra carta
}

// Como cada vaga foi preenchida, para mostrar na tela.
export interface Vaga {
  representa: Carta;
  carta: Carta; // a carta da mão (pode ser coringa ou Joker)
  substituta: boolean;
}

interface Mao {
  naturais: Int8Array; // cartas comuns (sem coringas e Jokers)
  totalNaturais: number;
  coringa: Map<Carta, number>; // quantos de cada tipo de coringa
  totalCoringas: number;
  jokers: number;
}

function separar(mao: Carta[], ctx: Contexto): Mao {
  const naturais = new Int8Array(NT);
  const coringa = new Map<Carta, number>(ctx.coringas.map(c => [c, 0]));
  let jokers = 0, totalNaturais = 0, totalCoringas = 0;
  for (const c of mao) {
    if (c === JOKER) jokers++;
    else if (ctx.ehCoringa(c)) { coringa.set(c, coringa.get(c)! + 1); totalCoringas++; }
    else { naturais[c]++; totalNaturais++; }
  }
  return { naturais, totalNaturais, coringa, totalCoringas, jokers };
}

function demanda(jogos: Jogo[]) {
  const d = new Map<Carta, number>();
  for (const j of jogos) for (const s of j.slots) d.set(s, (d.get(s) ?? 0) + 1);
  return d;
}

// Quantos coringas/Jokers ficam no lugar de outra carta (o mínimo possível), ou -1 se não fecha.
// Coringa no lugar dele mesmo não conta. O Joker sempre conta e só entra no lugar da carta do coringa.
function substitutosNecessarios(jogos: Jogo[], m: Mao, ctx: Contexto): number {
  const d = demanda(jogos);
  const [jt1, jt2] = ctx.jokerVale;
  const d1 = d.get(jt1) ?? 0, d2 = d.get(jt2) ?? 0;
  if (m.jokers > d1 + d2) return -1;
  const w1 = m.coringa.get(jt1)!, w2 = m.coringa.get(jt2)!, wv = m.coringa.get(ctx.vira)!;
  const proprioJt = Math.min(Math.min(w1, d1) + Math.min(w2, d2), d1 + d2 - m.jokers);
  const proprioVira = Math.min(wv, d.get(ctx.vira) ?? 0);
  return m.jokers + m.totalCoringas - proprioJt - proprioVira;
}

const chave = (jogos: Jogo[]) => jogos.map(j => j.id).sort((a, b) => a - b).join(',');

// Todas as formas válidas de arrumar a mão (9 ou 10 cartas).
export function arranjosPossiveis(mao: Carta[], ctx: Contexto): Arranjo[] {
  const tam = mao.length;
  if (tam !== 9 && tam !== 10) return [];
  const m = separar(mao, ctx);
  const flex = m.totalCoringas + m.jokers;
  const h = Int8Array.from(m.naturais);
  const achados = new Map<string, Arranjo>();
  const escolhidos: Jogo[] = [];

  const folha = () => {
    const k = chave(escolhidos);
    if (achados.has(k)) return;
    const subs = substitutosNecessarios(escolhidos, m, ctx);
    if (subs >= 0) achados.set(k, { jogos: [...escolhidos].sort((a, b) => b.tam - a.tam), substitutos: subs });
  };

  // vagasAbertas: vagas dos jogos escolhidos que ainda vão precisar de coringa/Joker
  const rec = (restTri: number, restDob: number, vagasAbertas: number) => {
    if (vagasAbertas > flex) return;
    let t = 0;
    while (t < NT && h[t] === 0) t++;
    if (t === NT) { livres(restTri, restDob, vagasAbertas, 0, 0); return; }
    const opcoes: Jogo[] = [];
    if (restDob > 0) opcoes.push(...DOBRAS_POR_CARTA[t]);
    if (restTri > 0) opcoes.push(...TRINCAS_POR_CARTA[t]);
    for (const j of opcoes) {
      const usados: Carta[] = [];
      for (const s of j.slots) if (h[s] > 0) { h[s]--; usados.push(s); }
      escolhidos.push(j);
      rec(restTri - (j.tam === 3 ? 1 : 0), restDob - (j.tam === 4 ? 1 : 0), vagasAbertas + j.tam - usados.length);
      escolhidos.pop();
      for (const s of usados) h[s]++;
    }
  };

  // sem cartas comuns sobrando: os jogos que faltam são feitos só com coringa/Joker
  const livres = (restTri: number, restDob: number, vagasAbertas: number, minTri: number, minDob: number) => {
    if (restTri === 0 && restDob === 0) { if (vagasAbertas === flex) folha(); return; }
    if (vagasAbertas + 3 * restTri + 4 * restDob > flex) return;
    if (restDob > 0) {
      for (let i = minDob; i < DOBRAS.length; i++) {
        escolhidos.push(DOBRAS[i]);
        livres(restTri, restDob - 1, vagasAbertas + 4, minTri, i);
        escolhidos.pop();
      }
      return;
    }
    for (let i = minTri; i < TRINCAS.length; i++) {
      escolhidos.push(TRINCAS[i]);
      livres(restTri - 1, restDob, vagasAbertas + 3, i, minDob);
      escolhidos.pop();
    }
  };

  rec(tam === 9 ? 3 : 2, tam === 9 ? 0 : 1, 0);
  return [...achados.values()];
}

// Distribui as cartas da mão nas vagas do arranjo (cartas comuns primeiro, nos jogos de
// "prioridade" antes — assim uma trinca da roleta fica com as cartas naturais quando dá).
export function preencher(arr: Arranjo, mao: Carta[], ctx: Contexto, prioridade: number[] = []): Vaga[][] {
  const m = separar(mao, ctx);
  const ordem = arr.jogos.map((_, i) => i).sort((a, b) => {
    const pa = prioridade.includes(arr.jogos[a].id) ? 0 : 1;
    const pb = prioridade.includes(arr.jogos[b].id) ? 0 : 1;
    return pa - pb || a - b;
  });
  const vagas: (Vaga | null)[][] = arr.jogos.map(j => j.slots.map(() => null));
  const h = Int8Array.from(m.naturais);
  const w = new Map(m.coringa);
  let jokers = m.jokers;
  const [jt1, jt2] = ctx.jokerVale;

  // 1) cartas comuns no próprio lugar
  for (const i of ordem) arr.jogos[i].slots.forEach((s, k) => {
    if (h[s] > 0) { h[s]--; vagas[i][k] = { representa: s, carta: s, substituta: false }; }
  });
  // 2) reserva vagas da carta do coringa para os Jokers, deixando o resto para o coringa ficar no próprio lugar
  const abertasJt: [number, number][] = [];
  for (const i of ordem) arr.jogos[i].slots.forEach((s, k) => { if (!vagas[i][k] && (s === jt1 || s === jt2)) abertasJt.push([i, k]); });
  const jtProprios = abertasJt.filter(([i, k]) => (w.get(arr.jogos[i].slots[k]) ?? 0) > 0);
  const reservaJoker = new Set<string>();
  // Jokers preferem vagas onde não há coringa do mesmo tipo para ficar no próprio lugar
  const porPreferencia = [...abertasJt.filter(v => !jtProprios.includes(v)), ...jtProprios.slice().reverse()];
  for (const [i, k] of porPreferencia) { if (reservaJoker.size >= jokers) break; reservaJoker.add(`${i},${k}`); }
  // 3) coringas no próprio lugar
  for (const i of ordem) arr.jogos[i].slots.forEach((s, k) => {
    if (vagas[i][k] || reservaJoker.has(`${i},${k}`)) return;
    if ((w.get(s) ?? 0) > 0) { w.set(s, w.get(s)! - 1); vagas[i][k] = { representa: s, carta: s, substituta: false }; }
  });
  // 4) Jokers nas vagas reservadas
  for (const pos of reservaJoker) {
    const [i, k] = pos.split(',').map(Number);
    vagas[i][k] = { representa: arr.jogos[i].slots[k], carta: JOKER, substituta: true };
    jokers--;
  }
  // 5) o resto dos coringas onde faltar carta
  const sobra: Carta[] = [];
  for (const [c, n] of w) for (let x = 0; x < n; x++) sobra.push(c);
  for (const i of ordem) arr.jogos[i].slots.forEach((s, k) => {
    if (!vagas[i][k]) vagas[i][k] = { representa: s, carta: sobra.pop() ?? JOKER, substituta: true };
  });
  return vagas as Vaga[][];
}
