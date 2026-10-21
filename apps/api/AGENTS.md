# apps/api

A API NestJS: login do gestor, canal da câmera, banco e cota. Soma-se ao `AGENTS.md` da raiz e não o
contradiz.

## Estado real

Existe só o esqueleto do [épico #3](../../docs/specs/3-manager-access/manager-session.md): o ambiente
validado, a conexão TypeORM, o log redigido, `GET /health` e a interface do OpenAPI em `/docs`. Nenhum
módulo de área existe ainda, e não há migration. Toda rota está aberta até o guard global da sessão
entrar.

## Stack

Workspace do Bun, ESM (`"type": "module"`), com as versões exatas no `package.json` e as escolhas no
[ADR 0001](../../docs/decisions/0001-stack-do-backend.md). O Bun instala os pacotes e verifica os tipos.
Build, execução e testes ficam com o Node 26. O Vitest 5 compila os decorators com a metadata que o Nest
injeta, sem plugin de SWC.

## Ambiente

As variáveis estão em `.env.example`. O `dotenv` carrega o `apps/api/.env` só nos pontos de entrada
(`src/main.ts` e `src/core/database/data-source.ts`), e uma variável já presente no `process.env`
prevalece. O `ConfigModule` valida o `process.env` com o esquema de `src/core/environment.ts`. Uma variável
ausente ou inválida encerra a API com "Config validation error:" e uma linha por variável.

O banco local sobe com `docker compose -f infra/compose.dev.yaml --env-file infra/.env up -d`, a partir
da raiz. O init cria o papel da API sem superusuário, com leitura e escrita nas tabelas que o papel das
migrations criar.

## Comandos

Todos executados dentro de `apps/api`. O `bun run check` roda os gates na ordem: `typecheck`, `format`, `lint`
e `test`. No VS Code, é a tarefa `api: check`. O `build` fica fora dele.

```
bun install
bun run check
bun run build
bun run dev
bun run migration:run
bun run migration:generate src/core/database/migrations/<Name>
```

O `bun run test` usa o Testcontainers e precisa do Docker no ar. O `tsconfig` não gera `tsbuildinfo`.

## Arquitetura

```
src/main.ts                       ponto de entrada: Fastify, log do pino, OpenAPI em /docs, listen
src/app.module.ts                 junta o CoreModule e, depois, os módulos de área
src/core/core.module.ts           ConfigModule, LoggerModule, TypeOrmModule e TerminusModule
src/core/environment.ts           esquema zod do ambiente e o tipo Environment
src/core/logger.ts                opções do pino-http, com a redação dos cabeçalhos de credencial
src/core/health.controller.ts     GET /health, com o ping no banco
src/core/database/data-source.ts  data source do CLI do TypeORM, com o papel das migrations
test/                             um arquivo por comportamento, cada um com a própria config de log
```

O `nestjs-pino` mantém um logger por processo. Um teste que precisa capturar o log ou mudar o destino
dele fica num arquivo próprio, porque o Vitest isola os arquivos em processos separados.
