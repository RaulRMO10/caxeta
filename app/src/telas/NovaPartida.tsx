import { CSSProperties, useState } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Carta } from '../componentes/Carta';
import { EditorPontos } from '../componentes/EditorPontos';
import { Icone } from '../componentes/Icone';
import { cartas } from '../motor/cartas';
import { CONFIG_PADRAO, ConfigPontos } from '../motor/premios';
import { CORES_JOGADORES } from '../estado/partida';

export interface Inscrito { nome: string; cor: string }

const novoInscrito = (usadas: string[]): Inscrito => ({ nome: '', cor: CORES_JOGADORES.find(c => !usadas.includes(c)) ?? CORES_JOGADORES[0] });

export function TelaInicio({ aoNova, aoPremios, aoRegras }: { aoNova: () => void; aoPremios: () => void; aoRegras: () => void }) {
  const leque = cartas('A♠ K♥ Q♣ J♦');
  return (
    <div className="inicio">
      <div className="inicio-leque">
        {leque.map((c, i) => (
          <Carta key={i} c={c} tam={92} className="inicio-carta" style={{ '--i': i - 1.5 } as CSSProperties} />
        ))}
      </div>
      <h1 className="logo">CAXETA</h1>
      <p className="inicio-sub">Placar, roleta e prêmios na palma da mão</p>
      <div className="inicio-botoes">
        <button className="botao botao-ouro botao-grande" onClick={aoNova}>Nova partida</button>
        <div className="inicio-links">
          <button className="botao botao-fantasma" onClick={aoPremios}><Icone nome="premios" tam={18} /> Prêmios</button>
          <button className="botao botao-fantasma" onClick={aoRegras}><Icone nome="regras" tam={18} /> Regras</button>
        </div>
      </div>
    </div>
  );
}

export function TelaNovaPartida({ inicial, configInicial, aoComecar, aoVoltar }: {
  inicial?: Inscrito[];
  configInicial?: ConfigPontos;
  aoComecar: (cfg: ConfigPontos, jogadores: Inscrito[], dealer: number) => void;
  aoVoltar: () => void;
}) {
  const [lista, setLista] = useState<Inscrito[]>(() => inicial ?? CORES_JOGADORES.slice(0, 4).map(cor => ({ nome: '', cor })));
  const [dealer, setDealer] = useState(0);
  const [cfg, setCfg] = useState<ConfigPontos>(configInicial ?? CONFIG_PADRAO);
  const [verPontos, setVerPontos] = useState(false);

  const nomeDe = (i: number) => lista[i].nome.trim() || `Jogador ${i + 1}`;
  const mover = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    const nova = [...lista];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setLista(nova);
    if (dealer === i) setDealer(j); else if (dealer === j) setDealer(i);
  };
  const remover = (i: number) => {
    setLista(lista.filter((_, k) => k !== i));
    setDealer(d => (d === i ? 0 : d > i ? d - 1 : d));
  };
  const trocarCor = (i: number) => {
    const usadas = lista.map(j => j.cor);
    const atual = CORES_JOGADORES.indexOf(lista[i].cor);
    for (let k = 1; k <= CORES_JOGADORES.length; k++) {
      const cor = CORES_JOGADORES[(atual + k) % CORES_JOGADORES.length];
      if (!usadas.includes(cor)) { setLista(lista.map((j, x) => (x === i ? { ...j, cor } : j))); return; }
    }
  };

  return (
    <div className="tela tela-nova">
      <header className="tela-topo">
        <button className="botao-icone" onClick={aoVoltar} aria-label="Voltar"><Icone nome="voltar" /></button>
        <h2>Nova partida</h2>
        <span />
      </header>

      <section className="painel">
        <header className="painel-topo"><h3>Jogadores</h3><span className="contagem">{lista.length} de 8</span></header>
        <p className="nota">Na ordem em que estão sentados. O jogo anda para a direita (o próximo da lista). Toque em <Icone nome="embaralha" tam={14} /> para escolher quem embaralha primeiro.</p>
        <ul className="inscritos">
          {lista.map((j, i) => (
            <li key={i} className={`inscrito ${dealer === i ? 'inscrito-dealer' : ''}`}>
              <button className="inscrito-cor" onClick={() => trocarCor(i)} aria-label="Trocar cor">
                <Avatar nome={nomeDe(i)} cor={j.cor} tam={38} />
              </button>
              <input className="campo" value={j.nome} placeholder={`Jogador ${i + 1}`} maxLength={14}
                onChange={e => setLista(lista.map((x, k) => (k === i ? { ...x, nome: e.target.value } : x)))} />
              <button className={`botao-icone inscrito-dealer-botao ${dealer === i ? 'ativo' : ''}`} onClick={() => setDealer(i)} aria-label="Embaralha primeiro">
                <Icone nome="embaralha" tam={18} />
              </button>
              <div className="inscrito-ordem">
                <button className="botao-icone mini" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><Icone nome="cima" tam={16} /></button>
                <button className="botao-icone mini" onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label="Descer"><Icone nome="baixo" tam={16} /></button>
              </div>
              <button className="botao-icone mini" onClick={() => remover(i)} disabled={lista.length <= 2} aria-label="Remover"><Icone nome="fechar" tam={16} /></button>
            </li>
          ))}
        </ul>
        {lista.length < 8 && (
          <button className="botao botao-fantasma botao-cheio" onClick={() => setLista([...lista, novoInscrito(lista.map(j => j.cor))])}>
            <Icone nome="mais" tam={18} /> Adicionar jogador
          </button>
        )}
        <p className="nota dealer-nota"><Icone nome="embaralha" tam={14} /> {nomeDe(dealer)} embaralha · <Icone nome="corta" tam={14} /> {nomeDe((dealer - 1 + lista.length) % lista.length)} corta · <Icone nome="comeca" tam={14} /> {nomeDe((dealer + 1) % lista.length)} começa</p>
      </section>

      <section className="painel">
        <button className="painel-dobravel" onClick={() => setVerPontos(!verPontos)} aria-expanded={verPontos}>
          <div>
            <h3>Pontuação e prêmios</h3>
            <small>Meio de {cfg.meio} · batida {cfg.base9}/{cfg.base10} · roleta com {cfg.roleta.trincas} trincas{cfg.roleta.quadra ? ' e quadra' : ''}</small>
          </div>
          <Icone nome={verPontos ? 'cima' : 'baixo'} />
        </button>
        {verPontos && <EditorPontos cfg={cfg} aoMudar={setCfg} jogadores={lista.length} />}
      </section>

      <div className="rodape-fixo">
        <button className="botao botao-ouro botao-grande botao-cheio"
          onClick={() => aoComecar(cfg, lista.map((j, i) => ({ ...j, nome: nomeDe(i) })), dealer)}>
          Começar partida
        </button>
      </div>
    </div>
  );
}
