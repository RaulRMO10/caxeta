# Caxeta

Regras da casa do jogo de baralho Caxeta, com sistema de prêmios calibrado por simulação e um app de celular para acompanhar a partida.

- **[REGRAS.txt](REGRAS.txt)**: regras completas, pontuação e prêmios.
- **[app/](app/)**: placar para o celular (React + Vite). As cartas são de verdade, na mesa. O app guarda os pontos, sorteia a roleta da rodada, mostra os coringas da vira e confere a mão de quem bateu para somar os prêmios.
- **[simulacao/](simulacao/)**: simulador usado para calcular o valor justo de cada prêmio.

## App

```sh
cd app
npm install
npm run dev     # abre no navegador (e no celular, pelo IP do computador na mesma Wi-Fi)
npm test        # testes do motor de pontos
npm run build   # versão final em app/dist
```

### Publicar na Vercel

1. Em vercel.com, **Add New → Project** e importe este repositório.
2. Em **Root Directory**, escolha `app`.
3. Deploy. A Vercel reconhece o Vite sozinha.

No celular, use **Adicionar à tela inicial** para abrir o placar como app, em tela cheia.

## Simulação

```sh
cd simulacao
node testes.js        # confere as regras e a busca de jogos
node analise.js       # mostra as tabelas a partir de simulacao/resultados/
sh rodar_tudo.sh      # roda tudo de novo (perto de 1 hora com 16 núcleos)
```

Cada prêmio foi testado jogando a mesma mão duas vezes, uma correndo atrás do prêmio e outra jogando seguro. O valor justo é o que faz a aposta compensar o risco de alguém bater antes.
