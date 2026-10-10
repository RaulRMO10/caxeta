import { useEffect, useMemo, useState } from 'react';
import { Carta as TipoCarta } from '../motor/cartas';
import { JOGOS } from '../motor/jogos';
import { Roleta as TipoRoleta } from '../motor/premios';
import { Carta } from './Carta';
import { Icone } from './Icone';

const cartaAleatoria = () => Math.floor(Math.random() * 52);

// As linhas da roleta: as trincas e, por último, a quadra.
function linhasDa(roleta: TipoRoleta) {
  const linhas = roleta.trincas.map((id, i) => ({ id, rotulo: String(i + 1), quadra: false }));
  if (roleta.quadra !== null) linhas.push({ id: roleta.quadra, rotulo: 'Q', quadra: true });
  return linhas;
}

// Quadro da roleta na tela da rodada.
export function RoletaResumo({ roleta, ativa, valorTrinca, valorQuadra, ehCoringa, aoRever, aoInformarVira }: {
  roleta: TipoRoleta;
  ativa: boolean; // a configuração tem roleta
  valorTrinca: number;
  valorQuadra: number;
  ehCoringa?: (c: TipoCarta) => boolean;
  aoRever: () => void;
  aoInformarVira: () => void;
}) {
  const linhas = linhasDa(roleta);
  if (!ativa) return null;
  if (roleta.sorteio === 0) {
    return (
      <button className="painel roleta roleta-espera" onClick={aoInformarVira}>
        <span className="roleta-espera-icone"><Icone nome="roleta" tam={26} /></span>
        <span>
          <strong>Roleta da rodada</strong>
          <small>Gira assim que você informar a vira</small>
        </span>
      </button>
    );
  }
  if (!linhas.length) return null;
  return (
    <section className="painel roleta">
      <header className="painel-topo">
        <h3><Icone nome="roleta" tam={18} /> Roleta da rodada</h3>
        <button className="botao-texto" onClick={aoRever}>ver girando</button>
      </header>
      <ol className="roleta-lista">
        {linhas.map((l, i) => (
          <li key={l.id} className={`roleta-item ${l.quadra ? 'roleta-quadra' : ''}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="roleta-num">{l.rotulo}</span>
            <div className="roleta-cartas">
              {JOGOS[l.id].slots.map((c, k) => <Carta key={k} c={c} tam={l.quadra ? 36 : 40} coringa={ehCoringa?.(c)} />)}
            </div>
            <span className="selo-pontos">+{l.quadra ? valorQuadra : valorTrinca}</span>
          </li>
        ))}
      </ol>
      <p className="nota">Bônus da rodada: só vale feito sem coringa{roleta.quadra !== null ? ', e a quadra só na batida de 10' : ''}. Nunca sai carta que é coringa na rodada.</p>
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

const GIRO = 1.7; // segundos de cada rolo (igual ao CSS)
const ESPACO = 0.85; // intervalo entre uma linha e a próxima
const PASSO_CARTA = 0.12; // intervalo entre os rolos de uma linha

// Tela da roleta girando, revelando linha por linha.
export function RoletaGirando({ roleta, numero, valorTrinca, valorQuadra, aoTerminar }: {
  roleta: TipoRoleta;
  numero: number;
  valorTrinca: number;
  valorQuadra: number;
  aoTerminar: () => void;
}) {
  const linhas = linhasDa(roleta);
  const [pousadas, setPousadas] = useState(0);
  useEffect(() => {
    const ts = linhasDa(roleta).map((l, i) => {
      const ultimoRolo = i * ESPACO + (JOGOS[l.id].slots.length - 1) * PASSO_CARTA;
      return setTimeout(() => { setPousadas(p => Math.max(p, i + 1)); navigator.vibrate?.(14); }, (ultimoRolo + GIRO + 0.3) * 1000);
    });
    return () => ts.forEach(clearTimeout);
  }, [roleta]);
  const terminou = pousadas >= linhas.length;
  const tam = window.innerWidth < 370 ? 44 : 52;
  return (
    <div className="roleta-tela">
      <div className="roleta-brilho" />
      <div className="roleta-palco">
        <p className="roleta-sobre">Rodada {numero}</p>
        <h2 className="roleta-titulo">Roleta</h2>
        <div className="roleta-linhas">
          {linhas.map((l, i) => (
            <div key={l.id} className={`roleta-linha ${l.quadra ? 'roleta-linha-quadra' : ''} ${pousadas > i ? 'pousou' : ''}`}>
              <span className="roleta-num">{l.rotulo}</span>
              <div className="roleta-rolos">
                {JOGOS[l.id].slots.map((c, k) => (
                  <Rolo key={k} final={c} tam={l.quadra ? tam - 10 : tam} atraso={i * ESPACO + k * PASSO_CARTA} />
                ))}
              </div>
              <span className="selo-pontos">+{l.quadra ? valorQuadra : valorTrinca}</span>
            </div>
          ))}
        </div>
        <p className="roleta-aviso">Bônus da rodada · só vale feito sem coringa</p>
        <button className={`botao ${terminou ? 'botao-ouro' : 'botao-fantasma'} roleta-botao`} onClick={aoTerminar}>
          {terminou ? 'Bora jogar!' : 'Pular'}
        </button>
      </div>
    </div>
  );
}
