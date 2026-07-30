import json, re

content = open(r'C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app\data\lojas_data.js', encoding='utf-8').read()
raw_json = content.replace('window.LOJAS_DATA = ', '').rstrip(';')
data = json.loads(raw_json)

def search_stores(data, raw_query):
    q = raw_query.lower().strip()
    if not q:
        return data
        
    num_candidate = re.sub(r'^(loja|lj)\s*#?', '', q, flags=re.IGNORECASE)
    num_candidate = re.sub(r'^#', '', num_candidate).strip()
    
    clean_num = None
    if re.match(r'^\d+$', num_candidate):
        clean_num = str(int(num_candidate))
        
    exact_num_match = None
    if clean_num:
        for s in data:
            if str(s.get('num', '')).strip() == clean_num:
                exact_num_match = s
                break

    if exact_num_match:
        return [exact_num_match]

    results = []
    for s in data:
        num_str = str(s.get('num', '')).strip()
        text_blob = " ".join([
            f"loja {num_str}",
            f"#{num_str}",
            num_str,
            s.get('loja', ''),
            s.get('municipio', ''),
            s.get('bairro', ''),
            s.get('endereco', ''),
            s.get('supervisor', ''),
            s.get('cnpj', ''),
            s.get('veterinario', '')
        ]).lower()
        
        if q in text_blob or (clean_num and clean_num in text_blob):
            results.append(s)
            
    return results

print("Test 1: 'loja 126'")
r1 = search_stores(data, 'loja 126')
print([f"Loja #{s['num']} - {s['loja']}" for s in r1])

print("\nTest 2: '050'")
r2 = search_stores(data, '050')
print([f"Loja #{s['num']} - {s['loja']}" for s in r2])

print("\nTest 3: 'DIVINOPOLIS'")
r3 = search_stores(data, 'DIVINOPOLIS')
print(f"Total found: {len(r3)}")
print([f"Loja #{s['num']} - {s['loja']}" for s in r3[:5]])
