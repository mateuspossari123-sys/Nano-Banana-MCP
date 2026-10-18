/*
 * Mapa do painel de LED — Evangelizashow
 *
 * Painel P3.91  →  1000 mm / 3,91 mm = 256 pixels por metro.
 *
 * "palco" = o palco inteiro desenhado em escala real (9 m × 2 m = 2304 × 512 px).
 *           Todo efeito/vídeo panorâmico é desenhado aqui.
 * "saida" = onde cada tela fica dentro da saída de vídeo do notebook (1920 × 1080),
 *           que é o que o processador do painel (Novastar etc.) recebe.
 *
 * Se o técnico mapear as telas em outra posição da saída, mude só os valores de "saida".
 */
window.CONFIG = {
  pxPorMetro: 256,
  saida: { largura: 1920, altura: 1080 },
  palco: { largura: 2304, altura: 512 },

  telas: [
    { id: 'C',   nome: 'Central 4×2 m',              palco: { x: 640,  y: 0,   w: 1024, h: 512 }, saida: { x: 0,    y: 0 } },
    { id: 'LE1', nome: 'Lateral esquerda superior',  palco: { x: 0,    y: 0,   w: 512,  h: 128 }, saida: { x: 1024, y: 0 } },
    { id: 'LE2', nome: 'Lateral esquerda inferior',  palco: { x: 0,    y: 256, w: 512,  h: 128 }, saida: { x: 1024, y: 128 } },
    { id: 'LD1', nome: 'Lateral direita superior',   palco: { x: 1792, y: 0,   w: 512,  h: 128 }, saida: { x: 1024, y: 256 } },
    { id: 'LD2', nome: 'Lateral direita inferior',   palco: { x: 1792, y: 256, w: 512,  h: 128 }, saida: { x: 1024, y: 384 } },
  ],

  // Refletores (as bolinhas do desenho) — só aparecem na prévia, para referência.
  refletores: [128, 256, 384].flatMap(x => [
    { x: x, y: 192 }, { x: x, y: 448 },
    { x: 1792 + x, y: 192 }, { x: 1792 + x, y: 448 },
  ]),

  // Duração da transição entre cenas, em segundos.
  transicao: 0.8,
};
