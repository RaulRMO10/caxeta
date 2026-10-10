import { Carta, contextoDaVira } from '../motor/cartas';
import { CONFIG_PADRAO, ConfigPontos, LinhaConta, Roleta, ROLETA_VAZIA, roletaTemCoringa, sortearRoleta } from '../motor/premios';

export interface Jogador {
  id: string;
  nome: string;
  cor: string;
  pontos: number;
  vivo: boolean;
}

export interface RodadaAtual {
  numero: number;
  dealerId: string;
  vira: Carta | null;
  roleta: Roleta;
  queimados: string[];
}

export interface Efeito {
  jogadorId: string;
  delta: number;
  saiu: boolean;
}

export interface Registro {
  numero: number;
  dealerId: string;
  vira: Carta | null;
  roleta: Roleta;
  vencedorId: string;
  tam: 9 | 10;
  mao: Carta[] | null; // null quando foi registrada sem marcar a mão
  linhas: LinhaConta[];
  total: number;
  ganhaPartida: boolean;
  efeitos: Efeito[];
  meioDepois: number;
}

export interface Partida {
  config: ConfigPontos;
  jogadores: Jogador[]; // na ordem da mesa; o jogo anda para a direita (próximo da lista)
  meio: number;
  rodada: RodadaAtual;
  historico: Registro[];
  campeaoId: string | null;
}

export const CORES_JOGADORES = ['#f97316', '#3b82f6', '#22c55e', '#ec4899', '#eab308', '#a855f7', '#14b8a6', '#ef4444'];

// ---------- Quem faz o quê ----------
export const vivos = (p: Partida) => p.jogadores.filter(j => j.vivo);
export const jogador = (p: Partida, id: string) => p.jogadores.find(j => j.id === id)!;

// próximo jogador vivo para a direita (passo 1) ou para a esquerda (passo -1)
export function vizinho(p: Partida, id: string, passo: 1 | -1): string {
  const n = p.jogadores.length;
  const i = p.jogadores.findIndex(j => j.id === id);
  for (let k = 1; k <= n; k++) {
    const j = p.jogadores[(i + passo * k + n * k) % n];
    if (j.vivo) return j.id;
  }
  return id;
}

export function funcoes(p: Partida) {
  const d = p.rodada.dealerId;
  return { embaralha: d, corta: vizinho(p, d, -1), comeca: vizinho(p, d, 1) };
}

// ---------- Subida e descida ----------
export function aplicarBatida(p: Partida, vencedorId: string, total: number, ganhaPartida: boolean) {
  const jogadores = p.jogadores.map(j => ({ ...j }));
  const efeitos: Efeito[] = jogadores.map(j => ({ jogadorId: j.id, delta: 0, saiu: false }));
  const ef = (id: string) => efeitos.find(e => e.jogadorId === id)!;
  const outros = jogadores.filter(j => j.vivo && j.id !== vencedorId);
  const vencedor = jogadores.find(j => j.id === vencedorId)!;
  let meio = p.meio;
  const tirarDeTodos = (valor: number) => {
    for (const j of outros) {
      const perda = Math.min(j.pontos, valor);
      j.pontos -= perda;
      ef(j.id).delta -= perda;
    }
  };
  const tirarQuemZerou = () => {
    for (const j of outros) if (j.vivo && j.pontos === 0) { j.vivo = false; ef(j.id).saiu = true; }
  };

  if (ganhaPartida) {
    for (const j of outros) { j.vivo = false; ef(j.id).saiu = true; }
  } else if (meio > 0) {
    // subida: puxa do meio; o que passar do meio já desce de cada um
    const pega = Math.min(total, meio);
    vencedor.pontos += pega;
    ef(vencedorId).delta += pega;
    meio -= pega;
    if (total > pega) tirarDeTodos(total - pega);
    if (meio === 0) tirarQuemZerou();
  } else {
    // descida: tira de cada um dos outros
    tirarDeTodos(total);
    tirarQuemZerou();
  }
  const restantes = jogadores.filter(j => j.vivo);
  return { jogadores, meio, efeitos, campeaoId: restantes.length === 1 ? restantes[0].id : null };
}

// ---------- Ações ----------
export type Acao =
  | { tipo: 'nova'; config: ConfigPontos; jogadores: { nome: string; cor: string }[]; dealer: number }
  | { tipo: 'vira'; carta: Carta | null; sortear?: boolean } // sortear: false quando a vira só é informada na hora da batida
  | { tipo: 'roleta' }
  | { tipo: 'queimar'; id: string }
  | { tipo: 'bateu'; vencedorId: string; tam: 9 | 10; mao: Carta[] | null; linhas: LinhaConta[]; total: number; ganhaPartida: boolean }
  | { tipo: 'ajustar'; id: string; pontos: number }
  | { tipo: 'meio'; valor: number }
  | { tipo: 'config'; config: ConfigPontos };

const novaRoleta = (cfg: ConfigPontos, vira: Carta) => sortearRoleta(cfg.roleta.trincas, cfg.roleta.quadra, contextoDaVira(vira));

export function novaPartida(config: ConfigPontos, nomes: { nome: string; cor: string }[], dealer: number): Partida {
  const jogadores = nomes.map((n, i) => ({ id: `j${i}-${Date.now().toString(36)}`, nome: n.nome, cor: n.cor, pontos: 0, vivo: true }));
  return {
    config,
    jogadores,
    meio: config.meio,
    rodada: { numero: 1, dealerId: jogadores[dealer].id, vira: null, roleta: ROLETA_VAZIA, queimados: [] },
    historico: [],
    campeaoId: null,
  };
}

export function reduzir(p: Partida | null, a: Acao): Partida | null {
  if (a.tipo === 'nova') return novaPartida(a.config, a.jogadores, a.dealer);
  if (!p) return p;
  switch (a.tipo) {
    case 'vira': {
      // a roleta gira depois da vira; se a vira foi corrigida e a roleta ficou com coringa, sorteia de novo
      const rodada = { ...p.rodada, vira: a.carta };
      const r = p.rodada.roleta;
      if (a.carta !== null && a.sortear !== false && (r.sorteio === 0 || roletaTemCoringa(r, contextoDaVira(a.carta))))
        rodada.roleta = novaRoleta(p.config, a.carta);
      return { ...p, rodada };
    }
    case 'roleta':
      if (p.rodada.vira === null) return p;
      return { ...p, rodada: { ...p.rodada, roleta: novaRoleta(p.config, p.rodada.vira) } };
    case 'queimar': {
      const q = p.rodada.queimados;
      return { ...p, rodada: { ...p.rodada, queimados: q.includes(a.id) ? q.filter(x => x !== a.id) : [...q, a.id] } };
    }
    case 'bateu': {
      const r = aplicarBatida(p, a.vencedorId, a.total, a.ganhaPartida);
      const registro: Registro = {
        numero: p.rodada.numero, dealerId: p.rodada.dealerId, vira: p.rodada.vira, roleta: p.rodada.roleta,
        vencedorId: a.vencedorId, tam: a.tam, mao: a.mao, linhas: a.linhas, total: a.total,
        ganhaPartida: a.ganhaPartida, efeitos: r.efeitos, meioDepois: r.meio,
      };
      const depois: Partida = { ...p, jogadores: r.jogadores, meio: r.meio, historico: [...p.historico, registro], campeaoId: r.campeaoId };
      // quem começou passa a embaralhar
      const proximoDealer = vizinho(depois, p.rodada.dealerId, 1);
      depois.rodada = { numero: p.rodada.numero + 1, dealerId: proximoDealer, vira: null, roleta: ROLETA_VAZIA, queimados: [] };
      return depois;
    }
    case 'ajustar':
      return { ...p, jogadores: p.jogadores.map(j => (j.id === a.id ? { ...j, pontos: Math.max(0, a.pontos) } : j)) };
    case 'meio':
      return { ...p, meio: Math.max(0, a.valor) };
    case 'config':
      return { ...p, config: a.config };
  }
}

// ---------- Guardar no celular ----------
const CHAVE = 'caxeta.partida.v1';
const CHAVE_DESFAZER = 'caxeta.desfazer.v1';

// Partidas salvas por versões antigas do app: a quadra já foi só um valor, e a roleta
// já foi sorteada antes da vira (podendo ter coringa).
function atualizar(p: Partida): Partida {
  const antiga = (r: Roleta) => typeof (r.quadra as unknown) === 'object' && r.quadra !== null;
  const normal = (r: Roleta): Roleta => ({ trincas: r.trincas, quadra: antiga(r) ? null : r.quadra, sorteio: r.sorteio ?? 1 });
  let config = p.config;
  const premiosAntigos = Object.values(config.premios).some(x => (x as { pontos9?: number }).pontos9 === undefined);
  if (premiosAntigos) {
    const premios = Object.fromEntries(Object.entries(CONFIG_PADRAO.premios).map(([id, padrao]) =>
      [id, { ...padrao, ativo: config.premios[id as keyof typeof config.premios]?.ativo ?? true }])) as ConfigPontos['premios'];
    config = { ...config, premios, desconto: CONFIG_PADRAO.desconto };
  }
  if (antiga(p.rodada.roleta))
    config = { ...config, roleta: { ...config.roleta, pontosTrinca: CONFIG_PADRAO.roleta.pontosTrinca, pontosQuadra: CONFIG_PADRAO.roleta.pontosQuadra } };
  let roleta = normal(p.rodada.roleta);
  if (p.rodada.vira === null) roleta = ROLETA_VAZIA;
  else if (antiga(p.rodada.roleta) || roletaTemCoringa(roleta, contextoDaVira(p.rodada.vira))) roleta = novaRoleta(config, p.rodada.vira);
  return {
    ...p,
    config,
    rodada: { ...p.rodada, roleta },
    historico: p.historico.map(h => ({ ...h, roleta: normal(h.roleta) })),
  };
}

export function carregar(): { partida: Partida | null; desfazer: Partida[] } {
  try {
    const p = localStorage.getItem(CHAVE);
    const d = localStorage.getItem(CHAVE_DESFAZER);
    return {
      partida: p ? atualizar(JSON.parse(p)) : null,
      desfazer: d ? (JSON.parse(d) as Partida[]).map(atualizar) : [],
    };
  } catch {
    return { partida: null, desfazer: [] };
  }
}

export function salvar(partida: Partida | null, desfazer: Partida[]) {
  try {
    if (partida) localStorage.setItem(CHAVE, JSON.stringify(partida));
    else localStorage.removeItem(CHAVE);
    localStorage.setItem(CHAVE_DESFAZER, JSON.stringify(desfazer.slice(-30)));
  } catch {
    // sem espaço ou navegador bloqueando: segue só na memória
  }
}
