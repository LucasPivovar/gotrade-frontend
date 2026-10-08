# Gotrade

Painel de gestão de tenants com autenticação e identidade visual de plataforma. React 19, Next.js 16, TypeScript e SQLite/libSQL (Turso).

## Rodar

```sh
npm ci
npm run setup
npm run dev
```

Abra `http://127.0.0.1:5173/login`. O setup grava as credenciais locais em `.env.local` e preserva configurações existentes. Nunca publique esse arquivo.

## Fluxo

**Tenant:** Conexões (integrações liberadas), Plataforma (nome e paleta) e Configurações (conta/senha).

**Admin:** cadastro e gestão de tenants; acesso à plataforma de cada um; edição de marca, liberação de integrações, convite e suspensão.

A identidade é salva no banco e carregada pelo UUID da operação. As plataformas não compartilham a marca pelo armazenamento global do navegador. Checkout e escolha de template de login estão desativados nesta versão; os dados antigos são preservados.

A plataforma em `prototipo/` usa dados de trading simulados e autenticação demonstrativa. O painel administrativo usa autenticação real. A lista de corretoras indica permissões, sem executar conexões financeiras reais.

## Verificação

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
```

Playwright usa a porta 5174 e banco independente. Capturas em `outputs/`. Consulte [IMPLEMENTACAO-GOTRADE.md](IMPLEMENTACAO-GOTRADE.md) para arquitetura, decisões e continuidade.

## Amostra pública

A configuração da Vercel ativa DEMO_MODE=true: acesso livre, sem senha ou Turso. Os dados são demonstrativos e temporários. Para um ambiente real, desative DEMO_MODE e siga docs/DEPLOY.md.

## Simplificação da amostra

Acessos: tenant@gmail.com / tenant123 e admin@gmail.com / admin123. O login tem atalhos para preencher cada perfil. O seletor global de demonstração foi removido. A navegação interna preserva o painel, a URL e o histórico do navegador sem tela intermediária de carregamento. O topo não mostra Meu perfil; o sidebar não exibe nome/e-mail da conta. Plataforma permite nome e uma cor de marca; os controles selecionados acompanham os tons da marca. A troca Demo/Real usa um botão D/Real ao lado do saldo, com dados simulados. Configurações permite alterar e-mail e senha; a atualização do e-mail é transacional e mantém o vínculo do tenant. Checkout e tokens de pagamento seguem fora desta versão.

A plataforma nasce junto com o tenant. O formulário Plataforma permite domínio, logo, nome e cor, com os campos em grid e a prévia abaixo. O domínio é apenas salvo nesta amostra: não configura DNS, não prova posse e não ativa roteamento por host. A logo enviada abre um modal de corte e uma segunda etapa com remoção opcional de fundo uniforme, ajuste de intensidade e prévia transparente. Ela substitui a marca no cabeçalho e no acesso do protótipo. Uploads são vinculados ao tenant. Controles selecionados usam tons da marca; compra, ganhos e ligar bot mantêm verde, enquanto venda e perdas mantêm vermelho.

O admin concentra a gestão na lista de tenants, com filtros de ativos, inativos e sem domínio, e busca por nome, responsável, e-mail e domínio. O menu de três pontos abre um modal com plataforma, clientes demonstrativos, responsável, status e conexões permitidas. Suporte e financeiro foram removidos do admin. Configurações contém somente Minha conta, para alterar e-mail e senha.

O botão **Novo tenant** abre um formulário com nome do responsável, e-mail e nome da plataforma. O cadastro aparece imediatamente na lista. Links de contratação anteriores continuam acessíveis, mas não fazem parte desse botão. O provisionamento de credenciais e os pagamentos reais dependem da futura integração de backend.

O tenant possui Plataforma, Conexões, Financeiro e Configurações. Financeiro mostra somente os pagamentos do próprio tenant à GoTrade, com totais por situação, histórico e filtro. O tenant não pode modificar esses registros. No modo de demonstração, há pagamentos fictícios; fora dele, a tela usa os registros existentes e mostra um estado vazio quando não houver pagamentos. Suporte foi removido dos dois painéis; a rota antiga redireciona para o início.

As configurações globais e os endpoints de contratação/suporte anteriores permanecem no backend para compatibilidade, sem telas no painel. No modo demonstrativo, o valor do link de contratação na URL serve apenas à apresentação e não autoriza cobranças. Fora de DEMO_MODE, o preço é lido exclusivamente do registro no banco.
