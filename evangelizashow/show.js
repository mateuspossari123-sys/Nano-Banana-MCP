/*
 * Efeitos de show e vinhetas com o logo.
 *
 * Fundos (campo "fundo" da cena) — pulsam na batida (BPM do roteiro ou tap tempo, tecla K):
 *   varredura  fachos de luz varrendo o palco, como moving heads
 *   pulso      anéis saindo do centro a cada batida e tiras acendendo em sequência
 *   feixes     barras de luz correndo pelos 9 m (o desenho muda a cada 8 batidas)
 *   tunel      molduras douradas vindo do centro para fora
 *   brilhos    chuva de brilho dourado
 *
 * Vinhetas (teclas L, V, C, ou campo "entrada" da cena para usar como passagem):
 *   explosao   clarão, onda de choque e faíscas com o logo no centro
 *   revelacao  um facho de luz atravessa o palco e revela o logo e o nome do evento
 *   cortina    barras douradas cobrem o painel, o logo aparece, e as barras abrem a próxima cena
 */
(function () {
  'use strict';

  const { EFEITOS, VINHETAS } = window.LED;
  const { rgba, brilho, texto, PARTICULAS, CREME, OURO, OURO_CLARO, TITULO } = window.LED.util;
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
})();
