'use strict';
// Núcleo da simulação da Caxeta: cartas, jogos possíveis (trincas e dobras),
// busca do melhor arranjo de uma mão e as famílias de prêmios.

const NAIPES = ['♠', '♥', '♣', '♦']; // cor = naipe % 2 -> 0 preto, 1 vermelho
const VALORES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const NT = 52;     // tipos de carta (sem o Joker)
const JOKER = 52;  // posição do Joker nos vetores de 53 posições

const tipo = (valor, naipe) => (valor - 1) * 4 + naipe;
const valorDe = t => (t >> 2) + 1;
const naipeDe = t => t & 3;
const nomeCarta = t => (t === JOKER ? 'Jk' : VALORES[valorDe(t) - 1] + NAIPES[naipeDe(t)]);
const valorPos = p => (p === 14 ? 1 : p); // posição 14 = Ás depois do K (Q-K-A)

function carta(txt) {
  if (txt === 'Jk') return JOKER;
  const naipe = NAIPES.indexOf(txt.slice(-1));
  const valor = VALORES.indexOf(txt.slice(0, -1)) + 1;
  if (naipe < 0 || valor < 1) throw new Error('carta inválida: ' + txt);
  return tipo(valor, naipe);
}

// Mão como vetor de contagem: h[tipo] = quantas cópias (inclui os coringas no próprio tipo).
function maoDeTexto(txt) {
  const h = new Int8Array(NT);
  let J = 0;
  for (const s of txt.trim().split(/\s+/)) {
    const c = carta(s);
    if (c === JOKER) J++; else h[c]++;
  }
  return { h, J };
}

// Coringas da rodada: valor seguinte ao da vira, na cor da vira (2 tipos), mais o espelho.
// jt1/jt2 são os tipos que o Joker pode representar.
function contextoDaVira(vira) {
  const v = valorDe(vira), cor = naipeDe(vira) & 1;
  const vc = v === 13 ? 1 : v + 1;
  const jt1 = tipo(vc, cor), jt2 = tipo(vc, cor + 2);
  const ehCoringa = new Uint8Array(NT);
  ehCoringa[jt1] = 1; ehCoringa[jt2] = 1; ehCoringa[vira] = 1;
  return { vira, jt1, jt2, ehCoringa, coringas: [jt1, jt2, vira] };
}

// ---------- Jogos possíveis ----------
// slots = tipos do jogo (a dobra de iguais repete um tipo).
function criarJogos() {
  const trincas = [], dobras = [];
  for (let n = 0; n < 4; n++) {
    for (let p = 1; p <= 12; p++) trincas.push({ slots: [0, 1, 2].map(i => tipo(valorPos(p + i), n)), seq: true, naipe: n, pos: p });
    for (let p = 1; p <= 11; p++) dobras.push({ slots: [0, 1, 2, 3].map(i => tipo(valorPos(p + i), n)), seq: true, naipe: n, pos: p });
  }
  for (let v = 1; v <= 13; v++) {
    for (let fora = 0; fora < 4; fora++) {
      const tres = [0, 1, 2, 3].filter(n => n !== fora);
      trincas.push({ slots: tres.map(n => tipo(v, n)), seq: false, valor: v });
      for (const rep of tres) dobras.push({ slots: [...tres.map(n => tipo(v, n)), tipo(v, rep)], seq: false, valor: v });
    }
  }
  return { trincas, dobras };
}
const JOGOS = criarJogos();

// Jogos guardados em vetores planos: tipos distintos de cada jogo e quantas vagas de cada tipo.
class ListaJogos {
  constructor(jogos) {
    this.n = jogos.length;
    const ini = [0], tipos = [], cont = [];
    const porTipo = Array.from({ length: NT }, () => []);
    jogos.forEach((j, id) => {
      const m = new Map();
      for (const t of j.slots) m.set(t, (m.get(t) || 0) + 1);
      for (const [t, c] of m) { tipos.push(t); cont.push(c); porTipo[t].push(id); }
      ini.push(tipos.length);
    });
    this.ini = Int32Array.from(ini);
    this.tipos = Int8Array.from(tipos);
    this.cont = Int8Array.from(cont);
    this.porTipo = porTipo.map(l => Int16Array.from(l));
    this.marca = new Int32Array(this.n);
    this.geracao = 0;
    this.tmp = new Int16Array(this.n);
    this.tmpM = new Int8Array(this.n);
    // candidatos da última montagem, do que mais casa para o que menos casa; no fim o jogo vazio (-1)
    this.cand = new Int16Array(this.n + 1);
    this.m = new Int8Array(this.n + 1);
    this.nc = 0;
  }

  montar(h) {
    const g = ++this.geracao;
    let n = 0;
    for (let t = 0; t < NT; t++) {
      if (h[t] === 0) continue;
      const l = this.porTipo[t];
      for (let i = 0; i < l.length; i++) {
        const id = l[i];
        if (this.marca[id] !== g) { this.marca[id] = g; this.tmp[n++] = id; }
      }
    }
    const baldes = [0, 0, 0, 0, 0];
    for (let i = 0; i < n; i++) {
      const id = this.tmp[i];
      let m = 0;
      for (let k = this.ini[id], f = this.ini[id + 1]; k < f; k++) {
        const ht = h[this.tipos[k]], c = this.cont[k];
        m += ht < c ? ht : c;
      }
      this.tmpM[i] = m;
      baldes[m]++;
    }
    const pos = [0, 0, 0, 0, 0];
    for (let m = 4, p = 0; m >= 1; m--) { pos[m] = p; p += baldes[m]; }
    for (let i = 0; i < n; i++) {
      const m = this.tmpM[i], p = pos[m]++;
      this.cand[p] = this.tmp[i];
      this.m[p] = m;
    }
    this.cand[n] = -1;
    this.m[n] = 0;
    this.nc = n + 1;
  }
}

// ---------- Busca do melhor arranjo ----------
// Dada uma mão, acha o máximo de cartas naturais que cabem em nTri trincas + nDob dobras
// (o resto das vagas é preenchido por coringa ou falta comprar). Testa as combinações de jogos
// que usam cartas da mão, das mais promissoras para as menos, cortando o que não pode ganhar.
// Com querOuts, marca também todos os tipos de carta que, se comprados, aumentam esse máximo.
class Buscador {
  constructor(trincas, dobras) {
    this.T = new ListaJogos(trincas);
    this.D = new ListaJogos(dobras);
    this.validos = new Uint8Array(NT);
    for (const j of [...trincas, ...dobras]) for (const t of j.slots) this.validos[t] = 1;
    this.h = new Int8Array(NT);
    this.dem = new Int8Array(NT);
    this.toc = new Int8Array(16);
    this.comboT = new Int16Array(4);
    this.nT = 0;
    this.dobAtual = -1;
    this.querDob = false;
    this.outs = new Uint8Array(NT);
    this.aberto = false;
    this.best = -1;
    this.querOuts = false;
  }

  _corta(teto) {
    return teto < this.best || (!this.querOuts && teto <= this.best);
  }

  _busca(nTri, nDob) {
    const T = this.T, D = this.D;
    T.montar(this.h);
    this.nT = 0;
    this.querDob = nDob > 0;
    if (!this.querDob) { this.dobAtual = -1; this._tri(nTri, 0, 0); return; }
    D.montar(this.h);
    for (let i = 0; i < D.nc; i++) {
      if (this._corta(D.m[i] + nTri * T.m[0])) break;
      this.dobAtual = D.cand[i];
      this._tri(nTri, 0, D.m[i]);
    }
  }

  _tri(resta, desde, soma) {
    if (resta === 0) { this._combo(); return; }
    const T = this.T;
    for (let i = desde; i < T.nc; i++) {
      if (this._corta(soma + T.m[i] * resta)) break;
      this.comboT[this.nT++] = T.cand[i];
      this._tri(resta - 1, i, soma + T.m[i]);
      this.nT--;
    }
  }

  _combo() {
    const h = this.h, dem = this.dem, toc = this.toc;
    let n = 0, vazio = false;
    const juntar = (L, id) => {
      for (let k = L.ini[id], f = L.ini[id + 1]; k < f; k++) {
        const t = L.tipos[k];
        if (dem[t] === 0) toc[n++] = t;
        dem[t] += L.cont[k];
      }
    };
    if (this.querDob) { if (this.dobAtual < 0) vazio = true; else juntar(this.D, this.dobAtual); }
    for (let i = 0; i < this.nT; i++) {
      const id = this.comboT[i];
      if (id < 0) vazio = true; else juntar(this.T, id);
    }
    let valor = 0;
    for (let q = 0; q < n; q++) { const t = toc[q]; valor += h[t] < dem[t] ? h[t] : dem[t]; }
    if (valor > this.best) {
      this.best = valor;
      if (this.querOuts) { this.outs.fill(0); this.aberto = false; }
    }
    if (valor === this.best && this.querOuts) {
      for (let q = 0; q < n; q++) { const t = toc[q]; if (dem[t] > h[t]) this.outs[t] = 1; }
      if (vazio) this.aberto = true;
    }
    for (let q = 0; q < n; q++) dem[toc[q]] = 0;
  }

  // Coringas entram como curinga (W). Retorna d = vagas que ainda faltam preencher.
  avaliar(hAll, J, ctx, nTri, nDob, querOuts) {
    const h = this.h;
    let W = 0;
    for (let t = 0; t < NT; t++) {
      if (ctx.ehCoringa[t]) { W += hAll[t]; h[t] = 0; } else h[t] = hAll[t];
    }
    this.best = -1; this.querOuts = querOuts;
    if (querOuts) { this.outs.fill(0); this.aberto = false; }
    for (let k = 0; k <= J; k++) {
      h[ctx.jt1] = k; h[ctx.jt2] = J - k;
      this._busca(nTri, nDob);
    }
    h[ctx.jt1] = 0; h[ctx.jt2] = 0;
    this.W = W;
    const vagas = 3 * nTri + 4 * nDob;
    return vagas - Math.min(vagas, this.best + W);
  }

  // Carta c (tipo ou JOKER) aumenta o máximo da última avaliação feita com querOuts?
  ajuda(c, ctx) {
    if (c === JOKER) return this.outs[ctx.jt1] || this.outs[ctx.jt2] || (this.aberto && (this.validos[ctx.jt1] || this.validos[ctx.jt2]));
    if (ctx.ehCoringa[c]) return true;
    return this.outs[c] || (this.aberto && this.validos[c]);
  }

  // Máximo bruto de naturais em h (já montado por quem chama, sem coringas).
  maximo(h, nTri, nDob) {
    for (let t = 0; t < NT; t++) this.h[t] = h[t];
    this.best = -1; this.querOuts = false;
    this._busca(nTri, nDob);
    return this.best;
  }

  // Detecta batida usando o mínimo de coringas como substitutos.
  // Retorna { s9, s10 }: coringas usados na melhor batida de 9 / de 10 (Infinity se não dá).
  // Coringa usado no lugar dele mesmo não conta. Joker conta como substituto se jokerConta.
  detectar(hAll, J, ctx, jokerConta) {
    const res = { s9: Infinity, s10: Infinity };
    const [c0, c1, c2] = ctx.coringas;
    const w0 = hAll[c0], w1 = hAll[c1], w2 = hAll[c2];
    const h = new Int8Array(NT);
    for (let t = 0; t < NT; t++) h[t] = ctx.ehCoringa[t] ? 0 : hAll[t];
    for (let a0 = 0; a0 <= w0; a0++) for (let a1 = 0; a1 <= w1; a1++) for (let a2 = 0; a2 <= w2; a2++) {
      const livres = (w0 - a0) + (w1 - a1) + (w2 - a2);
      for (let k1 = 0; k1 <= J; k1++) for (let k2 = 0; k1 + k2 <= J; k2++) {
        const fora = J - k1 - k2;
        h[c0] = a0; h[c1] = a1; h[c2] = a2;
        h[ctx.jt1] += k1; h[ctx.jt2] += k2;
        const extra = jokerConta ? k1 + k2 : 0;
        if (fora === 0) {
          const M = this.maximo(h, 2, 1);
          if (M + livres >= 10) res.s10 = Math.min(res.s10, 10 - M + extra);
        }
        if (fora <= 1) {
          const M = this.maximo(h, 3, 0);
          if (M + livres >= 9) res.s9 = Math.min(res.s9, 9 - M + extra);
        }
        h[ctx.jt1] -= k1; h[ctx.jt2] -= k2;
      }
    }
    return res;
  }
}

const BUSCA_GERAL = new Buscador(JOGOS.trincas, JOGOS.dobras);

// ---------- Famílias de prêmio ----------
const JOKER_CONTA = true; // Joker usado num prêmio conta como coringa (desconta)

// Família definida por uma lista fechada de padrões (multiconjuntos de 9 ou 10 cartas).
class FamiliaPadroes {
  constructor(nome, padroes) {
    this.nome = nome;
    const vistos = new Set();
    const ini = [0], tipos = [], cont = [], n = [];
    for (const p of padroes) {
      const ord = [...p].sort((a, b) => a - b);
      const chave = ord.join(',');
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      const m = new Map();
      for (const t of ord) m.set(t, (m.get(t) || 0) + 1);
      for (const [t, c] of m) { tipos.push(t); cont.push(c); }
      ini.push(tipos.length);
      n.push(ord.length);
    }
    this.ini = Int32Array.from(ini);
    this.tipos = Int16Array.from(tipos);
    this.cont = Int8Array.from(cont);
    this.n = Int8Array.from(n);
    this.total = n.length;
  }

  // retorna deficit (vagas sem carta) e subs (coringas/jokers usados como substitutos)
  _casar(k, hAll, J, W, ctx) {
    let nat = 0, self = 0, faltaJt = 0;
    for (let i = this.ini[k], f = this.ini[k + 1]; i < f; i++) {
      const t = this.tipos[i], c = this.cont[i], ht = hAll[t];
      const m = c < ht ? c : ht;
      nat += m;
      if (ctx.ehCoringa[t]) {
        self += m;
        if (t === ctx.jt1 || t === ctx.jt2) faltaJt += c - m;
      }
    }
    const falta = this.n[k] - nat;
    const jk = J < faltaJt ? J : faltaJt;
    const resto = falta - jk;
    const livres = W - self;
    const usa = resto < livres ? resto : livres;
    this._subs = usa + (JOKER_CONTA ? jk : 0);
    return resto - usa;
  }

  deficit(hAll, J, ctx) {
    let W = 0;
    for (const c of ctx.coringas) W += hAll[c];
    let melhor = 99, conta = 0;
    for (let k = 0; k < this.total; k++) {
      const d = this._casar(k, hAll, J, W, ctx);
      if (d < melhor) { melhor = d; conta = 1; } else if (d === melhor) conta++;
    }
    return { d: melhor, desempate: conta };
  }

  detectar(hAll, J, ctx) {
    let W = 0;
    for (const c of ctx.coringas) W += hAll[c];
    const res = { s9: Infinity, s10: Infinity };
    for (let k = 0; k < this.total; k++) {
      if (this._casar(k, hAll, J, W, ctx) === 0) {
        if (this.n[k] === 9) res.s9 = Math.min(res.s9, this._subs);
        else res.s10 = Math.min(res.s10, this._subs);
      }
    }
    return res;
  }
}

// Família livre: qualquer batida usando só um conjunto restrito de jogos (ex.: só uma pinta).
class FamiliaLivre {
  constructor(nome, variantes, modos = [[3, 0], [2, 1]]) {
    this.nome = nome;
    this.variantes = variantes.map(([tri, dob]) => new Buscador(tri, dob));
    this.modos = modos;
    this.permite9 = modos.some(([nTri]) => nTri === 3);
  }

  deficit(hAll, J, ctx) {
    let melhor = 99, desempate = 0;
    for (const b of this.variantes) {
      for (const [nTri, nDob] of this.modos) {
        const d = b.avaliar(hAll, J, ctx, nTri, nDob, true);
        if (d > melhor) continue;
        let outs = 0;
        for (let t = 0; t < NT; t++) if (b.outs[t] || (b.aberto && b.validos[t])) outs++;
        if (d < melhor || outs > desempate) { melhor = d; desempate = outs; }
      }
    }
    return { d: melhor, desempate };
  }

  detectar(hAll, J, ctx) {
    const res = { s9: Infinity, s10: Infinity };
    for (const b of this.variantes) {
      const r = b.detectar(hAll, J, ctx, JOKER_CONTA);
      if (this.permite9) res.s9 = Math.min(res.s9, r.s9);
      res.s10 = Math.min(res.s10, r.s10);
    }
    return res;
  }
}

// ---------- Construção das famílias ----------
const seqTipos = (p, tam, naipe) => Array.from({ length: tam }, (_, i) => tipo(valorPos(p + i), naipe));

function familiasEscada() {
  const colorida = [], colAs = [], mesma = [], mesmaAs = [];
  for (let p = 1; p + 8 <= 14; p++) {
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
      const pad = [...seqTipos(p, 3, a), ...seqTipos(p + 3, 3, b), ...seqTipos(p + 6, 3, c)];
      colorida.push(pad);
      if (p === 1) colAs.push(pad);
      if (a === b && b === c) { mesma.push(pad); if (p === 1) mesmaAs.push(pad); }
    }
  }
  for (let p = 1; p + 9 <= 14; p++) {
    for (const tam of [[4, 3, 3], [3, 4, 3], [3, 3, 4]]) {
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 4; c++) {
        const ns = [a, b, c];
        const pad = [];
        let pos = p;
        for (let i = 0; i < 3; i++) { pad.push(...seqTipos(pos, tam[i], ns[i])); pos += tam[i]; }
        colorida.push(pad);
        if (p === 1) colAs.push(pad);
        if (a === b && b === c) { mesma.push(pad); if (p === 1) mesmaAs.push(pad); }
      }
    }
  }
  return {
    escada_colorida: new FamiliaPadroes('Escada colorida', colorida),
    escadao_colorido: new FamiliaPadroes('Escadão colorido', colAs),
    escada: new FamiliaPadroes('Escada', mesma),
    escadao: new FamiliaPadroes('Escadão', mesmaAs),
  };
}

function familiaGemeas() {
  const pads = [];
  for (const T of JOGOS.trincas) {
    for (const X of JOGOS.trincas) pads.push([...T.slots, ...T.slots, ...X.slots]);
    for (const D of JOGOS.dobras) pads.push([...T.slots, ...T.slots, ...D.slots]);
  }
  return new FamiliaPadroes('Gêmeas', pads);
}

// Bandeira: três sequências com os mesmos valores em três pintas diferentes
// (é o mesmo que três trincas de iguais com valores seguidos).
function familiaBandeira() {
  const pads = [];
  for (let p = 1; p <= 12; p++) for (let fora = 0; fora < 4; fora++) {
    const ns = [0, 1, 2, 3].filter(n => n !== fora);
    pads.push(ns.flatMap(n => seqTipos(p, 3, n)));
  }
  return new FamiliaPadroes('Bandeira', pads);
}

function familiasLivres() {
  const { trincas, dobras } = JOGOS;
  const seqDe = (lista, naipes) => lista.filter(j => j.seq && naipes.includes(j.naipe));
  const figura = t => [1, 11, 12, 13].includes(valorDe(t));
  return {
    uma_pinta: new FamiliaLivre('Uma pinta só', [0, 1, 2, 3].map(n => [seqDe(trincas, [n]), seqDe(dobras, [n])])),
    cor_unica: new FamiliaLivre('Cor única', [0, 1].map(c => [seqDe(trincas, [c, c + 2]), seqDe(dobras, [c, c + 2])])),
    so_iguais: new FamiliaLivre('Só iguais', [[trincas.filter(j => !j.seq), dobras.filter(j => !j.seq)]]),
    figuras: new FamiliaLivre('Figuras (J Q K A)', [[trincas.filter(j => j.slots.every(figura)), dobras.filter(j => j.slots.every(figura))]]),
    dez: new FamiliaLivre('Bater de 10', [[trincas, dobras]], [[2, 1]]),
  };
}

let _familias = null;
function familias() {
  if (!_familias) _familias = { ...familiasEscada(), gemeas: familiaGemeas(), bandeira: familiaBandeira(), ...familiasLivres() };
  return _familias;
}

// ---------- Roleta ----------
// Itens sorteados (trincas e quadras) que só valem se feitos sem coringa.
class FamiliaRoleta {
  constructor(itens) {
    this.nome = 'Roleta';
    this.itens = itens.map(slots => {
      const m = new Map();
      for (const t of slots) m.set(t, (m.get(t) || 0) + 1);
      return { slots, pares: [...m], tam: slots.length };
    });
    this.hRest = new Int8Array(NT);
  }

  // quantas cartas do item já tem (naturais, coringa no próprio lugar vale) e monta o resto da mão
  _separar(item, hAll) {
    let tem = 0;
    for (let t = 0; t < NT; t++) this.hRest[t] = hAll[t];
    for (const [t, c] of item.pares) {
      const m = Math.min(c, hAll[t]);
      tem += m;
      this.hRest[t] -= m;
    }
    return tem;
  }

  _deficitItem(item, hAll, J, ctx) {
    const tem = this._separar(item, hAll);
    const falta = item.tam - tem;
    let melhor = 99;
    const formas = item.tam === 3 ? [[2, 0], [1, 1]] : [[2, 0]];
    for (const [nTri, nDob] of formas) {
      const dRest = BUSCA_GERAL.avaliar(this.hRest, J, ctx, nTri, nDob, false);
      melhor = Math.min(melhor, falta + dRest);
    }
    return melhor;
  }

  deficit(hAll, J, ctx) {
    let melhor = 99, conta = 0;
    for (const item of this.itens) {
      const d = this._deficitItem(item, hAll, J, ctx);
      if (d < melhor) { melhor = d; conta = 1; } else if (d === melhor) conta++;
    }
    return { d: melhor, desempate: conta };
  }

  // Cada item (mão de 10 cartas): dá para bater de 9 / de 10 com ele feito sem coringa?
  itensNaBatida(hAll, J, ctx) {
    const res = [];
    for (const item of this.itens) {
      const tem = this._separar(item, hAll);
      const r = { b9: false, b10: false };
      if (tem === item.tam) {
        let W = 0, resto = 0;
        const h = new Int8Array(NT);
        for (let t = 0; t < NT; t++) {
          if (ctx.ehCoringa[t]) W += this.hRest[t]; else { h[t] = this.hRest[t]; resto += this.hRest[t]; }
        }
        const restoCartas = resto + W + J; // 10 - tam
        const formas = item.tam === 3 ? [[2, 0, 6], [1, 1, 7]] : [[2, 0, 6]];
        for (const [nTri, nDob, vagas] of formas) {
          const total = item.tam + vagas;
          if (restoCartas - vagas > (total === 9 ? 1 : 0)) continue;
          let ok = false;
          for (let k = 0; k <= J && !ok; k++) {
            h[ctx.jt1] = k; h[ctx.jt2] = J - k;
            if (BUSCA_GERAL.maximo(h, nTri, nDob) + W >= vagas) ok = true;
            h[ctx.jt1] = 0; h[ctx.jt2] = 0;
          }
          if (ok) r[total === 9 ? 'b9' : 'b10'] = true;
        }
      }
      res.push(r);
    }
    return res;
  }

  detectar(hAll, J, ctx) {
    const itens = this.itensNaBatida(hAll, J, ctx);
    return {
      s9: itens.some(x => x.b9) ? 0 : Infinity,
      s10: itens.some(x => x.b10) ? 0 : Infinity,
    };
  }
}

function sortearItens(rand, nTrincas, nQuadras) {
  const escolher = (lista, n) => {
    const idx = new Set();
    while (idx.size < n) idx.add(Math.floor(rand() * lista.length));
    return [...idx].map(i => lista[i].slots);
  };
  return { trincas: escolher(JOGOS.trincas, nTrincas), quadras: escolher(JOGOS.dobras, nQuadras) };
}

module.exports = {
  NAIPES, VALORES, NT, JOKER, tipo, valorDe, naipeDe, nomeCarta, carta, maoDeTexto,
  contextoDaVira, JOGOS, Buscador, BUSCA_GERAL, FamiliaPadroes, FamiliaLivre, FamiliaRoleta,
  familias, sortearItens, JOKER_CONTA,
};
