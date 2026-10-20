# 0001. Stack do backend: NestJS no Node, com Bun como gerenciador de pacotes

- Status: accepted
- Date: 2026-10-20

## Contexto

O Vultra registra presença por reconhecimento facial a partir de uma ESP32-CAM. O quadro só existe em
memória e a expressão facial é inferida a partir dele mesmo. Este repositório recomeça o sistema do zero.
O firmware da câmera e o worker de inferência em Python vêm do repositório anterior sem mudança. O backend
e o painel trocam de stack.

O backend anterior era todo em Python, para o projeto ter uma linguagem só. O custo foi maior que o
ganho: o time escreve uma API completa com mais fluência em TypeScript. Rust foi considerado e descartado
pelo prazo. A prioridade é a velocidade: são duas pessoas, com entrega em dezembro.

O NestJS 12 já traz no framework, ou em pacotes mantidos pelo próprio time, quase tudo de que o serviço
precisa: validação por Standard Schema, cookies, CSRF e cabeçalhos de segurança no núcleo desde a 12.1,
autenticação e autorização em pacotes próprios, gRPC, WebSocket, filas, cota, saúde e OpenAPI.
O `@nestjs/platform-node` foi anunciado, mas não está publicado no npm. Por isso a escolha ficou entre
Express e Fastify.

O Bun foi avaliado como runtime numa prova com a stack inteira: banco com RLS, sessão, cota, CSRF,
gRPC com o worker, upload, WebSocket da câmera e log. Passou em tudo, mas com dois contornos para
falhas silenciosas:

- Com o `nestjs-cls` importado no carregamento do arquivo de teste, o `bun test` deixa os testes com
  I/O travados até o timeout (oven-sh/bun#44552). O sintoma parece defeito do código da aplicação.
- No Bun, uma mensagem de texto do WebSocket chega ao `WsAdapter` como `Buffer`. No Node ela chega como
  string. Um parser que decide pelo tipo trataria o comando JSON como quadro.

A mesma suíte rodou no Node 26.8.1 com Vitest e passou nos 10 testes, sem nenhum dos dois contornos.

## Decisão

**O serviço é NestJS 12 sobre Fastify, no Node 26.** O Bun é o gerenciador de pacotes e o verificador
de tipos. O build e os testes são do ecossistema do Node.

| Papel | Escolha |
| --- | --- |
| Runtime | Node 26 (LTS a partir de 2026-10-28) |
| Gerenciador de pacotes | Bun 1.4.3 (`bun install`, `bun.lock`) |
| Verificação de tipos | `bun check` |
| Build | `@nestjs/cli` 12.0.9 com `typescript` 6.0.3 |
| Testes | Vitest 5.0.5, com Testcontainers para PostgreSQL e Redis |
| Lint e formatação | `oxlint` 1.89.0 com `oxlint-tsgolint` 7.0.2004, `prettier` 3.9.10 |

Bibliotecas do serviço, todas com versão exata:

| Necessidade | Pacote e versão |
| --- | --- |
| Núcleo | `@nestjs/common` 12.2.0, `@nestjs/core` 12.2.0, `reflect-metadata` 0.2.2, `rxjs` 7.8.2 |
| HTTP | `@nestjs/platform-fastify` 12.2.0 |
| Upload de arquivo | `@fastify/multipart` 10.1.4 |
| Validação e esquemas | `zod` 4.6.7, pelo `StandardSchemaValidationPipe` do Nest |
| Configuração | `@nestjs/config` 12.0.1, com o ambiente validado por esquema `zod` |
| Autenticação | `@nestjs/authentication` 0.1.1: sessão por cookie para o gestor, chave de API para câmeras |
| Autorização | `@nestjs/authorization` 0.1.0: política por rota, nega por padrão |
| Banco | `@nestjs/typeorm` 12.0.2, `typeorm` 1.1.2, `pg` 8.23.1, coluna `vector` nativa |
| Redis | `ioredis` 6.0.0 |
| Cota | `@nestjs/throttler` 6.7.1, com armazenamento próprio no Redis |
| Canal da câmera | `@nestjs/websockets` 12.2.0, `@nestjs/platform-ws` 12.2.0, `ws` 8.22.0 |
| Worker de inferência | `@nestjs/microservices` 12.2.0, `@grpc/grpc-js` 1.14.6, `@grpc/proto-loader` 0.8.1 |
| Contrato gRPC | `.proto` versionado, tipos gerados por `ts-proto` 2.18.0 via `@bufbuild/buf` 1.74.0 |
| Log | `nestjs-pino` 5.3.1, `pino` 10.4.0, `pino-http` 11.0.0 |
| Saúde | `@nestjs/terminus` 12.1.0 |
| OpenAPI | `@nestjs/swagger` 12.0.2, com `@fastify/static` 10.1.6 para a interface |
| Testes | `@nestjs/testing` 12.2.0, `@testcontainers/postgresql` 12.2.1, `@testcontainers/redis` 12.2.1 |
| Tipos | `@types/node` 26.6.5, `@types/pg` 8.23.1, `@types/ws` 8.18.2 |

O worker Python ganha um servidor `grpc.aio` com `grpcio` 1.84.0 e `grpcio-tools` 1.84.0, gerado a
partir do mesmo `.proto`.

A forma de usar cada peça segue o que a prova verificou:

- Banco: o serviço conecta com um papel sem superusuário. Uma escrita que grava mais de uma tabela
  roda em `DataSource.transaction` do TypeORM. As migrations rodam com um papel privilegiado, que cria a
  extensão `vector`, a partir do `dist` pelo CLI do TypeORM.
- Cota: o cliente do Redis da cota usa `enableOfflineQueue: false` e `maxRetriesPerRequest: 0`.
  Uma falha no Redis responde `503`. Uma cota estourada responde `429`.
- Câmera: a chave da câmera é conferida no handshake e de novo em cada mensagem. O parser do
  `WsAdapter` decide pelo conteúdo: começa em `FF D8`, é quadro JPEG; caso contrário, é JSON.
- Inferência: cada chamada ao worker leva um prazo (`deadline`). A chamada vencida falha no serviço,
  e o worker não fica esperando resposta.

## Consequências

- Volta o passo de build. O serviço roda o `dist`, não o código-fonte.
- O `typescript` fica em 6.0.3, mesmo com a 7.0.2 publicada. O TypeScript 7 não traz mais a API de
  compilação em JavaScript, da qual o `nest build` depende. A troca acontece quando o `@nestjs/cli`
  suportar a 7. Na verificação de tipos o `bun check` cumpre o papel do `tsc` e não depende do pacote
  `typescript`.
- Autenticação e autorização dependem de pacotes 0.x. Um ajuste no meio de uma versão 0.x pode quebrar
  a API. As versões ficam fixadas e a atualização é deliberada, com a suíte rodando.
- Quando a chave da câmera é revogada com a conexão aberta, o Nest responde `401` na mensagem seguinte,
  mas não fecha a conexão. Nos dois runtimes o gateway da câmera precisa fechar com o código `1008`.
- Nenhum requisito depende do Bun como runtime. O gargalo de desempenho é a inferência no worker.
- Quando o `@nestjs/platform-node` for publicado em versão estável, a troca do Fastify por ele é uma
  decisão nova.

## Alternativas consideradas

- Python com FastAPI, como no backend anterior: descartado pela fluência do time. O custo de
  escrever a API em Python pesou mais que manter uma linguagem só.
- Rust: descartado pelo prazo.
- Bun como runtime e como runner de testes: passou na prova com dois contornos para falhas
  silenciosas, numa superfície pequena. O Nest e as bibliotecas desta lista são testados no Node.
  No Bun, cada atualização de runtime vira uma rodada de verificação nossa, e uma falha pode aparecer
  disfarçada de defeito da aplicação.
- Express como plataforma HTTP: o Fastify entrega upload e arquivos estáticos por plugins oficiais
  e passou em toda a prova. O `@nestjs/platform-node` ainda não existe.
- Passport para autenticação: o Nest 12 ensina autenticação com `@nestjs/authentication`, que já
  traz sessão, hash de senha e chave de API.
- `@nestjs/cqrs`: os fluxos do sistema são diretos.
- BullMQ: nenhum requisito tem trabalho assíncrono. O cadastro, o reconhecimento e o disparo de captura
  são síncronos ou passam pelo canal da câmera.
- `nestjs-cls` com `@nestjs-cls/transactional`: servia para fixar a instituição do RLS em cada
  transação. O sistema atende uma instalação só, e a transação do próprio TypeORM basta.
- Jest: o Vitest roda TypeScript ESM sem configuração extra e já injeta dependências pelos tipos
  dos construtores.
- pnpm e npm como gerenciador: o pnpm ficou fora por escolha do time. O npm é a saída se o Bun falhar
  como gerenciador.
- `@nestjs/mau`: fora do escopo do projeto.
