import { CSSProperties } from 'react';

export function Avatar({ nome, cor, tam = 36, apagado }: { nome: string; cor: string; tam?: number; apagado?: boolean }) {
  const iniciais = nome.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <span className={`avatar ${apagado ? 'avatar-apagado' : ''}`} style={{ '--cor': cor, width: tam, height: tam, fontSize: tam * 0.4 } as CSSProperties}>
      {iniciais}
    </span>
  );
}
