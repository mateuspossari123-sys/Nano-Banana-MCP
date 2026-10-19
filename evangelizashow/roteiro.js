/*
 * Roteiro do show — cada item de "cenas" é um momento que o operador avança.
 *
 * Campos de uma cena (todos opcionais, menos "nome"):
 *   nome        nome que aparece só para o operador
 *   fundo       efeito animado: 'sim' (padrão) | 'gradiente' | 'raios' | 'particulas' | 'estrelas' | 'ondas' | 'preto'
 *               efeitos de show, que pulsam na batida: 'varredura' | 'pulso' | 'feixes' | 'tunel' | 'brilhos'
 *                 | 'pixelado' (ondas de cor em pixel grande) | 'xadrez' (túnel de xadrez com o logo no centro)
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
 *   letras      lista de slides de letra; use \n para quebrar linha (máx. 2 linhas por slide) e
 *               *palavra* para destacar em dourado. Um slide também pode ser
 *               { texto, luz: 0..1 (para o fundo 'amanhecer'), vinheta: 'raios' (dispara ao entrar) }
 *   faixa       texto que corre nas tiras laterais; {logo} vira o logo correndo junto
 *   contagem    { minutos: 5 }  ou  { ate: '19:30' }  — mostra relógio regressivo no central
 *   logo        true → mostra o logo (ROTEIRO.logo) no painel central
 *   entrada     vinheta que faz a passagem para esta cena: 'explosao' | 'revelacao' | 'cortina' | 'raios'
 *   automatico  vinheta disparada sozinha a cada N batidas: { vinheta: 'raios', aCada: 16 }
 *   animarEntrada  true → a cena se monta em 5 s (sai do escuro, imagem desliza, textos em
 *               sequência, laterais por último) e depois fica parada
 *   textoLado   'direita' | 'esquerda' → texto só numa metade do central (bom para retratos)
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
      nome: 'Sentinela da Manhã',
      entrada: 'cortina',
      fundo: 'amanhecer',
      titulo: 'Sentinela da *Manhã*',
      subtitulo: 'Gerados pela Imaculada',
      // "luz": 0 = noite, 1 = sol nascido. O céu acompanha a letra; no refrão o sol nasce.
      letras: [
        { texto: 'No coração da noite\npode o medo chegar', luz: 0 },
        { texto: 'Espero ansiosamente\na luz da aurora aparecer', luz: 0.1 },
        { texto: 'Eu sei, que a manhã logo vem\nvem o alvorecer de um novo tempo', luz: 0.25 },
        { texto: 'Mas ainda é *noite*', luz: 0 },
        { texto: 'No coração da noite\npode o medo chegar', luz: 0 },
        { texto: 'Espero ansiosamente\na luz da aurora aparecer', luz: 0.1 },
        { texto: 'Eu sei, que a manhã logo vem\nvem o alvorecer de um novo tempo', luz: 0.25 },
        { texto: 'Mas ainda é *noite*', luz: 0 },
        { texto: 'Tenho um posto pra guardar\n*(sou sentinela)*', luz: 0.35 },
        { texto: 'Sou chamado a anunciar\n*(sou sentinela)*', luz: 0.45 },
        { texto: 'Até meu nome Deus trocou\nagora eu já sei quem sou, eu sou', luz: 0.6 },
        { texto: '*Sentinela da manhã*\nque anuncia a chegada do Sol', luz: 1, vinheta: 'raios' },
        { texto: 'Proclama que\n*Jesus ressuscitou*' },
        { texto: '*Sentinela da manhã*\nque anuncia a chegada do Sol' },
        { texto: 'Proclama que\n*Jesus ressuscitou*' },
        { texto: 'Eu sei que o dia vem\nvem, *maranathá* vem', luz: 0.55 },
        { texto: 'Jesus minha esperança\nque nunca me engana', luz: 0.5 },
        { texto: 'Eu sei, o mundo quer sua luz\nquer o alvorecer de um novo tempo', luz: 0.4 },
        { texto: 'Mas ainda é *noite*', luz: 0.05 },
        { texto: 'Tenho um posto pra guardar\n*(sou sentinela)*', luz: 0.35 },
        { texto: 'Sou chamado a anunciar\n*(sou sentinela)*', luz: 0.45 },
        { texto: 'Até meu nome Deus trocou\nagora eu já sei quem sou, eu sou', luz: 0.6 },
        { texto: '*Sentinela da manhã*\nque anuncia a chegada do Sol', luz: 1, vinheta: 'raios' },
        { texto: 'Proclama que\n*Jesus ressuscitou*' },
        { texto: '*Sentinela da manhã*\nque anuncia a chegada do Sol', vinheta: 'raios' },
        { texto: 'Proclama que\n*Jesus ressuscitou*' },
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
      nome: 'Música 4 (pixelado)',
      entrada: 'cortina',
      fundo: 'pixelado',
      cores: ['#021220', '#0e4166', '#2a6f9f', '#9cc8e8', '#fdf0e3', '#d9b36a'],
      titulo: 'Nome da música 4',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
      ],
    },
    {
      nome: 'Música 5 (pixelado colorido)',
      entrada: 'explosao',
      fundo: 'pixelado',
      cores: ['#1b1f6b', '#3d8bff', '#4ad7ff', '#ff5fa2', '#ff9f43', '#ffe08a'],
      titulo: 'Nome da música 5',
      subtitulo: 'Artista',
      letras: [
        'Linha um\nlinha dois',
      ],
    },
    {
      nome: 'Túnel xadrez com o logo',
      entrada: 'cortina',
      fundo: 'xadrez',
      cores: ['#021220', '#0e4166', '#d9b36a', '#fdf0e3'],
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
      nome: 'Jesus Misericordioso (animado)',
      fundo: { misericordia: 'midia/misericordia-v1', x: 972, coracao: [1166, 159] },
    },
    {
      nome: 'Jesus Misericordioso (animado, versão 2)',
      fundo: { misericordia: 'midia/misericordia-v2', x: 960, coracao: [1172, 159] },
    },
    {
      nome: 'Jesus Misericordioso',
      fundo: { imagem: 'midia/divina-misericordia-panorama.png', modo: 'panorama' },
    },
    {
      nome: 'Jesus Misericordioso (versão 2)',
      fundo: { imagem: 'midia/divina-misericordia-2-panorama.png', modo: 'panorama' },
    },
    {
      nome: 'Reinaldo Alguz (fundador)',
      animarEntrada: true,   // monta em 5 s (foto, nome, laterais) e depois fica parado
      fundo: { imagem: 'midia/reinaldo-central.jpg', modo: 'central' },
      textoLado: 'direita',
      titulo: 'Reinaldo\n*Alguz*',
      subtitulo: 'Fundador da Comunidade SIM',
      faixa: '{logo}   30 anos SIM   ',
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
