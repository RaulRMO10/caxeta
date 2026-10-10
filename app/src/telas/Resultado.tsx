import { CSSProperties } from 'react';
import { Avatar } from '../componentes/Avatar';
import { Confete } from '../componentes/Confete';
import { Icone } from '../componentes/Icone';
import { useContador } from '../componentes/tela';
import { Nivel, NIVEIS } from '../motor/premios';
import { jogador, Partida, Registro } from '../estado/partida';

const ORDEM_NIVEL: Nivel[] = ['bronze', 'prata', 'ouro', 'diamante', 'lenda'];

export function ResultadoBatida({ p, r, aoSeguir }: { p: Partida; r: Registro; aoSeguir: () => void }) {
  const v = jogador(p, r.vencedorId);
  const premios = r.linhas.filter(l => l.nivel);
  const maior = premios.reduce<Nivel | null>((m, l) => (!m || ORDEM_NIVEL.indexOf(l.nivel!) > ORDEM_NIVEL.indexOf(m) ? l.nivel! : m), null);
  const total = useContador(r.total, 900);
  const cor = maior ? NIVEIS[maior].cor : 'var(--ouro)';
  const perdas = r.efeitos.filter(e => e.delta < 0 || e.saiu);
  return (
    <div className={`resultado ${maior ? `resultado-${maior}` : ''}`} style={{ '--cor': cor } as CSSProperties}>
      {premios.length > 0 && <Confete quantidade={maior === 'bronze' || maior === 'prata' ? 50 : 110} />}
      <div className="resultado-cartao">
        <div className="resultado-raios" />
        <Avatar nome={v.nome} cor={v.cor} tam={84} />
        <h2>{v.nome} bateu!</h2>
        <p className="resultado-sub">batida de {r.tam}</p>
        <div className="resultado-total">+{total}</div>
        {premios.length > 0 && (
          <div className="resultado-premios">
            {premios.map((l, i) => (
              <span key={i} className="selo-premio" style={{ '--cor': NIVEIS[l.nivel!].cor, animationDelay: `${400 + i * 150}ms` } as CSSProperties}>
                {l.rotulo}{l.ganha ? '' : ` +${l.pontos}`}
              </span>
            ))}
          </div>
        )}
        {perdas.length > 0 && (
          <ul className="resultado-efeitos">
            {perdas.map(e => {
              const j = jogador(p, e.jogadorId);
              return (
                <li key={e.jogadorId}>
                  <Avatar nome={j.nome} cor={j.cor} tam={24} apagado={e.saiu} />
                  <span>{j.nome}</span>
                  {e.delta < 0 && <b className="negativo">{e.delta}</b>}
                  {e.saiu && <span className="saiu">saiu</span>}
                </li>
              );
            })}
          </ul>
        )}
        {r.meioDepois === 0 && !p.historico.slice(0, -1).some(h => h.meioDepois === 0) && (
          <p className="resultado-aviso">O meio acabou: começou a descida!</p>
        )}
        <button className="botao botao-ouro botao-grande botao-cheio" onClick={aoSeguir}>
          {p.campeaoId ? 'Ver campeão' : 'Próxima rodada'}
        </button>
      </div>
    </div>
  );
}

export function Campeao({ p, aoRevanche, aoPlacar }: { p: Partida; aoRevanche: () => void; aoPlacar: () => void }) {
  const c = jogador(p, p.campeaoId!);
  const vitorias = p.historico.filter(h => h.vencedorId === c.id).length;
  return (
    <div className="resultado resultado-campeao" style={{ '--cor': 'var(--ouro)' } as CSSProperties}>
      <Confete quantidade={140} />
      <div className="resultado-cartao">
        <div className="resultado-raios" />
        <span className="coroa"><Icone nome="coroa" tam={48} espessura={1.6} /></span>
        <Avatar nome={c.nome} cor={c.cor} tam={96} />
        <h2>{c.nome}</h2>
        <p className="resultado-sub">venceu a partida</p>
        <p className="nota centro">{p.historico.length} rodadas · {vitorias} batida{vitorias === 1 ? '' : 's'}</p>
        <button className="botao botao-ouro botao-grande botao-cheio" onClick={aoRevanche}>Revanche</button>
        <button className="botao botao-fantasma botao-cheio" onClick={aoPlacar}>Ver placar</button>
      </div>
    </div>
  );
}
