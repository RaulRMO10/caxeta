#!/bin/sh
# Segunda parte: escadas raras e comparação com mesas de 2 e de 6 jogadores.
set -e
cd "$(dirname "$0")"
node simular.js cacar escadao_colorido 4 100000
node simular.js cacar bandeira 4 100000
node simular.js cacar escada 4 150000
node simular.js cacar escadao 4 200000
for N in 2 6; do
  node simular.js cacar escada_colorida $N 60000
  node simular.js cacar roleta:3:0 $N 30000
  node simular.js cacar gemeas $N 10000
done
echo FIM
