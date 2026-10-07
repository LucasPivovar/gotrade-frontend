# Plataforma demonstrativa Gotrade

Aplicação estática adaptada para demonstração. Saldo, gráfico, ordens, robô, histórico e suporte usam dados simulados. Não envia ordens financeiras reais.

A marca vem do banco pelo endpoint `/api/branding?tenant=<UUID>`. Abra `/prototipo?tenant=<UUID>` pelo painel para carregar nome e paleta da operação. A identificação continua na URL durante a navegação. Comunicação entre abas é isolada por tenant; nomes/cores não são buscados em um localStorage compartilhado.

O login visual tem um layout fixo. O botão Entrar é demonstrativo e aceita campos vazios; ele não substitui a autenticação real do painel administrativo. Cadastro pago e checkout estão desativados.

`branding.js` carrega a identidade; `auth.js` e `auth.css` renderizam a autenticação demonstrativa; `palette.js` é gerado de `lib/brand-palette.ts` por `scripts/assets.mjs`. Alterações no bundle arquivado são feitas pelo script `scripts/patch-bundle.mjs`, sem edição manual do minificado.

Use `npm run dev` na raiz para carregar a marca persistida. O servidor estático `node prototipo/serve.mjs` não fornece o banco nem `/api/branding`.
