import { CSSProperties } from 'react';
import { Carta } from '../componentes/Carta';
import { ComNaipes } from '../componentes/Naipe';
import { cartas } from '../motor/cartas';
import { CONFIG_PADRAO, ConfigPontos, MULTIPLICADOR_MESA, Nivel, NIVEIS, PREMIOS, valorPremio, valorQuadraRoleta, valorTrincaRoleta } from '../motor/premios';

const ORDEM: Nivel[] = ['bronze', 'prata', 'ouro', 'diamante', 'lenda'];

function Exemplo({ txt }: { txt: string }) {
  const cs = cartas(txt);
  return (
    <div className="exemplo-cartas">
      {[0, 3, 6].filter(i => i < cs.length).map(i => (
        <div key={i} className="exemplo-jogo">{cs.slice(i, i + 3).map((c, k) => <Carta key={k} c={c} tam={28} />)}</div>
      ))}
    </div>
  );
}

export function TelaPremios({ cfg = CONFIG_PADRAO, jogadores = 4 }: { cfg?: ConfigPontos; jogadores?: number }) {
  const mult = cfg.ajusteMesa ? MULTIPLICADOR_MESA[jogadores] ?? 1 : 1;
  return (
    <div className="tela tela-premios">
      <section className="painel premios-intro">
        <h3>Como funciona</h3>
        <ul className="lista">
          <li>A batida vale <b>{cfg.base9}</b> (de 9) ou <b>{cfg.base10}</b> (de 10), mais os prêmios.</li>
          <li>Prêmios somam. Se um está dentro do outro (toda Escada é também Uma pinta só), vale só o maior.</li>
          <li>Cada coringa ou Joker no lugar de outra carta tira <b>{cfg.desconto}</b> de cada prêmio. Coringa no próprio lugar não conta.</li>
          <li>Valores para <b>{jogadores} jogadores</b>{cfg.ajusteMesa && mult !== 1 ? <> (×{mult.toLocaleString('pt-BR')} pelo tamanho da mesa)</> : null}.</li>
        </ul>
      </section>

      <section className="painel premio-cartao nivel-bronze" style={{ '--cor': NIVEIS.bronze.cor } as CSSProperties}>
        <header className="premio-topo">
          <span className="selo-nivel">Roleta</span>
          <h3>Bônus da rodada</h3>
        </header>
        <p>Assim que a vira é informada, o app sorteia {cfg.roleta.trincas} trincas{cfg.roleta.quadra ? ' e 1 quadra' : ''}, com as cartas exatas e sem nenhuma carta que seja coringa na rodada. É um bônus para movimentar a partida: só vale se o jogo for feito <b>sem coringa</b>, e não muda com o tamanho da mesa.</p>
        <div className="premio-linha-valor"><span>Cada trinca sorteada</span><b>+{valorTrincaRoleta(cfg)}</b></div>
        {cfg.roleta.quadra && (
          <>
            <div className="premio-linha-valor"><span>Quadra sorteada (só na batida de 10)</span><b>+{valorQuadraRoleta(cfg)}</b></div>
            <div className="exemplo-cartas">
              <Exemplo txt="4♥ 5♥ 6♥" /><small className="nota">ex. de trinca</small>
            </div>
            <div className="exemplo-cartas">
              <div className="exemplo-jogo">{cartas('7♠ 7♠ 7♥ 7♦').map((c, k) => <Carta key={k} c={c} tam={28} />)}</div>
              <div className="exemplo-jogo">{cartas('9♣ 10♣ J♣ Q♣').map((c, k) => <Carta key={k} c={c} tam={28} />)}</div>
              <small className="nota">ex. de quadras</small>
            </div>
          </>
        )}
      </section>

      {ORDEM.map(nivel => {
        const lista = PREMIOS.filter(p => p.nivel === nivel && cfg.premios[p.id].ativo);
        if (!lista.length) return null;
        return (
          <div key={nivel} className="nivel-grupo">
            <h3 className="secao-titulo nivel-titulo" style={{ color: NIVEIS[nivel].cor }}>{NIVEIS[nivel].nome}</h3>
            {lista.map(p => (
              <section key={p.id} className={`painel premio-cartao nivel-${nivel}`} style={{ '--cor': NIVEIS[nivel].cor } as CSSProperties}>
                <header className="premio-topo">
                  <h3>{p.nome}</h3>
                  <span className="premio-valor">{nivel === 'lenda' ? 'ganha a partida' : `+${valorPremio(cfg, p.id, jogadores)}`}</span>
                </header>
                <p><ComNaipes>{p.descricao}</ComNaipes></p>
                <Exemplo txt={p.exemplo} />
                <small className="premio-freq">Sai sem ninguém procurar em ~1 a cada {p.semQuerer.toLocaleString('pt-BR')} batidas</small>
              </section>
            ))}
          </div>
        );
      })}

      <section className="painel">
        <h3>Tamanho da mesa</h3>
        <p className="nota">Com mais gente, é mais difícil completar um prêmio antes de alguém bater. Por isso o valor muda:</p>
        <div className="tabela-mesa">
          {Object.entries(MULTIPLICADOR_MESA).map(([n, m]) => (
            <div key={n} className={Number(n) === jogadores ? 'atual' : ''}><span>{n}</span><b>×{m.toLocaleString('pt-BR')}</b></div>
          ))}
        </div>
      </section>
    </div>
  );
}
