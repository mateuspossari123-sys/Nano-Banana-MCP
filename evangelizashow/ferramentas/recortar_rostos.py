#!/usr/bin/env python3
"""
Recorta os rostos das fotos da comunidade para o mural do painel.

    python3 ferramentas/recortar_rostos.py PASTA_DAS_FOTOS [--natural]

Para cada rosto encontrado: endireita a cabeça (inclusive quem tirou a foto
inclinado), recorta um quadrado igual para todos (cabelo até o queixo/pescoço),
equaliza a luz e aplica o duotom azul da identidade (ou mantém a cor com
--natural). Salva em midia/rostos/, gera midia/rostos/rostos.js (a lista que o
player lê) e uma folha de revisão numerada: midia/rostos/revisao.jpg.

Revise a folha: se algum recorte não for um rosto, apague o arquivo e rode
    python3 ferramentas/recortar_rostos.py --lista
para só refazer a lista.

Requer: pip install "opencv-python-headless<5" pillow
"""
import argparse
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'midia', 'rostos')
LADO = 320            # tamanho final de cada rosto, em pixels
MENOR_ROSTO = 48      # rostos menores que isso na foto ficam borrados no painel
ANGULOS = (0, -20, 20)
EXTENSOES = ('.jpg', '.jpeg', '.png', '.webp', '.heic')

CASCATA = cv2.data.haarcascades
ROSTO = cv2.CascadeClassifier(os.path.join(CASCATA, 'haarcascade_frontalface_alt2.xml'))
OLHO = cv2.CascadeClassifier(os.path.join(CASCATA, 'haarcascade_eye.xml'))


def girar(img, angulo, centro=None):
    h, w = img.shape[:2]
    centro = centro or (w / 2, h / 2)
    m = cv2.getRotationMatrix2D(centro, angulo, 1.0)
    return cv2.warpAffine(img, m, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE), m


def detectar(cinza):
    """Procura rostos com a foto em 0° e levemente girada, para pegar cabeças inclinadas.
    Devolve (cx, cy, lado, angulo, confianca) em coordenadas da foto original."""
    h, w = cinza.shape
    achados = []
    for ang in ANGULOS:
        g, m = girar(cinza, ang) if ang else (cinza, None)
        caixas, _, pesos = ROSTO.detectMultiScale3(
            g, scaleFactor=1.08, minNeighbors=5, minSize=(MENOR_ROSTO, MENOR_ROSTO), outputRejectLevels=True)
        inv = cv2.invertAffineTransform(m) if m is not None else None
        for (x, y, lw, lh), peso in zip(caixas, pesos):
            cx, cy = x + lw / 2, y + lh / 2
            if inv is not None:
                cx, cy = inv @ np.array([cx, cy, 1.0])
            achados.append((cx, cy, lw, ang, float(peso)))
    # Junta detecções do mesmo rosto em ângulos diferentes; fica a mais confiável.
    achados.sort(key=lambda a: -a[4])
    finais = []
    for a in achados:
        if all(math.hypot(a[0] - f[0], a[1] - f[1]) > 0.5 * max(a[2], f[2]) for f in finais):
            finais.append(a)
    return finais


def olhos_do_rosto(cinza, cx, cy, lado):
    x0, y0 = int(cx - lado / 2), int(cy - lado / 2)
    roi = cinza[max(0, y0):y0 + int(lado * 0.55), max(0, x0):x0 + lado]
    if roi.size == 0:
        return []
    return OLHO.detectMultiScale(roi, scaleFactor=1.1, minNeighbors=6, minSize=(lado // 8, lado // 8))


def ajuste_pelos_olhos(olhos, lado):
    """Com o rosto já quase reto, mede a inclinação pela linha dos olhos."""
    if len(olhos) < 2:
        return 0.0
    olhos = sorted(olhos, key=lambda o: -o[2])[:2]
    (ax, ay, aw, ah), (bx, by, bw, bh) = sorted(olhos, key=lambda o: o[0])
    dx = (bx + bw / 2) - (ax + aw / 2)
    dy = (by + bh / 2) - (ay + ah / 2)
    if dx < lado * 0.2:
        return 0.0
    ang = math.degrees(math.atan2(dy, dx))
    return ang if abs(ang) < 15 else 0.0


def duotom(rgb):
    cinza = ImageOps.autocontrast(ImageOps.grayscale(rgb), cutoff=1)
    return ImageOps.colorize(cinza, black='#020c18', mid='#2a6699', white='#fbf1df', midpoint=110)


def equalizar(bgr):
    lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
    lab[:, :, 0] = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4)).apply(lab[:, :, 0])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def recortar(caminho, natural):
    foto = ImageOps.exif_transpose(Image.open(caminho)).convert('RGB')
    bgr = cv2.cvtColor(np.array(foto), cv2.COLOR_RGB2BGR)
    cinza = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
    rostos = []
    for cx, cy, lado, ang, _ in detectar(cinza):
        # Endireita a foto em volta do rosto e refina pelos olhos.
        reto, _ = girar(cinza, ang, (cx, cy)) if ang else (cinza, None)
        olhos = olhos_do_rosto(reto, cx, cy, int(lado))
        angulo = ang + ajuste_pelos_olhos(olhos, int(lado))
        img, _ = girar(bgr, angulo, (cx, cy)) if angulo else (bgr, None)
        q = int(lado * 1.9)
        x0, y0 = int(cx - q / 2), int(cy - lado * 0.05 - q / 2)
        h, w = img.shape[:2]
        pad = max(0, -x0, -y0, x0 + q - w, y0 + q - h)
        if pad:
            img = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
            x0, y0 = x0 + pad, y0 + pad
        corte = equalizar(cv2.resize(img[y0:y0 + q, x0:x0 + q], (LADO, LADO), interpolation=cv2.INTER_AREA))
        rgb = Image.fromarray(cv2.cvtColor(corte, cv2.COLOR_BGR2RGB))
        rostos.append((cx, rgb if natural else duotom(rgb)))
    # Da esquerda para a direita, como as pessoas estão na foto.
    return [r for _, r in sorted(rostos, key=lambda r: r[0])]


def gerar_lista():
    arquivos = sorted(f for f in os.listdir(SAIDA) if f.endswith('.jpg') and f != 'revisao.jpg')
    with open(os.path.join(SAIDA, 'rostos.js'), 'w', encoding='utf-8') as js:
        js.write('// Gerado por ferramentas/recortar_rostos.py — lista dos rostos do mural.\n')
        js.write('window.ROSTOS = [\n')
        js.writelines(f"  'midia/rostos/{a}',\n" for a in arquivos)
        js.write('];\n')
    # Folha de revisão numerada, para conferir se todo recorte é mesmo um rosto.
    if arquivos:
        col, t = 10, 140
        folha = Image.new('RGB', (col * t, math.ceil(len(arquivos) / col) * (t + 22)), '#0d0d10')
        d = ImageDraw.Draw(folha)
        for i, a in enumerate(arquivos):
            x, y = (i % col) * t, (i // col) * (t + 22)
            folha.paste(Image.open(os.path.join(SAIDA, a)).resize((t - 6, t - 6)), (x + 3, y + 3))
            d.text((x + 4, y + t - 2), a[:22], fill='#f0d49a')
        folha.save(os.path.join(SAIDA, 'revisao.jpg'), quality=85)
    return arquivos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('fotos', nargs='?', help='pasta (ou arquivo) com as fotos')
    ap.add_argument('--natural', action='store_true', help='mantém as cores (sem duotom azul)')
    ap.add_argument('--lista', action='store_true', help='só refaz rostos.js e a folha de revisão')
    a = ap.parse_args()
    os.makedirs(SAIDA, exist_ok=True)
    if not a.lista:
        if not a.fotos:
            ap.error('informe a pasta das fotos')
        fotos = [a.fotos] if os.path.isfile(a.fotos) else sorted(
            os.path.join(a.fotos, f) for f in os.listdir(a.fotos) if f.lower().endswith(EXTENSOES))
        for caminho in fotos:
            base = os.path.splitext(os.path.basename(caminho))[0].lower().replace(' ', '-')
            try:
                rostos = recortar(caminho, a.natural)
            except Exception as e:  # foto corrompida ou formato sem suporte
                print(f'  ! {caminho}: {e}', file=sys.stderr)
                continue
            for i, r in enumerate(rostos, 1):
                r.save(os.path.join(SAIDA, f'{base}-{i:02d}.jpg'), quality=90)
            print(f'{os.path.basename(caminho)}: {len(rostos)} rosto(s)')
    total = gerar_lista()
    print(f'{len(total)} rostos na lista. Confira midia/rostos/revisao.jpg')


if __name__ == '__main__':
    main()
