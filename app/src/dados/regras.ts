// Regras da Caxeta (as do REGRAS.txt, com a pontuação em pontos e os prêmios).

export type Bloco =
  | { tipo: 'lista'; itens: string[] }
  | { tipo: 'sub'; texto: string }
  | { tipo: 'exemplos'; linhas: [string, string][] }; // [cartas, explicação]

export interface Secao {
  titulo: string;
  blocos: Bloco[];
}

export const REGRAS: Secao[] = [
  {
    titulo: 'Material e jogadores',
    blocos: [{ tipo: 'lista', itens: ['2 baralhos com os Jokers: 108 cartas.', 'De 2 a 8 jogadores.'] }],
  },
  {
    titulo: 'Embaralhar, cortar e dar as cartas',
    blocos: [{
      tipo: 'lista', itens: [
        'O jogo anda no sentido anti-horário (para a direita).',
        'Quem embaralha entrega para o jogador da esquerda cortar.',
        'Quem embaralhou dá as cartas de 3 em 3, dando a volta na mesa 3 vezes, até cada um ter 9 cartas.',
        'O jogador da direita de quem embaralhou começa.',
        'Na rodada seguinte todo mundo anda uma casa: quem começou passa a embaralhar. O app mostra quem é cada um.',
      ],
    }],
  },
  {
    titulo: 'A vira e os coringas',
    blocos: [
      { tipo: 'lista', itens: [
        'Depois de dar as cartas, vira-se uma carta do monte: a vira. Se sair Joker, vira outra.',
        'Coringas (valem qualquer carta): as 4 cartas do valor seguinte ao da vira, na mesma cor dela, e o espelho (a outra cópia da vira). São 5 por rodada.',
        'Depois do K vem o Ás.',
        'Não tem limite de coringas por jogo. Pode descartar coringa (mas é vacilo).',
      ] },
      { tipo: 'exemplos', linhas: [
        ['6♠', 'Coringas: 7♠ 7♣ (duas de cada) e o outro 6♠'],
        ['6♦', 'Coringas: 7♥ 7♦ (duas de cada) e o outro 6♦'],
        ['K♥', 'Coringas: A♥ A♦ (duas de cada) e o outro K♥'],
      ] },
      { tipo: 'sub', texto: 'Joker' },
      { tipo: 'lista', itens: [
        'O Joker não vale tudo: vale a carta do coringa (valor seguinte ao da vira, na cor da vira), em qualquer uma das duas pintas. A cor do Joker não importa.',
      ] },
      { tipo: 'exemplos', linhas: [
        ['Jk Jk 8♠', 'Vira 7♥: trinca 8♥ 8♦ 8♠'],
        ['6♦ 7♦ Jk', 'Vira 7♥: sequência 6♦ 7♦ 8♦'],
        ['4♠ 5♠ Jk', 'Não vale: o Joker não vira 6♠'],
      ] },
    ],
  },
  {
    titulo: 'Os jogos',
    blocos: [
      { tipo: 'sub', texto: 'Trinca (3 cartas)' },
      { tipo: 'exemplos', linhas: [
        ['4♥ 5♥ 6♥', 'Sequência: seguidas da mesma pinta'],
        ['9♠ 9♥ 9♦', 'Iguais: mesmo valor, pintas diferentes'],
      ] },
      { tipo: 'sub', texto: 'Dobra (4 cartas), só na batida de 10' },
      { tipo: 'exemplos', linhas: [
        ['4♥ 5♥ 6♥ 7♥', 'Sequência de 4'],
        ['9♠ 9♠ 9♥ 9♦', '3 pintas diferentes + 1 repetida'],
        ['9♠ 9♥ 9♦ 9♣', 'Não vale: 4 pintas diferentes'],
      ] },
      { tipo: 'sub', texto: 'O Ás' },
      { tipo: 'exemplos', linhas: [
        ['A♣ 2♣ 3♣', 'Vale'],
        ['Q♣ K♣ A♣', 'Vale'],
        ['K♣ A♣ 2♣', 'Não vale: não dá a volta'],
      ] },
    ],
  },
  {
    titulo: 'A jogada',
    blocos: [{
      tipo: 'lista', itens: [
        'Na sua vez: compra uma carta (do monte ou a de cima do lixo) e descarta uma.',
        'Quem começa a rodada: se a primeira carta não servir, descarta e pode comprar outra. Depois descarta de novo.',
        'Se o monte acabar, embaralha o lixo e ele vira o monte.',
      ],
    }],
  },
  {
    titulo: 'Bater',
    blocos: [
      { tipo: 'lista', itens: [
        'Bater de 9: 3 trincas, descartando a 10ª carta.',
        'Bater de 10: 2 trincas + 1 dobra, descendo as 10 cartas.',
        'Só quem bate marca. Quem não bateu perde tudo o que estava montando.',
        'Bater errado: fica queimado e, até o fim da rodada, só compra do monte.',
      ] },
      { tipo: 'sub', texto: 'Bater atravessado' },
      { tipo: 'lista', itens: [
        'Se alguém descarta a carta que falta para você bater, você pode bater com ela fora da sua vez.',
        'A preferência é do jogador da vez: se ele bater com essa carta, a batida é dele.',
        'Se ele fizer menção de comprar do monte, ou pegar a carta e não bater, você pode bater atravessado.',
        'Ainda a combinar na mesa: se a carta já foi pega, se duas pessoas querem a mesma carta, e até quando vale.',
      ] },
    ],
  },
  {
    titulo: 'Pontos: subida e descida',
    blocos: [
      { tipo: 'lista', itens: [
        'O meio começa com 100 pontos. Batida de 9 vale 10, batida de 10 vale 20, mais os prêmios.',
        'Subida: quem bate puxa do meio. Se a batida vale mais do que sobrou, puxa o que sobrou e o resto já desce de cada um dos outros.',
        'Quando o meio acaba, quem está sem ponto sai na hora.',
        'Descida: quem bate tira o valor da batida de cada um dos outros. Quem zera, sai.',
        'Ganha quem sobrar por último.',
      ] },
    ],
  },
];

export const DUVIDAS: [string, string][] = [
  ['O app escolhe a vira?', 'Não. As cartas e a vira são de verdade, na mesa. Você só informa no app qual carta virou, e ele mostra os coringas.'],
  ['Preciso marcar a mão toda vez?', 'Não. Se a batida não tem prêmio, é só escolher "sem prêmio" e registrar. Marque a mão quando alguém tiver prêmio, para o app conferir e somar.'],
  ['Prêmio feito com coringa vale?', 'Os prêmios fixos valem, mas cada coringa ou Joker usado no lugar de outra carta tira 10 pontos de cada prêmio. As trincas e a quadra da roleta só valem sem coringa.'],
  ['E coringa no lugar dele mesmo?', 'Não desconta. Se o 7♥ é coringa e entra como 7♥ mesmo, conta como carta normal.'],
  ['Dá para ganhar dois prêmios na mesma batida?', 'Dá, e eles somam. Só quando um prêmio está dentro do outro (toda Escada também é Uma pinta só, por exemplo) vale só o maior.'],
  ['Por que o prêmio muda com o número de jogadores?', 'Com mais gente na mesa, é mais difícil completar um prêmio antes de alguém bater. A simulação mediu isso: com 2 jogadores o prêmio vale metade, com 6 vale uns 35% a mais. Dá para desligar nos ajustes.'],
  ['De onde vieram os valores dos prêmios?', 'De uma simulação com milhões de mãos: para cada prêmio, a mesma mão foi jogada correndo atrás dele e jogando seguro. O valor é o que faz a aposta valer a pena.'],
  ['Como funciona a roleta?', 'Assim que você informa a vira, o app sorteia 3 trincas e 1 quadra exatas, sem nenhuma carta que seja coringa naquela rodada. É um bônus para movimentar a partida: quem bater com uma delas feita sem coringa ganha +10 por trinca e +20 pela quadra (a quadra só entra na batida de 10). O bônus não muda com o tamanho da mesa.'],
  ['Errei a rodada, e agora?', 'No Placar tem "Desfazer última rodada". Também dá para ajustar os pontos de alguém na mão.'],
];
