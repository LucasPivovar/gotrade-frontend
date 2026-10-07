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
