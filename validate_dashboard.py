#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent
errors = []

required = [
    'index.html', 'styles.css', 'app.js', 'charts.js', 'data-loader.js',
    'bootstrap-data.js', 'requirements.txt', 'update_dashboard.py'
]
for name in required:
    if not (ROOT / name).exists():
        errors.append(f'Falta archivo requerido: {name}')

index = (ROOT / 'index.html').read_text(encoding='utf-8') if (ROOT / 'index.html').exists() else ''
for attr in re.findall(r'(?:src|href)=["\']([^"\']+)["\']', index):
    clean = attr.split('?', 1)[0].split('#', 1)[0]
    if clean.startswith(('http://', 'https://', '//', '#', 'mailto:')) or not clean:
        continue
    if not (ROOT / clean).exists():
        errors.append(f'index.html referencia un archivo inexistente: {clean}')

# CSV/JSON locales cargados explícitamente desde JavaScript.
for js in ROOT.glob('*.js'):
    text = js.read_text(encoding='utf-8', errors='replace')
    for name in re.findall(r'["\']([A-Za-z0-9_.-]+\.(?:csv|json))["\']', text):
        if not (ROOT / name).exists():
            errors.append(f'{js.name} referencia un archivo inexistente: {name}')

if errors:
    print('\n'.join(f'ERROR: {e}' for e in sorted(set(errors))))
    raise SystemExit(1)

print('OK: estructura compatible con publicación estática en GitHub Pages.')
