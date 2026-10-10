// Ícones de traço simples (24x24).
const ICONES = {
  rodada: 'M7 4h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM17 7l2.2.6a2 2 0 0 1 1.4 2.4l-2.6 9.6',
  placar: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  premios: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 22l5-3 5 3-1.5-8',
  regras: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 21a2 2 0 0 1 2-2h13v2M8 7h7M8 11h5',
  ajustes: 'M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4',
  telaCheia: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  sairTelaCheia: 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5',
  fechar: 'M6 6l12 12M18 6 6 18',
  voltar: 'M15 5l-7 7 7 7',
  avancar: 'M9 5l7 7-7 7',
  desfazer: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  mais: 'M12 5v14M5 12h14',
  menos: 'M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  fogo: 'M12 22c4 0 7-2.7 7-6.6 0-3.1-2-5.4-3.6-7.1-.4 1.6-1.3 2.7-2.4 3.2.2-3.6-1.4-6.6-4-8.5.3 3-1.4 5-3 6.9C4.6 11.6 5 13 5 15.4 5 19.3 8 22 12 22z',
  coroa: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z',
  roleta: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4',
  embaralha: 'M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5',
  corta: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
  comeca: 'M7 4l12 8-12 8V4z',
  lixeira: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  editar: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
  cima: 'M6 15l6-6 6 6',
  baixo: 'M6 9l6 6 6-6',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 11v6M12 7.5v.5',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
};

export type NomeIcone = keyof typeof ICONES;

export function Icone({ nome, tam = 22, espessura = 2 }: { nome: NomeIcone; tam?: number; espessura?: number }) {
  return (
    <svg className="icone" viewBox="0 0 24 24" width={tam} height={tam} fill="none" stroke="currentColor"
      strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONES[nome]} />
    </svg>
  );
}
