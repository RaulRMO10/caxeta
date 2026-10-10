import { Contexto, JOKER } from '../motor/cartas';
import { ResultadoBatida } from '../motor/premios';
import { Carta } from './Carta';

// Mostra como a mão foi arrumada: cada jogo, com os coringas e o que eles valem.
export function JogosMontados({ r, ctx, tam = 44 }: { r: ResultadoBatida; ctx: Contexto; tam?: number }) {
  return (
    <div className="jogos">
      {r.vagas.map((vagas, i) => {
        const j = r.arranjo.jogos[i];
        const nome = j.seq ? (j.tam === 4 ? 'Sequência de 4' : 'Sequência') : (j.tam === 4 ? 'Dobra de iguais' : 'Iguais');
        const roleta = r.roletaFeita.includes(i);
        return (
          <div key={i} className={`jogo ${roleta ? 'jogo-roleta' : ''}`} style={{ animationDelay: `${i * 90}ms` }}>
            <div className="jogo-cartas">
              {vagas.map((v, k) => (
                <Carta key={k} c={v.carta} tam={tam}
                  coringa={v.carta !== JOKER && ctx.ehCoringa(v.carta)}
                  vale={v.substituta ? v.representa : null} />
              ))}
            </div>
            <span className="jogo-nome">{nome}{roleta && <b> · roleta</b>}</span>
          </div>
        );
      })}
    </div>
  );
}
