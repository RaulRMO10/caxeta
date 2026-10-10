import { useState } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Carta } from '../componentes/Carta';
import { Folha } from '../componentes/Folha';
import { Icone, NomeIcone } from '../componentes/Icone';
import { ComNaipes } from '../componentes/Naipe';
import { RoletaResumo } from '../componentes/Roleta';
import { SeletorCarta } from '../componentes/SeletorCarta';
import { copiasDisponiveis, contextoDaVira, nomeCarta } from '../motor/cartas';
import { valorQuadraRoleta, valorTrincaRoleta } from '../motor/premios';
import { Acao, funcoes, jogador, Partida, vivos } from '../estado/partida';

export function BarraMeio({ p }: { p: Partida }) {
  const descida = p.meio === 0;
  return (
    <div className={`barra-meio ${descida ? 'descida' : ''}`}>
      <div className="barra-meio-texto">
        <span className="fase">{descida ? 'Descida' : 'Subida'}</span>
        <span>{descida ? 'quem bate tira de cada um' : <>meio: <b>{p.meio}</b> de {p.config.meio}</>}</span>
      </div>
      <div className="barra-meio-trilho"><div className="barra-meio-cheia" style={{ width: `${(p.meio / p.config.meio) * 100}%` }} /></div>
    </div>
  );
}

function Funcao({ icone, rotulo, id, p }: { icone: NomeIcone; rotulo: string; id: string; p: Partida }) {
  const j = jogador(p, id);
  return (
    <div className="funcao">
      <span className="funcao-icone"><Icone nome={icone} tam={16} /></span>
      <Avatar nome={j.nome} cor={j.cor} tam={34} />
      <span className="funcao-nome">{j.nome}</span>
      <span className="funcao-rotulo">{rotulo}</span>
    </div>
  );
}

export function TelaRodada({ p, despachar, aoBater, aoRoleta }: {
  p: Partida;
  despachar: (a: Acao) => void;
  aoBater: () => void;
  aoRoleta: () => void;
}) {
  const [escolherVira, setEscolherVira] = useState(false);
  const [queimar, setQueimar] = useState(false);
  const f = funcoes(p);
  const vira = p.rodada.vira;
  const ctx = vira !== null ? contextoDaVira(vira) : null;

  return (
    <div className="tela tela-rodada">
      <BarraMeio p={p} />

      <section className="painel funcoes">
        <Funcao icone="embaralha" rotulo="embaralha" id={f.embaralha} p={p} />
        <Funcao icone="corta" rotulo="corta" id={f.corta} p={p} />
        <Funcao icone="comeca" rotulo="começa" id={f.comeca} p={p} />
      </section>

      <section className={`painel vira ${vira === null ? 'vira-vazia' : ''}`}>
        {vira === null || !ctx ? (
          <button className="vira-botao" onClick={() => setEscolherVira(true)}>
            <span className="vira-fantasma"><Icone nome="mais" tam={28} /></span>
            <span>
              <strong>Qual carta virou?</strong>
              <small>Toque para informar a vira e ver os coringas</small>
            </span>
          </button>
        ) : (
          <div className="vira-conteudo" key={vira}>
            <button className="vira-carta" onClick={() => setEscolherVira(true)} aria-label="Trocar a vira">
              <Carta c={vira} tam={84} />
              <span className="vira-rotulo">vira</span>
            </button>
            <div className="vira-coringas">
              <h3>Coringas</h3>
              <div className="coringas-cartas">
                {ctx.jokerVale.map(c => (
                  <div key={c} className="coringa-item"><Carta c={c} tam={44} coringa /><span>×2</span></div>
                ))}
                <div className="coringa-item"><Carta c={vira} tam={44} coringa /><span>espelho</span></div>
              </div>
              <p className="joker-vale"><span className="selo-joker">Joker</span> vale <ComNaipes>{`${nomeCarta(ctx.jokerVale[0])} ou ${nomeCarta(ctx.jokerVale[1])}`}</ComNaipes></p>
            </div>
          </div>
        )}
      </section>

      <RoletaResumo roleta={p.rodada.roleta} valorTrinca={valorTrincaRoleta(p.config)} valorQuadra={valorQuadraRoleta(p.config)}
        ehCoringa={ctx?.ehCoringa} aoRever={aoRoleta} />

      {p.rodada.queimados.length > 0 && (
        <section className="painel queimados">
          {p.rodada.queimados.map(id => {
            const j = jogador(p, id);
            return (
              <div key={id} className="queimado">
                <span className="queimado-fogo"><Icone nome="fogo" tam={18} /></span>
                <span><b>{j.nome}</b> bateu errado: só compra do monte</span>
                <button className="botao-icone mini" onClick={() => despachar({ tipo: 'queimar', id })} aria-label="Tirar"><Icone nome="fechar" tam={14} /></button>
              </div>
            );
          })}
        </section>
      )}
      <button className="botao-texto queimar-link" onClick={() => setQueimar(true)}><Icone nome="fogo" tam={15} /> Alguém bateu errado?</button>

      <div className="bater-fixo">
        <button className="botao botao-ouro botao-bater" onClick={aoBater}>Bateu!</button>
      </div>

      <Folha aberta={escolherVira} aoFechar={() => setEscolherVira(false)} titulo="Qual carta virou?">
        <SeletorCarta
          restantes={c => copiasDisponiveis(c, null)}
          aoEscolher={c => { despachar({ tipo: 'vira', carta: c }); setEscolherVira(false); }}
          naipeInicial={vira !== null ? vira & 3 : 1}
        />
      </Folha>

      <Folha aberta={queimar} aoFechar={() => setQueimar(false)} titulo="Quem bateu errado?">
        <p className="nota">Fica queimado até o fim da rodada: só pode comprar do monte.</p>
        <div className="grade-jogadores">
          {vivos(p).map(j => (
            <button key={j.id} className={`cartao-jogador ${p.rodada.queimados.includes(j.id) ? 'ativo' : ''}`}
              onClick={() => { despachar({ tipo: 'queimar', id: j.id }); setQueimar(false); }}>
              <Avatar nome={j.nome} cor={j.cor} tam={44} />
              <span>{j.nome}</span>
            </button>
          ))}
        </div>
      </Folha>
    </div>
  );
}
