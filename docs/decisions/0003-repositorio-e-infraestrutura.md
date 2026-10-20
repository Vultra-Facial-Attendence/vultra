# 0003. Repositório e infraestrutura

- Status: accepted
- Date: 2026-10-20

## Contexto

O sistema tem quatro partes: a API em NestJS ([0001](0001-stack-do-backend.md)), o painel em Next.js
([0002](0002-stack-do-frontend.md)), o worker de inferência em Python e o firmware da ESP32-CAM. A
API fala com o worker por gRPC e com o painel por OpenAPI, então os contratos cruzam as pastas.

O sistema precisa rodar a partir dos mesmos artefatos de build numa máquina local, na rede da câmera,
onde o artigo mede a latência, e num servidor na nuvem, onde o sistema é demonstrado. A câmera só fala
com a API sobre TLS.

A produção é uma VPS própria com Coolify, atrás da Cloudflare. O Coolify não lida bem com compose, e
nada vai para a VPS antes de o sistema estar completo. O repositório anterior não tinha CI, e um gate
que só roda na máquina de quem desenvolve não prova nada para o outro integrante.

## Decisão

**Um monorepo com workspaces do Bun, um Dockerfile por app, e TLS fora da aplicação na produção.**

| Pasta | Conteúdo |
| --- | --- |
| `apps/api` | API NestJS |
| `apps/web` | painel Next.js |
| `apps/worker` | worker de inferência em Python, com `uv` |
| `esp32-cam` | firmware, com ESP-IDF 6.1 |
| `proto` | contrato gRPC entre a API e o worker |
| `infra` | compose de desenvolvimento |
| `docs` | documentação, publicada com Zensical |

Os comandos rodam por área com `bun run --filter`. O monorepo não usa Turborepo nem Nx.

| Peça | Escolha |
| --- | --- |
| Banco | PostgreSQL 18 com pgvector 0.8.7, imagem `pgvector/pgvector:0.8.7-pg18-trixie` |
| Redis | Redis 8.10.2, imagem `redis:8.10.2-trixie`, com `maxmemory-policy noeviction` |
| Imagem da API | `node:26-trixie-slim`, rodando o `dist` do `nest build` |
| Imagem do painel | `node:26-trixie-slim`, rodando a saída `standalone` do Next |
| Imagem do worker | `python:3.13-slim-trixie` com `uv`, recebendo conexão só da rede interna |
| Desenvolvimento | `infra/compose.dev.yaml` com PostgreSQL e Redis, portas publicadas em `127.0.0.1`. Os apps rodam fora do Docker |
| Testes de integração | Testcontainers, sem depender do compose de desenvolvimento |
| CI | GitHub Actions por área, com filtro de caminho, rodando os gates em cada PR |
| Atualização de dependências | manual, com `bun outdated` e `uv`, quando o time decide |
| Observabilidade | log do pino. A latência do artigo é medida pelo harness de pesquisa |

TLS por ambiente:

- Produção: Cloudflare na frente e o proxy do Coolify terminam o TLS. A API e o painel servem HTTP na
  rede interna. A câmera conecta por `wss://` no domínio público da API.
- Local: a API serve HTTPS com um certificado emitido pela CA própria do projeto, que o firmware fixa.
  O caminho do certificado e da chave entra pelo ambiente local e fica ausente na produção.

Na produção, o PostgreSQL e o Redis são recursos de banco do Coolify, com as mesmas imagens. As
migrations rodam no comando de pré-implantação do container da API, com o papel privilegiado do banco.
Os serviços se encontram pelo nome interno do Coolify. Só o painel e a API têm domínio público.

## Consequências

- O compose deixa de descrever a implantação. Cada app é implantado pelo próprio Dockerfile, e as três
  imagens são os artefatos que rodam nos dois ambientes.
- Atrás da Cloudflare, o certificado é o da Cloudflare e muda periodicamente. O firmware da produção
  valida pelo pacote de CAs raiz do ESP-IDF (`esp_crt_bundle`). O firmware local continua fixando a CA
  do projeto. A troca acontece quando o sistema for para a VPS.
- A Cloudflare encerra uma conexão WebSocket depois de cerca de 100 s sem tráfego, nos planos abaixo do
  Enterprise. O firmware da produção envia uma mensagem de aplicação em intervalo menor que esse.
- O pin do Redis na linha 7, do repositório anterior, deixa de existir. Ele vinha da biblioteca Python
  `limits`, que não faz parte desta stack.
- Sem atualização automática, uma versão nova só entra quando o time roda `bun outdated` e decide.
- O CI roda em cada PR. Um repositório público não paga minutos do GitHub Actions.

## Alternativas consideradas

- Compose único para os dois ambientes, como no repositório anterior: o Coolify não lida bem com
  compose.
- Caddy como proxy TLS no compose: na produção o Coolify e a Cloudflare já fazem o papel, e no
  ambiente local a própria API serve HTTPS.
- TLS pelo Next: o `next start` não serve HTTPS, e a câmera fala com a API, não com o painel.
- Repositórios separados por app: os contratos gRPC e OpenAPI teriam que ser publicados e
  versionados entre eles.
- Turborepo ou Nx: os workspaces do Bun bastam para quatro áreas.
- Dependabot: o time prefere atualizar à mão.
- PostgreSQL 16: o repositório anterior usava 16 sem motivo técnico. O 18 traz `uuidv7()` nativo.
- Valkey: o Redis 8 atende ao que a stack usa.
- OpenTelemetry e Prometheus: nenhum requisito pede métrica em produção.
