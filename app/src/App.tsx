import { useCallback, useState } from 'react';
import { Avatar } from './componentes/Avatar';
import { EditorPontos } from './componentes/EditorPontos';
import { Folha } from './componentes/Folha';
import { Icone, NomeIcone } from './componentes/Icone';
import { RoletaGirando } from './componentes/Roleta';
import { useTelaCheia, useTelaLigada } from './componentes/tela';
import { valorQuadraRoleta, valorTrincaRoleta } from './motor/premios';
import { Acao, carregar, jogador, Partida, reduzir, salvar, vivos } from './estado/partida';
import { FluxoBatida } from './telas/Batida';
import { Inscrito, TelaInicio, TelaNovaPartida } from './telas/NovaPartida';
import { TelaPlacar } from './telas/Placar';
import { TelaPremios } from './telas/Premios';
import { TelaRegras } from './telas/Regras';
import { Campeao, ResultadoBatida } from './telas/Resultado';
import { TelaRodada } from './telas/Rodada';

type Aba = 'rodada' | 'placar' | 'premios' | 'regras';
const ABAS: { id: Aba; rotulo: string; icone: NomeIcone }[] = [
  { id: 'rodada', rotulo: 'Rodada', icone: 'rodada' },
  { id: 'placar', rotulo: 'Placar', icone: 'placar' },
  { id: 'premios', rotulo: 'Prêmios', icone: 'premios' },
  { id: 'regras', rotulo: 'Regras', icone: 'regras' },
];

export default function App() {
  const [estado, setEstado] = useState(carregar);
  const p = estado.partida;
  const [aba, setAba] = useState<Aba>('rodada');
  const [semPartida, setSemPartida] = useState<'inicio' | 'nova'>('inicio');
  const [info, setInfo] = useState<'premios' | 'regras' | null>(null);
  const [bater, setBater] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  // número do último sorteio da roleta que já girou na tela (ao recarregar a página não gira de novo)
  const [roletaVista, setRoletaVista] = useState<number>(() => p?.rodada.roleta.sorteio ?? 0);
  const [mostrarUltimo, setMostrarUltimo] = useState(false);
  const [verCampeao, setVerCampeao] = useState(true);
  const [revanche, setRevanche] = useState<{ jogadores: Inscrito[]; partida: Partida } | null>(null);
  const tela = useTelaCheia();
  useTelaLigada(!!p);

  const despachar = useCallback((a: Acao) => {
    setEstado(s => {
      const partida = reduzir(s.partida, a);
      const desfazer = a.tipo === 'nova' ? [] : a.tipo === 'bateu' && s.partida ? [...s.desfazer, s.partida].slice(-30) : s.desfazer;
      salvar(partida, desfazer);
      return { partida, desfazer };
    });
    if (a.tipo === 'bateu') setMostrarUltimo(true);
    if (a.tipo === 'nova') { setVerCampeao(true); setAba('rodada'); }
  }, []);

  const desfazerRodada = () => {
    const partida = estado.desfazer[estado.desfazer.length - 1];
    if (!partida) return;
    const desfazer = estado.desfazer.slice(0, -1);
    salvar(partida, desfazer);
    setEstado({ partida, desfazer });
    setRoletaVista(partida.rodada.roleta.sorteio);
    setVerCampeao(true);
  };

  const encerrar = () => {
    salvar(null, []);
    setEstado({ partida: null, desfazer: [] });
    setSemPartida('inicio');
    setAjustes(false);
  };

  const comecarRevanche = () => {
    if (!p) return;
    const primeiro = p.historico[0]?.dealerId ?? p.rodada.dealerId;
    const i = p.jogadores.findIndex(j => j.id === primeiro);
    despachar({ tipo: 'nova', config: p.config, jogadores: p.jogadores.map(j => ({ nome: j.nome, cor: j.cor })), dealer: (i + 1) % p.jogadores.length });
  };

  // ---------- sem partida ----------
  if (!p) {
    return (
      <div className="app sem-partida">
        {semPartida === 'inicio'
          ? <TelaInicio aoNova={() => setSemPartida('nova')} aoPremios={() => setInfo('premios')} aoRegras={() => setInfo('regras')} />
          : <TelaNovaPartida
              inicial={revanche?.jogadores}
              configInicial={revanche?.partida.config}
              aoVoltar={() => { setSemPartida('inicio'); setRevanche(null); }}
              aoComecar={(config, jogadores, dealer) => { setRevanche(null); despachar({ tipo: 'nova', config, jogadores, dealer }); }} />}
        <Folha aberta={info !== null} aoFechar={() => setInfo(null)} cheia titulo={info === 'premios' ? 'Prêmios' : 'Regras'}>
          {info === 'premios' ? <TelaPremios /> : <TelaRegras />}
        </Folha>
      </div>
    );
  }

  // ---------- partida ----------
  const n = vivos(p).length;
  const ultimo = p.historico[p.historico.length - 1];
  // a roleta gira sozinha assim que é sorteada (quando a vira é informada)
  const mostrarRoleta = !p.campeaoId && !mostrarUltimo && p.rodada.roleta.sorteio !== 0 && roletaVista !== p.rodada.roleta.sorteio
    && (p.rodada.roleta.trincas.length > 0 || p.rodada.roleta.quadra !== null);
  const campeao = p.campeaoId ? jogador(p, p.campeaoId) : null;

  return (
    <div className="app">
      <header className="topo">
        <span className="topo-marca">CAXETA</span>
        <span className="topo-rodada">{campeao ? 'Fim de jogo' : `Rodada ${p.rodada.numero}`}</span>
        <div className="topo-acoes">
          {tela.suportada && (
            <button className="botao-icone" onClick={tela.alternar} aria-label={tela.cheia ? 'Sair da tela cheia' : 'Tela cheia'}>
              <Icone nome={tela.cheia ? 'sairTelaCheia' : 'telaCheia'} />
            </button>
          )}
          <button className="botao-icone" onClick={() => setAjustes(true)} aria-label="Ajustes"><Icone nome="ajustes" /></button>
        </div>
      </header>

      <main className="conteudo" key={aba}>
        {aba === 'rodada' && (campeao
          ? (
            <div className="tela fim-de-jogo">
              <section className="painel centro">
                <span className="coroa"><Icone nome="coroa" tam={40} espessura={1.6} /></span>
                <Avatar nome={campeao.nome} cor={campeao.cor} tam={72} />
                <h2>{campeao.nome} venceu!</h2>
                <button className="botao botao-ouro botao-grande botao-cheio" onClick={comecarRevanche}>Revanche</button>
                <button className="botao botao-fantasma botao-cheio" onClick={() => { setRevanche({ jogadores: p.jogadores.map(j => ({ nome: j.nome, cor: j.cor })), partida: p }); encerrar(); setSemPartida('nova'); }}>Mudar jogadores</button>
              </section>
            </div>
          )
          : <TelaRodada p={p} despachar={despachar} aoBater={() => setBater(true)} aoRoleta={() => setRoletaVista(-1)} />)}
        {aba === 'placar' && <TelaPlacar p={p} despachar={despachar} podeDesfazer={estado.desfazer.length > 0} aoDesfazer={desfazerRodada} aoEncerrar={encerrar} />}
        {aba === 'premios' && <TelaPremios cfg={p.config} jogadores={n} />}
        {aba === 'regras' && <TelaRegras />}
      </main>

      <nav className="nav">
        {ABAS.map(a => (
          <button key={a.id} className={aba === a.id ? 'ativo' : ''} onClick={() => setAba(a.id)} aria-current={aba === a.id}>
            <Icone nome={a.icone} />
            <span>{a.rotulo}</span>
          </button>
        ))}
      </nav>

      <FluxoBatida aberta={bater} aoFechar={() => setBater(false)} p={p} despachar={despachar} />

      <Folha aberta={ajustes} aoFechar={() => setAjustes(false)} cheia titulo="Ajustes">
        <div className="ajustes">
          <button className="botao botao-fantasma botao-cheio" disabled={p.rodada.vira === null}
            onClick={() => { despachar({ tipo: 'roleta' }); setAjustes(false); }}>
            <Icone nome="roleta" tam={18} /> {p.rodada.vira === null ? 'A roleta gira depois da vira' : 'Sortear a roleta de novo'}
          </button>
          {tela.suportada && (
            <button className="botao botao-fantasma botao-cheio" onClick={tela.alternar}>
              <Icone nome={tela.cheia ? 'sairTelaCheia' : 'telaCheia'} tam={18} /> {tela.cheia ? 'Sair da tela cheia' : 'Tela cheia'}
            </button>
          )}
          <p className="nota">Dica: no menu do navegador, use "Adicionar à tela inicial". Assim o placar abre como app, em tela cheia.</p>
          <EditorPontos cfg={p.config} aoMudar={config => despachar({ tipo: 'config', config })} jogadores={n} />
          <button className="botao botao-perigo botao-cheio" onClick={encerrar}>Encerrar partida</button>
        </div>
      </Folha>

      {mostrarRoleta && (
        <RoletaGirando key={`${p.rodada.roleta.sorteio}-${roletaVista}`} roleta={p.rodada.roleta} numero={p.rodada.numero}
          valorTrinca={valorTrincaRoleta(p.config)} valorQuadra={valorQuadraRoleta(p.config)}
          aoTerminar={() => setRoletaVista(p.rodada.roleta.sorteio)} />
      )}

      {mostrarUltimo && ultimo && (
        <ResultadoBatida p={p} r={ultimo} aoSeguir={() => { setMostrarUltimo(false); setAba('rodada'); }} />
      )}

      {campeao && verCampeao && !mostrarUltimo && (
        <Campeao p={p} aoRevanche={comecarRevanche} aoPlacar={() => { setVerCampeao(false); setAba('placar'); }} />
      )}
    </div>
  );
}
