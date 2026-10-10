import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Carta } from '../componentes/Carta';
import { Folha } from '../componentes/Folha';
import { Icone } from '../componentes/Icone';
import { JogosMontados } from '../componentes/JogosMontados';
import { SeletorCarta } from '../componentes/SeletorCarta';
import { Carta as TipoCarta, contextoDaVira, copiasDisponiveis, JOKER } from '../motor/cartas';
import { calcularBatida, NIVEIS } from '../motor/premios';
import { Acao, jogador, Partida, vivos } from '../estado/partida';

type Passo = 'quem' | 'tipo' | 'vira' | 'mao' | 'resultado';

export function FluxoBatida({ aberta, aoFechar, p, despachar }: {
  aberta: boolean;
  aoFechar: () => void;
  p: Partida;
  despachar: (a: Acao) => void;
}) {
  const [passo, setPasso] = useState<Passo>('quem');
  const [vencedorId, setVencedorId] = useState<string | null>(null);
  const [tam, setTam] = useState<9 | 10>(9);
  const [mao, setMao] = useState<TipoCarta[]>([]);

  useEffect(() => {
    if (aberta) { setPasso('quem'); setVencedorId(null); setMao([]); }
  }, [aberta]);

  const vira = p.rodada.vira;
  const ctx = vira !== null ? contextoDaVira(vira) : null;
  const n = vivos(p).length;
  const resultado = useMemo(
    () => (vira !== null && mao.length === tam ? calcularBatida(mao, contextoDaVira(vira), p.rodada.roleta, p.config, n) : null),
    [mao, tam, vira, p.rodada.roleta, p.config, n],
  );

  // mão completa: mostra a conta
  useEffect(() => {
    if (passo === 'mao' && mao.length === tam) {
      const t = setTimeout(() => setPasso('resultado'), 350);
      return () => clearTimeout(t);
    }
  }, [mao, tam, passo]);

  const vencedor = vencedorId ? jogador(p, vencedorId) : null;
  const quantas = (c: TipoCarta) => mao.filter(x => x === c).length;
  const restantes = (c: TipoCarta) => (mao.length >= tam ? 0 : copiasDisponiveis(c, vira) - quantas(c));
  const tirar = (i: number) => setMao(mao.filter((_, k) => k !== i));
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
              <button key={t} className="opcao-batida" onClick={() => { setTam(t); setMao([]); setPasso(vira === null ? 'vira' : 'mao'); }}>
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
            <div className={`vagas vagas-${tam}`}>
              {Array.from({ length: tam }, (_, i) => (
                <div key={i} className="vaga">
                  {mao[i] !== undefined
                    ? <Carta c={mao[i]} tam={54} coringa={mao[i] !== JOKER && ctx?.ehCoringa(mao[i])} onClick={() => tirar(i)} className="vaga-carta" />
                    : <Carta c={null} tam={54} />}
                </div>
              ))}
            </div>
            <div className="batida-mao-info">
              <span><b>{mao.length}</b> de {tam} cartas · toque numa carta para tirar</span>
              {mao.length > 0 && <button className="botao-texto" onClick={() => setMao([])}>limpar</button>}
            </div>
            <SeletorCarta comJoker restantes={restantes} quantas={quantas} ehCoringa={ctx?.ehCoringa}
              aoEscolher={c => setMao(m => [...m, c])} />
            <button className="botao botao-fantasma botao-cheio sem-premio" onClick={semPremio}>
              Sem prêmio: registrar só a batida (+{tam === 10 ? p.config.base10 : p.config.base9})
            </button>
          </div>
        )}

        {passo === 'resultado' && ctx && (
          resultado ? (
            <div className="batida-resultado">
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
