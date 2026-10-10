'use strict';
// Roda os experimentos em paralelo (um processo por núcleo) e salva em resultados/.
//
//   node simular.js base <N> <rodadas>
//       Mesa só de jogadores seguros: quem ganha, como bate, e com que frequência
//       cada prêmio aparece "sem querer" na batida de quem ganhou.
//
//   node simular.js cacar <familia> <N> <maosParaOlhar> [maxGap]
//   node simular.js cacar roleta:<trincas>:<quadras> <N> <maosParaOlhar> [maxGap]
//       O jogador 0 decide, olhando a mão recebida, se corre atrás do prêmio:
//       corre quando a distância até o prêmio é no máximo (distância até bater) + maxGap.
//       Cada mão em que ele correria é jogada duas vezes, com as mesmas cartas: uma
//       jogando seguro e outra correndo atrás. A diferença mostra o risco da aposta.
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');
const fs = require('fs');
const path = require('path');
const C = require('./core');
const G = require('./jogo');

const MAX_GAP = 3;

function familiaPorNome(nome, rand) {
  // quadra sorteada mais aberta: só o valor (qualquer dobra de iguais desse valor)
  // ou só a sequência de 4 valores (em qualquer pinta)
  if (nome.startsWith('quadra:')) {
    let modo = nome.split(':')[1];
    if (modo === 'qualquer') modo = rand() < 0.5 ? 'valor' : 'seq';
    const dobras = C.JOGOS.dobras;
    if (modo === 'valor') {
      const v = 1 + Math.floor(rand() * 13);
      return new C.FamiliaRoleta(dobras.filter(d => !d.seq && d.valor === v).map(d => d.slots));
    }
    const p = 1 + Math.floor(rand() * 11);
    return new C.FamiliaRoleta(dobras.filter(d => d.seq && d.pos === p).map(d => d.slots));
  }
  if (nome.startsWith('roleta:')) {
    const [, k, q] = nome.split(':').map(Number);
    const it = C.sortearItens(rand, k, q);
    return new C.FamiliaRoleta([...it.trincas, ...it.quadras]);
  }
  const f = C.familias()[nome];
  if (!f) throw new Error('família desconhecida: ' + nome);
  return f;
}

// ---------- mesa só de seguros ----------
function rodarBase({ N, ini, fim }) {
  const fams = C.familias();
  const nomes = Object.keys(fams);
  const r = {
    rodadas: 0, sem: 0, vitPos: new Array(N).fill(0), tam10: 0, atravessado: 0, turnos: 0, primeira: 0,
    limpa: 0, fam: Object.fromEntries(nomes.map(n => [n, [0, 0, 0, 0]])),
    roleta: Array.from({ length: 7 }, () => new Array(4).fill(0)), // [trincas][quadras] -> batidas com algum item
  };
  const js = Array.from({ length: N }, () => new G.Jogador(G.Seguro()));
  for (let s = ini; s < fim; s++) {
    avisar(s - ini);
    const rand = G.criarRand(s * 7919 + 13);
    const dealer = s % N;
    const res = G.jogarRodada(js, dealer, rand);
    r.rodadas++;
    if (res.vencedor < 0) { r.sem++; continue; }
    r.vitPos[(res.vencedor - dealer - 1 + 2 * N) % N]++; // 0 = quem começa
    if (res.tam === 10) r.tam10++;
    if (res.atravessado) r.atravessado++;
    if (res.vezes <= 1) r.primeira++;
    r.turnos += res.turnos;
    const { h, J, ctx } = res;
    const geral = C.BUSCA_GERAL.detectar(h, J, ctx, C.JOKER_CONTA);
    if ((res.tam === 10 ? geral.s10 : geral.s9) === 0) r.limpa++;
    for (const n of nomes) {
      const d = fams[n].detectar(h, J, ctx);
      const subs = Math.min(d.s9, d.s10);
      if (subs < Infinity) r.fam[n][Math.min(subs, 3)]++;
    }
    const it = C.sortearItens(G.criarRand(s * 31 + 7), 6, 3);
    const rol = new C.FamiliaRoleta([...it.trincas, ...it.quadras]).itensNaBatida(h, J, ctx).map(x => x.b9 || x.b10);
    for (let k = 0; k <= 6; k++) for (let q = 0; q <= 3; q++) {
      if (rol.slice(0, k).some(Boolean) || rol.slice(6, 6 + q).some(Boolean)) r.roleta[k][q]++;
    }
  }
  return r;
}

// ---------- caçador x seguro com as mesmas cartas ----------
function rodarCacar({ N, familia, ini, fim, maxGap }) {
  const novo = () => ({ n: 0, segVit: 0, segBase: 0, chVit: 0, chBase: 0, chSubs: 0, chSubsHist: [0, 0, 0, 0], chTurnos: 0, segTurnos: 0 });
  const r = { olhadas: 0, porGap: Array.from({ length: maxGap + 1 }, novo) };
  const js = Array.from({ length: N }, () => new G.Jogador(G.Seguro()));
  const seguro = G.Seguro();
  for (let s = ini; s < fim; s++) {
    avisar(s - ini);
    const semente = s * 7919 + 13;
    const dealer = s % N;
    const fam = familiaPorNome(familia, G.criarRand(s * 31 + 7));
    const cacador = G.Cacador(fam);
    js[0].estrategia = cacador;
    let gap = 0;
    const filtro = ctx => {
      const p = js[0];
      const d9 = C.BUSCA_GERAL.avaliar(p.h, p.J, ctx, 3, 0, false);
      gap = Math.max(0, p.dF - d9);
      return gap <= maxGap;
    };
    r.olhadas++;
    const resC = G.jogarRodada(js, dealer, G.criarRand(semente), filtro);
    if (resC.pulada) continue;
    js[0].estrategia = seguro;
    const resS = G.jogarRodada(js, dealer, G.criarRand(semente));
    const a = r.porGap[gap];
    a.n++;
    if (resS.vencedor === 0) { a.segVit++; a.segBase += resS.tam === 10 ? 2 : 1; a.segTurnos += resS.turnos; }
    if (resC.vencedor === 0) {
      const d = fam.detectar(resC.h, resC.J, resC.ctx);
      const subs = resC.tam === 10 ? d.s10 : d.s9;
      a.chVit++; a.chBase += resC.tam === 10 ? 2 : 1; a.chTurnos += resC.turnos;
      a.chSubs += subs; a.chSubsHist[Math.min(subs, 3)]++;
    }
  }
  return r;
}

// manda o progresso para o processo principal de tempos em tempos
function avisar(feitas) {
  if (feitas % 200 === 0 && !isMainThread) parentPort.postMessage({ progresso: feitas });
}

// soma resultados parciais (números e vetores, recursivamente)
function somar(a, b) {
  if (typeof a === 'number') return a + b;
  if (Array.isArray(a)) return a.map((x, i) => somar(x, b[i]));
  const o = {};
  for (const k of Object.keys(a)) o[k] = somar(a[k], b[k]);
  return o;
}

async function principal() {
  const [tipo, ...args] = process.argv.slice(2);
  let tarefa, total, nome;
  if (tipo === 'base') {
    const N = +args[0]; total = +args[1];
    tarefa = { tipo, N };
    nome = `base_N${N}`;
  } else if (tipo === 'cacar') {
    const familia = args[0], N = +args[1]; total = +args[2];
    const maxGap = args[3] !== undefined ? +args[3] : MAX_GAP;
    tarefa = { tipo, N, familia, maxGap };
    nome = `cacar_${familia.replace(/:/g, '-')}_N${N}`;
  } else {
    console.log('uso: node simular.js base <N> <rodadas> | cacar <familia> <N> <maos> [maxGap]');
    process.exit(1);
  }
  const nw = os.cpus().length;
  const t0 = Date.now();
  const feitas = new Array(nw).fill(0);
  const arqProgresso = path.join(__dirname, 'resultados', 'progresso.txt');
  fs.mkdirSync(path.dirname(arqProgresso), { recursive: true });
  let ultimo = 0;
  const partes = await Promise.all(Array.from({ length: nw }, (_, w) => new Promise((ok, erro) => {
    const ini = Math.floor(total * w / nw), fim = Math.floor(total * (w + 1) / nw);
    const wk = new Worker(__filename, { workerData: { ...tarefa, ini, fim } });
    wk.on('message', m => {
      if (m.progresso === undefined) { feitas[w] = fim - ini; ok(m); return; }
      feitas[w] = m.progresso;
      if (Date.now() - ultimo > 5000) {
        ultimo = Date.now();
        const f = feitas.reduce((a, b) => a + b, 0) / total;
        fs.writeFileSync(arqProgresso, `${nome} ${(100 * f).toFixed(0)}% (${((Date.now() - t0) / 1000).toFixed(0)}s)
`);
      }
    });
    wk.on('error', erro);
  })));
  const res = partes.reduce(somar);
  res.config = { ...tarefa, total, segundos: (Date.now() - t0) / 1000 };
  fs.mkdirSync(path.join(__dirname, 'resultados'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'resultados', nome + '.json'), JSON.stringify(res, null, 1));
  console.log(`${nome}: ${total} em ${res.config.segundos.toFixed(0)}s`);
}

if (isMainThread) principal();
else parentPort.postMessage(workerData.tipo === 'base' ? rodarBase(workerData) : rodarCacar(workerData));
