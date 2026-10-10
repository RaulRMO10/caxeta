import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Carta } from '../componentes/Carta';
import { Folha } from '../componentes/Folha';
import { Icone } from '../componentes/Icone';
import { JogosMontados } from '../componentes/JogosMontados';
import { SeletorCarta } from '../componentes/SeletorCarta';
import { formaJogo } from '../motor/arranjo';
import { Carta as TipoCarta, contextoDaVira, copiasDisponiveis, JOKER } from '../motor/cartas';
import { Jogo } from '../motor/jogos';
import { calcularBatida, NIVEIS } from '../motor/premios';
import { Acao, jogador, Partida, vivos } from '../estado/partida';

type Passo = 'quem' | 'tipo' | 'vira' | 'mao' | 'resultado';

// As vagas da mão separadas em jogos, do jeito que a pessoa baixa na mesa.
const GRUPOS: Record<9 | 10, { nome: string; ini: number; fim: number }[]> = {
  9: [{ nome: 'Jogo 1', ini: 0, fim: 3 }, { nome: 'Jogo 2', ini: 3, fim: 6 }, { nome: 'Jogo 3', ini: 6, fim: 9 }],
  10: [{ nome: 'Jogo 1', ini: 0, fim: 3 }, { nome: 'Jogo 2', ini: 3, fim: 6 }, { nome: 'Quadra', ini: 6, fim: 10 }],
};

const nomeDoJogo = (j: Jogo) => (j.seq ? (j.tam === 4 ? 'Sequência de 4' : 'Sequência') : (j.tam === 4 ? 'Quadra de iguais' : 'Iguais'));

export function FluxoBatida({ aberta, aoFechar, p, despachar }: {
  aberta: boolean;
  aoFechar: () => void;
  p: Partida;
  despachar: (a: Acao) => void;
}) {
  const [passo, setPasso] = useState<Passo>('quem');
  const [vencedorId, setVencedorId] = useState<string | null>(null);
  const [tam, setTam] = useState<9 | 10>(9);
  const [vagas, setVagas] = useState<(TipoCarta | null)[]>(Array(9).fill(null));
  const [alvo, setAlvo] = useState(0); // vaga que recebe a próxima carta

  const comecarMao = (t: 9 | 10) => { setTam(t); setVagas(Array(t).fill(null)); setAlvo(0); };
  useEffect(() => {
    if (aberta) { setPasso('quem'); setVencedorId(null); comecarMao(9); }
  }, [aberta]);

  const vira = p.rodada.vira;
  const ctx = vira !== null ? contextoDaVira(vira) : null;
  const n = vivos(p).length;
  const mao = vagas.filter((c): c is TipoCarta => c !== null);
  const cheia = mao.length === tam;
  const resultado = useMemo(() => {
    if (vira === null || vagas.some(c => c === null)) return null;
    const grupos = GRUPOS[tam].map(g => vagas.slice(g.ini, g.fim) as TipoCarta[]);
    return calcularBatida(grupos.flat(), contextoDaVira(vira), p.rodada.roleta, p.config, n, grupos);
  }, [vagas, tam, vira, p.rodada.roleta, p.config, n]);

  // mão completa: mostra a conta
  useEffect(() => {
    if (passo === 'mao' && cheia) {
      const t = setTimeout(() => setPasso('resultado'), 450);
      return () => clearTimeout(t);
    }
  }, [cheia, passo]);

  const vencedor = vencedorId ? jogador(p, vencedorId) : null;
  const quantas = (c: TipoCarta) => mao.filter(x => x === c).length;
  const restantes = (c: TipoCarta) => (cheia ? 0 : copiasDisponiveis(c, vira) - quantas(c));
  const colocar = (c: TipoCarta) => {
    const novas = [...vagas];
    const i = novas[alvo] === null ? alvo : novas.indexOf(null);
    if (i < 0) return;
    novas[i] = c;
    setVagas(novas);
    // próxima vaga vazia depois desta (ou a primeira que sobrou)
    const depois = novas.findIndex((x, k) => k > i && x === null);
    setAlvo(depois >= 0 ? depois : novas.indexOf(null));
  };
  const tirar = (i: number) => { const novas = [...vagas]; novas[i] = null; setVagas(novas); setAlvo(i); };
  const semPremio = () => {
    const base = tam === 10 ? p.config.base10 : p.config.base9;
    despachar({ tipo: 'bateu', vencedorId: vencedorId!, tam, mao: null, linhas: [{ rotulo: `Batida de ${tam}`, pontos: base }], total: base, ganhaPartida: false });
    aoFechar();
  };
  const confirmar = () => {
    if (!resultado) return;
    despachar({ tipo: 'bateu', vencedorId: vencedorId!, tam, mao, linhas: resultado.linhas, total: resultado.total, ganhaPartida: resultado.ganhaPartida });
    aoFechar();
  };
  const queimar = () => {
    if (vencedorId) despachar({ tipo: 'queimar', id: vencedorId });
    aoFechar();
  };

  const voltar: Partial<Record<Passo, Passo>> = { tipo: 'quem', vira: 'tipo', mao: 'tipo', resultado: 'mao' };
  const titulo = {
    quem: 'Quem bateu?',
    tipo: 'Bateu de quanto?',
    vira: 'Antes: qual foi a vira?',
    mao: `Mão de ${vencedor?.nome ?? ''}`,
    resultado: resultado ? 'Conferido!' : 'Não fechou',
  }[passo];

  return (
    <Folha aberta={aberta} aoFechar={aoFechar} cheia titulo={
      <span className="batida-titulo">
        {voltar[passo] && <button className="botao-icone" onClick={() => setPasso(voltar[passo]!)} aria-label="Voltar"><Icone nome="voltar" /></button>}
        {titulo}
      </span>
    }>
      <div className="batida" key={passo}>
        {passo === 'quem' && (
          <div className="grade-jogadores grande">
            {vivos(p).map(j => (
              <button key={j.id} className="cartao-jogador" onClick={() => { setVencedorId(j.id); setPasso('tipo'); }}>
                <Avatar nome={j.nome} cor={j.cor} tam={56} />
                <span>{j.nome}</span>
                <small>{j.pontos} pts</small>
              </button>
            ))}
          </div>
        )}

        {passo === 'tipo' && vencedor && (
          <div className="batida-tipo">
            <div className="batida-quem"><Avatar nome={vencedor.nome} cor={vencedor.cor} tam={44} /> <b>{vencedor.nome}</b> bateu</div>
            {([9, 10] as const).map(t => (
              <button key={t} className="opcao-batida" onClick={() => { comecarMao(t); setPasso(vira === null ? 'vira' : 'mao'); }}>
                <span className="opcao-numero">{t}</span>
                <span className="opcao-texto">
                  <strong>Batida de {t}</strong>
                  <small>{t === 9 ? '3 trincas' : '2 trincas + 1 dobra'}</small>
                </span>
                <span className="selo-pontos">+{t === 10 ? p.config.base10 : p.config.base9}</span>
              </button>
            ))}
            <p className="nota">Depois você marca a mão para o app achar os prêmios. Se não tiver prêmio, dá para pular.</p>
          </div>
        )}

        {passo === 'vira' && (
          <div>
            <p className="nota">Para conferir a mão o app precisa saber os coringas. A roleta desta rodada não vale: ela só gira quando a vira é informada antes.</p>
            <SeletorCarta restantes={c => copiasDisponiveis(c, null)} aoEscolher={c => { despachar({ tipo: 'vira', carta: c, sortear: false }); setPasso('mao'); }} />
            <button className="botao botao-fantasma botao-cheio sem-premio" onClick={semPremio}>
              Sem prêmio: registrar só a batida (+{tam === 10 ? p.config.base10 : p.config.base9})
            </button>
          </div>
        )}

        {passo === 'mao' && (
          <div className="batida-mao">
            <div className="grupos">
              {GRUPOS[tam].map(g => {
                const doGrupo = vagas.slice(g.ini, g.fim);
                const completo = doGrupo.every(c => c !== null);
                const jogo = completo && ctx ? formaJogo(doGrupo as TipoCarta[], ctx) : null;
                const estado = !completo ? '' : jogo ? 'grupo-ok' : 'grupo-erro';
                return (
                  <div key={g.nome} className={`grupo ${estado}`}>
                    <div className="grupo-topo">
                      <span className="grupo-nome">{g.nome}</span>
                      <span className="grupo-status">
                        {!completo ? `${doGrupo.filter(c => c !== null).length} de ${g.fim - g.ini}`
                          : jogo ? <><Icone nome="check" tam={14} /> {nomeDoJogo(jogo)}</> : 'não forma jogo'}
                      </span>
                    </div>
                    <div className="grupo-cartas">
                      {doGrupo.map((c, k) => {
                        const i = g.ini + k;
                        return c !== null
                          ? <Carta key={i} c={c} tam={50} coringa={c !== JOKER && ctx?.ehCoringa(c)} onClick={() => tirar(i)} className="vaga-carta" />
                          : (
                            <button key={i} className={`vaga-botao ${alvo === i ? 'alvo' : ''}`} onClick={() => setAlvo(i)} aria-label={`Vaga ${k + 1} do ${g.nome}`}>
                              <Carta c={null} tam={50} />
                            </button>
                          );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="batida-mao-info">
              <span><b>{mao.length}</b> de {tam} cartas · toque numa carta para tirar</span>
              {mao.length > 0 && <button className="botao-texto" onClick={() => comecarMao(tam)}>limpar</button>}
            </div>
            <SeletorCarta comJoker restantes={restantes} quantas={quantas} ehCoringa={ctx?.ehCoringa} aoEscolher={colocar} />
            <button className="botao botao-fantasma botao-cheio sem-premio" onClick={semPremio}>
              Sem prêmio: registrar só a batida (+{tam === 10 ? p.config.base10 : p.config.base9})
            </button>
          </div>
        )}

        {passo === 'resultado' && ctx && (
          resultado ? (
            <div className="batida-resultado">
              {resultado.arrumacao !== 'marcada' && (
                <p className="aviso-arrumacao">
                  <Icone nome="info" tam={16} />
                  {resultado.arrumacao === 'melhor'
                    ? 'Achei um jeito de arrumar essas cartas que vale mais:'
                    : 'Do jeito que foi marcado algum jogo não fecha, mas as cartas fecham assim:'}
                </p>
              )}
              <JogosMontados r={resultado} ctx={ctx} />
              <ul className="conta">
                {resultado.linhas.map((l, i) => (
                  <li key={i} style={{ animationDelay: `${200 + i * 110}ms` }}>
                    <span className="conta-rotulo">
                      {l.nivel && <span className="ponto-nivel" style={{ background: NIVEIS[l.nivel].cor }} />}
                      {l.rotulo}
                      {l.detalhe && <small>{l.detalhe}</small>}
                    </span>
                    <span className="conta-pontos">{l.ganha ? <Icone nome="coroa" tam={18} /> : `+${l.pontos}`}</span>
                  </li>
                ))}
              </ul>
              <div className="conta-total">
                <span>Total</span>
                <strong>{resultado.ganhaPartida ? 'Ganha a partida!' : `+${resultado.total}`}</strong>
              </div>
              <button className="botao botao-ouro botao-grande botao-cheio" onClick={confirmar}>Confirmar</button>
            </div>
          ) : (
            <div className="batida-erro">
              <div className="erro-icone"><Icone nome="info" tam={36} /></div>
              <h3>Essas cartas não fecham uma batida de {tam}</h3>
              <p className="nota">{tam === 9 ? 'Precisa de 3 trincas.' : 'Precisa de 2 trincas e 1 dobra.'} Confira se marcou alguma carta errada.</p>
              <div className="leque-erro">{mao.map((c, i) => <Carta key={i} c={c} tam={34} coringa={c !== JOKER && ctx.ehCoringa(c)} />)}</div>
              <button className="botao botao-ouro botao-cheio" onClick={() => setPasso('mao')}>Corrigir as cartas</button>
              <button className="botao botao-perigo botao-cheio" onClick={queimar}><Icone nome="fogo" tam={18} /> Bateu errado: queimar {vencedor?.nome}</button>
            </div>
          )
        )}
      </div>
    </Folha>
  );
}
