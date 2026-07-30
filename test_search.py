import json

content = open(r'C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app\data\lojas_data.js', encoding='utf-8').read()
raw_json = content.replace('window.LOJAS_DATA = ', '').rstrip(';')
data = json.loads(raw_json)

query = '050'

# Clean query: if user types "050" or "loja 50" or "#50", strip leading zeros and words to get raw integer string
def get_clean_num(q):
    q = q.lower().strip()
    for prefix in ['loja', 'lj', '#']:
        if q.startswith(prefix):
            q = q[len(prefix):].strip()
    # Strip leading zeros if it's numeric
    if q.isdigit():
        return str(int(q))
    return q

clean_num = get_clean_num(query)

matches = []
for s in data:
    num_str = str(s.get('num', '')).strip()
    
    # Exact number match check
    is_exact_num = (
        num_str == query or 
        num_str == clean_num or 
        num_str.zfill(2) == query or 
        num_str.zfill(3) == query
    )
    
    # Blob check
    blob = " ".join([
        f"loja {num_str}",
        f"loja #{num_str}",
        f"#{num_str}",
        num_str,
        num_str.zfill(2),
        num_str.zfill(3),
        s.get('loja', ''),
        s.get('municipio', ''),
        s.get('bairro', ''),
        s.get('endereco', ''),
        s.get('supervisor', ''),
        s.get('cnpj', '')
    ]).lower()
    
    if is_exact_num or query in blob or clean_num in blob:
        matches.append({
            'num': num_str,
            'loja': s.get('loja'),
            'is_exact': is_exact_num
        })

matches.sort(key=lambda x: 0 if x['is_exact'] else 1)
print(f"Total matches for '{query}' (clean='{clean_num}'): {len(matches)}")
print("Top 10 matches:")
for m in matches[:10]:
    print(f"  Loja #{m['num']} - {m['loja']} (Exact: {m['is_exact']})")
