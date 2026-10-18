/*
 * Roteiro do show — cada item de "cenas" é um momento que o operador avança.
 *
 * Campos de uma cena (todos opcionais, menos "nome"):
 *   nome        nome que aparece só para o operador
 *   fundo       efeito animado: 'sim' (padrão) | 'gradiente' | 'raios' | 'particulas' | 'estrelas' | 'ondas' | 'preto'
 *               efeitos de show, que pulsam na batida: 'varredura' | 'pulso' | 'feixes' | 'tunel' | 'brilhos'
 *               ou mídia:  { video: 'midia/arquivo.mp4', modo: 'panorama' }
 *                          { imagens: ['midia/a.jpg', 'midia/b.jpg'], troca: 10 }  → galeria que troca a cada 10 s,
 *                              com zoom lento e a imagem desfocada nas laterais (bom para músicas de oração).
 *                              Retratos e banners aparecem inteiros; para forçar, use { src, ajuste: 'preencher' | 'conter' }
 *                          { mosaico: [{ src: 'midia/santos/x.jpg', nome: 'Nome' }, ...] } → retratos lado a lado
 *                              em molduras douradas no painel central (o título vai para cima)
 *                          { rostos: true, grade: [5, 3], porVez: 5, troca: 4 } → mural com os rostos da comunidade
 *                              (gerados por ferramentas/recortar_rostos.py); a cada 4 s trocam 5 rostos (uma fileira)
 *                          { imagem: 'midia/arquivo.jpg', modo: 'central' }
 *               modos:  'panorama' → arquivo 2304×512, ocupa os 9 m (central + laterais)
 *                       'central'  → arquivo 1024×512, só no painel central (laterais usam "efeitoLaterais")
 *                       'mapeado'  → arquivo 1920×1080 já montado no mapa de pixels da saída
 *   efeitoLaterais  efeito das laterais quando o fundo é 'central' (padrão: 'sim')
 *   cores       [fundo, cor de luz 1, cor de luz 2, ...]
 *   titulo, subtitulo   texto no painel central; no título, *palavra* sai em itálico dourado
 *   letras      lista de slides de letra; use \n para quebrar linha (máx. 2 linhas por slide)
 *   faixa       texto que corre nas tiras laterais; {logo} vira o logo correndo junto
 *   contagem    { minutos: 5 }  ou  { ate: '19:30' }  — mostra relógio regressivo no central
 *   logo        true → mostra o logo (ROTEIRO.logo) no painel central
 *   entrada     vinheta que faz a passagem para esta cena: 'explosao' | 'revelacao' | 'cortina' | 'raios'
 *   automatico  vinheta disparada sozinha a cada N batidas: { vinheta: 'raios', aCada: 16 }
 *
 * Detalhes dos efeitos e vinhetas: show.js.
 */
window.ROTEIRO = {
  evento: 'Evangelizashow — Comunidade SIM — sábado, 21/11, 19h30',
  logo: 'midia/logo.png',
  assinatura: 'Evangeliza*show*',   // texto da vinheta "revelação"
  faixaPadrao: '{logo}   30 anos SIM   ',   // faixa das laterais ligada pela tecla F
  bpm: 120,                         // batida inicial; no show, ajuste com tap tempo (tecla K)

  // Paleta da identidade: azul profundo, azul do brilho, dourado.
  cores: ['#021220', '#0e4166', '#d9b36a'],

  cenas: [
    {
      nome: 'Espera do público',
      logo: true,
      titulo: 'Evangeliza*show*',
      subtitulo: 'Comunidade SIM · Alcançados pela misericórdia',
      faixa: '{logo}   30 anos SIM   ',
    },
    {
      nome: 'Contagem regressiva',
      contagem: { ate: '19:30', texto: 'O show começa em' },
      faixa: '{logo}   30 anos SIM   ',
    },
    {
      nome: 'Abertura',
      entrada: 'revelacao',
      fundo: 'varredura',
      cores: ['#021220', '#0e4166', '#d9b36a'],
      logo: true,
      titulo: 'Evangeliza*show*',
    },
    {
      nome: 'Música 1',
      entrada: 'cortina',
      fundo: 'pulso',
      cores: ['#021220', '#0e4166', '#d9b36a'],
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
      entrada: 'cortina',
      fundo: 'feixes',
      automatico: { vinheta: 'raios', aCada: 16 },
      cores: ['#021220', '#0e4166', '#d9b36a'],
      titulo: 'Nome da música 2',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
        'Linha três\nlinha quatro',
      ],
    },
    {
      nome: 'Música 3',
      entrada: 'explosao',
      fundo: 'tunel',
      automatico: { vinheta: 'relampago', aCada: 32 },
      cores: ['#021220', '#0e4166', '#d9b36a'],
      titulo: 'Nome da música 3',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
      ],
    },
    {
      nome: 'Louvor (sem letra)',
      fundo: 'brilhos',
      cores: ['#021220', '#0e4166', '#d9b36a'],
      faixa: '{logo}   30 anos SIM   ',
    },
    {
      nome: 'Música oracional (imagens)',
      fundo: { imagens: ['midia/adoracao.jpg', 'midia/joao-paulo-ii.jpg'], troca: 12 },
      titulo: 'Nome da música oracional',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
        'Linha três\nlinha quatro',
      ],
    },
    {
      nome: 'Santos (arte)',
      entrada: 'cortina',
      fundo: {
        mosaico: [
          { src: 'midia/santos/santa-teresinha.jpg', nome: 'Santa Teresinha' },
          { src: 'midia/santos/padre-pio.jpg', nome: 'São Padre Pio' },
          { src: 'midia/santos/joao-paulo-ii.jpg', nome: 'São João Paulo II' },
          { src: 'midia/santos/santa-faustina.jpg', nome: 'Santa Faustina' },
          { src: 'midia/santos/madre-teresa.jpg', nome: 'Madre Teresa' },
        ],
      },
      titulo: 'Evangeliza*show*',
      faixa: '{logo}   30 anos SIM   ',
    },
    {
      nome: 'Mural da comunidade',
      entrada: 'cortina',
      fundo: { rostos: true, grade: [5, 3], porVez: 5, troca: 4 },
      faixa: '{logo}   Eu digo SIM a Deus   ',
    },
    {
      nome: 'Diga SIM a Deus (cartaz)',
      entrada: 'raios',
      fundo: { imagens: ['midia/diga-sim-a-deus.jpg'] },
    },
    {
      nome: 'Santificai-vos (banner)',
      entrada: 'cortina',
      fundo: { imagens: ['midia/santificai-vos.jpg'] },
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
      entrada: 'explosao',
      fundo: 'raios',
      cores: ['#021220', '#d9b36a', '#f0d49a'],
      logo: true,
      titulo: 'Obrigado!',
      subtitulo: 'Comunidade SIM · Alcançados pela misericórdia',
      faixa: '{logo}   30 anos SIM   ',
    },
    {
      nome: 'Tela preta',
      fundo: 'preto',
    },
  ],
};
