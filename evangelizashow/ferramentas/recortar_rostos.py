#!/usr/bin/env python3
"""
Recorta os rostos das fotos da comunidade para o mural do painel, sem repetir pessoas.

    python3 ferramentas/recortar_rostos.py FOTO_OU_PASTA [...] [--natural]

Para cada rosto: encontra os olhos, endireita a cabeça, recorta todos no mesmo
enquadramento, equaliza a luz e aplica o duotom azul da identidade (ou mantém a
cor com --natural). Quem aparece em mais de uma foto entra uma vez só, com o
melhor recorte. Pode rodar de novo com fotos novas: quem já está no mural não
se repete.

Saída em midia/rostos/: os recortes (pessoa-001.jpg...), rostos.js (a lista que
o player lê), rostos.json (a "assinatura" de cada rosto) e revisao.jpg (folha
numerada para conferir).

Na revisão, apague o arquivo de qualquer recorte que não seja uma pessoa (quadro,
estampa de camiseta, imagem de santo) e rode
    python3 ferramentas/recortar_rostos.py --lista
Esse rosto fica marcado como descartado e não volta em execuções futuras.

Requer: pip install dlib-bin pillow numpy, e os modelos do pacote
face_recognition_models (PyPI) em ferramentas/modelos/:
shape_predictor_5_face_landmarks.dat e dlib_face_recognition_resnet_model_v1.dat.
"""
import argparse
import json
import math
import os
import sys

import dlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageStat

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, 'midia', 'rostos')
MODELOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'modelos')
DADOS = os.path.join(SAIDA, 'rostos.json')
LADO = 320            # tamanho final de cada rosto, em pixels
MENOR_ROSTO = 24      # menores que isso ficariam borrados no círculo de ~120 px do painel
MAIOR_FOTO = 2400     # fotos maiores são reduzidas (mais rápido, mesmo resultado)
MESMA_PESSOA = 0.5    # distância entre assinaturas abaixo da qual é a mesma pessoa
EXTENSOES = ('.jpg', '.jpeg', '.png', '.webp')


def modelo(nome):
    caminho = os.path.join(MODELOS, nome)
    if not os.path.exists(caminho):
        sys.exit(f'Falta o modelo {caminho} (veja as instruções no começo deste arquivo).')
    return caminho


# Detector HOG: leve e bom para rostos de frente (o detector CNN do dlib é mais preciso,
# mas consome memória demais em fotos grandes).
DETECTOR = dlib.get_frontal_face_detector()
PONTOS = dlib.shape_predictor(modelo('shape_predictor_5_face_landmarks.dat'))
ASSINATURA = dlib.face_recognition_model_v1(modelo('dlib_face_recognition_resnet_model_v1.dat'))


def duotom(rgb):
    cinza = ImageOps.autocontrast(ImageOps.grayscale(rgb), cutoff=1)
    return ImageOps.colorize(cinza, black='#020c18', mid='#2a6699', white='#fbf1df', midpoint=110)


def nitidez(rgb):
    """Variância das bordas: separa recorte nítido de recorte tremido ou borrado."""
    return ImageStat.Stat(ImageOps.grayscale(rgb).filter(ImageFilter.FIND_EDGES)).var[0]


def rostos_da_foto(caminho):
    foto = ImageOps.exif_transpose(Image.open(caminho)).convert('RGB')
    foto.thumbnail((MAIOR_FOTO, MAIOR_FOTO))
    img = np.array(foto)
    # Fotos menores são ampliadas na detecção para achar também os rostos do fundo.
    ampliar = 1 if max(foto.size) >= 1600 else 2
    achados = []
    for r in DETECTOR(img, ampliar):
        if r.width() < MENOR_ROSTO:
            continue
        pontos = PONTOS(img, r)
        # O recorte já sai alinhado pelos olhos: cabeça reta, mesmo enquadramento para todos.
        chip = Image.fromarray(dlib.get_face_chip(img, pontos, size=LADO, padding=0.6))
        assinatura = list(ASSINATURA.compute_face_descriptor(img, pontos))
        achados.append({
            'x': r.center().x,
            'chip': chip,
            'assinatura': assinatura,
            'qualidade': r.width() * math.sqrt(max(1.0, nitidez(chip))),
        })
    return sorted(achados, key=lambda a: a['x'])


def mesma_pessoa(a, b):
    return np.linalg.norm(np.array(a) - np.array(b)) < MESMA_PESSOA


def carregar():
    if os.path.exists(DADOS):
        with open(DADOS, encoding='utf-8') as f:
            return json.load(f)
    return []


def salvar(dados):
    with open(DADOS, 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False)


def gerar_lista(dados):
    """Quem teve o arquivo apagado na revisão vira descartado; o resto entra na lista do player."""
    for p in dados:
        if not p.get('descartado') and not os.path.exists(os.path.join(SAIDA, p['arquivo'])):
            p['descartado'] = True
    salvar(dados)
    ativos = [p['arquivo'] for p in dados if not p.get('descartado')]
    with open(os.path.join(SAIDA, 'rostos.js'), 'w', encoding='utf-8') as js:
        js.write('// Gerado por ferramentas/recortar_rostos.py — lista dos rostos do mural.\n')
        js.write('window.ROSTOS = [\n')
        js.writelines(f"  'midia/rostos/{a}',\n" for a in ativos)
        js.write('];\n')
    if ativos:
        col, t = 10, 150
        folha = Image.new('RGB', (col * t, math.ceil(len(ativos) / col) * (t + 24)), '#0d0d10')
        d = ImageDraw.Draw(folha)
        for i, a in enumerate(ativos):
            x, y = (i % col) * t, (i // col) * (t + 24)
            folha.paste(Image.open(os.path.join(SAIDA, a)).resize((t - 6, t - 6)), (x + 3, y + 3))
            d.text((x + 6, y + t), a, fill='#f0d49a')
        folha.save(os.path.join(SAIDA, 'revisao.jpg'), quality=85)
    elif os.path.exists(os.path.join(SAIDA, 'revisao.jpg')):
        os.remove(os.path.join(SAIDA, 'revisao.jpg'))
    return ativos


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('fotos', nargs='*', help='fotos ou pastas com fotos')
    ap.add_argument('--natural', action='store_true', help='mantém as cores (sem duotom azul)')
    ap.add_argument('--lista', action='store_true', help='só refaz rostos.js e a folha de revisão')
    a = ap.parse_args()
    os.makedirs(SAIDA, exist_ok=True)
    dados = carregar()
    if not a.lista:
        if not a.fotos:
            ap.error('informe as fotos ou a pasta das fotos')
        arquivos = []
        for f in a.fotos:
            arquivos += [f] if os.path.isfile(f) else sorted(
                os.path.join(f, n) for n in os.listdir(f) if n.lower().endswith(EXTENSOES))
        for caminho in arquivos:
            novos = repetidos = 0
            for r in rostos_da_foto(caminho):
                igual = next((p for p in dados if mesma_pessoa(p['assinatura'], r['assinatura'])), None)
                if igual and (igual.get('descartado') or r['qualidade'] <= igual['qualidade']):
                    repetidos += 1
                    continue
                if igual:
                    repetidos += 1    # mesma pessoa, recorte melhor: substitui o arquivo
                else:
                    novos += 1
                    igual = {'arquivo': f'pessoa-{len(dados) + 1:03d}.jpg'}
                    dados.append(igual)
                igual.update(assinatura=r['assinatura'], qualidade=r['qualidade'], origem=os.path.basename(caminho))
                (r['chip'] if a.natural else duotom(r['chip'])).save(os.path.join(SAIDA, igual['arquivo']), quality=90)
            print(f'{os.path.basename(caminho)}: {novos} rosto(s) novo(s), {repetidos} repetido(s)')
    ativos = gerar_lista(dados)
    print(f'{len(ativos)} pessoas no mural.' + (' Confira midia/rostos/revisao.jpg' if ativos else ''))


if __name__ == '__main__':
    main()
