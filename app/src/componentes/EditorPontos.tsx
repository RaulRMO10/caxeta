import { ReactNode } from 'react';
import { CONFIG_PADRAO, ConfigPontos, MULTIPLICADOR_MESA, NIVEIS, PREMIOS } from '../motor/premios';
import { Icone } from './Icone';

export function Passo({ valor, aoMudar, passo = 5, min = 0, max = 999 }: {
  valor: number; aoMudar: (v: number) => void; passo?: number; min?: number; max?: number;
}) {
  return (
    <div className="passo">
      <button onClick={() => aoMudar(Math.max(min, valor - passo))} disabled={valor <= min} aria-label="menos"><Icone nome="menos" tam={18} /></button>
      <span className="passo-valor">{valor}</span>
      <button onClick={() => aoMudar(Math.min(max, valor + passo))} disabled={valor >= max} aria-label="mais"><Icone nome="mais" tam={18} /></button>
    </div>
  );
}

export function Chave({ ligada, aoMudar, rotulo }: { ligada: boolean; aoMudar: (v: boolean) => void; rotulo: string }) {
  return (
    <button className={`chave ${ligada ? 'ligada' : ''}`} role="switch" aria-checked={ligada} aria-label={rotulo} onClick={() => aoMudar(!ligada)}>
      <span className="chave-bolinha" />
    </button>
  );
}

function Linha({ rotulo, ajuda, children, cor, semBorda }: { rotulo: ReactNode; ajuda?: ReactNode; children: ReactNode; cor?: string; semBorda?: boolean }) {
  return (
    <div className={`ajuste-linha ${semBorda ? 'sem-borda' : ''}`}>
      <div className="ajuste-rotulo">
        {cor && <span className="ponto-nivel" style={{ background: cor }} />}
        <div><span>{rotulo}</span>{ajuda && <small>{ajuda}</small>}</div>
      </div>
      <div className="ajuste-controle">{children}</div>
    </div>
  );
}

export function EditorPontos({ cfg, aoMudar, jogadores }: { cfg: ConfigPontos; aoMudar: (c: ConfigPontos) => void; jogadores: number }) {
  const mudar = (parte: Partial<ConfigPontos>) => aoMudar({ ...cfg, ...parte });
  const roleta = (parte: Partial<ConfigPontos['roleta']>) => mudar({ roleta: { ...cfg.roleta, ...parte } });
  return (
    <div className="editor">
      <h4 className="editor-titulo">Meio e batidas</h4>
      <Linha rotulo="Pontos no meio"><Passo valor={cfg.meio} passo={10} min={10} aoMudar={v => mudar({ meio: v })} /></Linha>
      <Linha rotulo="Batida de 9"><Passo valor={cfg.base9} aoMudar={v => mudar({ base9: v })} /></Linha>
      <Linha rotulo="Batida de 10"><Passo valor={cfg.base10} aoMudar={v => mudar({ base10: v })} /></Linha>

      <h4 className="editor-titulo">Roleta</h4>
      <Linha rotulo="Trincas sorteadas"><Passo valor={cfg.roleta.trincas} passo={1} max={6} aoMudar={v => roleta({ trincas: v })} /></Linha>
      <Linha rotulo="Pontos da trinca"><Passo valor={cfg.roleta.pontosTrinca} aoMudar={v => roleta({ pontosTrinca: v })} /></Linha>
      <Linha rotulo="Quadra sorteada"><Chave rotulo="Quadra sorteada" ligada={cfg.roleta.quadra} aoMudar={v => roleta({ quadra: v })} /></Linha>
      {cfg.roleta.quadra && <Linha rotulo="Pontos da quadra"><Passo valor={cfg.roleta.pontosQuadra} aoMudar={v => roleta({ pontosQuadra: v })} /></Linha>}

      <h4 className="editor-titulo">Prêmios</h4>
      {PREMIOS.map(p => {
        const atual = cfg.premios[p.id];
        const setar = (parte: Partial<typeof atual>) => mudar({ premios: { ...cfg.premios, [p.id]: { ...atual, ...parte } } });
        const ajuda = p.ganha10 ? 'na batida de 10 ganha a partida' : p.pontos10 === null ? 'só na batida de 9' : undefined;
        return (
          <div key={p.id} className="ajuste-premio">
            <Linha rotulo={p.nome} cor={NIVEIS[p.nivel].cor} ajuda={ajuda} semBorda>
              <Chave rotulo={p.nome} ligada={atual.ativo} aoMudar={v => setar({ ativo: v })} />
            </Linha>
            {atual.ativo && (
              <div className="ajuste-premio-valores">
                <span>de 9</span>
                <Passo valor={atual.pontos9} aoMudar={v => setar({ pontos9: v })} />
                {p.pontos10 !== null && (
                  <>
                    <span>de 10</span>
                    <Passo valor={atual.pontos10} aoMudar={v => setar({ pontos10: v })} />
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      <h4 className="editor-titulo">Coringa e mesa</h4>
      <Linha rotulo="Desconto por coringa" ajuda="tirado de cada prêmio fixo"><Passo valor={cfg.desconto} aoMudar={v => mudar({ desconto: v })} /></Linha>
      <Linha rotulo="Ajustar pela mesa" ajuda={`com ${jogadores} jogadores: ×${(MULTIPLICADOR_MESA[jogadores] ?? 1).toLocaleString('pt-BR')}`}>
        <Chave rotulo="Ajustar pela mesa" ligada={cfg.ajusteMesa} aoMudar={v => mudar({ ajusteMesa: v })} />
      </Linha>
      <button className="botao botao-fantasma botao-pequeno editor-padrao" onClick={() => aoMudar(CONFIG_PADRAO)}>Voltar ao padrão</button>
    </div>
  );
}
