# 🏪 Localizador de Lojas - Rota & Informações Mobile

Aplicação web estática, responsiva e otimizada para smartphones e computadores para busca e navegação direta (Google Maps / Waze) para todas as 563 lojas cadastradas.

---

## 🌟 Funcionalidades

- 🚗 **Navegação Direta no Google Maps & Waze**: Link com 1 clique para cada uma das 563 lojas usando coordenadas GPS exatas.
- 📱 **Mobile First**: Layout pensado para celular com tema escuro/claro e carregamento instantâneo.
- 🗺️ **Mapa Interativo (Leaflet.js)**: Visualização em mapa de todas as lojas com marcadores e popups.
- 📍 **Localização GPS ("Mais Próximas")**: Descubra quais lojas estão mais perto da sua localização atual em km.
- 🔍 **Busca & Filtros Globais**: Pesquisa instantânea por nome da loja, número, município, bairro, supervisor, CNPJ, etc.
- 📞 **Contatos com 1 Toque**: Discagem rápida para telefone corporativo e contato veterinário.

---

## 🚀 Como Publicar no GitHub Pages (Passo a Passo)

### 1. Criar um Repositório no GitHub
1. Acesse [GitHub.com](https://github.com) e faça login na sua conta.
2. Clique no botão **"+"** no canto superior direito e selecione **New repository**.
3. Defina o nome do repositório (exemplo: `cadastro-lojas` ou `localizador-lojas`).
4. Mantenha o repositório como **Public** (Público).
5. Deixe desmarcadas as opções de criar README (já criamos localmente).
6. Clique em **Create repository**.

---

### 2. Enviar os Arquivos do seu Computador para o GitHub

No terminal (PowerShell ou Command Prompt) dentro da pasta do projeto `C:\Users\Wagner\.gemini\antigravity\scratch\lojas-app`, execute os seguintes comandos:

```bash
git init
git add .
git commit -m "Primeiro commit do Localizador de Lojas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/cadastro-lojas.git
git push -u origin main
```
*(Substitua `SEU_USUARIO` e `cadastro-lojas` pelo seu usuário do GitHub e nome do repositório).*

---

### 3. Ativar o GitHub Pages

1. No seu repositório no GitHub, acesse a aba **Settings** (Configurações).
2. No menu lateral esquerdo, clique em **Pages**.
3. Em **Build and deployment** -> **Branch**:
   - Selecione a branch `main`.
   - Mantenha a pasta como `/ (root)`.
   - Clique em **Save**.
4. Aguarde cerca de 1 a 2 minutos. O GitHub gerará o seu link público!
5. Seu site estará disponível no endereço:
   `https://SEU_USUARIO.github.io/cadastro-lojas/`

---

## 🛠️ Como Atualizar os Dados no Futuro

Se o arquivo `CADASTRO_LOJAS ATUALIZADO.xlsx` mudar no futuro:

1. Coloque o arquivo atualizado na área de trabalho.
2. Execute o script Python localmente:
   ```bash
   python export_excel_to_json.py
   ```
3. Suba as alterações para o GitHub:
   ```bash
   git add .
   git commit -m "Atualizando dados das lojas"
   git push
   ```
O site no GitHub Pages será atualizado automaticamente em instantes!
