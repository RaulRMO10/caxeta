'use strict';
// Motor de uma rodada de Caxeta com jogadores automáticos.
// Regras seguidas: REGRAS.txt (vira, coringas, Joker, lixo só a de cima, primeira jogada
// com direito a trocar a carta, bater de 9 e de 10, bater atravessado com preferência
// para quem está mais perto na sequência).
const C = require('./core');
const { NT, JOKER } = C;
const B = C.BUSCA_GERAL;
const LIMITE_TURNOS = 600;

function criarRand(semente) { // mulberry32
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function embaralhar(v, rand) {
  for (let i = v.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const x = v[i]; v[i] = v[j]; v[j] = x;
  }
}

class Jogador {
  constructor(estrategia) {
    this.estrategia = estrategia;
    this.h = new Int8Array(NT);
    this.J = 0;
    // estado da mão de 9 cartas: quanto falta e quais cartas ajudam (para bater de 9 e de 10)
    this.d9 = 99; this.o9 = new Uint8Array(NT); this.a9 = false;
    this.d10 = 99; this.o10 = new Uint8Array(NT); this.a10 = false;
    this.dF = 99; // quanto falta para o prêmio (caçador)
    this.vezes = 0;
  }
  limpar() { this.h.fill(0); this.J = 0; this.vezes = 0; }
  por(c) { if (c === JOKER) this.J++; else this.h[c]++; }
  tirar(c) { if (c === JOKER) this.J--; else this.h[c]--; }
  // cartas que podem ser descartadas (coringa nunca)
  candidatas(ctx, proibida) {
    const l = [];
    for (let t = 0; t < NT; t++) if (this.h[t] > 0 && !ctx.ehCoringa[t] && t !== proibida) l.push(t);
    if (this.J > 0 && proibida !== JOKER) l.push(JOKER);
    if (l.length === 0) for (let t = 0; t < NT; t++) if (this.h[t] > 0 && t !== proibida) { l.push(t); break; }
    return l;
  }
}

// Peso das cartas que ajudam: quantas cópias ainda podem vir.
function pesoOuts(p, ctx) {
  let w = 0;
  for (let t = 0; t < NT; t++) {
    if (ctx.ehCoringa[t]) continue;
    if (B.outs[t] || B.aberto) w += Math.max(0, 2 - p.h[t] - (t === ctx.vira ? 1 : 0));
  }
  if (B.outs[ctx.jt1] || B.outs[ctx.jt2] || B.aberto) w += 4 - p.J;
  return w;
}

function sortearEntre(l, rand) { return l[Math.floor(rand() * l.length)]; }

// ---------- Jogador seguro: bate o mais rápido possível ----------
function Seguro() {
  return {
    nome: 'seguro',
    estado(p, ctx) {
      p.d9 = B.avaliar(p.h, p.J, ctx, 3, 0, true);
      p.o9.set(B.outs); p.a9 = B.aberto;
      p.d10 = B.avaliar(p.h, p.J, ctx, 2, 1, false);
      if (p.d10 === 1) { B.avaliar(p.h, p.J, ctx, 2, 1, true); p.o10.set(B.outs); p.a10 = B.aberto; }
    },
    // com a carta c (ainda fora da mão), bate? 10, 9 ou 0
    bateCom(p, c, ctx) {
      const ajuda = (o, a) => (c === JOKER ? (o[ctx.jt1] || o[ctx.jt2] || a) : (ctx.ehCoringa[c] || o[c] || a));
      if (p.d10 === 1 && ajuda(p.o10, p.a10)) return 10;
      if (p.d9 === 0 || (p.d9 === 1 && ajuda(p.o9, p.a9))) return 9;
      return 0;
    },
    querLixo(p, c, ctx) {
      if (this.bateCom(p, c, ctx)) return true;
      if (c !== JOKER && ctx.ehCoringa[c]) return true;
      p.por(c);
      let melhor = 99;
      for (const x of p.candidatas(ctx, c)) {
        p.tirar(x);
        melhor = Math.min(melhor, B.avaliar(p.h, p.J, ctx, 3, 0, false));
        p.por(x);
      }
      p.tirar(c);
      return melhor < p.d9;
    },
    descarte(p, ctx, proibida) {
      const cand = p.candidatas(ctx, proibida);
      const ds = cand.map(x => { p.tirar(x); const d = B.avaliar(p.h, p.J, ctx, 3, 0, false); p.por(x); return d; });
      const min = Math.min(...ds);
      let melhores = [], melhorPeso = -1;
      cand.forEach((x, i) => {
        if (ds[i] !== min) return;
        p.tirar(x); B.avaliar(p.h, p.J, ctx, 3, 0, true); const w = pesoOuts(p, ctx); p.por(x);
        if (w > melhorPeso) { melhorPeso = w; melhores = [x]; } else if (w === melhorPeso) melhores.push(x);
      });
      return sortearEntre(melhores, ctx.rand);
    },
  };
}

// ---------- Caçador: só bate quando completa o prêmio da família ----------
function Cacador(familia) {
  return {
    nome: familia.nome,
    familia,
    estado(p, ctx) { p.dF = familia.deficit(p.h, p.J, ctx).d; },
    bateCom(p, c, ctx) {
      if (p.dF > 1) return 0;
      p.por(c);
      const r = familia.detectar(p.h, p.J, ctx);
      p.tirar(c);
      if (r.s10 < Infinity && r.s10 <= r.s9) return 10;
      if (r.s9 < Infinity) return 9;
      if (r.s10 < Infinity) return 10;
      return 0;
    },
    querLixo(p, c, ctx) {
      if (this.bateCom(p, c, ctx)) return true;
      p.por(c);
      let melhor = 99;
      for (const x of p.candidatas(ctx, c)) {
        p.tirar(x);
        melhor = Math.min(melhor, familia.deficit(p.h, p.J, ctx).d);
        p.por(x);
      }
      p.tirar(c);
      return melhor < p.dF;
    },
    descarte(p, ctx, proibida) {
      const cand = p.candidatas(ctx, proibida);
      let melhores = [], chave = null;
      for (const x of cand) {
        p.tirar(x);
        const r = familia.deficit(p.h, p.J, ctx);
        p.por(x);
        const k = [r.d, -r.desempate];
        const cmp = chave === null ? -1 : (k[0] - chave[0]) || (k[1] - chave[1]);
        if (cmp < 0) { chave = k; melhores = [x]; } else if (cmp === 0) melhores.push(x);
      }
      if (melhores.length === 1) return melhores[0];
      // empate: segue o jogador seguro entre os empatados
      const ds = melhores.map(x => { p.tirar(x); const d = B.avaliar(p.h, p.J, ctx, 3, 0, false); p.por(x); return d; });
      const min = Math.min(...ds);
      return sortearEntre(melhores.filter((_, i) => ds[i] === min), ctx.rand);
    },
  };
}

// Joga uma rodada. Retorna quem bateu, como, e a mão final de quem bateu.
// filtro(ctx) é chamado depois de dar as cartas; se devolver false a rodada não é jogada.
function jogarRodada(jogadores, dealer, rand, filtro) {
  const N = jogadores.length;
  const monte = [];
  for (let t = 0; t < NT; t++) monte.push(t, t);
  for (let i = 0; i < 4; i++) monte.push(JOKER);
  embaralhar(monte, rand);
  for (const p of jogadores) p.limpar();
  for (let r = 0; r < 9; r++) for (let i = 1; i <= N; i++) jogadores[(dealer + i) % N].por(monte.pop());
  let vira;
  while ((vira = monte.pop()) === JOKER) monte.unshift(JOKER);
  const ctx = C.contextoDaVira(vira);
  ctx.rand = rand;
  for (const p of jogadores) p.estrategia.estado(p, ctx);
  if (filtro && !filtro(ctx)) return { pulada: true };

  const lixo = [];
  let turnos = 0;
  const comprar = () => {
    if (monte.length === 0) {
      if (lixo.length <= 1) return -1;
      const topo = lixo.pop();
      monte.push(...lixo);
      lixo.length = 0;
      lixo.push(topo);
      embaralhar(monte, rand);
    }
    return monte.pop();
  };
  const fim = (q, tam, c, atravessado) => {
    const p = jogadores[q];
    p.por(c);
    return { vencedor: q, tam, atravessado, turnos, vezes: p.vezes, ctx, h: Int8Array.from(p.h), J: p.J };
  };
  // alguém bate com a carta descartada? preferência para quem está mais perto na sequência
  const atravessar = (de, c) => {
    for (let k = 1; k < N; k++) {
      const q = (de + k) % N;
      const tam = jogadores[q].estrategia.bateCom(jogadores[q], c, ctx);
      if (tam) { lixo.pop(); return fim(q, tam, c, k > 1); }
    }
    return null;
  };
  const descartar = (vez, x) => {
    const p = jogadores[vez];
    p.tirar(x);
    p.estrategia.estado(p, ctx);
    lixo.push(x);
    return atravessar(vez, x);
  };

  let vez = (dealer + 1) % N;
  while (turnos < LIMITE_TURNOS) {
    const p = jogadores[vez], E = p.estrategia;
    p.vezes++;
    let c, doLixo = false;
    if (lixo.length && E.querLixo(p, lixo[lixo.length - 1], ctx)) { c = lixo.pop(); doLixo = true; }
    else if ((c = comprar()) < 0) break;
    let tam = E.bateCom(p, c, ctx);
    if (tam) return fim(vez, tam, c, false);
    p.por(c);
    let x = E.descarte(p, ctx, doLixo ? c : -1);
    if (turnos === 0 && x === c) {
      // quem começa: a primeira carta não serviu, descarta e compra outra
      const r = descartar(vez, x);
      if (r) return r;
      if ((c = comprar()) < 0) break;
      tam = E.bateCom(p, c, ctx);
      if (tam) return fim(vez, tam, c, false);
      p.por(c);
      x = E.descarte(p, ctx, -1);
    }
    const r = descartar(vez, x);
    if (r) return r;
    vez = (vez + 1) % N;
    turnos++;
  }
  return { vencedor: -1, turnos };
}

module.exports = { criarRand, Jogador, Seguro, Cacador, jogarRodada };
