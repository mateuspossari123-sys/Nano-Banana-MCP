/*
 * Roteiro do show — cada item de "cenas" é um momento que o operador avança.
 *
 * Campos de uma cena (todos opcionais, menos "nome"):
 *   nome        nome que aparece só para o operador
 *   fundo       efeito animado: 'sim' (padrão) | 'gradiente' | 'raios' | 'particulas' | 'estrelas' | 'ondas' | 'preto'
 *               ou mídia:  { video: 'midia/arquivo.mp4', modo: 'panorama' }
 *                          { imagem: 'midia/arquivo.jpg', modo: 'central' }
 *               modos:  'panorama' → arquivo 2304×512, ocupa os 9 m (central + laterais)
 *                       'central'  → arquivo 1024×512, só no painel central (laterais usam "efeitoLaterais")
 *                       'mapeado'  → arquivo 1920×1080 já montado no mapa de pixels da saída
 *   efeitoLaterais  efeito das laterais quando o fundo é 'central' (padrão: 'sim')
 *   cores       [fundo, cor de luz 1, cor de luz 2, ...]
 *   titulo, subtitulo   texto no painel central; no título, *palavra* sai em itálico dourado
 *   letras      lista de slides de letra; use \n para quebrar linha (máx. 2 linhas por slide)
 *   faixa       texto que corre nas tiras laterais
 *   contagem    { minutos: 5 }  ou  { ate: '19:30' }  — mostra relógio regressivo no central
 *   logo        true → mostra o logo (ROTEIRO.logo) no painel central
 */
window.ROTEIRO = {
  evento: 'Evangelizashow — Comunidade SIM — sábado, 21/11, 19h30',
  logo: 'midia/logo.png',

  // Paleta da identidade: azul profundo, azul do brilho, dourado.
  cores: ['#021220', '#0e4166', '#d9b36a'],

  cenas: [
    {
      nome: 'Espera do público',
      logo: true,
      titulo: 'Evangeliza*show*',
      subtitulo: 'Comunidade SIM · Alcançados pela misericórdia',
      faixa: 'Evangelizashow  ✦  Comunidade SIM  ✦  ',
    },
    {
      nome: 'Contagem regressiva',
      contagem: { ate: '19:30', texto: 'O show começa em' },
      faixa: 'Evangelizashow  ✦  ',
    },
    {
      nome: 'Abertura',
      fundo: 'raios',
      cores: ['#021220', '#d9b36a', '#f0d49a'],
      logo: true,
      titulo: 'Evangeliza*show*',
    },
    {
      nome: 'Música 1',
      fundo: 'gradiente',
      cores: ['#021220', '#0e4166', '#2a6f9f'],
      titulo: 'Nome da música 1',
      subtitulo: 'Artista',
      letras: [
        'Primeira linha da letra\nsegunda linha da letra',
        'Terceira linha da letra\nquarta linha da letra',
        'Refrão linha um\nrefrão linha dois',
      ],
    },
    {
      nome: 'Música 2',
      fundo: 'ondas',
      cores: ['#021220', '#d9b36a', '#2c6e9e'],
      titulo: 'Nome da música 2',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
        'Linha três\nlinha quatro',
      ],
    },
    {
      nome: 'Pregação',
      titulo: '“Ide por todo o mundo\ne pregai o *Evangelho*”',
      subtitulo: 'Marcos 16,15',
    },
    {
      nome: 'Oração',
      fundo: 'particulas',
      cores: ['#020a14', '#f0d49a', '#fdf0e3'],
      titulo: '*Jesus, eu confio em vós!*',
    },
    {
      nome: 'Encerramento',
      fundo: 'raios',
      cores: ['#021220', '#d9b36a', '#f0d49a'],
      logo: true,
      titulo: 'Obrigado!',
      subtitulo: 'Comunidade SIM · Alcançados pela misericórdia',
      faixa: 'Evangelizashow  ✦  Comunidade SIM  ✦  ',
    },
    {
      nome: 'Tela preta',
      fundo: 'preto',
    },
  ],
};
