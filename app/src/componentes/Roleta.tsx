import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { Carta as TipoCarta, tipo, VALORES } from '../motor/cartas';
import { JOGOS } from '../motor/jogos';
import { Roleta as TipoRoleta } from '../motor/premios';
import { Carta } from './Carta';
import { Icone } from './Icone';

const cartaAleatoria = () => Math.floor(Math.random() * 52);

// Quadro da roleta na tela da rodada.
export function RoletaResumo({ roleta, valorTrinca, valorQuadra, ehCoringa, aoRever }: {
  roleta: TipoRoleta;
  valorTrinca: number;
  valorQuadra: number;
  ehCoringa?: (c: TipoCarta) => boolean;
  aoRever: () => void;
}) {
  if (!roleta.trincas.length && !roleta.quadra) return null;
  return (
    <section className="painel roleta">
      <header className="painel-topo">
        <h3><Icone nome="roleta" tam={18} /> Roleta da rodada</h3>
        <button className="botao-texto" onClick={aoRever}>ver girando</button>
      </header>
      <ol className="roleta-lista">
        {roleta.trincas.map((id, i) => (
          <li key={id} className="roleta-item" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="roleta-num">{i + 1}</span>
            <div className="roleta-cartas">
              {JOGOS[id].slots.map((c, k) => <Carta key={k} c={c} tam={40} coringa={ehCoringa?.(c)} />)}
            </div>
            <span className="selo-pontos">+{valorTrinca}</span>
          </li>
        ))}
        {roleta.quadra && (
          <li className="roleta-item roleta-quadra" style={{ animationDelay: `${roleta.trincas.length * 60}ms` }}>
            <span className="roleta-num">Q</span>
            <div className="roleta-quadra-info">
              <strong>Quadra de {VALORES[roleta.quadra.valor - 1]}</strong>
              <small>3 pintas diferentes + 1 repetida · só na batida de 10</small>
            </div>
            <span className="selo-pontos">+{valorQuadra}</span>
          </li>
        )}
      </ol>
      <p className="nota">Só vale se o jogo for feito sem coringa.</p>
    </section>
  );
}

// Um rolo de caça-níquel que para na carta sorteada.
function Rolo({ final, atraso, tam }: { final: TipoCarta; atraso: number; tam: number }) {
  const faixa = useMemo(() => Array.from({ length: 14 }, cartaAleatoria), []);
  const [girar, setGirar] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGirar(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const altura = Math.round(tam * 1.4) + 10;
  return (
    <div className="rolo" style={{ height: altura, width: tam + 10 }}>
      <div className="rolo-faixa" style={{
        transform: `translateY(${girar ? -faixa.length * altura : 0}px)`,
        transitionDelay: `${atraso}s`,
      }}>
        {[...faixa, final].map((c, i) => (
          <div key={i} className="rolo-item" style={{ height: altura }}><Carta c={c} tam={tam} /></div>
        ))}
      </div>
    </div>
  );
}

// Rolo dos valores, para a quadra.
function RoloValor({ valor, atraso }: { valor: number; atraso: number }) {
  const faixa = useMemo(() => Array.from({ length: 16 }, () => 1 + Math.floor(Math.random() * 13)), []);
  const [girar, setGirar] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setGirar(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  const altura = 84;
  return (
    <div className="rolo rolo-valor" style={{ height: altura }}>
      <div className="rolo-faixa" style={{ transform: `translateY(${girar ? -faixa.length * altura : 0}px)`, transitionDelay: `${atraso}s` }}>
        {[...faixa, valor].map((v, i) => <div key={i} className="rolo-item rolo-valor-item" style={{ height: altura }}>{VALORES[v - 1]}</div>)}
      </div>
    </div>
  );
}

const GIRO = 1.7; // segundos de cada rolo (igual ao CSS)
const ESPACO = 0.85; // intervalo entre uma linha e a próxima

// Tela da roleta girando, revelando trinca por trinca.
export function RoletaGirando({ roleta, numero, valorTrinca, valorQuadra, aoTerminar }: {
  roleta: TipoRoleta;
  numero: number;
  valorTrinca: number;
  valorQuadra: number;
  aoTerminar: () => void;
}) {
  const linhas = roleta.trincas.length + (roleta.quadra ? 1 : 0);
  const [pousadas, setPousadas] = useState(0);
  useEffect(() => {
    const ts = Array.from({ length: linhas }, (_, i) =>
      setTimeout(() => { setPousadas(p => Math.max(p, i + 1)); navigator.vibrate?.(14); }, (i * ESPACO + GIRO + 0.3 + 0.24) * 1000));
    return () => ts.forEach(clearTimeout);
  }, [linhas]);
  const terminou = pousadas >= linhas;
  const tam = window.innerWidth < 370 ? 44 : 52;
  return (
    <div className="roleta-tela">
      <div className="roleta-brilho" />
      <div className="roleta-palco">
        <p className="roleta-sobre">Rodada {numero}</p>
        <h2 className="roleta-titulo">Roleta</h2>
        <div className="roleta-linhas">
          {roleta.trincas.map((id, i) => (
            <div key={id} className={`roleta-linha ${pousadas > i ? 'pousou' : ''}`}>
              <span className="roleta-num">{i + 1}</span>
              <div className="roleta-rolos">
                {JOGOS[id].slots.map((c, k) => <Rolo key={k} final={c} tam={tam} atraso={i * ESPACO + k * 0.12} />)}
              </div>
              <span className="selo-pontos">+{valorTrinca}</span>
            </div>
          ))}
          {roleta.quadra && (
            <div className={`roleta-linha roleta-linha-quadra ${pousadas >= linhas ? 'pousou' : ''}`}>
              <span className="roleta-num">Q</span>
              <div className="roleta-quadra-giro">
                <RoloValor valor={roleta.quadra.valor} atraso={roleta.trincas.length * ESPACO} />
                <div className="roleta-quadra-texto">
                  <strong>Quadra</strong>
                  <small>qualquer quadra desse valor</small>
                </div>
              </div>
              <span className="selo-pontos">+{valorQuadra}</span>
            </div>
          )}
        </div>
        <p className="roleta-aviso">Só vale feito sem coringa</p>
        <button className={`botao ${terminou ? 'botao-ouro' : 'botao-fantasma'} roleta-botao`} onClick={aoTerminar}>
          {terminou ? 'Bora jogar!' : 'Pular'}
        </button>
      </div>
    </div>
  );
}

// Exemplo visual de uma quadra do valor (para a tela de prêmios).
export function ExemploQuadra({ valor, tam = 30 }: { valor: number; tam?: number }) {
  return (
    <div className="leque" style={{ '--sob': `${-tam * 0.3}px` } as CSSProperties}>
      {[0, 0, 1, 3].map((n, i) => <Carta key={i} c={tipo(valor, n)} tam={tam} />)}
    </div>
  );
}
