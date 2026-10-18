/*
 * Motor de renderização do painel de LED.
 *
 * Tudo é desenhado primeiro no "palco" (o palco inteiro em escala real) e depois
 * recortado para a posição de cada tela na saída de vídeo. Assim um mesmo efeito
 * atravessa central e laterais sem emenda.
 */
(function () {
  'use strict';

  // Identidade visual da Comunidade SIM.
  const SERIFA = '"Playfair Display", Georgia, serif';
  const SANS = '"Montserrat", "Segoe UI", Arial, sans-serif';
  const CREME = '#fdf0e3';
  const OURO = '#d9b36a';
  const OURO_CLARO = '#f0d49a';
  const CORES_PADRAO = ['#021220', '#0e4166', '#d9b36a'];
  const TITULO = { familia: SERIFA, peso: 800, cor: CREME, corDestaque: OURO };
  const SUBTITULO = { familia: SANS, peso: 700, tamanho: 34, cor: OURO_CLARO, caixaAlta: true, espacamento: 0.3 };
  const LETRA = { familia: SANS, peso: 700, tamanho: 76, cor: '#ffffff' };

  function rgba(hex, a) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // Aleatório com semente fixa: a prévia do operador e a saída mostram as mesmas partículas.
  function semente(s) {
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  const PARTICULAS = (() => {
    const r = semente(42);
    return Array.from({ length: 160 }, () => ({ x: r(), y: r(), v: 0.015 + r() * 0.04, t: r(), f: r() * 6.28 }));
  })();
  const ESTRELAS = (() => {
    const r = semente(7);
    return Array.from({ length: 320 }, () => ({ x: r(), y: r(), t: r(), f: r() * 6.28, v: 0.5 + r() * 2 }));
  })();

  // Brilho pré-renderizado por cor (desenhar gradiente por partícula a cada quadro é caro).
  const brilhos = {};
  function brilho(cor) {
    if (!brilhos[cor]) {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, rgba(cor, 1));
      g.addColorStop(0.25, rgba(cor, 0.5));
      g.addColorStop(1, rgba(cor, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, 64, 64);
      brilhos[cor] = c;
    }
    return brilhos[cor];
  }

  function luz(c, i) { return c[1 + (i % (c.length - 1))]; }

  const EFEITOS = {
    preto() {},

    // Fundo da identidade: azul profundo com um brilho central que respira e poeira dourada.
    sim(ctx, W, H, t, c) {
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2 + Math.sin(t * 0.1) * W * 0.08, cy = H * 0.55;
      const r = W * (0.42 + 0.03 * Math.sin(t * 0.3));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, rgba(c[1], 0.95));
      g.addColorStop(1, rgba(c[1], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      PARTICULAS.slice(0, 90).forEach(p => {
        const y = (((p.y - t * p.v * 0.5) % 1) + 1) % 1;
        const raio = 3 + p.t * 9;
        ctx.globalAlpha = 0.12 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.8 + p.f));
        ctx.drawImage(brilho(c[2] || OURO), p.x * W - raio, y * H - raio, raio * 2, raio * 2);
      });
      ctx.restore();
    },

    gradiente(ctx, W, H, t, c) {
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const x = W * (0.5 + 0.45 * Math.sin(t * 0.13 + i * 2.1));
        const y = H * (0.5 + 0.5 * Math.cos(t * 0.17 + i * 1.3));
        const g = ctx.createRadialGradient(x, y, 0, x, y, H * 2.2);
        g.addColorStop(0, rgba(luz(c, i), 0.5));
        g.addColorStop(1, rgba(luz(c, i), 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    },

    raios(ctx, W, H, t, c) {
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = -H * 0.4, n = 22;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + (i / (n - 1) - 0.5) * 2.6 + Math.sin(t * 0.2 + i) * 0.06;
        const w = 0.025 + 0.02 * Math.sin(t * 0.7 + i * 1.7);
        ctx.fillStyle = rgba(luz(c, i), 0.09 + 0.06 * Math.sin(t * 0.9 + i * 2.3));
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a - w) * W, cy + Math.sin(a - w) * W);
        ctx.lineTo(cx + Math.cos(a + w) * W, cy + Math.sin(a + w) * W);
        ctx.closePath();
        ctx.fill();
      }
      const g = ctx.createRadialGradient(cx, 0, 0, cx, 0, H * 1.3);
      g.addColorStop(0, rgba(c[1], 0.65));
      g.addColorStop(1, rgba(c[1], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },

    particulas(ctx, W, H, t, c) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, c[0]);
      g.addColorStop(1, rgba(c[1], 0.12));
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      PARTICULAS.forEach((p, i) => {
        const y = (((p.y - t * p.v) % 1) + 1) % 1;
        const x = p.x + 0.008 * Math.sin(t * 0.5 + p.f);
        const r = 10 + p.t * 34;
        ctx.globalAlpha = 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + p.f));
        ctx.drawImage(brilho(luz(c, i)), x * W - r, y * H * 1.2 - r * 0.6, r * 2, r * 2);
      });
      ctx.restore();
    },

    estrelas(ctx, W, H, t, c) {
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H, 0, W / 2, H, W * 0.5);
      g.addColorStop(0, rgba(c[2] || c[1], 0.25));
      g.addColorStop(1, rgba(c[2] || c[1], 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ESTRELAS.forEach((s, i) => {
        const x = ((s.x + t * 0.004) % 1) * W;
        const r = 4 + s.t * 10;
        ctx.globalAlpha = Math.max(0, 0.15 + 0.85 * Math.sin(t * s.v + s.f));
        ctx.drawImage(brilho(i % 5 ? '#ffffff' : c[1]), x - r, s.y * H - r, r * 2, r * 2);
      });
      ctx.restore();
    },

    ondas(ctx, W, H, t, c) {
      ctx.fillStyle = c[0];
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 16) {
          const y = H * (0.2 + 0.15 * k) + Math.sin(x * 0.003 + t * (0.5 + k * 0.13) + k) * H * 0.14;
          x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = rgba(luz(c, k), 0.12);
        ctx.lineWidth = 60;
        ctx.stroke();
        ctx.strokeStyle = rgba(luz(c, k), 0.5);
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.restore();
    },
  };

  function desenharCover(ctx, el, iw, ih, r) {
    const s = Math.max(r.w / iw, r.h / ih);
    const w = iw * s, h = ih * s;
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip();
    ctx.drawImage(el, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h);
    ctx.restore();
  }

  function dimensoes(el) {
    if (el instanceof HTMLVideoElement) return el.readyState >= 2 ? [el.videoWidth, el.videoHeight] : null;
    return el.complete && el.naturalWidth ? [el.naturalWidth, el.naturalHeight] : null;
  }

  // Trechos entre *asteriscos* saem em itálico dourado, como o "App *SIM*" da identidade.
  function trechos(l) {
    return l.split('*').map((t, i) => ({ t: t, d: i % 2 === 1 })).filter(x => x.t);
  }
  function fonte(o, destaque, s) {
    return `${destaque ? 'italic ' : ''}${o.peso} ${s}px ${o.familia}`;
  }
  function larguraLinha(ctx, l, o, s) {
    return trechos(l).reduce((w, x) => { ctx.font = fonte(o, x.d, s); return w + ctx.measureText(x.t).width; }, 0);
  }

  // Escreve linhas centralizadas, reduzindo a fonte até caber no retângulo.
  function texto(ctx, linhas, r, o) {
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    if (o.caixaAlta) linhas = linhas.map(l => l.toUpperCase());
    const esp = o.espacamento || 0;
    let s = o.tamanho;
    ctx.letterSpacing = `${esp * s}px`;
    const largura = Math.max(...linhas.map(l => larguraLinha(ctx, l, o, s)));
    s *= Math.min(1, (r.w * 0.94) / largura, r.h / (linhas.length * 1.18 * s));
    ctx.letterSpacing = `${esp * s}px`;
    ctx.shadowColor = o.sombra || 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = s * 0.3;
    const y0 = r.y + r.h / 2 - ((linhas.length - 1) * s * 1.18) / 2;
    linhas.forEach((l, i) => {
      // O espaçamento entre letras também entra depois da última; metade dele recentraliza.
      let x = r.x + (r.w - larguraLinha(ctx, l, o, s) + esp * s) / 2;
      trechos(l).forEach(p => {
        ctx.font = fonte(o, p.d, s);
        ctx.fillStyle = p.d ? o.corDestaque || o.cor : o.cor;
        ctx.fillText(p.t, x, y0 + i * s * 1.18);
        x += ctx.measureText(p.t).width;
      });
    });
    ctx.restore();
  }

  class Motor {
    constructor(canvas, opcoes) {
      this.cfg = window.CONFIG;
      this.rot = window.ROTEIRO;
      this.opcoes = opcoes || {};
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      const { largura: W, altura: H } = this.cfg.palco;
      this.W = W;
      this.H = H;
      this.palco = document.createElement('canvas');
      this.palco.width = W;
      this.palco.height = H;
      this.pctx = this.palco.getContext('2d');
      this.foto = document.createElement('canvas');
      this.foto.width = W;
      this.foto.height = H;
      this.mapa = document.createElement('canvas');
      this.mapa.width = this.cfg.saida.largura;
      this.mapa.height = this.cfg.saida.altura;
      this.central = this.cfg.telas.find(t => t.id === 'C').palco;
      this.estado = { cena: 0, linha: -1, blackout: false, teste: false, preview: false };
      this.preto = 0;
      this.trocaEm = -1e9;
      this.linhaEm = 0;
      this.midia = {};
      this.rot.cenas.forEach(c => this.midiaDe(c.fundo));
      if (this.rot.logo) {
        this.logo = new Image();
        this.logo.src = this.rot.logo;
      }
      // Fontes desenhadas no canvas só carregam quando pedidas explicitamente.
      if (document.fonts) ['800 1em "Playfair Display"', 'italic 700 1em "Playfair Display"', '700 1em Montserrat'].forEach(f => document.fonts.load(f));
      this.entrar(0);
    }

    midiaDe(fundo) {
      if (!fundo || typeof fundo !== 'object') return null;
      const src = fundo.video || fundo.imagem;
      if (!this.midia[src]) {
        let el;
        if (fundo.video) {
          el = document.createElement('video');
          el.muted = true;
          el.loop = fundo.loop !== false;
          el.playsInline = true;
          el.preload = 'auto';
          el.src = src;
        } else {
          el = new Image();
          el.src = src;
        }
        this.midia[src] = el;
      }
      return this.midia[src];
    }

    entrar(i) {
      this.entradaEm = Date.now();
      const atual = this.midiaDe(this.rot.cenas[i].fundo);
      if (atual instanceof HTMLVideoElement) {
        atual.currentTime = 0;
        atual.play().catch(() => {});
      }
      clearTimeout(this.pausa);
      this.pausa = setTimeout(() => {
        Object.values(this.midia).forEach(el => {
          if (el instanceof HTMLVideoElement && el !== atual) el.pause();
        });
      }, this.cfg.transicao * 1000 + 100);
    }

    setEstado(novo) {
      if (novo.cena !== this.estado.cena) {
        const f = this.foto.getContext('2d');
        f.clearRect(0, 0, this.W, this.H);
        f.drawImage(this.palco, 0, 0);
        this.trocaEm = performance.now();
        this.entrar(novo.cena);
      }
      if (novo.linha !== this.estado.linha || novo.cena !== this.estado.cena) this.linhaEm = performance.now();
      this.estado = Object.assign({}, novo);
    }

    iniciar() {
      let ultimo = performance.now();
      const quadro = agora => {
        this.desenhar(agora, (agora - ultimo) / 1000);
        ultimo = agora;
        requestAnimationFrame(quadro);
      };
      requestAnimationFrame(quadro);
    }

    desenhar(agora, dt) {
      const p = this.pctx, t = agora / 1000;
      p.save();
      p.fillStyle = '#000';
      p.fillRect(0, 0, this.W, this.H);
      if (this.estado.teste) {
        this.desenharTeste(p, t);
      } else {
        this.desenharCena(p, this.rot.cenas[this.estado.cena], t, agora);
        const prog = (agora - this.trocaEm) / (this.cfg.transicao * 1000);
        if (prog < 1) {
          p.globalAlpha = 1 - prog;
          p.drawImage(this.foto, 0, 0);
          p.globalAlpha = 1;
        }
      }
      p.restore();

      const alvo = this.estado.blackout ? 1 : 0;
      this.preto += Math.sign(alvo - this.preto) * Math.min(Math.abs(alvo - this.preto), dt / 0.6);

      if (this.opcoes.previa || this.estado.preview) this.desenharPrevia();
      else this.mapear();
    }

    desenharCena(p, cena, t, agora) {
      const cores = cena.cores || this.rot.cores || CORES_PADRAO;
      const f = cena.fundo || 'sim';
      if (typeof f === 'string') {
        (EFEITOS[f] || EFEITOS.sim)(p, this.W, this.H, t, cores);
      } else {
        const modo = f.modo || 'panorama';
        if (modo === 'central') (EFEITOS[cena.efeitoLaterais] || EFEITOS.sim)(p, this.W, this.H, t, cores);
        const el = this.midiaDe(f), d = dimensoes(el);
        if (d && modo === 'mapeado') {
          const m = this.mapa.getContext('2d');
          m.drawImage(el, 0, 0, this.mapa.width, this.mapa.height);
          this.cfg.telas.forEach(({ palco: r, saida: s }) => p.drawImage(this.mapa, s.x, s.y, r.w, r.h, r.x, r.y, r.w, r.h));
        } else if (d) {
          desenharCover(p, el, d[0], d[1], modo === 'central' ? this.central : { x: 0, y: 0, w: this.W, h: this.H });
        }
      }

      if (cena.faixa) this.desenharFaixa(p, cena.faixa.toUpperCase(), t);

      const C = this.central, margem = 36;
      const blocos = [];
      if (cena.contagem) {
        const k = cena.contagem;
        let alvo = this.entradaEm + (k.minutos || 0) * 60000;
        if (k.ate) {
          const [h, m] = k.ate.split(':').map(Number);
          const d = new Date();
          d.setHours(h, m, 0, 0);
          alvo = d.getTime();
        }
        const resto = Math.max(0, Math.ceil((alvo - Date.now()) / 1000));
        const dois = n => String(n).padStart(2, '0');
        const h = Math.floor(resto / 3600), m = Math.floor(resto / 60) % 60;
        const mmss = (h ? `${h}:${dois(m)}` : dois(m)) + `:${dois(resto % 60)}`;
        if (k.texto) blocos.push({ linhas: [k.texto], o: SUBTITULO, h: 44 });
        blocos.push({ linhas: [mmss], o: Object.assign({ tamanho: 240 }, TITULO), h: 260 });
      } else if (this.estado.linha >= 0 && cena.letras) {
        const linhas = cena.letras[this.estado.linha].split('\n');
        blocos.push({ linhas: linhas, o: LETRA, h: C.h - 2 * margem });
      } else {
        const logo = cena.logo && this.logo && this.logo.complete && this.logo.naturalWidth;
        const acompanhado = logo || cena.subtitulo;
        if (logo) blocos.push({ logo: true, h: cena.titulo ? 190 : 380 });
        if (cena.titulo) {
          const linhas = cena.titulo.split('\n'), tam = acompanhado ? 104 : 132;
          blocos.push({ linhas: linhas, o: Object.assign({ tamanho: tam }, TITULO), h: tam * 1.18 * linhas.length });
        }
        if (cena.subtitulo) {
          const linhas = cena.subtitulo.split('\n');
          blocos.push({ linhas: linhas, o: SUBTITULO, h: 44 * linhas.length });
        }
      }

      // Empilha os blocos no centro do painel central, encolhendo tudo se não couber.
      const espaco = 22;
      const total = blocos.reduce((s, b) => s + b.h, 0) + espaco * Math.max(0, blocos.length - 1);
      const escala = Math.min(1, (C.h - 2 * margem) / total);
      let y = C.y + (C.h - total * escala) / 2;
      p.save();
      p.globalAlpha = Math.min(1, (agora - this.linhaEm) / 300);
      blocos.forEach(b => {
        const r = { x: C.x + margem, y: y, w: C.w - 2 * margem, h: b.h * escala };
        if (b.logo) {
          const s = Math.min(r.w / this.logo.naturalWidth, r.h / this.logo.naturalHeight);
          const w = this.logo.naturalWidth * s, h = this.logo.naturalHeight * s;
          p.drawImage(this.logo, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h);
        } else {
          texto(p, b.linhas, r, b.o);
        }
        y += (b.h + espaco) * escala;
      });
      p.restore();
    }

    desenharFaixa(p, frase, t) {
      this.cfg.telas.filter(tl => tl.id !== 'C').forEach(({ palco: r }, i) => {
        p.save();
        p.beginPath();
        p.rect(r.x, r.y, r.w, r.h);
        p.clip();
        const s = r.h * 0.36;
        p.font = `700 ${s}px ${SANS}`;
        p.letterSpacing = `${s * 0.25}px`;
        p.textBaseline = 'middle';
        p.fillStyle = OURO_CLARO;
        p.shadowColor = rgba(OURO, 0.8);
        p.shadowBlur = s * 0.5;
        const largura = p.measureText(frase).width;
        // Laterais esquerdas correm para a esquerda e direitas para a direita: o texto "sai" do centro.
        const dir = r.x < this.central.x ? -1 : 1;
        let x = (((dir * t * 90) % largura) + largura) % largura - largura;
        for (; x < r.w; x += largura) p.fillText(frase, r.x + x, r.y + r.h / 2);
        p.restore();
      });
    }

    desenharTeste(p, t) {
      const cores = { C: '#1e5bd8', LE1: '#d81e5b', LE2: '#e07b00', LD1: '#14a35a', LD2: '#8a2be2' };
      this.cfg.telas.forEach(({ id, nome, palco: r, saida: s }) => {
        p.save();
        p.beginPath();
        p.rect(r.x, r.y, r.w, r.h);
        p.clip();
        p.fillStyle = cores[id] || '#555';
        p.fillRect(r.x, r.y, r.w, r.h);
        for (let x = 0; x <= r.w; x += 32) {
          p.fillStyle = x % 128 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.6)';
          p.fillRect(r.x + x, r.y, 1, r.h);
        }
        for (let y = 0; y <= r.h; y += 32) {
          p.fillStyle = y % 128 ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.6)';
          p.fillRect(r.x, r.y + y, r.w, 1);
        }
        p.strokeStyle = 'rgba(255,255,255,0.35)';
        p.lineWidth = 2;
        p.beginPath();
        p.moveTo(r.x, r.y); p.lineTo(r.x + r.w, r.y + r.h);
        p.moveTo(r.x + r.w, r.y); p.lineTo(r.x, r.y + r.h);
        p.stroke();
        p.strokeStyle = '#fff';
        p.lineWidth = 4;
        p.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
        // Triângulo no canto superior esquerdo: confere se a tela não está espelhada/girada.
        p.fillStyle = '#fff';
        p.beginPath();
        p.moveTo(r.x, r.y); p.lineTo(r.x + 40, r.y); p.lineTo(r.x, r.y + 40);
        p.fill();
        p.textAlign = 'center';
        p.textBaseline = 'middle';
        p.shadowColor = '#000';
        p.shadowBlur = 6;
        const grande = r.h > 200;
        p.font = `800 ${grande ? 110 : 40}px ${SANS}`;
        p.fillText(id, r.x + r.w / 2, r.y + r.h * (grande ? 0.36 : 0.32));
        p.font = `600 ${grande ? 30 : 15}px ${SANS}`;
        p.fillText(`${nome} — ${r.w}×${r.h} px`, r.x + r.w / 2, r.y + r.h * (grande ? 0.6 : 0.62));
        p.fillText(`saída x=${s.x} y=${s.y}`, r.x + r.w / 2, r.y + r.h * (grande ? 0.69 : 0.82));
        p.restore();
      });
      // Barra que varre os 9 m: tem que passar contínua de uma tela para a outra.
      const x = (t * 500) % this.W;
      p.fillStyle = '#fff';
      p.fillRect(x, 0, 6, this.H);
    }

    mapear() {
      const c = this.ctx;
      c.globalAlpha = 1;
      c.fillStyle = '#000';
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.cfg.telas.forEach(({ palco: r, saida: s }) => c.drawImage(this.palco, r.x, r.y, r.w, r.h, s.x, s.y, r.w, r.h));
      if (this.preto > 0) {
        c.fillStyle = `rgba(0,0,0,${this.preto})`;
        c.fillRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    // Vista do palco em proporção real, como o público vai ver.
    desenharPrevia() {
      const c = this.ctx, cw = this.canvas.width, ch = this.canvas.height;
      const s = Math.min((cw - 40) / this.W, (ch - 40) / this.H);
      const ox = (cw - this.W * s) / 2, oy = (ch - this.H * s) / 2;
      c.globalAlpha = 1;
      c.fillStyle = '#0d0d10';
      c.fillRect(0, 0, cw, ch);
      c.globalAlpha = 0.08;
      c.drawImage(this.palco, ox, oy, this.W * s, this.H * s);
      c.globalAlpha = 1;
      this.cfg.telas.forEach(({ palco: r }) => {
        c.drawImage(this.palco, r.x, r.y, r.w, r.h, ox + r.x * s, oy + r.y * s, r.w * s, r.h * s);
        if (this.preto > 0) {
          c.fillStyle = `rgba(0,0,0,${this.preto})`;
          c.fillRect(ox + r.x * s, oy + r.y * s, r.w * s, r.h * s);
        }
        c.strokeStyle = '#333';
        c.strokeRect(ox + r.x * s, oy + r.y * s, r.w * s, r.h * s);
      });
      (this.cfg.refletores || []).forEach(({ x, y }) => {
        c.beginPath();
        c.arc(ox + x * s, oy + y * s, 34 * s, 0, Math.PI * 2);
        c.fillStyle = '#1c1c22';
        c.fill();
        c.strokeStyle = '#4a4a55';
        c.stroke();
      });
    }
  }

  function comandar(e, cmd, rot) {
    const s = Object.assign({}, e), n = rot.cenas.length;
    const letras = i => (rot.cenas[i].letras || []).length;
    if (typeof cmd === 'object') {
      s.cena = Math.max(0, Math.min(n - 1, cmd.cena));
      s.linha = cmd.linha == null ? -1 : cmd.linha;
      return s;
    }
    switch (cmd) {
      case 'avancar':
        if (s.linha < letras(s.cena) - 1) s.linha++;
        else if (s.cena < n - 1) { s.cena++; s.linha = -1; }
        break;
      case 'voltar':
        if (s.linha > -1) s.linha--;
        else if (s.cena > 0) { s.cena--; s.linha = -1; }
        break;
      case 'proxima': if (s.cena < n - 1) { s.cena++; s.linha = -1; } break;
      case 'anterior': if (s.cena > 0) { s.cena--; s.linha = -1; } break;
      case 'blackout': s.blackout = !s.blackout; break;
      case 'teste': s.teste = !s.teste; break;
      case 'previa': s.preview = !s.preview; break;
    }
    return s;
  }

  // Passadores de slide costumam mandar PageDown/PageUp e "." ou "b" para tela preta.
  function teclaParaComando(ev) {
    switch (ev.key) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': return 'avancar';
      case 'ArrowLeft': case 'PageUp': case 'Backspace': return 'voltar';
      case 'ArrowDown': return 'proxima';
      case 'ArrowUp': return 'anterior';
      case 'b': case 'B': case '.': return 'blackout';
      case 't': case 'T': return 'teste';
      case 'p': case 'P': return 'previa';
    }
    return null;
  }

  window.LED = { Motor, comandar, teclaParaComando };
})();
