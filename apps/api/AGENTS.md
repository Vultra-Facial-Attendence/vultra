# apps/api

A API NestJS: login do gestor, canal da câmera, banco e cota. Soma-se ao `AGENTS.md` da raiz e não o
contradiz.

## Estado real

Existem o esqueleto e o módulo `access` do [épico #3](../../docs/specs/3-manager-access/manager-session.md):
o ambiente validado, a conexão TypeORM, o log redigido, `GET /health`, a interface do OpenAPI em `/docs`, o
login do gestor por sessão em `/session` e a migration `CreateManagers`. O guard global do
`@nestjs/authentication` nega toda rota sem sessão. Uma rota pública nova leva `@Public()` e entra na lista
de `test/deny-by-default.spec.ts`.

## Stack

Workspace do Bun, ESM (`"type": "module"`), com as versões exatas no `package.json` e as escolhas no
[ADR 0001](../../docs/decisions/0001-stack-do-backend.md). O Bun instala os pacotes e verifica os tipos.
Build, execução e testes ficam com o Node 26. O Vitest 5 compila os decorators com a metadata que o Nest
injeta, sem plugin de SWC.

## Ambiente

As variáveis estão em `.env.example`. O `dotenv` carrega o `apps/api/.env` só nos pontos de entrada
(`src/main.ts`, `src/core/database/data-source.ts` e o bloco `import.meta.main` de
`src/modules/access/commands/manager-create.command.ts`), e uma variável já presente no `process.env`
prevalece. O `ConfigModule` valida o `process.env` com o esquema de `src/core/config/environment.ts`. Uma variável
ausente ou inválida encerra a API com "Config validation error:" e uma linha por variável.

O banco local sobe com `docker compose -f infra/compose.dev.yaml --env-file infra/.env up -d`, a partir
da raiz. O init cria o papel da API sem superusuário, com leitura e escrita nas tabelas que o papel das
migrations criar.

## Comandos

Todos executados dentro de `apps/api`. O `bun run check` roda os gates na ordem: `typecheck`, `format`, `lint`
e `test`. No VS Code, é a tarefa `api: check`. O `build` fica fora dele. O `.github/workflows/api.yml`
roda os dois em todo Pull Request que muda a área.

```
bun install
bun run check
bun run build
bun run dev
bun run migration:run
bun run migration:generate src/core/database/migrations/<Name>
bun run manager:create <email>
```

O `manager:create` roda pelo `nest start --entryFile`, que compila o `dist` antes. O `ts-node` ESM, que
serve às migrations, não resolve os imports ESM do Nest.

O `bun run test` usa o Testcontainers e precisa do Docker no ar. O `tsconfig` não gera `tsbuildinfo`.

## Arquitetura

```
src/main.ts                            ponto de entrada: Fastify, log do pino, setUpApp, listen
src/app.module.ts                      junta o CoreModule e os módulos de área
src/common/                            nasce com a primeira peça usada por mais de um módulo
src/core/core.module.ts                ConfigModule, LoggerModule, TypeOrmModule e TerminusModule
src/core/setup.ts                      OpenAPI em /docs e proteção CSRF, usado pelo main.ts e pelos testes
src/core/config/environment.ts         esquema zod do ambiente e o tipo Environment
src/core/logger/logger.ts              opções do pino-http, com a redação dos cabeçalhos de credencial
src/core/health/health.controller.ts   GET /health, com o ping no banco
src/core/database/data-source.ts       data source do CLI do TypeORM, com o papel das migrations
src/core/database/migrations/          migrations geradas pelo migration:generate
src/modules/access/                    gestor, sessão no PostgreSQL, /session, log do login e manager:create
  controllers/ services/ entities/ dto/ providers/ repositories/ commands/
test/support/database.ts               sobe o PostgreSQL, roda o migration:run e monta a app com o setUpApp
test/core/, test/modules/<área>/       um arquivo por comportamento, cada um com a própria config de log
```

Os aliases `@modules/*`, `@core/*` e `@common/*` estão no `tsconfig.json`. O `nest build` os reescreve para
caminhos relativos no `dist`, e o Vitest os resolve pelo `resolve.tsconfigPaths`. O data source das
migrations importa só de `src/core` e por caminho relativo, porque o `ts-node` não lê os aliases.

O `nestjs-pino` mantém um logger por processo. Um teste que precisa capturar o log ou mudar o destino
dele fica num arquivo próprio, porque o Vitest isola os arquivos em processos separados.
