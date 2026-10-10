import { useState } from 'react';
import { Carta, JOKER, NOMES_NAIPES, tipo, VALORES } from '../motor/cartas';
import { Naipe } from './Naipe';

// Escolhe a pinta (fica marcada) e depois o valor. O Joker é um botão só.
export function SeletorCarta({ aoEscolher, restantes, quantas, comJoker, ehCoringa, naipeInicial = 1 }: {
  aoEscolher: (c: Carta) => void;
  restantes: (c: Carta) => number; // quantas ainda dá para escolher
  quantas?: (c: Carta) => number; // quantas já estão escolhidas
  comJoker?: boolean;
  ehCoringa?: (c: Carta) => boolean;
  naipeInicial?: number;
}) {
  const [naipe, setNaipe] = useState(naipeInicial);
  const tocar = (c: Carta) => {
    if (restantes(c) <= 0) return;
    navigator.vibrate?.(8);
    aoEscolher(c);
  };
  const qJoker = quantas?.(JOKER) ?? 0;
  return (
    <div className="seletor">
      <div className={`seletor-naipes ${comJoker ? 'com-joker' : ''}`}>
        {[0, 1, 2, 3].map(n => (
          <button key={n} className={`seletor-naipe ${naipe === n ? 'ativo' : ''}`} onClick={() => setNaipe(n)} aria-pressed={naipe === n}>
            <Naipe n={n} tam={26} cor={n % 2 ? 'var(--vermelho-texto)' : '#f3efe2'} />
            <span>{NOMES_NAIPES[n]}</span>
          </button>
        ))}
        {comJoker && (
          <button className="seletor-joker" onClick={() => tocar(JOKER)} disabled={restantes(JOKER) <= 0}>
            <span className="seletor-joker-estrela">✦</span>
            <span>Joker</span>
            {qJoker > 0 && <span className="sv-qtd">{qJoker}</span>}
          </button>
        )}
      </div>
      <div className="seletor-valores" key={naipe}>
        {VALORES.map((r, i) => {
          const c = tipo(i + 1, naipe);
          const q = quantas?.(c) ?? 0;
          const coringa = ehCoringa?.(c);
          return (
            <button key={r} className={`seletor-valor ${naipe % 2 ? 'vermelho' : 'preto'} ${coringa ? 'coringa' : ''}`}
              disabled={restantes(c) <= 0} onClick={() => tocar(c)} style={{ animationDelay: `${i * 12}ms` }}>
              <span className="sv-rotulo">{r}</span>
              <Naipe n={naipe} tam={13} />
              {q > 0 && <span className="sv-qtd">{q}</span>}
              {coringa && <span className="sv-estrela">★</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
