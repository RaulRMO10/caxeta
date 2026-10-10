import { useState } from 'react';
import { Carta } from '../componentes/Carta';
import { Icone } from '../componentes/Icone';
import { ComNaipes } from '../componentes/Naipe';
import { cartas } from '../motor/cartas';
import { Bloco, DUVIDAS, REGRAS } from '../dados/regras';

function MostrarBloco({ b }: { b: Bloco }) {
  if (b.tipo === 'sub') return <h4 className="regra-sub">{b.texto}</h4>;
  if (b.tipo === 'lista') return <ul className="lista">{b.itens.map((t, i) => <li key={i}><ComNaipes>{t}</ComNaipes></li>)}</ul>;
  return (
    <div className="regra-exemplos">
      {b.linhas.map(([cs, txt], i) => (
        <div key={i} className="regra-exemplo">
          <div className="regra-exemplo-cartas">{cartas(cs).map((c, k) => <Carta key={k} c={c} tam={30} />)}</div>
          <span><ComNaipes>{txt}</ComNaipes></span>
        </div>
      ))}
    </div>
  );
}

export function TelaRegras() {
  const [aberta, setAberta] = useState<number | null>(null);
  return (
    <div className="tela tela-regras">
      {REGRAS.map((s, i) => (
        <section key={i} className="painel regra">
          <h3><span className="regra-num">{i + 1}</span>{s.titulo}</h3>
          {s.blocos.map((b, k) => <MostrarBloco key={k} b={b} />)}
        </section>
      ))}
      <h3 className="secao-titulo">Dúvidas</h3>
      <div className="duvidas">
        {DUVIDAS.map(([p, r], i) => (
          <div key={i} className={`duvida ${aberta === i ? 'aberta' : ''}`}>
            <button onClick={() => setAberta(aberta === i ? null : i)} aria-expanded={aberta === i}>
              <span>{p}</span><Icone nome={aberta === i ? 'cima' : 'baixo'} tam={18} />
            </button>
            {aberta === i && <p><ComNaipes>{r}</ComNaipes></p>}
          </div>
        ))}
      </div>
    </div>
  );
}
