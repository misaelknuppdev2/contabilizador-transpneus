# Contabilizador de Rodas — verificações e instruções

Este repositório contém uma pequena ferramenta front-end para controlar serviços de rodas.

Arquivos importantes

- `index.html` — página principal (HTML + CSS + JS inline)
- `run_checks.js` — script que executa HTMLHint, ESLint (scripts inline) e Puppeteer para capturar erros de runtime
- `.github/workflows/checks.yml` — workflow CI que roda `npm run check`

Como usar localmente

1. Instale Node.js (recomendo usar nvm):

```bash
# instalar nvm (se ainda não tiver)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# instalar Node LTS
nvm install --lts
nvm use --lts
```

2. Instale dependências e rode os checks:

```bash
cd '/home/misael/arquivos sites'
npm install
npm run check
# para testar o PWA localmente (abre na porta 8080)
npm run start
```

3. Formatando o projeto (Prettier):

```bash
npm run format
```

Notas

- O projeto agora usa `puppeteer-core` para evitar o download automático do Chromium; o script procura um binário Chrome/Chromium local e pode ser configurado via a variável de ambiente `CHROME_BIN` (ex.: `/usr/bin/chromium-browser`).
- O workflow do GitHub Actions foi atualizado para instalar Chromium no runner e definirá `CHROME_BIN` para `/usr/bin/chromium-browser` — assim o CI não faz download adicional do Chromium como dependência do pacote.

PWA / Instalar no celular

- Android (Chrome/Edge): abra o site via HTTPS (ou rode local com `npm run start` e use ngrok para HTTPS) — o navegador deve mostrar a opção "Instalar" ou o botão "Adicionar à tela inicial". O manifest + service worker permitem instalação e execução no modo standalone.
- iOS (Safari): o Safari não usa completamente o service worker para alguns casos, mas você pode adicionar ao Home Screen via botão "Compartilhar → Add to Home Screen". Garanta que os meta tags e `apple-touch-icon` estejam presentes (já incluídos).

Observações sobre ícones

- Para produção substitua os ícones `manifest.webmanifest` e `apple-touch-icon` por imagens PNG reais (192x192 e 512x512) colocadas no diretório e atualize as URLs no manifest e `index.html`.

Se quiser, eu posso:

- migrar para `puppeteer-core` para economizar espaço; (feito)
- adicionar checagem de acessibilidade (axe/pa11y) e integrar ao `run_checks.js`;
- configurar Prettier como pre-commit hook.

Nota sobre hooks

- Adicionei `husky` e `lint-staged` como dependências de desenvolvimento e um arquivo de hook em `.husky/pre-commit` que executa `npx lint-staged` para formatar arquivos antes do commit. Para ativar os hooks localmente é preciso inicializar um repositório Git (se ainda não existir) e executar `npx husky install` — o script `prepare` no `package.json` também fará isso automaticamente durante `npm install` em um ambiente com Git.

Acessibilidade

- Integrei `axe-core` ao `run_checks.js`. Executando `npm run check` agora também roda uma auditoria de acessibilidade (axe) e imprime violações, se houver. Eu corrigi automaticamente problemas detectados (ex.: label `for` e landmark `<main>`). Depois dessas correções, o audit retornou sem violações no meu teste local.
