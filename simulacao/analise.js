'use strict';
// Lê resultados/ e calcula o valor justo de cada prêmio.
//
// Unidade: 1 = uma batida de 9 (na escala de 100 pontos, 10 pontos).
// Valor justo do prêmio = quanto ele precisa pagar para que correr atrás dele
// renda, em média, o mesmo que jogar seguro com as mesmas cartas:
//   chance(seguro) x base(seguro) = chance(caçando) x (base(caçando) + prêmio - desconto)
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'resultados');
const ler = nome => {
  const f = path.join(DIR, nome + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
};
const pct = (a, b, casas = 1) => (b ? (100 * a / b).toFixed(casas) + '%' : '-');
const NOMES = {
  dez: 'Bater de 10', uma_pinta: 'Uma pinta só', cor_unica: 'Cor única', so_iguais: 'Só iguais',
  gemeas: 'Gêmeas', figuras: 'Figuras (J Q K A)', escada_colorida: 'Escada colorida',
  escadao_colorido: 'Escadão colorido', escada: 'Escada', escadao: 'Escadão', bandeira: 'Bandeira',
};
const DESCONTO = 1; // cada coringa usado tira 1 unidade (10 pontos) do prêmio

// ---------- mesa só de seguros ----------
console.log('=== MESA SÓ DE JOGADORES SEGUROS ===\n');
for (const N of [2, 3, 4, 6, 8]) {
  const r = ler(`base_N${N}`);
  if (!r) continue;
  const b = r.rodadas - r.sem;
  console.log(`N=${N} (${r.rodadas} rodadas): turnos/rodada ${(r.turnos / b).toFixed(1)} | de 10 ${pct(r.tam10, b)} | atravessado ${pct(r.atravessado, b)} | de primeira ${pct(r.primeira, b)} | sem coringa ${pct(r.limpa, b)}`);
  console.log(`   vitórias por posição (quem começa -> quem deu): ${r.vitPos.map(v => pct(v, r.rodadas, 0)).join(' ')}`);
}

const base = ler('base_N4');
if (base) {
  const b = base.rodadas - base.sem;
  console.log('\nPrêmios que saem SEM QUERER (N=4, % das batidas) e coringas usados [0, 1, 2, 3+]:');
  for (const [k, h] of Object.entries(base.fam)) {
    const tot = h.reduce((x, y) => x + y, 0);
    console.log(`  ${(NOMES[k] || k).padEnd(20)} ${pct(tot, b, 2).padStart(7)}   [${h.join(', ')}]`);
  }
  console.log('\nRoleta SEM QUERER (N=4): % das batidas que trazem algum item sorteado, sem coringa');
  console.log('              ' + [0, 1, 2, 3].map(q => `${q} quadra${q === 1 ? ' ' : 's'}`).join('   '));
  for (let k = 0; k <= 6; k++) console.log(`  ${k} trinca${k === 1 ? ' ' : 's'}   ` + base.roleta[k].map(v => pct(v, b).padStart(9)).join('  '));
}

// ---------- caçadores ----------
function resumoCaca(r, gapMax) {
  const s = { n: 0, segVit: 0, segBase: 0, chVit: 0, chBase: 0, chSubs: 0 };
  for (let g = 0; g <= gapMax && g < r.porGap.length; g++) for (const k of Object.keys(s)) s[k] += r.porGap[g][k];
  const pSeg = s.segVit / s.n, pCh = s.chVit / s.n;
  const bSeg = s.segBase / s.segVit, bCh = s.chBase / s.chVit, subs = s.chSubs / s.chVit;
  const liquido = pCh > 0 ? pSeg * bSeg / pCh - bCh : Infinity;
  return { ...s, freq: s.n / r.olhadas, pSeg, pCh, bSeg, bCh, subs, liquido, nominal: liquido + DESCONTO * subs };
}

console.log('\n=== CORRENDO ATRÁS DO PRÊMIO (N=4) ===');
console.log('Corre quando a mão recebida está a no máximo G cartas a mais do prêmio do que de bater.');
console.log('freq = em quantas mãos isso acontece | seguro/caçando = chance de bater nessas mesmas mãos');
console.log('valor = quanto o prêmio precisa pagar (em batidas de 9) | +coringa = já somando o desconto médio\n');
const arquivos = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter(f => f.startsWith('cacar_') && f.endsWith('_N4.json')) : [];
const linhas = [];
for (const f of arquivos) {
  const r = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const chave = f.slice(6, -8);
  const nome = chave.startsWith('roleta-') ? `Roleta ${chave.split('-')[1]} trinca(s) + ${chave.split('-')[2]} quadra(s)` : (NOMES[chave] || chave);
  linhas.push({ nome, chave, r });
}
for (const { nome, r } of linhas) {
  console.log(`${nome}  (${r.olhadas} mãos olhadas)`);
  for (let G = 0; G < r.porGap.length; G++) {
    const s = resumoCaca(r, G);
    if (s.n === 0) continue;
    console.log(`   G<=${G}: freq ${pct(s.n, r.olhadas, 2).padStart(7)} | n ${String(s.n).padStart(6)} | seguro ${pct(s.segVit, s.n).padStart(6)} | caçando ${pct(s.chVit, s.n, 2).padStart(7)} (${s.chVit}) | coringas/batida ${s.subs.toFixed(2)} | valor ${s.liquido.toFixed(1).padStart(6)} | +coringa ${s.nominal.toFixed(1).padStart(6)}`);
  }
}

// ---------- resumo em pontos (escala do meio com 100 pontos: batida de 9 = 10) ----------
const G_REF = 1;
console.log(`\n=== RESUMO (N=4, quem corre atrás com a mão até ${G_REF} carta mais longe do prêmio) ===`);
console.log('prêmio'.padEnd(34) + 'sai sem querer   corre em   consegue   justo líquido   justo c/ desconto');
const bN4 = base ? base.rodadas - base.sem : 0;
const naturalDe = chave => {
  if (!base) return '-';
  if (chave.startsWith('roleta-')) {
    const [k, q] = chave.split('-').slice(1).map(Number);
    return pct(base.roleta[k][q], bN4, 2);
  }
  const h = base.fam[chave];
  return h ? pct(h.reduce((a, b) => a + b, 0), bN4, 2) : '-';
};
const resumo = linhas.map(({ nome, chave, r }) => ({ nome, chave, s: resumoCaca(r, G_REF) }))
  .sort((a, b) => a.s.nominal - b.s.nominal);
for (const { nome, chave, s } of resumo) {
  console.log(nome.padEnd(34) + naturalDe(chave).padStart(14) + pct(s.n, s.n / s.freq, 0).padStart(11) +
    pct(s.chVit, s.n, 2).padStart(11) + `${Math.round(10 * s.liquido)} pts`.padStart(16) + `${Math.round(10 * s.nominal)} pts`.padStart(20));
}

// ---------- tamanho da mesa ----------
console.log('\n=== TAMANHO DA MESA (valor justo com desconto, em pontos) ===');
for (const chave of ['escada_colorida', 'roleta-3-0', 'gemeas']) {
  const vals = [2, 4, 6].map(N => {
    const r = ler(`cacar_${chave}_N${N}`);
    return r ? `N=${N}: ${Math.round(10 * resumoCaca(r, G_REF).nominal)} pts` : `N=${N}: -`;
  });
  console.log(`  ${(NOMES[chave] || chave).padEnd(18)} ${vals.join('   ')}`);
}

module.exports = { resumoCaca, ler, NOMES };
