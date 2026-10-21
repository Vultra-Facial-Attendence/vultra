# Vultra

Sistema de uma Iniciação Científica. Ele registra presença por reconhecimento facial a partir de uma
ESP32-CAM, processa o quadro apenas em memória e infere a expressão facial no mesmo quadro. O Vultra
não é produto: existe para ser o objeto que o artigo mede e para ser demonstrado ao vivo.

O que o sistema faz está em `docs/requirements/`, um SRS versionado. Por que cada escolha foi feita está
em `docs/decisions/`. Este arquivo diz como se trabalha aqui e não repete nenhum dos dois.

---

## Estado real do repositório

Antes de afirmar que algo existe, confira aqui. O repositório começou do zero em 2026-10-20.

- Há o SRS 1.0.0, o pré-registro do artigo e os ADRs 0001 a 0004.
- O firmware de bancada (`esp32-cam`) e o `apps/worker`, que só baixa os modelos, vieram do repositório
  anterior sem mudança.
- O `apps/api` tem só o esqueleto: ambiente validado, conexão com o banco, log redigido, `GET /health` e
  `/docs`. Nenhum módulo de área existe ainda.
- O `infra/compose.dev.yaml` sobe só o PostgreSQL. O Redis entra no épico C.
- `apps/web` e `proto` ainda não existem.
- Não existe workflow de CI. O ADR 0003 decidiu que ele existirá.
- Nenhuma branch tem proteção configurada. A regra de branch abaixo é uma convenção.

Se um agente encontrar algum desses itens já resolvido, ele confere no repositório antes de acreditar.

---

## Stack

| Área | Tecnologia | Decidida em |
| --- | --- | --- |
| `apps/api` | NestJS 12 sobre Fastify, Node 26, TypeORM com pgvector, gRPC para o worker | [ADR 0001](docs/decisions/0001-stack-do-backend.md) |
| `apps/web` | Next.js 16 com App Router, Node 26, Mantine 9 e CSS Modules | [ADR 0002](docs/decisions/0002-stack-do-frontend.md) |
| `apps/worker` | Python 3.13 com `uv`, InsightFace e ONNX Runtime, servidor `grpc.aio` | [ADR 0001](docs/decisions/0001-stack-do-backend.md) |
| `esp32-cam` | AI-Thinker ESP32-CAM, ESP-IDF 6.1, `esp_websocket_client` | [ADR 0004](docs/decisions/0004-canal-da-camera-por-websocket.md) |
| Banco e Redis | PostgreSQL 18 com pgvector 0.8.7, Redis 8 | [ADR 0003](docs/decisions/0003-repositorio-e-infraestrutura.md) |
| Monorepo | workspaces do Bun, um Dockerfile por app | [ADR 0003](docs/decisions/0003-repositorio-e-infraestrutura.md) |

As versões exatas estão nos ADRs e não se repetem aqui.

---

## Linguagem e scripts

- `apps/api` e `apps/web` usam TypeScript. `apps/worker` e `docs/research` usam Python. `esp32-cam` usa
  C++.
- Um script fica na área que ele serve e é escrito na linguagem dessa área. A raiz não tem linguagem de
  script própria.

---

## Convenções

- O Bun instala os pacotes e verifica os tipos (`bun check`). Quem roda a API, o painel e os testes é o
  Node 26.
- `infra/compose.dev.yaml` só existe para desenvolver. Ele sobe o PostgreSQL e o Redis com as portas em
  `127.0.0.1`, e os apps rodam fora do Docker. A implantação é feita pelo Dockerfile de cada app.
- Os tipos do contrato gRPC são gerados a partir de `proto/`, e os tipos da API que o painel usa são
  gerados a partir do `openapi.json`. Nenhum dos dois é escrito à mão.
- O harness de avaliação do artigo vive em `docs/research/`. Ele importa o pipeline do worker
  diretamente e fica fora da superfície do sistema.

---

## Comandos

Esta seção só lista comandos que já foram executados. Cada área com gates próprios recebe o seu
`AGENTS.md` quando o código dela entrar.

| Área | Gates |
| --- | --- |
| `docs` | `uvx zensical==0.0.71 build` (o site local abre com `uvx zensical==0.0.71 serve --open`) |
| `apps/api` | `bun run check` (tipos, formatação, lint e testes) e `bun run build` ([AGENTS.md](apps/api/AGENTS.md)) |
| `apps/web` | pendente: a pasta não existe |
| `apps/worker` | `uv run ruff check`, `uv run ruff format --check`, `uv run mypy` ([AGENTS.md](apps/worker/AGENTS.md)) |
| `esp32-cam` | `idf.py build`, e `uvx ruff check` e `uvx ruff format --check` no servidor de bancada ([AGENTS.md](esp32-cam/AGENTS.md)) |

---

## Arquitetura

O mapa completo está em `docs/architecture/`. As regras abaixo são as que se conferem no código.

```
apps/api         API HTTP, canal da câmera (WebSocket), banco, cota          E1
apps/worker      inferência: detecção, qualidade, vivacidade, vetor, emoção  E1
esp32-cam        captura e envio do quadro                                   E1
proto            contrato gRPC entre a API e o worker                        E1
infra            compose de desenvolvimento                                  E1
apps/web         login e tela ao vivo da sessão de chamada                   E2
docs/research    pré-registro e harness do artigo
```

`apps/api` tem um módulo Nest por área do SRS: `registry`, `devices`, `biometrics`, `recognition`,
`affective`, `access`, `governance` e `attendance`. Ambiente, banco, Redis e log ficam em `src/core`. Os
arquivos seguem a nomenclatura do Nest CLI (`*.module.ts`, `*.controller.ts`, `*.service.ts`,
`*.entity.ts`). Uma classe de repository só existe quando a consulta não cabe no `Repository` do TypeORM
injetado. Um módulo usa outro apenas pelo que esse outro declara em `exports`.

Regras de fronteira:

- O quadro existe apenas em memória. Nunca é gravado em banco, disco, log, Redis, mensagem de erro nem
  resposta.
- `apps/worker` não acessa banco nem Redis e não conhece `apps/api`. Ele recebe o quadro e a finalidade
  pelo contrato de `proto/` e devolve o resultado.
- Só `apps/worker` carrega modelo e chama o runtime de inferência.
- `apps/web` fala com a API apenas pelo `openapi.json` e não guarda regra de negócio. A leitura acontece
  em Server Component. A escrita vai do navegador para `/api`, sem Server Actions.
- Uma interface só existe numa fronteira externa real. Não se cria interface com uma única
  implementação.

Onde vai um arquivo novo:

| O que é | Onde |
| --- | --- |
| Rota, regra ou consulta de uma área do SRS | o módulo da área em `apps/api/src` |
| Ambiente, conexão de banco ou de Redis, log | `apps/api/src/core` |
| Etapa de inferência ou carga de modelo | `apps/worker` |
| Mensagem ou serviço entre a API e o worker | `proto` |
| Tela | `apps/web/src/app` |
| Código da câmera | `esp32-cam` |
| Serviço de desenvolvimento | `infra/compose.dev.yaml` |
| Decisão que cruza áreas | `docs/decisions/NNNN-slug.md` |

Fluxo de uma captura:

```
ESP32-CAM ──WebSocket sobre TLS──▶ apps/api ──gRPC──▶ apps/worker
                                      │                  │ vetor, vivacidade, emoção
                                      │◀─────────────────┘
                                      ▼
                         PostgreSQL + pgvector (comparação 1:N)
                                      │
                                      ▼
                         apps/web (tela ao vivo, por polling)
```

---

## Branches

- A integração acontece na `staging`. Todo trabalho sai de uma branch `<tipo>/<issue>-<slug>`, cortada
  da `staging`, e volta por Pull Request.
- A `main` só recebe a release, vinda da `staging` por merge commit.
- Ninguém faz push direto na `main` nem na `staging`.

---

## Processo

- O backlog vive no GitHub Project "Vultra" da org `Vultra-Facial-Attendence`.
- O sprint dura uma semana.
- Todo trabalho nasce de uma issue, que é assignada antes do primeiro commit. O projeto tem um
  autor só, Theo, e nenhum outro integrante revisa o trabalho.
- Um requisito novo ou alterado passa pelo controle de mudança de `docs/requirements/`.

---

## Design

As telas são feitas no Claude Design e exportadas para `docs/design/pages/<feature>/`.

---

## Idioma

- Conversa, documentação, issues e textos da interface são em PT-BR.
- Código, nomes de arquivo e de diretório, valores de enum, mensagens de log, commits e branches são em
  inglês.
