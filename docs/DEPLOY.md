# Gotrade na Vercel

Importe o repositório LucasPivovar/gotrade-frontend e selecione Next.js. A raiz do projeto é a raiz do repositório. Use Node.js 24, instalação npm ci e build npm run build. Não configure exportação estática nem uma reescrita universal para index.html.

## Amostra pública (configuração atual)

vercel.json ativa DEMO_MODE=true. Qualquer pessoa pode abrir o painel ou entrar na demonstração com os campos vazios, sem credenciais ou configuração de banco remoto. O botão de perfis permite experimentar admin e tenant. Os dados são demonstrativos, compartilhados e temporários; podem reiniciar entre instâncias da Vercel.

## Quando usar dados reais

Desative DEMO_MODE antes de conectar clientes reais. Configure TURSO_DATABASE_URL (libsql://), TURSO_AUTH_TOKEN, ADMIN_EMAIL e ADMIN_PASSWORD (12 a 128 caracteres). Não use banco file: para dados reais na Vercel, nem prefixos NEXT_PUBLIC_ para segredos.

## Rotas e recuperação

O Next.js atende /login, /connections, /platform, /settings e /tenants, inclusive atualização direta. Sem sessão, as páginas privadas redirecionam para o acesso. As páginas têm loading, error e global-error; falhas de consulta da sessão exibem uma tela com tentativa novamente.

/prototipo/app/history e outras rotas internas sem extensão recebem o HTML do protótipo. /app/... redireciona para /prototipo/app/... preservando tenant e demais parâmetros. Arquivos ausentes continuam 404 e não recebem HTML no lugar de JavaScript. outputFileTracingIncludes inclui os arquivos de prototipo nas funções da Vercel. [Documentação oficial](https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions).

Um endereço desconhecido continua HTTP 404 com uma página útil. Falhas de banco nas APIs principais retornam 503 sem detalhes internos. IDs desconhecidos retornam 404, operações suspensas 403 e conflitos de revisão 409. Não é possível garantir ausência absoluta de 500 em infraestrutura externa.

## Multitenancy

O servidor obtém a operação pela sessão. O tenant recebe somente sua operação, sem o histórico de outros tenants, e só pode editar nome e duas cores. Admin gerencia tenants do próprio workspace. A marca pública retorna apenas campos públicos para um UUID explícito. O protótipo usa armazenamento local por tenant; a prévia transmite alterações temporárias sem salvar.

Checkout, personalização de login e backup legado estão fora desta versão. O protótipo financeiro continua simulado: conexão com corretoras, saldo e ordens não são integrações reais.

## Verificação após deploy

Abra /login; entre e atualize /platform diretamente; salve nome/cores; abra /prototipo/app?tenant=UUID e atualize a página; teste dois tenants e o acesso negado a outro UUID. Confira que /pagina-inexistente e um asset ausente retornam 404. Confirme as variáveis antes de liberar clientes.
