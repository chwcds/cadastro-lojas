import os
import pandas as pd
import json
from urllib.parse import quote

out_dir = r"C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app\data"
os.makedirs(out_dir, exist_ok=True)

file_path = r"C:\Users\Wagner\Desktop\CADASTRO_LOJAS ATUALIZADO.xlsx"
df = pd.read_excel(file_path)

df.columns = [
    'num', 'loja', 'supervisor', 'veterinario', 'contato_vet', 
    'regiao', 'email', 'email_supervisor', 'tipo', 'inauguracao_fechou', 
    'aberta', 'cnpj', 'endereco', 'numero', 'bairro', 
    'municipio', 'cep', 'telefone_corporativo', 'coordenada', 'uf', 
    'tipo_operacao', 'auditor', 'tipo_preco_loja', 'tipo_loja'
]

lojas = []
for idx, row in df.iterrows():
    coord_raw = str(row['coordenada']).strip() if pd.notna(row['coordenada']) else ''
    lat, lon = None, None
    gmaps_link = ''
    waze_link = ''
    
    if ',' in coord_raw:
        parts = [p.strip() for p in coord_raw.split(',')]
        try:
            lat_val = float(parts[0])
            lon_val = float(parts[1])
            lat, lon = lat_val, lon_val
            gmaps_link = f"https://www.google.com/maps/search/?api=1&query={lat_val},{lon_val}"
            waze_link = f"https://waze.com/ul?ll={lat_val},{lon_val}&navigate=yes"
        except Exception:
            pass
            
    if not gmaps_link:
        end_parts = [
            str(row['loja']) if pd.notna(row['loja']) else '',
            str(row['endereco']) if pd.notna(row['endereco']) else '',
            str(row['numero']) if pd.notna(row['numero']) else '',
            str(row['municipio']) if pd.notna(row['municipio']) else '',
            str(row['uf']) if pd.notna(row['uf']) else ''
        ]
        end_str = " ".join([p for p in end_parts if p]).strip()
        gmaps_link = f"https://www.google.com/maps/search/?api=1&query={quote(end_str)}"
        waze_link = f"https://waze.com/ul?q={quote(end_str)}&navigate=yes"

    def clean_val(v):
        if pd.isna(v) or v is None:
            return ""
        s = str(v).strip()
        if s.endswith(".0"):
            s = s[:-2]
        return s

    item = {
        'num': clean_val(row['num']),
        'loja': clean_val(row['loja']),
        'supervisor': clean_val(row['supervisor']),
        'veterinario': clean_val(row['veterinario']),
        'contato_vet': clean_val(row['contato_vet']),
        'regiao': clean_val(row['regiao']),
        'email': clean_val(row['email']),
        'email_supervisor': clean_val(row['email_supervisor']),
        'tipo': clean_val(row['tipo']),
        'inauguracao_fechou': clean_val(str(row['inauguracao_fechou'])[:10] if pd.notna(row['inauguracao_fechou']) else ''),
        'aberta': clean_val(row['aberta']),
        'cnpj': clean_val(row['cnpj']),
        'endereco': clean_val(row['endereco']),
        'numero': clean_val(row['numero']),
        'bairro': clean_val(row['bairro']),
        'municipio': clean_val(row['municipio']),
        'cep': clean_val(row['cep']),
        'telefone_corporativo': clean_val(row['telefone_corporativo']),
        'coordenada': coord_raw,
        'lat': lat,
        'lon': lon,
        'gmaps_link': gmaps_link,
        'waze_link': waze_link,
        'uf': clean_val(row['uf']),
        'tipo_operacao': clean_val(row['tipo_operacao']),
        'auditor': clean_val(row['auditor']),
        'tipo_preco_loja': clean_val(row['tipo_preco_loja']),
        'tipo_loja': clean_val(row['tipo_loja'])
    }
    lojas.append(item)

js_content = "window.LOJAS_DATA = " + json.dumps(lojas, ensure_ascii=False, indent=2) + ";"
with open(os.path.join(out_dir, "lojas_data.js"), "w", encoding="utf-8") as f:
    f.write(js_content)

print(f"Sucesso! {len(lojas)} lojas exportadas com links do Google Maps em lojas_data.js")
