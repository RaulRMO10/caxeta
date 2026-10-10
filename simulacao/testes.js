'use strict';
// Testes do núcleo: regras dos jogos, coringas, Joker, detecção de prêmios
// e conferência da busca contra força bruta em mãos aleatórias.
const assert = require('assert');
const C = require('./core');

let ok = 0;
function teste(nome, fn) {
  try { fn(); ok++; } catch (e) { console.error('FALHOU:', nome, '\n ', e.message); process.exitCode = 1; }
}

const ctxDe = txt => C.contextoDaVira(C.carta(txt));
const B = C.BUSCA_GERAL;
const d9 = (txt, vira) => { const m = C.maoDeTexto(txt); return B.avaliar(m.h, m.J, ctxDe(vira), 3, 0, false); };
const d10 = (txt, vira) => { const m = C.maoDeTexto(txt); return B.avaliar(m.h, m.J, ctxDe(vira), 2, 1, false); };
const det = (fam, txt, vira) => { const m = C.maoDeTexto(txt); return fam.detectar(m.h, m.J, ctxDe(vira)); };

teste('quantidade de jogos', () => {
  assert.strictEqual(C.JOGOS.trincas.length, 100);
  assert.strictEqual(C.JOGOS.dobras.length, 200);
});

teste('coringas da vira', () => {
  const nomes = ctx => ctx.coringas.map(C.nomeCarta).sort().join(' ');
  assert.strictEqual(nomes(ctxDe('6♠')), ['7♠', '7♣', '6♠'].sort().join(' '));
  assert.strictEqual(nomes(ctxDe('6♦')), ['7♥', '7♦', '6♦'].sort().join(' '));
  assert.strictEqual(nomes(ctxDe('K♥')), ['A♥', 'A♦', 'K♥'].sort().join(' '));
});

teste('batida de 9 simples', () => {
  assert.strictEqual(d9('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '2♣'), 0);
  assert.strictEqual(d9('A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ K♠', '2♣'), 1);
  assert.strictEqual(d9('A♥ 4♥ 8♥ 5♠ J♥ 2♣ 9♦ 6♦ K♠', '3♣'), 6);
});

teste('Q-K-A vale, K-A-2 não', () => {
  assert.strictEqual(d9('Q♠ K♠ A♠ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '2♣'), 0);
  assert.strictEqual(d9('K♠ A♠ 2♠ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '7♣'), 1);
});

teste('trinca de iguais não repete pinta', () => {
  assert.strictEqual(d9('5♠ 5♠ 5♥ 7♠ 8♠ 9♠ 9♦ 10♦ J♦', '2♣'), 1);
});

teste('batida de 10 e dobra', () => {
  assert.strictEqual(d10('A♥ 2♥ 3♥ 4♥ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣'), 0);
  assert.strictEqual(d10('9♠ 9♠ 9♥ 9♦ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣'), 0);
  // quatro pintas diferentes não é dobra
  assert.strictEqual(d10('9♠ 9♣ 9♥ 9♦ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣'), 1);
  assert.strictEqual(d9('9♠ 9♣ 9♥ 9♦ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦', '2♣'), 0);
});

teste('coringa vale qualquer carta', () => {
  // vira 6♠ -> coringas 7♠ 7♣ e o outro 6♠
  assert.strictEqual(d9('A♥ 2♥ 7♣ 5♠ 5♥ 6♠ 9♦ 10♦ J♦', '6♠'), 0);
  assert.strictEqual(d9('7♠ 7♣ 6♠ 5♠ 5♥ 5♣ 9♦ 10♦ J♦', '6♠'), 0);
});

teste('Joker vale a carta do coringa (só ela)', () => {
  // vira 7♥ -> Joker vale 8♥ ou 8♦
  assert.strictEqual(d9('Jk Jk 8♠ A♣ 2♣ 3♣ 4♠ 5♠ 6♠', '7♥'), 0);
  assert.strictEqual(d9('6♦ 7♦ Jk A♣ 2♣ 3♣ 4♠ 5♠ 6♠', '7♥'), 0);
  assert.strictEqual(d9('4♠ 5♠ Jk A♣ 2♣ 3♣ 4♥ 5♥ 6♥', '7♥'), 1);
  // três Jokers sozinhos repetem pinta
  assert.strictEqual(d9('Jk Jk Jk A♣ 2♣ 3♣ 4♥ 5♥ 6♥', '7♥'), 1);
});

const F = C.familias();

teste('escadas', () => {
  const r = det(F.escadao, 'A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ K♦', 'J♥');
  assert.strictEqual(r.s9, 0);
  // vira J♥ -> coringas Q♥ Q♦ e J♥; Q♥ no lugar do 5♠
  assert.strictEqual(det(F.escadao, 'A♠ 2♠ 3♠ 4♠ Q♥ 6♠ 7♠ 8♠ 9♠ K♦', 'J♥').s9, 1);
  const ex = 'A♥ 2♥ 3♥ 4♥ 5♠ 6♠ 7♠ 8♦ 9♦ 10♦';
  assert.strictEqual(det(F.escadao_colorido, ex, 'J♣').s10, 0);
  assert.strictEqual(det(F.escada_colorida, ex, 'J♣').s10, 0);
  assert.strictEqual(det(F.escada, ex, 'J♣').s10, Infinity);
  assert.strictEqual(det(F.escada, '3♣ 4♣ 5♣ 6♣ 7♣ 8♣ 9♣ 10♣ J♣ 2♦', 'K♥').s9, 0);
});

teste('coringa no lugar dele mesmo não desconta', () => {
  // vira 4♠ -> coringas 5♠ 5♣ e o outro 4♠; aqui o 5♠ entra como 5♠
  assert.strictEqual(det(F.escadao, 'A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ K♦', '4♠').s9, 0);
});

teste('gêmeas, bandeira, uma pinta, só iguais, figuras', () => {
  assert.strictEqual(det(F.gemeas, '7♣ 8♣ 9♣ 7♣ 8♣ 9♣ 2♥ 2♠ 2♦ K♦', 'J♥').s9, 0);
  assert.strictEqual(det(F.gemeas, '7♣ 8♣ 9♣ 7♥ 8♥ 9♥ 2♥ 2♠ 2♦ K♦', 'J♥').s9, Infinity);
  assert.strictEqual(det(F.bandeira, '4♥ 5♥ 6♥ 4♠ 5♠ 6♠ 4♦ 5♦ 6♦ K♣', 'J♥').s9, 0);
  assert.strictEqual(det(F.uma_pinta, '2♥ 3♥ 4♥ 7♥ 8♥ 9♥ J♥ Q♥ K♥ 5♣', '5♠').s9, 0);
  assert.strictEqual(det(F.uma_pinta, '2♥ 3♥ 4♥ 7♥ 8♥ 9♥ J♦ Q♦ K♦ 5♣', '5♠').s9, Infinity);
  assert.strictEqual(det(F.cor_unica, '2♥ 3♥ 4♥ 7♥ 8♥ 9♥ J♦ Q♦ K♦ 5♣', '5♠').s9, 0);
  assert.strictEqual(det(F.so_iguais, '2♥ 2♠ 2♦ 7♥ 7♠ 7♣ J♦ J♠ J♥ 5♣', '5♠').s9, 0);
  assert.strictEqual(det(F.figuras, 'J♥ Q♥ K♥ A♠ A♣ A♦ Q♦ K♦ A♦ 5♣', '5♠').s9, 0);
});

teste('roleta só vale sem coringa', () => {
  const rol = new C.FamiliaRoleta([[C.carta('A♥'), C.carta('2♥'), C.carta('3♥')]]);
  assert.strictEqual(det(rol, 'A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦ K♠', '7♣').s9, 0);
  // vira 2♣ -> 3♥ e 3♦ são coringas, mas aqui o 3♥ está no lugar dele mesmo: vale
  assert.strictEqual(det(rol, 'A♥ 2♥ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦ K♠', '2♦').s9, 0);
  // com coringa no lugar do 2♥ não vale
  assert.strictEqual(det(rol, 'A♥ 3♦ 3♥ 5♠ 5♥ 5♣ 9♦ 10♦ J♦ K♠', '2♦').s9, Infinity);
});

// ---------- Força bruta em mãos aleatórias ----------
let semente = 12345;
const rand = () => { semente = (semente * 1103515245 + 12345) & 0x7fffffff; return semente / 0x80000000; };
function maoAleatoria(n) {
  const baralho = [];
  for (let t = 0; t < 52; t++) baralho.push(t, t);
  for (let i = 0; i < 4; i++) baralho.push(C.JOKER);
  for (let i = baralho.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [baralho[i], baralho[j]] = [baralho[j], baralho[i]]; }
  let vira; do { vira = baralho.pop(); } while (vira === C.JOKER);
  const h = new Int8Array(52); let J = 0;
  let k = 0;
  while (k < n) { const c = baralho.pop(); if (c === vira) continue; if (c === C.JOKER) J++; else h[c]++; k++; }
  return { h, J, ctx: C.contextoDaVira(vira) };
}

teste('cartas que ajudam (outs) batem com força bruta', () => {
  for (let it = 0; it < 400; it++) {
    const { h, J, ctx } = it % 2 ? maoAleatoria(9) : maoQuasePronta(9);
    for (const [nTri, nDob] of [[3, 0], [2, 1]]) {
      B.avaliar(h, J, ctx, nTri, nDob, true);
      const antes = B.best;
      const outs = Uint8Array.from(B.outs), aberto = B.aberto;
      const ajuda = c => {
        B.outs.set(outs); B.aberto = aberto;
        return !!B.ajuda(c, ctx);
      };
      for (let c = 0; c <= 52; c++) {
        if (c < 52 && ctx.ehCoringa[c]) continue;
        const esperado = ajuda(c);
        if (c === 52) B.avaliar(h, J + 1, ctx, nTri, nDob, false);
        else { h[c]++; B.avaliar(h, J, ctx, nTri, nDob, false); h[c]--; }
        const real = B.best > antes;
        assert.strictEqual(esperado, real, `mão ${it} carta ${C.nomeCarta(c)} modo ${nTri}/${nDob}`);
      }
    }
  }
});

// mão quase pronta: cartas de jogos sorteados, algumas trocadas por coringa/Joker ou por lixo
function maoQuasePronta(n) {
  const { h: _, J: __, ctx } = maoAleatoria(0);
  const h = new Int8Array(52); let J = 0;
  const jogos = n === 10 && rand() < 0.5
    ? [C.JOGOS.dobras[Math.floor(rand() * 200)], C.JOGOS.trincas[Math.floor(rand() * 100)], C.JOGOS.trincas[Math.floor(rand() * 100)]]
    : [0, 1, 2].map(() => C.JOGOS.trincas[Math.floor(rand() * 100)]);
  let k = 0;
  for (const j of jogos) for (const t of j.slots) {
    if (k >= n) break;
    const r = rand();
    if (r < 0.1) h[ctx.coringas[Math.floor(rand() * 3)]]++;
    else if (r < 0.15) J++;
    else if (r < 0.3) h[Math.floor(rand() * 52)]++;
    else h[t]++;
    k++;
  }
  while (k < n) { h[Math.floor(rand() * 52)]++; k++; }
  for (let t = 0; t < 52; t++) if (h[t] > 2) h[t] = 2;
  return { h, J, ctx };
}

// máximo de naturais testando TODAS as combinações de jogos (inclui jogo vazio)
function maximoBruto(h, nTri, nDob) {
  const tri = [null, ...C.JOGOS.trincas.map(j => j.slots)];
  const dob = nDob ? [null, ...C.JOGOS.dobras.map(j => j.slots)] : [null];
  let best = 0;
  const dem = new Int8Array(52);
  const valor = combo => {
    dem.fill(0);
    for (const s of combo) if (s) for (const t of s) dem[t]++;
    let v = 0;
    for (let t = 0; t < 52; t++) v += Math.min(h[t], dem[t]);
    return v;
  };
  for (const d of dob) {
    if (nTri === 3) {
      for (let i = 0; i < tri.length; i++) for (let j = i; j < tri.length; j++) for (let k = j; k < tri.length; k++) best = Math.max(best, valor([d, tri[i], tri[j], tri[k]]));
    } else {
      for (let i = 0; i < tri.length; i++) for (let j = i; j < tri.length; j++) best = Math.max(best, valor([d, tri[i], tri[j]]));
    }
  }
  return best;
}

teste('busca rápida = força bruta (todas as combinações)', () => {
  for (let it = 0; it < 60; it++) {
    const { h, J, ctx } = it % 3 === 0 ? maoAleatoria(9) : maoQuasePronta(9);
    const hn = new Int8Array(52);
    for (let t = 0; t < 52; t++) hn[t] = ctx.ehCoringa[t] ? 0 : h[t];
    hn[ctx.jt1] += J;
    assert.strictEqual(B.maximo(hn, 3, 0), maximoBruto(hn, 3, 0), 'modo 9, mão ' + it);
    if (it < 12) assert.strictEqual(B.maximo(hn, 2, 1), maximoBruto(hn, 2, 1), 'modo 10, mão ' + it);
  }
});

teste('detecção com coringas bate com a avaliação', () => {
  for (let it = 0; it < 600; it++) {
    const { h, J, ctx } = it % 4 === 0 ? maoAleatoria(10) : maoQuasePronta(10);
    const pode9 = B.avaliar(h, J, ctx, 3, 0, false) === 0;
    const pode10 = B.avaliar(h, J, ctx, 2, 1, false) === 0;
    const r = B.detectar(h, J, ctx, true);
    assert.strictEqual(r.s9 < Infinity, pode9, 'b9 mão ' + it);
    assert.strictEqual(r.s10 < Infinity, pode10, 'b10 mão ' + it);
  }
});

console.log(`${ok} testes passaram`);
