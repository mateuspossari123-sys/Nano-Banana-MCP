/*
 * Efeitos de show e vinhetas com o logo.
 *
 * Fundos (campo "fundo" da cena) — pulsam na batida (BPM do roteiro ou tap tempo, tecla K):
 *   varredura  fachos de luz varrendo o palco, como moving heads
 *   pulso      anéis saindo do centro a cada batida e tiras acendendo em sequência
 *   feixes     barras de luz correndo pelos 9 m (o desenho muda a cada 8 batidas)
 *   tunel      molduras douradas vindo do centro para fora
 *   brilhos    chuva de brilho dourado
 *   pixelado   ondas de cor líquidas em degraus de pixel grande (cores da cena = faixas do degradê)
 *   xadrez     túnel de xadrez girando e avançando, com o logo num círculo no centro
 *   amanhecer  noite estrelada que vira dia conforme a "luz" de cada slide da letra
 *   misericordia (fundo { misericordia: pasta, x, coracao }): acendem as tiras (vermelho e azul), abrem
 *              os raios com o logo da SIM no central e por fim aparece Jesus Misericordioso
 *
 * Vinhetas (teclas L, V, C, ou campo "entrada" da cena para usar como passagem):
 *   explosao   clarão, onda de choque e faíscas com o logo no centro
 *   revelacao  um facho de luz atravessa o palco e revela o logo e o nome do evento
 *   cortina    barras douradas cobrem o painel, o logo aparece, e as barras abrem a próxima cena
 *   raios      explosão de raios de luz saindo do centro para as laterais (tecla R)
 *   relampago  três relâmpagos dourados atravessando o palco (tecla X)
 *
 * Para disparar sozinha a cada N batidas: automatico: { vinheta: 'raios', aCada: 16 } na cena.
 */
(function () {
  'use strict';

  const { EFEITOS, VINHETAS } = window.LED;
  const { rgba, brilho, texto, semente, PARTICULAS, CREME, OURO, OURO_CLARO, TITULO } = window.LED.util;
  const NOITE = '#021220';
  const C = window.CONFIG.telas.find(t => t.id === 'C').palco;
  const TIRAS = window.CONFIG.telas.filter(t => t.id !== 'C').map(t => t.palco);
  const cx = C.x + C.w / 2, cy = C.y + C.h / 2;

  const lim = v => Math.max(0, Math.min(1, v));
  const suave = v => v * v * (3 - 2 * v);
  const desacelera = v => 1 - Math.pow(1 - v, 3);
  // Brilho que estoura na batida e vai caindo até a próxima.
  const decai = (fase, k) => Math.exp(-fase * k);

  function fundo(ctx, W, H, c) {
    ctx.fillStyle = c[0];
    ctx.fillRect(0, 0, W, H);
  }

  function halo(ctx, x, y, r, cor, alfa) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(cor, alfa));
    g.addColorStop(1, rgba(cor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function logo(ctx, m, x, y, h, alfa) {
    const L = m.logo;
    if (!L || !L.naturalWidth || alfa <= 0) return;
    const w = (h * L.naturalWidth) / L.naturalHeight;
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.shadowColor = rgba(OURO, 0.9);
    ctx.shadowBlur = h * 0.12;
    ctx.drawImage(L, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  }

  // ---------------------------------------------------------------- fundos

  EFEITOS.varredura = function (ctx, W, H, t, c, b) {
    fundo(ctx, W, H, c);
    const nevoa = ctx.createLinearGradient(0, H, 0, 0);
    nevoa.addColorStop(0, rgba(c[1], 0.45));
    nevoa.addColorStop(1, rgba(c[1], 0));
    ctx.fillStyle = nevoa;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const forca = 0.4 + 0.35 * decai(b.fase, 4);
    [0.03, 0.17, 0.33, 0.5, 0.67, 0.83, 0.97].forEach((fx, i) => {
      const ox = fx * W, oy = H + 30, L = H * 3, w = 0.08;
      const a = -Math.PI / 2 + Math.sin(t * 0.7 + i * 1.3) * 0.9 * (i % 2 ? 1 : -1);
      const cor = i % 2 ? c[2] || OURO : CREME;
      const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, L);
      g.addColorStop(0, rgba(cor, forca));
      g.addColorStop(1, rgba(cor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(a - w) * L, oy + Math.sin(a - w) * L);
      ctx.lineTo(ox + Math.cos(a + w) * L, oy + Math.sin(a + w) * L);
      ctx.closePath();
      ctx.fill();
      ctx.drawImage(brilho(cor), ox - 70, oy - 100, 140, 140);
    });
    ctx.restore();
  };

  EFEITOS.pulso = function (ctx, W, H, t, c, b) {
    fundo(ctx, W, H, c);
    const k = decai(b.fase, 3);
    halo(ctx, cx, cy, W * 0.45, c[1], 0.45 + 0.5 * k);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const idade = b.fase + i;
      ctx.strokeStyle = rgba(c[2] || OURO, 0.75 * (1 - idade / 4));
      ctx.lineWidth = 2 + 12 * (1 - idade / 4);
      ctx.beginPath();
      ctx.arc(cx, cy, 40 + idade * W * 0.14, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Uma tira por batida: LE1, LD1, LE2, LD2. A luz nasce do lado do centro.
    const ordem = [0, 2, 1, 3];
    TIRAS.forEach((r, i) => {
      if (b.n % TIRAS.length !== ordem[i]) return;
      const perto = r.x < cx ? r.x + r.w : r.x, longe = r.x < cx ? r.x : r.x + r.w;
      const g = ctx.createLinearGradient(perto, 0, longe, 0);
      g.addColorStop(0, rgba(OURO_CLARO, 0.85 * k));
      g.addColorStop(1, rgba(OURO, 0.1 * k));
      ctx.fillStyle = g;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    });
    ctx.restore();
  };

  EFEITOS.feixes = function (ctx, W, H, t, c, b) {
    fundo(ctx, W, H, c);
    const n = 36, lw = W / n;
    const padrao = Math.floor(b.n / 8) % 3;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      // Em que ponto da batida a onda passa por esta coluna.
      const atraso = [x, Math.abs(x - 0.5) * 2, 1 - Math.abs(x - 0.5) * 2][padrao];
      const v = decai((((b.total - atraso) % 1) + 1) % 1, 4);
      const cor = i % 2 ? c[2] || OURO : CREME;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rgba(cor, 0.9 * v));
      g.addColorStop(0.5, rgba(cor, 0.3 * v));
      g.addColorStop(1, rgba(cor, 0.9 * v));
      ctx.fillStyle = g;
      ctx.fillRect(i * lw + lw * 0.2, 0, lw * 0.6, H);
    }
    ctx.restore();
  };

  EFEITOS.tunel = function (ctx, W, H, t, c, b) {
    fundo(ctx, W, H, c);
    halo(ctx, cx, cy, W * 0.35, c[1], 0.8);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const n = 14, z = b.total / 2;
    for (let i = 0; i < n; i++) {
      const d = (i + z) % n / n;
      const s = Math.pow(d, 2.2), w = 80 + s * W * 1.1, h = w * 0.5;
      ctx.strokeStyle = rgba(i % 2 ? c[2] || OURO : CREME, 0.85 * lim(d * 3) * (1 - d * 0.4));
      ctx.lineWidth = 1 + s * 12;
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h * 0.18);
      ctx.stroke();
    }
    ctx.restore();
  };

  EFEITOS.brilhos = function (ctx, W, H, t, c, b) {
    fundo(ctx, W, H, c);
    const ceu = ctx.createLinearGradient(0, 0, 0, H);
    ceu.addColorStop(0, rgba(c[1], 0.6));
    ceu.addColorStop(1, rgba(c[1], 0));
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    PARTICULAS.forEach((p, i) => {
      const x = (p.x + Math.sin(t * 0.8 + p.f) * 0.004) * W;
      const y = ((p.y + t * (0.12 + p.v * 4)) % 1) * H * 1.1 - H * 0.05;
      const pisca = 0.5 + 0.5 * Math.sin(t * (4 + p.t * 6) + p.f);
      const r = 5 + p.t * 11;
      ctx.globalAlpha = 0.35 + 0.65 * pisca;
      ctx.drawImage(brilho(i % 3 ? OURO_CLARO : CREME), x - r, y - r, r * 2, r * 2);
      if (i % 9 === 0 && pisca > 0.75) {
        ctx.fillStyle = CREME;
        ctx.fillRect(x - r * 3, y - 0.75, r * 6, 1.5);
        ctx.fillRect(x - 0.75, y - r * 3, 1.5, r * 6);
      }
    });
    ctx.restore();
  };

  // Efeitos calculados ponto a ponto rodam numa tela pequena e são ampliados sem
  // suavizar: fica leve e os "pixels grandes" fazem parte do visual.
  function telaBaixa(nome, w, h) {
    const k = '_' + nome;
    if (!telaBaixa[k]) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      telaBaixa[k] = { c: c, ctx: c.getContext('2d'), img: c.getContext('2d').createImageData(w, h) };
    }
    return telaBaixa[k];
  }

  function rgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function ampliar(ctx, tb, W, H) {
    tb.ctx.putImageData(tb.img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tb.c, 0, 0, W, H);
    ctx.restore();
  }

  const logoShow = new Image();
  logoShow.src = window.ROTEIRO.logo || '';

  // Pixelado: ondas de cor líquidas em degraus, em blocos de 16 px. As cores da cena
  // são as faixas do degradê (use 4 a 6 cores; a ordem é a ordem das faixas).
  EFEITOS.pixelado = function (ctx, W, H, t, c, b) {
    const bloco = 16, w = Math.ceil(W / bloco), h = Math.ceil(H / bloco);
    const tb = telaBaixa('pixelado', w, h), d = tb.img.data;
    const cores = (c.length >= 4 ? c : [c[0], '#0e4166', '#2a6f9f', '#9cc8e8', '#fdf0e3', c[2] || OURO]).map(rgb);
    const niveis = cores.length * 2, pulso = 0.15 * decai(b.fase, 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = Math.sin(x * 0.06 + t * 0.5 + Math.sin(y * 0.18 + t * 0.35) * 2.2)
          + 0.6 * Math.sin((x - y * 1.5) * 0.045 - t * 0.7)
          + 0.4 * Math.sin(Math.hypot(x - w / 2, (y - h / 2) * 2) * 0.12 - t * 1.1);
        v = (v + 2) / 4;
        // Degraus: a cor anda em saltos, como no telão de referência.
        const q = Math.max(0, Math.min(niveis - 1, Math.floor(v * niveis))) / (niveis - 1) * (cores.length - 1);
        const i = Math.min(cores.length - 2, Math.floor(q)), f = q - i;
        const a = cores[i], z = cores[i + 1], o = (y * w + x) * 4;
        for (let k = 0; k < 3; k++) d[o + k] = Math.min(255, (a[k] + (z[k] - a[k]) * f) * (1 + pulso));
        d[o + 3] = 255;
      }
    }
    ampliar(ctx, tb, W, H);
  };

  // Túnel xadrez: xadrez em perspectiva girando e vindo na direção do público, um
  // passo por batida, com o logo num círculo no centro do painel.
  EFEITOS.xadrez = function (ctx, W, H, t, c, b) {
    const bloco = 4, w = Math.ceil(W / bloco), h = Math.ceil(H / bloco);
    const tb = telaBaixa('xadrez', w, h), d = tb.img.data;
    const claro = rgb(c[3] || CREME), escuro = rgb(c[0]), meio = rgb(c[1]);
    const avanco = b.n + suave(b.fase), giro = t * 0.08;
    const ox = cx / bloco, oy = cy / bloco;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - ox, dy = (y - oy) * 1.6, r = Math.hypot(dx, dy) + 0.001;
        const ang = Math.atan2(dy, dx) + giro + Math.sin(r * 0.04 - t * 0.9) * 0.25;
        const prof = 260 / r + avanco * 0.5;
        const casa = (Math.floor(prof * 2) + Math.floor((ang / (Math.PI * 2)) * 24 + 24)) & 1;
        // Perto do centro o xadrez some no escuro, como profundidade.
        const nevoa = Math.min(1, r / 70);
        const cor = casa ? claro : escuro, o = (y * w + x) * 4;
        for (let k = 0; k < 3; k++) d[o + k] = meio[k] + (cor[k] - meio[k]) * nevoa;
        d[o + 3] = 255;
      }
    }
    ampliar(ctx, tb, W, H);
    const raio = C.h * 0.42 * (1 + 0.03 * decai(b.fase, 5));
    ctx.save();
    ctx.shadowColor = rgba('#000000', 0.6);
    ctx.shadowBlur = 40;
    ctx.beginPath();
    ctx.arc(cx, cy, raio, 0, Math.PI * 2);
    ctx.fillStyle = rgba(c[0], 0.92);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = rgba(OURO_CLARO, 0.8);
    ctx.lineWidth = 3;
    ctx.stroke();
    if (logoShow.complete && logoShow.naturalWidth) {
      const lh = raio * 1.15, lw = (lh * logoShow.naturalWidth) / logoShow.naturalHeight;
      ctx.drawImage(logoShow, cx - lw / 2, cy - lh / 2, lw, lh);
    }
    ctx.restore();
  };

  function mistura(a, z, f) {
    const x = rgb(a), y = rgb(z);
    return '#' + x.map((v, k) => Math.round(v + (y[k] - v) * f).toString(16).padStart(2, '0')).join('');
  }

  // Amanhecer: noite estrelada que clareia conforme a "luz" dos slides da letra
  // (0 = noite, 1 = sol nascido, com raios). Feito para "Sentinela da Manhã".
  EFEITOS.amanhecer = function (ctx, W, H, t, c, b) {
    const luz = lim(b.luz || 0);
    const ceu = ctx.createLinearGradient(0, 0, 0, H);
    ceu.addColorStop(0, mistura('#01060f', '#123e6e', luz));
    ceu.addColorStop(0.6, mistura('#03102a', '#2c6aa0', luz));
    ceu.addColorStop(1, mistura('#061a3a', '#f2b45c', luz));
    ctx.fillStyle = ceu;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // Estrelas somem com o dia.
    const estrelas = 1 - lim(luz * 1.6);
    if (estrelas > 0) {
      PARTICULAS.forEach((p, i) => {
        const r = 2 + p.t * 5;
        ctx.globalAlpha = estrelas * Math.max(0, 0.2 + 0.8 * Math.sin(t * (0.8 + p.v * 20) + p.f));
        ctx.drawImage(brilho(i % 6 ? CREME : OURO_CLARO), ((p.x + t * 0.002) % 1) * W - r, p.y * H * 0.8 - r, r * 2, r * 2);
      });
      ctx.globalAlpha = 1;
    }
    // Clarão no horizonte, depois o sol subindo atrás do painel central.
    halo(ctx, cx, H + 40, W * (0.25 + 0.35 * luz), OURO, 0.15 + 0.55 * luz);
    const sol = H + 140 - suave(lim((luz - 0.3) / 0.7)) * H * 0.78;
    halo(ctx, cx, sol, 260, '#ffe9b8', 0.9 * lim((luz - 0.25) * 2));
    ctx.globalAlpha = lim((luz - 0.3) * 2);
    ctx.beginPath();
    ctx.arc(cx, sol, 95, 0, Math.PI * 2);
    ctx.fillStyle = '#fff4dc';
    ctx.fill();
    ctx.globalAlpha = 1;
    // Com o sol no alto, raios girando devagar e pulsando na batida.
    const raios = lim((luz - 0.7) / 0.3) * (0.55 + 0.45 * decai(b.fase, 3));
    if (raios > 0) {
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2 + t * 0.05, w = 0.035, L = W * 0.7;
        const g = ctx.createRadialGradient(cx, sol, 0, cx, sol, L);
        g.addColorStop(0, rgba('#fff4dc', 0.45 * raios));
        g.addColorStop(1, rgba(OURO, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, sol);
        ctx.lineTo(cx + Math.cos(a - w) * L, sol + Math.sin(a - w) * L);
        ctx.lineTo(cx + Math.cos(a + w) * L, sol + Math.sin(a + w) * L);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  // Misericórdia: Jesus aparece no escuro, o coração brilha e os raios saem dele e se
  // espalham até as tiras. Usa as camadas de midia/misericordia-vN/ (fundo, pintura, raios).
  // Na cena: fundo: { misericordia: 'midia/misericordia-v1', x: 972, coracao: [1166, 159] }
  const camadas = {};
  function camada(src) {
    if (!camadas[src]) {
      camadas[src] = new Image();
      camadas[src].src = src;
    }
    const im = camadas[src];
    return im.complete && im.naturalWidth ? im : null;
  }
  let raiosTela = null;

  const VERMELHO = '#ff2238', AZUL = '#2f8bff';
  let logoBicolor = null;

  // Logo da SIM pintado de vermelho (esquerda) a azul (direita), como os raios.
  function logoMisericordia() {
    if (logoBicolor || !(logoShow.complete && logoShow.naturalWidth)) return logoBicolor;
    const c = document.createElement('canvas');
    c.width = logoShow.naturalWidth;
    c.height = logoShow.naturalHeight;
    const x = c.getContext('2d');
    x.drawImage(logoShow, 0, 0);
    x.globalCompositeOperation = 'source-in';
    const g = x.createLinearGradient(0, 0, c.width, 0);
    g.addColorStop(0, VERMELHO);
    g.addColorStop(0.42, '#ff6b7a');
    g.addColorStop(0.58, '#7ab8ff');
    g.addColorStop(1, AZUL);
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    logoBicolor = c;
    return c;
  }

  // Leque de raios do centro do painel: vermelhos para a esquerda, azuis para a direita.
  function leque(ctx, x, y, alcance, alfa, t) {
    const n = 40;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.04;
      const cor = Math.cos(a) < 0 ? VERMELHO : AZUL;
      const w = 0.03 + 0.015 * Math.sin(i * 2.3 + t);
      const L = alcance * (0.75 + 0.25 * Math.sin(i * 1.7));
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, L));
      g.addColorStop(0, rgba('#ffffff', 0.5 * alfa));
      g.addColorStop(0.15, rgba(cor, 0.6 * alfa));
      g.addColorStop(1, rgba(cor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a - w) * L, y + Math.sin(a - w) * L);
      ctx.lineTo(x + Math.cos(a + w) * L, y + Math.sin(a + w) * L);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Misericórdia, em quatro tempos:
  //   1) acendem as tiras de cima (vermelho de um lado, azul do outro);
  //   2) acendem as tiras de baixo;
  //   3) no central, os raios se abrem do centro com o logo da SIM em vermelho e azul;
  //   4) o logo dá lugar a Jesus Misericordioso, com os raios saindo do coração.
  // Usa as camadas de midia/misericordia-vN/ (fundo, pintura, raios).
  // Na cena: fundo: { misericordia: 'midia/misericordia-v1', x: 972, coracao: [1166, 159] }
  window.LED.misericordia = function (ctx, W, H, t, f, m) {
    const fundo = camada(f.misericordia + '/fundo.jpg');
    const pintura = camada(f.misericordia + '/pintura.png');
    const raios = camada(f.misericordia + '/raios.jpg');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (!fundo || !pintura || !raios) return;
    const tc = (Date.now() - m.entradaEm) / 1000;
    const [hx, hy] = f.coracao;
    const respira = 0.88 + 0.12 * Math.sin(t * 1.3);

    // 1 e 2) As tiras: os raios da arte recortados em cada tira, de cima e depois de baixo.
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    TIRAS.forEach(r => {
      const inicio = r.y < 200 ? 0.4 : 1.6;
      const v = suave(lim((tc - inicio) / 0.7));
      if (v <= 0) return;
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      ctx.globalAlpha = v * respira;
      // Duas vezes: nas tiras os raios precisam aparecer bem, sozinhos no escuro.
      ctx.drawImage(raios, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      ctx.globalAlpha = v * 0.6;
      ctx.drawImage(raios, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
      // Brilho que corre do lado do centro para a ponta quando a tira acende.
      const corre = lim((tc - inicio) / 1.1);
      if (corre < 1) {
        const esquerda = r.x < C.x;
        const xb = esquerda ? r.x + r.w * (1 - corre) : r.x + r.w * corre;
        const g = ctx.createLinearGradient(xb - 90, 0, xb + 90, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, rgba(esquerda ? '#ff8a96' : '#9cc8ff', 0.9 * (1 - corre)));
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      ctx.restore();
    });
    ctx.restore();

    // 3) Raios do centro e logo bicolor (abrem em 2,8 s; saem entre 7,5 s e 9 s).
    const sai = suave(lim((tc - 7.5) / 1.5));
    const abre = desacelera(lim((tc - 2.8) / 1.8));
    ctx.save();
    ctx.beginPath();
    ctx.rect(C.x, C.y, C.w, C.h);
    ctx.clip();
    if (abre > 0 && sai < 1) {
      ctx.globalCompositeOperation = 'lighter';
      const fl = lim((tc - 2.8) / 0.3) * (1 - lim((tc - 3.1) / 0.9));
      if (fl > 0) halo(ctx, cx, cy, 120 + 260 * fl, '#ffffff', 0.8 * fl);
      leque(ctx, cx, cy, 80 + abre * 720, (1 - sai) * respira, t);
      halo(ctx, cx, cy, 180, '#ffffff', 0.25 * abre * (1 - sai));
      ctx.globalCompositeOperation = 'source-over';
      const lg = logoMisericordia();
      const entra = suave(lim((tc - 3.2) / 1.2));
      if (lg && entra > 0) {
        // Disco escuro e suave atrás do logo, para ele não se misturar com os raios.
        const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, C.h * 0.42);
        dg.addColorStop(0, `rgba(2,6,16,${0.92 * entra * (1 - sai)})`);
        dg.addColorStop(0.7, `rgba(2,6,16,${0.85 * entra * (1 - sai)})`);
        dg.addColorStop(1, 'rgba(2,6,16,0)');
        ctx.fillStyle = dg;
        ctx.fillRect(C.x, C.y, C.w, C.h);
        const lh = C.h * 0.62 * (0.85 + 0.15 * entra) * (1 + 0.02 * Math.sin(t * 1.5));
        const lw = (lh * lg.width) / lg.height;
        ctx.globalAlpha = entra * (1 - sai);
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 30;
        ctx.drawImage(lg, cx - lw / 2, cy - lh / 2, lw, lh);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // 4) Jesus Misericordioso aparece (8 s a 11 s) e os raios passam a sair do coração.
    const jesus = suave(lim((tc - 8) / 3));
    if (jesus > 0) {
      ctx.globalAlpha = jesus;
      ctx.drawImage(fundo, 0, 0, W, H);
      const zoom = 1.04 - 0.04 * desacelera(lim((tc - 8) / 4));
      ctx.drawImage(pintura, hx + (f.x - hx) * zoom, hy - hy * zoom, pintura.naturalWidth * zoom, pintura.naturalHeight * zoom);
      ctx.globalCompositeOperation = 'lighter';
      const raioC = desacelera(lim((tc - 9.5) / 2.5));
      if (raioC > 0) {
        if (!raiosTela) {
          raiosTela = document.createElement('canvas');
          raiosTela.width = W;
          raiosTela.height = H;
        }
        const rc = raiosTela.getContext('2d');
        rc.globalCompositeOperation = 'source-over';
        rc.clearRect(0, 0, W, H);
        rc.drawImage(raios, 0, 0, W, H);
        const alcance = 40 + raioC * 900;
        const g = rc.createRadialGradient(hx, hy, 0, hx, hy, alcance);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.75, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        rc.globalCompositeOperation = 'destination-in';
        rc.fillStyle = g;
        rc.fillRect(0, 0, W, H);
        ctx.globalAlpha = respira * lim((tc - 9.5) / 0.6);
        ctx.drawImage(raiosTela, 0, 0);
      }
      ctx.globalAlpha = 0.35 * jesus * (0.8 + 0.2 * Math.sin(t * 2));
      halo(ctx, hx, hy, 70, '#ffffff', 1);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };

  // -------------------------------------------------------------- vinhetas
  // dur: duração em segundos · cobre: fração da duração em que o painel está
  // coberto (é quando a cena troca, se a vinheta for usada como "entrada").

  VINHETAS.explosao = {
    dur: 3.2,
    cobre: 0.1,
    desenhar(ctx, W, H, p, m) {
      const escuro = p < 0.1 ? p / 0.1 : p > 0.85 ? (1 - p) / 0.15 : 1;
      ctx.fillStyle = rgba(NOITE, 0.92 * escuro);
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const clarao = 1 - p / 0.12;
      if (clarao > 0) halo(ctx, cx, cy, W * (0.15 + p * 4), CREME, clarao);
      [0, 0.08].forEach(atraso => {
        const e = desacelera(lim((p - atraso) / 0.5));
        if (e <= 0 || e >= 1) return;
        ctx.strokeStyle = rgba(OURO, 1 - e);
        ctx.lineWidth = 2 + 30 * (1 - e);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 60 + e * W * 0.6, (60 + e * W * 0.6) * 0.6, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      const voo = desacelera(lim(p / 0.7)), some = 1 - lim(p / 0.8);
      PARTICULAS.forEach((q, i) => {
        const d = voo * (0.3 + (q.v - 0.015) * 17) * W * 0.6, r = 4 + q.t * 10;
        ctx.globalAlpha = some;
        ctx.drawImage(brilho(i % 3 ? OURO : CREME), cx + Math.cos(q.f) * d - r, cy + Math.sin(q.f) * d * 0.6 - r, r * 2, r * 2);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      // O logo some antes de o fundo clarear, para não se misturar com o texto da cena.
      const entra = desacelera(lim((p - 0.04) / 0.25)), sai = lim((p - 0.68) / 0.17);
      logo(ctx, m, cx, cy, C.h * 0.62 * (1.35 - 0.35 * entra), entra * (1 - sai));
    },
  };

  VINHETAS.revelacao = {
    dur: 4.5,
    cobre: 0.12,
    desenhar(ctx, W, H, p, m) {
      const escuro = p < 0.08 ? p / 0.08 : p > 0.85 ? (1 - p) / 0.15 : 1;
      ctx.fillStyle = rgba(NOITE, escuro);
      ctx.fillRect(0, 0, W, H);
      const xs = suave(lim((p - 0.08) / 0.5)) * (W + 400) - 200;
      // O que o facho já atravessou fica revelado.
      ctx.save();
      ctx.globalAlpha = escuro;
      ctx.beginPath();
      ctx.rect(0, 0, Math.max(0, xs), H);
      ctx.clip();
      halo(ctx, cx, cy, C.w * 0.6, '#0e4166', 0.95);
      logo(ctx, m, cx, C.y + C.h * 0.33, C.h * 0.45, 1);
      texto(ctx, [m.rot.assinatura || 'Evangeliza*show*'], { x: C.x + 36, y: C.y + C.h * 0.6, w: C.w - 72, h: C.h * 0.3 }, Object.assign({ tamanho: 110 }, TITULO));
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      TIRAS.forEach(r => {
        const desde = (xs - (r.x + r.w / 2)) / W;
        if (desde <= 0) return;
        ctx.fillStyle = rgba(OURO_CLARO, 0.75 * Math.exp(-desde * 14) * escuro);
        ctx.fillRect(r.x, r.y, r.w, r.h);
      });
      if (p < 0.62) {
        const g = ctx.createLinearGradient(xs - 160, 0, xs + 160, 0);
        g.addColorStop(0, rgba(OURO, 0));
        g.addColorStop(0.5, rgba(CREME, 0.95));
        g.addColorStop(1, rgba(OURO, 0));
        ctx.fillStyle = g;
        ctx.fillRect(xs - 160, 0, 320, H);
      }
    },
  };

  VINHETAS.cortina = {
    dur: 2.6,
    cobre: 0.42,
    desenhar(ctx, W, H, p, m) {
      // Barras inclinadas: x' = x + s·(H − y).
      const s = 0.5, n = 16, bw = (W + s * H) / n;
      ctx.save();
      ctx.transform(1, 0, -s, 1, s * H, 0);
      for (let i = 0; i < n; i++) {
        const atraso = i * 0.012;
        const entra = suave(lim((p - atraso) / 0.3)), sai = suave(lim((p - 0.62 - atraso) / 0.3));
        if (entra <= sai) continue;
        const x0 = -s * H + i * bw;
        ctx.fillStyle = i % 2 ? '#08304d' : NOITE;
        ctx.fillRect(x0 + bw * sai, 0, bw * (entra - sai) + 1, H);
        if (entra < 1) {
          ctx.fillStyle = OURO_CLARO;
          ctx.fillRect(x0 + bw * entra - 4, 0, 4, H);
        }
        if (sai > 0) {
          ctx.fillStyle = OURO_CLARO;
          ctx.fillRect(x0 + bw * sai, 0, 4, H);
        }
      }
      ctx.restore();
      const meio = lim((p - 0.3) / 0.12) * (1 - lim((p - 0.6) / 0.1));
      if (meio > 0) {
        ctx.globalCompositeOperation = 'lighter';
        halo(ctx, cx, cy, C.w * 0.5, '#0e4166', meio);
        ctx.globalCompositeOperation = 'source-over';
        logo(ctx, m, cx, cy, C.h * 0.6 * (0.9 + 0.1 * meio), meio);
      }
    },
  };

  VINHETAS.raios = {
    porBaixo: true,
    dur: 3,
    cobre: 0.2,
    desenhar(ctx, W, H, p) {
      const forca = p < 0.12 ? suave(p / 0.12) : 1 - suave(lim((p - 0.5) / 0.5));
      const alcance = desacelera(lim(p / 0.35)) * W * 0.75;
      ctx.globalCompositeOperation = 'lighter';
      const n = 32;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + p * 0.5;
        const w = 0.03 + 0.02 * Math.sin(i * 2.7), L = alcance * (0.7 + 0.3 * Math.sin(i * 1.9));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, L));
        g.addColorStop(0, rgba(CREME, 0.6 * forca));
        g.addColorStop(0.4, rgba(OURO, 0.35 * forca));
        g.addColorStop(1, rgba(OURO, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - w) * L, cy + Math.sin(a - w) * L);
        ctx.lineTo(cx + Math.cos(a + w) * L, cy + Math.sin(a + w) * L);
        ctx.closePath();
        ctx.fill();
      }
      halo(ctx, cx, cy, C.h * 0.8, CREME, 0.5 * forca);
    },
  };

  // Linha quebrada por deslocamento do ponto médio, com brilho dourado em volta.
  function descarga(ctx, rnd, x0, y0, x1, y1, grossura, alfa) {
    let pts = [[x0, y0], [x1, y1]], desvio = Math.hypot(x1 - x0, y1 - y0) * 0.25;
    for (let k = 0; k < 6; k++) {
      const novos = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const nx = ay - by, ny = bx - ax, len = Math.hypot(nx, ny) || 1, d = (rnd() - 0.5) * desvio;
        novos.push([(ax + bx) / 2 + (nx / len) * d, (ay + by) / 2 + (ny / len) * d], pts[i]);
      }
      pts = novos;
      desvio *= 0.55;
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    [[OURO, 0.3, 7], [OURO_CLARO, 0.8, 2.5], [CREME, 1, 1]].forEach(([cor, a, l]) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = rgba(cor, a * alfa);
      ctx.lineWidth = grossura * l;
      ctx.stroke();
    });
    return pts;
  }

  VINHETAS.relampago = {
    porBaixo: true,
    dur: 1.6,
    cobre: 0,
    desenhar(ctx, W, H, p, m) {
      // A semente vem da hora do disparo: saída e prévia desenham os mesmos relâmpagos.
      const base = Math.floor(m.vinheta.t0 % 100000) + 1;
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) {
        const rnd = semente(base * 31 + k * 7919);
        const x0 = rnd() * W, x1 = x0 + (rnd() - 0.5) * W * 0.5, galho = rnd();
        const vida = (p - k * 0.22) / 0.3;
        if (vida < 0 || vida > 1) continue;
        // Acende, cai, reacende uma vez e some.
        const alfa = (1 - vida) * (vida < 0.15 || (vida > 0.3 && vida < 0.4) ? 1 : 0.5);
        halo(ctx, (x0 + x1) / 2, H / 2, H * 0.9, OURO, 0.25 * alfa);
        const pts = descarga(ctx, rnd, x0, -10, x1, H + 10, 2.5, alfa);
        const [gx, gy] = pts[Math.floor(pts.length * (0.3 + galho * 0.3))];
        descarga(ctx, rnd, gx, gy, gx + (rnd() - 0.5) * W * 0.25, H + 10, 1.4, alfa * 0.8);
      }
    },
  };
})();
