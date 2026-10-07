# Gotrade — fluxo simplificado

## Escopo confirmado

O tenant tem exatamente três áreas:

- **Conexões**: corretoras e integrações liberadas para a operação. Não lista plataformas.
- **Plataforma**: nome, cor principal e cor secundária, prévia do próprio protótipo e link para abrir a plataforma com a identidade salva.
- **Configurações**: conta e alteração de senha.

O administrador vê **Tenants** e **Configurações**. Na lista de tenants, pode cadastrar uma operação com responsável/e-mail, abrir sua plataforma, editar a identidade, liberar integrações, gerar convite de ativação e suspender/reativar o acesso. Ao selecionar um tenant, navega entre sua Plataforma, Conexões e Configurações, com ação de voltar à lista.

Checkout e personalização de layout de login estão desativados nesta etapa. A página de autenticação usa um layout único. Removidos os textos “TradingPro White Label” e “Central de gerenciamento”. O painel se chama Gotrade; cada plataforma conserva seu próprio nome.

## Implementação

- `app/panel.tsx`: painel simplificado com navegação contextual por perfil, lista de tenants, formulário de cadastro, editor da plataforma, integrações e configurações.
- `app/gotrade.css`: layout responsivo, sem textos acima dos títulos nem rodapé; editor limitado a nome e duas cores.
- `app/platform/page.tsx`: área de Plataforma protegida pela sessão.
- `components/login-form.tsx`: autenticação Gotrade com texto coerente com o fluxo; sem credenciais fixas na interface.
- `components/platform-preview.tsx`: iframe do protótipo real em `/prototipo/app?tenant=<UUID>&preview=1`; envia rascunhos de nome e cores somente para a prévia. Não grava marca nem token de login. O gráfico acompanha as cores ao vivo.
- `lib/application.ts`: validação da marca, defaults, slug único, atualização de nome/paleta preservando os outros campos e projeção pública da marca.
- `app/api/workspace/route.ts`: ação `applicationBranding`, com sessão, autorização por tenant, verificação de origem e controle de revisão; ações de checkout recusadas.
- `app/api/branding/route.ts`: resolução pública por UUID exato; desconhecida retorna 404, suspensa retorna 403; não expõe dados de usuários.
- `prototipo/branding.js`: carrega identidade persistida pelo UUID, preserva a identificação na navegação e isola comunicação por tenant. Não compartilha a marca pelo localStorage global.
- `lib/server.ts`: novos workspaces reais começam vazios; leitura não injeta ofertas ou atividades fictícias.
- `app/checkout/[id]/page.tsx`: checkout público desativado; `/checkouts` e `/identity` levam à Plataforma.
- `scripts/patch-bundle.mjs`: rota de assinatura do protótipo redirecionada para a aplicação.
- `app/api/auth/quick-login/route.ts`: login sem senha restrito ao modo de demonstração.

Os componentes antigos de builder e templates permanecem no código como material legado, sem fazer parte do painel atual. Não apagar dados existentes de tenants ou checkouts para simplificar a interface.

## Contratos importantes para próximas alterações

`Tenant` representa a operação e sua plataforma. `Tenant.connections` continua sendo a lista de corretoras liberadas. Nunca usar esse campo para listar plataformas.

Editar a marca usa `POST /api/workspace` com `{ action: 'applicationBranding', revision, value: { id, name, color, secondaryColor } }`. O servidor mescla apenas esses campos; ID, slug, responsável, permissões e configurações existentes são preservados. Conflitos de revisão retornam 409.

A plataforma abre em `/prototipo?tenant=<UUID>`. Nome/cor na URL não são a fonte da marca. `/api/branding?tenant=<UUID>` fornece os dados persistidos. O template de autenticação visual é sempre `split`, sem seletor nesta versão.

Criar tenant é ação exclusiva do admin. O cadastro da interface solicita nome da operação, nome do responsável e e-mail para permitir o fluxo de convite. Não criar usuários ou senhas fictícios. As funções de modelo permitem ausência de responsável para compatibilidade, mas a API de convite exige responsável/e-mail válidos.

## Limitação existente

O painel tem autenticação real por senha e sessão. A plataforma de trading em `prototipo/` continua sendo uma demonstração estática com operações simuladas e login demonstrativo. Salvar nome/paleta realmente persiste no banco e muda a identidade do protótipo. Isso não cria integração financeira nem autenticação de trading em produção. As corretoras da lista representam permissões, não contas já conectadas.

## Execução e verificação

Node >=22.13.0. Executar `npm ci`, `npm run setup`, `npm run dev`; acessar `http://127.0.0.1:5173/login`. As credenciais locais estão em `.env.local`, ignorado pelo Git. Não exibir senhas em respostas. Ler `AGENTS.md` e os guias Next em `node_modules/next/dist/docs/` antes de editar código Next.

Verificações: `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e`. Os testes E2E usam porta 5174 e banco separado. Cobrem cadastro/admin, convite/tenant, menus, isolamento, paleta persistida, duas plataformas, revisão e suspensão. As capturas do redesign ficam em `outputs/`.

## Prompt para continuar com o 6.1 Sol

> Trabalhe em `C:\Users\Blast\Documents\ChatGPT\tradeee\gotrade`. Leia `AGENTS.md` e `IMPLEMENTACAO-GOTRADE.md`. Preserve a separação: tenant tem Conexões (integrações), Plataforma (nome/paleta) e Configurações (conta); admin gerencia tenants e abre a plataforma de cada um. Não transformar Conexões em lista de plataformas. Checkout e escolha de layout de login estão fora do escopo atual. A identidade deve continuar persistida por UUID, com isolamento de dados no servidor. Use a implementação existente como base e execute os testes pertinentes. Não faça deploy nem push.

## Verificação desta implementação

- Typecheck e build de produção aprovados.
- 22 testes unitários e 4 testes de navegador aprovados.
- Lint dos arquivos principais alterados aprovado sem análise de tipos; o comando completo com tipos falhou ao iniciar o executável nativo `tsgolint.exe` neste Windows.
- Layout de Plataforma inspecionado em desktop e celular; capturas disponíveis em `outputs/gotrade-admin-platform.png`, `outputs/gotrade-admin-tenants.png` e `outputs/gotrade-tenant-mobile.png`.


## Publicação e Vercel

Destino autorizado: LucasPivovar/gotrade-frontend. Consulte docs/DEPLOY.md para as variáveis obrigatórias e os fallbacks. A publicação atual é uma amostra pública com DEMO_MODE=true, sem credenciais. Desative esse modo ao conectar dados reais. O backup antigo foi desativado e tenants não recebem atividade de outras operações. As APIs principais tratam banco indisponível com 503; páginas de sessão exibem recuperação. As rotas internas do protótipo e a inclusão dos assets no pacote de produção foram verificadas.
