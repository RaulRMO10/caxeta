import { arranjosPossiveis, Arranjo, preencher, Vaga } from './arranjo';
import { Carta, Contexto, valorDe } from './cartas';
import { DOBRAS, Jogo, JOGOS, TRINCAS } from './jogos';

export type Nivel = 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lenda';

export const NIVEIS: Record<Nivel, { nome: string; cor: string }> = {
  bronze: { nome: 'Bronze', cor: '#d08c4f' },
  prata: { nome: 'Prata', cor: '#c3ccd8' },
  ouro: { nome: 'Ouro', cor: '#f2c14e' },
  diamante: { nome: 'Diamante', cor: '#7dd3fc' },
  lenda: { nome: 'Lenda', cor: '#c084fc' },
};

export type PremioId =
  | 'cor_unica' | 'figuras' | 'escada_colorida' | 'uma_pinta' | 'gemeas'
  | 'escadao_colorido' | 'bandeira' | 'escada' | 'escadao';

export interface DefPremio {
  id: PremioId;
  nome: string;
  nivel: Nivel;
  pontos: number; // padrão, numa mesa de 4 (0 = ganha a partida)
  descricao: string;
  exemplo: string;
  semQuerer: number; // sai sem ninguém procurar em 1 a cada X batidas (simulação, mesa de 4)
  contidoEm: PremioId[]; // se um desses também saiu, vale só o maior
}

export const PREMIOS: DefPremio[] = [
  { id: 'cor_unica', nome: 'Cor única', nivel: 'bronze', pontos: 40, semQuerer: 32,
    descricao: 'A batida inteira em sequências de uma cor só: só vermelhas (♥ ♦) ou só pretas (♠ ♣).',
    exemplo: '2♥ 3♥ 4♥ 7♦ 8♦ 9♦ J♥ Q♥ K♥', contidoEm: ['uma_pinta', 'escada', 'escadao'] },
  { id: 'figuras', nome: 'Figuras', nivel: 'bronze', pontos: 40, semQuerer: 180,
    descricao: 'A batida inteira só com J, Q, K e Ás.',
    exemplo: 'J♥ Q♥ K♥ A♠ A♣ A♦ Q♦ K♦ A♦', contidoEm: [] },
  { id: 'escada_colorida', nome: 'Escada colorida', nivel: 'prata', pontos: 60, semQuerer: 140,
    descricao: '9 valores seguidos (10 na batida de 10), em sequências de qualquer pinta.',
    exemplo: '3♥ 4♥ 5♥ 6♠ 7♠ 8♠ 9♦ 10♦ J♦', contidoEm: ['escadao_colorido', 'escada', 'escadao'] },
  { id: 'uma_pinta', nome: 'Uma pinta só', nivel: 'prata', pontos: 60, semQuerer: 290,
    descricao: 'A batida inteira em sequências da mesma pinta.',
    exemplo: '2♣ 3♣ 4♣ 7♣ 8♣ 9♣ J♣ Q♣ K♣', contidoEm: ['escada', 'escadao'] },
  { id: 'gemeas', nome: 'Gêmeas', nivel: 'ouro', pontos: 80, semQuerer: 370,
    descricao: 'Dois jogos idênticos, carta por carta (só dá porque são dois baralhos).',
    exemplo: '7♣ 8♣ 9♣ 7♣ 8♣ 9♣ 5♠ 5♥ 5♦', contidoEm: [] },
  { id: 'escadao_colorido', nome: 'Escadão colorido', nivel: 'ouro', pontos: 80, semQuerer: 830,
    descricao: 'Do Ás até o 9 (até o 10 na batida de 10), com as pintas misturadas.',
    exemplo: 'A♥ 2♥ 3♥ 4♠ 5♠ 6♠ 7♦ 8♦ 9♦', contidoEm: ['escadao'] },
  { id: 'bandeira', nome: 'Bandeira', nivel: 'diamante', pontos: 120, semQuerer: 2000,
    descricao: 'Três sequências com os mesmos valores, em três pintas diferentes.',
    exemplo: '4♥ 5♥ 6♥ 4♠ 5♠ 6♠ 4♦ 5♦ 6♦', contidoEm: [] },
  { id: 'escada', nome: 'Escada', nivel: 'diamante', pontos: 120, semQuerer: 3300,
    descricao: '9 cartas seguidas da mesma pinta (10 na batida de 10).',
    exemplo: '3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠ 10♠ J♠', contidoEm: ['escadao'] },
  { id: 'escadao', nome: 'Escadão', nivel: 'lenda', pontos: 0, semQuerer: 25000,
    descricao: 'Do Ás até o 9 da mesma pinta. Ganha a partida na hora.',
    exemplo: 'A♠ 2♠ 3♠ 4♠ 5♠ 6♠ 7♠ 8♠ 9♠', contidoEm: [] },
];

export const PREMIO = Object.fromEntries(PREMIOS.map(p => [p.id, p])) as Record<PremioId, DefPremio>;

// ---------- Roleta ----------
// Bônus da rodada: trincas e uma quadra exatas, que só valem feitas sem coringa.
// É sorteada depois da vira e nunca usa as cartas que são coringa na rodada.
export interface Roleta {
  trincas: number[]; // ids de trincas
  quadra: number | null; // id de uma dobra (4 cartas exatas)
  sorteio: number; // muda a cada sorteio; 0 = ainda não sorteada (falta a vira)
}

export const ROLETA_VAZIA: Roleta = { trincas: [], quadra: null, sorteio: 0 };

let ultimoSorteio = 0;

export function sortearRoleta(nTrincas: number, comQuadra: boolean, ctx: Contexto, rand = Math.random): Roleta {
  const semCoringa = (j: Jogo) => j.slots.every(s => !ctx.ehCoringa(s));
  const trincas = TRINCAS.filter(semCoringa);
  const ids = new Set<number>();
  while (ids.size < Math.min(nTrincas, trincas.length)) ids.add(trincas[Math.floor(rand() * trincas.length)].id);
  let quadra: number | null = null;
  if (comQuadra) {
    // metade das vezes sequência de 4, metade quadra de iguais
    const seq = rand() < 0.5;
    const lista = DOBRAS.filter(d => d.seq === seq && semCoringa(d));
    quadra = lista[Math.floor(rand() * lista.length)].id;
  }
  ultimoSorteio = Math.max(Date.now(), ultimoSorteio + 1);
  return { trincas: [...ids], quadra, sorteio: ultimoSorteio };
}

// A roleta tem alguma carta que é coringa com esta vira? (acontece quando a vira é corrigida)
export const roletaTemCoringa = (r: Roleta, ctx: Contexto) =>
  [...r.trincas, ...(r.quadra !== null ? [r.quadra] : [])].some(id => JOGOS[id].slots.some(ctx.ehCoringa));

// ---------- Configuração da pontuação ----------
export interface ConfigPontos {
  meio: number;
  base9: number;
  base10: number;
  desconto: number; // pontos tirados de cada prêmio fixo por coringa/Joker usado
  ajusteMesa: boolean;
  premios: Record<PremioId, { ativo: boolean; pontos: number }>;
  roleta: { trincas: number; pontosTrinca: number; quadra: boolean; pontosQuadra: number };
}

export const CONFIG_PADRAO: ConfigPontos = {
  meio: 100,
  base9: 10,
  base10: 20,
  desconto: 10,
  ajusteMesa: true,
  premios: Object.fromEntries(PREMIOS.map(p => [p.id, { ativo: true, pontos: p.pontos }])) as ConfigPontos['premios'],
  roleta: { trincas: 3, pontosTrinca: 10, quadra: true, pontosQuadra: 20 },
};

// Quanto mais gente na mesa, mais difícil completar um prêmio antes de alguém bater.
// Multiplicador do valor dos prêmios pelo número de jogadores vivos (simulação).
export const MULTIPLICADOR_MESA: Record<number, number> = { 2: 0.5, 3: 0.75, 4: 1, 5: 1.15, 6: 1.35, 7: 1.45, 8: 1.5 };

export const multiplicador = (cfg: ConfigPontos, jogadores: number) =>
  cfg.ajusteMesa ? (MULTIPLICADOR_MESA[jogadores] ?? 1) : 1;

export const arred5 = (x: number) => Math.round(x / 5) * 5;

export const valorPremio = (cfg: ConfigPontos, id: PremioId, jogadores: number) =>
  arred5(cfg.premios[id].pontos * multiplicador(cfg, jogadores));

// A roleta é um bônus fixo para movimentar a partida: não muda com o tamanho da mesa.
export const valorTrincaRoleta = (cfg: ConfigPontos) => cfg.roleta.pontosTrinca;
export const valorQuadraRoleta = (cfg: ConfigPontos) => cfg.roleta.pontosQuadra;

// ---------- Prêmios de um arranjo ----------
function premiosFixos(jogos: Jogo[], tam: number): PremioId[] {
  const achados: PremioId[] = [];
  if (jogos.every(j => j.seq)) {
    const naipes = new Set(jogos.map(j => j.naipe));
    const umaPinta = naipes.size === 1;
    const cores = new Set(jogos.map(j => j.naipe & 1));
    if (cores.size === 1) achados.push('cor_unica');
    if (umaPinta) achados.push('uma_pinta');
    const ord = [...jogos].sort((a, b) => a.pos - b.pos);
    const seguidas = ord.every((j, i) => i === 0 || j.pos === ord[i - 1].pos + ord[i - 1].tam);
    if (seguidas) {
      achados.push('escada_colorida');
      if (ord[0].pos === 1) achados.push('escadao_colorido');
      if (umaPinta) achados.push('escada');
      if (umaPinta && ord[0].pos === 1) achados.push('escadao');
    }
    if (tam === 9 && naipes.size === 3 && jogos.every(j => j.pos === jogos[0].pos)) achados.push('bandeira');
  }
  if (jogos.every(j => j.slots.every(s => [1, 11, 12, 13].includes(valorDe(s))))) achados.push('figuras');
  if (jogos.some((j, i) => jogos.some((k, x) => x > i && k.id === j.id))) achados.push('gemeas');
  // quando um prêmio está dentro de outro que também saiu, vale só o maior
  return achados.filter(p => !PREMIO[p].contidoEm.some(q => achados.includes(q)));
}

// o jogo dá para ser montado só com cartas naturais da mão (coringa no próprio lugar vale)?
function natural(j: Jogo, mao: Carta[]) {
  const precisa = new Map<Carta, number>();
  for (const s of j.slots) precisa.set(s, (precisa.get(s) ?? 0) + 1);
  for (const [s, n] of precisa) if (mao.filter(c => c === s).length < n) return false;
  return true;
}

export interface LinhaConta {
  rotulo: string;
  pontos: number; // 0 quando ganha a partida
  detalhe?: string;
  nivel?: Nivel;
  ganha?: boolean;
}

export interface ResultadoBatida {
  tam: 9 | 10;
  arranjo: Arranjo;
  vagas: Vaga[][];
  linhas: LinhaConta[];
  total: number;
  ganhaPartida: boolean;
  premios: PremioId[];
  roletaFeita: number[]; // índices dos jogos do arranjo que são da roleta
}

function avaliar(arr: Arranjo, mao: Carta[], ctx: Contexto, roleta: Roleta, cfg: ConfigPontos, jogadores: number): ResultadoBatida {
  const tam = mao.length as 9 | 10;
  const linhas: LinhaConta[] = [{ rotulo: `Batida de ${tam}`, pontos: tam === 10 ? cfg.base10 : cfg.base9 }];
  let ganha = false;
  const premios = premiosFixos(arr.jogos, tam).filter(p => cfg.premios[p].ativo);
  for (const p of premios) {
    const def = PREMIO[p];
    if (def.nivel === 'lenda') {
      ganha = true;
      linhas.push({ rotulo: def.nome, pontos: 0, nivel: def.nivel, ganha: true, detalhe: 'ganha a partida' });
      continue;
    }
    const cheio = valorPremio(cfg, p, jogadores);
    const desconto = cfg.desconto * arr.substitutos;
    linhas.push({
      rotulo: def.nome, nivel: def.nivel, pontos: Math.max(0, cheio - desconto),
      detalhe: desconto > 0 ? `${cheio} − ${desconto} (${arr.substitutos} coringa${arr.substitutos > 1 ? 's' : ''})` : undefined,
    });
  }
  const roletaFeita: number[] = [];
  const vistos = new Set<number>();
  arr.jogos.forEach((j, i) => {
    if (vistos.has(j.id) || !natural(j, mao)) return;
    if (roleta.trincas.includes(j.id)) {
      vistos.add(j.id); roletaFeita.push(i);
      linhas.push({ rotulo: 'Trinca da roleta', nivel: 'bronze', pontos: valorTrincaRoleta(cfg) });
    } else if (cfg.roleta.quadra && roleta.quadra === j.id) {
      vistos.add(j.id); roletaFeita.push(i);
      linhas.push({ rotulo: 'Quadra da roleta', nivel: 'bronze', pontos: valorQuadraRoleta(cfg) });
    }
  });
  const total = linhas.reduce((s, l) => s + l.pontos, 0);
  const vagas = preencher(arr, mao, ctx, roletaFeita.map(i => arr.jogos[i].id));
  return { tam, arranjo: arr, vagas, linhas, total, ganhaPartida: ganha, premios, roletaFeita };
}

// Melhor forma de arrumar a mão do vencedor (a que dá mais pontos). null se não fecha batida.
export function calcularBatida(mao: Carta[], ctx: Contexto, roleta: Roleta, cfg: ConfigPontos, jogadores: number): ResultadoBatida | null {
  let melhor: ResultadoBatida | null = null;
  for (const arr of arranjosPossiveis(mao, ctx)) {
    const r = avaliar(arr, mao, ctx, roleta, cfg, jogadores);
    if (!melhor
      || Number(r.ganhaPartida) - Number(melhor.ganhaPartida) > 0
      || (r.ganhaPartida === melhor.ganhaPartida && (r.total > melhor.total
        || (r.total === melhor.total && r.arranjo.substitutos < melhor.arranjo.substitutos)))) melhor = r;
  }
  return melhor;
}

