import { CSSProperties, useState } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Carta } from '../componentes/Carta';
import { Passo } from '../componentes/EditorPontos';
import { Folha } from '../componentes/Folha';
import { Icone } from '../componentes/Icone';
import { useContador } from '../componentes/tela';
import { contextoDaVira, JOKER } from '../motor/cartas';
import { NIVEIS } from '../motor/premios';
import { Acao, Jogador, jogador, Partida } from '../estado/partida';
import { BarraMeio } from './Rodada';

function LinhaPlacar({ j, maximo, posicao, aoTocar }: { j: Jogador; maximo: number; posicao: number; aoTocar: () => void }) {
  const pontos = useContador(j.pontos);
  return (
    <li className={`placar-linha ${j.vivo ? '' : 'fora'}`} onClick={aoTocar}>
      <span className="placar-pos">{j.vivo ? posicao : '—'}</span>
      <Avatar nome={j.nome} cor={j.cor} tam={42} apagado={!j.vivo} />
      <div className="placar-meio">
        <span className="placar-nome">{j.nome}{!j.vivo && <small> saiu</small>}</span>
        <div className="placar-trilho"><div className="placar-barra" style={{ width: `${Math.min(100, (j.pontos / maximo) * 100)}%`, background: j.cor }} /></div>
      </div>
      <span className="placar-pontos">{pontos}</span>
    </li>
  );
}

export function TelaPlacar({ p, despachar, podeDesfazer, aoDesfazer, aoEncerrar }: {
  p: Partida;
  despachar: (a: Acao) => void;
  podeDesfazer: boolean;
  aoDesfazer: () => void;
  aoEncerrar: () => void;
}) {
  const [editar, setEditar] = useState<Jogador | null>(null);
  const [valor, setValor] = useState(0);
  const [aberto, setAberto] = useState<number | null>(null);
  const [confirmarFim, setConfirmarFim] = useState(false);
  const ordem = [...p.jogadores].sort((a, b) => Number(b.vivo) - Number(a.vivo) || b.pontos - a.pontos);
  const maximo = Math.max(p.config.meio / 2, ...p.jogadores.map(j => j.pontos), 1);
  let pos = 0;

  return (
    <div className="tela tela-placar">
      <BarraMeio p={p} />
      <ol className="placar">
        {ordem.map(j => (
          <LinhaPlacar key={j.id} j={j} maximo={maximo} posicao={j.vivo ? ++pos : 0}
            aoTocar={() => { setEditar(j); setValor(j.pontos); }} />
        ))}
      </ol>
      <p className="nota centro">Toque num jogador para ajustar os pontos.</p>

      <div className="placar-acoes">
        <button className="botao botao-fantasma" onClick={aoDesfazer} disabled={!podeDesfazer}><Icone nome="desfazer" tam={18} /> Desfazer última rodada</button>
      </div>

      <h3 className="secao-titulo">Rodadas</h3>
      {p.historico.length === 0 && <p className="nota centro">Ainda ninguém bateu.</p>}
      <ul className="historico">
        {[...p.historico].reverse().map(r => {
          const v = jogador(p, r.vencedorId);
          const premios = r.linhas.filter(l => l.nivel);
          const saiu = r.efeitos.filter(e => e.saiu);
          // o que o vencedor puxou de fato (no fim da subida o meio pode ter menos que a batida)
          const puxou = r.efeitos.find(e => e.jogadorId === r.vencedorId)?.delta ?? 0;
          const desceu = r.efeitos.filter(e => e.delta < 0);
          const abrir = aberto === r.numero;
          return (
            <li key={r.numero} className={`historico-item ${abrir ? 'aberto' : ''}`}>
              <button className="historico-topo" onClick={() => setAberto(abrir ? null : r.numero)} aria-expanded={abrir}>
                <span className="historico-num">{r.numero}</span>
                <Avatar nome={v.nome} cor={v.cor} tam={30} />
                <span className="historico-texto">
                  <b>{v.nome}</b> bateu de {r.tam}
                  {premios.length > 0 && <span className="historico-premios">{premios.map((l, i) => <span key={i} className="mini-selo" style={{ '--cor': NIVEIS[l.nivel!].cor } as CSSProperties}>{l.rotulo}</span>)}</span>}
                </span>
                <span className="historico-pontos">{r.ganhaPartida ? <Icone nome="coroa" tam={18} /> : puxou > 0 ? `+${puxou}` : `−${r.total} cada`}</span>
              </button>
              {abrir && (
                <div className="historico-detalhe">
                  {r.vira !== null && <div className="historico-vira"><span>vira</span><Carta c={r.vira} tam={30} /></div>}
                  {r.mao && <div className="historico-mao">{r.mao.map((c, i) => <Carta key={i} c={c} tam={30} coringa={c !== JOKER && r.vira !== null && contextoDaVira(r.vira).ehCoringa(c)} />)}</div>}
                  <ul className="conta pequena">
                    {r.linhas.map((l, i) => <li key={i}><span className="conta-rotulo">{l.rotulo}{l.detalhe && <small>{l.detalhe}</small>}</span><span className="conta-pontos">{l.ganha ? 'ganha' : `+${l.pontos}`}</span></li>)}
                  </ul>
                  {puxou > 0 && puxou < r.total && <p className="nota">Puxou do meio: {v.nome} +{puxou}</p>}
                  {desceu.length > 0 && (
                    <p className="nota">Desceu: {desceu.map(e => `${jogador(p, e.jogadorId).nome} −${-e.delta}`).join(' · ')}</p>
                  )}
                  {saiu.length > 0 && <p className="nota">Saiu: {saiu.map(e => jogador(p, e.jogadorId).nome).join(', ')}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button className="botao botao-perigo botao-cheio encerrar" onClick={() => setConfirmarFim(true)}>Encerrar partida</button>

      <Folha aberta={editar !== null} aoFechar={() => setEditar(null)} titulo={editar ? `Pontos de ${editar.nome}` : ''}>
        {editar && (
          <div className="ajuste-pontos">
            <Avatar nome={editar.nome} cor={editar.cor} tam={64} />
            <Passo valor={valor} passo={10} max={9999} aoMudar={setValor} />
            <div className="ajuste-rapido">
              {[-5, -1, 1, 5].map(d => <button key={d} className="botao botao-fantasma botao-pequeno" onClick={() => setValor(Math.max(0, valor + d))}>{d > 0 ? `+${d}` : d}</button>)}
            </div>
            <button className="botao botao-ouro botao-cheio" onClick={() => { despachar({ tipo: 'ajustar', id: editar.id, pontos: valor }); setEditar(null); }}>Salvar</button>
          </div>
        )}
      </Folha>

      <Folha aberta={confirmarFim} aoFechar={() => setConfirmarFim(false)} titulo="Encerrar a partida?">
        <p className="nota">O placar e o histórico desta partida vão ser apagados.</p>
        <button className="botao botao-perigo botao-cheio" onClick={() => { setConfirmarFim(false); aoEncerrar(); }}>Encerrar</button>
        <button className="botao botao-fantasma botao-cheio" onClick={() => setConfirmarFim(false)}>Continuar jogando</button>
      </Folha>
    </div>
  );
}
