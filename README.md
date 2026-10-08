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

Acessos: tenant@gmail.com / tenant123 e admin@gmail.com / admin123. O login tem atalhos para preencher cada perfil. O seletor global de demonstração foi removido. A navegação interna preserva o painel, a URL e o histórico do navegador sem tela intermediária de carregamento. O topo mostra Meu perfil; o sidebar não exibe nome/e-mail da conta. Plataforma permite nome e uma cor de marca; os controles selecionados acompanham os tons da marca. A troca Demo/Real usa um botão D/Real ao lado do saldo, com dados simulados. Configurações permite alterar e-mail e senha; a atualização do e-mail é transacional e mantém o vínculo do tenant. Checkout e tokens de pagamento seguem fora desta versão.

A plataforma nasce junto com o tenant. O formulário Plataforma permite domínio, logo, nome e cor, com os campos em grid e a prévia abaixo. O domínio é apenas salvo nesta amostra: não configura DNS, não prova posse e não ativa roteamento por host. A logo enviada abre um modal de corte e uma segunda etapa com remoção opcional de fundo uniforme, ajuste de intensidade e prévia transparente. Ela substitui a marca no cabeçalho e no acesso do protótipo. Uploads são vinculados ao tenant. Controles selecionados usam tons da marca; compra, ganhos e ligar bot mantêm verde, enquanto venda e perdas mantêm vermelho.

O admin concentra a gestão na lista de tenants, com filtros de ativos, suspensos e sem domínio cadastrado. A busca inclui nome, responsável, e-mail e domínio. Cada tenant mostra suas conexões habilitadas e oferece acesso direto à plataforma ou ao responsável. Suspensão pede confirmação e pode ser revertida; convites continuam válidos por 24 horas. O domínio exibido representa somente o cadastro, sem confirmação de DNS.

O admin agora organiza a lista de tenants sem cards clicáveis. A visão individual reúne acompanhamento e histórico de pagamentos. Usuários foi removido do menu. Configurações permite escolher provedores do catálogo, e-mail de suporte e plano sugerido. A amostra adiciona tenants e pagamentos fictícios uma única vez, preservando os dados existentes; a inicialização de produção não recebe esses exemplos.

## Administração e contratação

O menu de três pontos abre o modal do tenant com plataforma, clientes demonstrativos, pagamentos, status e conexões permitidas. Configurações reúne Minha conta, catálogo de conexões e preferências administrativas. O preço administrativo é registrado em cada link público `/contratar/[token]`; alterações posteriores não mudam links existentes. A contratação é uma apresentação: não cobra, não provisiona plataforma nem envia credenciais. Esses passos dependem da futura integração do backend.

Na plataforma do tenant, o valor do checkout e webhook HTTPS são salvos; não há disparo de webhook nesta etapa. A prévia é uma imagem estática. Tickets são isolados por tenant; o admin pode responder e encerrar. Para envio real de respostas, configure `RESEND_API_KEY` e `SUPPORT_EMAIL_FROM` com remetente verificado no Resend. Sem configuração ou com `DEMO_MODE=true`, a resposta é salva com envio pendente. O Telegram é configurado nas preferências administrativas. Nunca use o modo público de demonstração com dados reais.

No modo demonstrativo, o link inclui o valor na URL apenas para renderizar a apresentação mesmo se o armazenamento temporário reiniciar. Esse valor não autoriza cobranças. Fora de `DEMO_MODE`, a rota ignora o parâmetro e busca o preço exclusivamente pelo registro do link no banco.

O botão **Novo tenant** agora abre um formulário direto com nome do responsável, e-mail, telefone e nome da plataforma. O cadastro aparece imediatamente na lista e o telefone fica disponível na visão geral do tenant. Links de contratação anteriores continuam acessíveis, mas não fazem parte desse botão.
