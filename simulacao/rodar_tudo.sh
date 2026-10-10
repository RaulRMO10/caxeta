#!/bin/sh
# Roda todos os experimentos usados no balanceamento (demora ~1 hora com 16 núcleos).
set -e
cd "$(dirname "$0")"
node simular.js base 4 100000
for N in 2 3 6 8; do node simular.js base $N 30000; done
node simular.js cacar dez 4 40000
node simular.js cacar uma_pinta 4 40000
node simular.js cacar cor_unica 4 40000
node simular.js cacar so_iguais 4 40000
node simular.js cacar gemeas 4 30000
node simular.js cacar figuras 4 150000
node simular.js cacar escada_colorida 4 300000
for K in 1 2 3 4 6; do node simular.js cacar roleta:$K:0 4 40000; done
for Q in 1 2; do node simular.js cacar roleta:0:$Q 4 40000; done
node simular.js cacar roleta:3:1 4 40000
node simular.js cacar escadao_colorido 4 1500000
node simular.js cacar bandeira 4 1500000
node simular.js cacar escada 4 1500000
node simular.js cacar escadao 4 3000000
