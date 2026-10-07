# Gotrade na Vercel

Importe o repositório LucasPivovar/gotrade-frontend e selecione Next.js. A raiz do projeto é a raiz do repositório. Use Node.js 24, instalação npm ci e build npm run build. Não configure exportação estática nem uma reescrita universal para index.html.

## Variáveis obrigatórias

- TURSO_DATABASE_URL: URL libsql:// de um banco Turso remoto.
- TURSO_AUTH_TOKEN: token desse banco (somente servidor).
- ADMIN_EMAIL: e-mail do administrador inicial.
- ADMIN_PASSWORD: senha inicial de 12 a 128 caracteres. A criação não redefine senhas de contas existentes.
- DEMO_MODE: false. O modo compartilhado de demonstração é bloqueado em VERCEL_ENV=production.

Não use banco file: na Vercel. Não exponha essas variáveis com NEXT_PUBLIC_. Um banco ausente ou indisponível gera uma resposta recuperável, não um workspace compartilhado nem sucesso fictício.

## Rotas e recuperação

O Next.js atende /login, /connections, /platform, /settings e /tenants, inclusive atualização direta. Sem sessão, as páginas privadas redirecionam para o acesso. As páginas têm loading, error e global-error; falhas de consulta da sessão exibem uma tela com tentativa novamente.

/prototipo/app/history e outras rotas internas sem extensão recebem o HTML do protótipo. /app/... redireciona para /prototipo/app/... preservando tenant e demais parâmetros. Arquivos ausentes continuam 404 e não recebem HTML no lugar de JavaScript. outputFileTracingIncludes inclui os arquivos de prototipo nas funções da Vercel. [Documentação oficial](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).

Um endereço desconhecido continua HTTP 404 com uma página útil. Falhas de banco nas APIs principais retornam 503 sem detalhes internos. IDs desconhecidos retornam 404, operações suspensas 403 e conflitos de revisão 409. Não é possível garantir ausência absoluta de 500 em infraestrutura externa.

## Multitenancy

O servidor obtém a operação pela sessão. O tenant recebe somente sua operação, sem o histórico de outros tenants, e só pode editar nome e duas cores. Admin gerencia tenants do próprio workspace. A marca pública retorna apenas campos públicos para um UUID explícito. O protótipo usa armazenamento local por tenant; a prévia transmite alterações temporárias sem salvar.

Checkout, personalização de login e backup legado estão fora desta versão. O protótipo financeiro continua simulado: conexão com corretoras, saldo e ordens não são integrações reais.

## Verificação após deploy

Abra /login; entre e atualize /platform diretamente; salve nome/cores; abra /prototipo/app?tenant=UUID e atualize a página; teste dois tenants e o acesso negado a outro UUID. Confira que /pagina-inexistente e um asset ausente retornam 404. Confirme as variáveis antes de liberar clientes.
