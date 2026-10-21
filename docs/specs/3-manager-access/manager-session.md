# A-01 — Autenticar o gestor na API

> **Status:** published
> **Perfil:** API
> **Módulo:** `apps/api/src/access` e `apps/api/src/core`
> **Épico:** [#3](https://github.com/Vultra-Facial-Attendence/vultra/issues/3)
> **Requisitos:** FR-ACC-01, NFR-SEC-03, NFR-SEC-04, NFR-SEC-05
> **Sprint:** 1

O épico cria o `apps/api`. O gestor entra com e-mail e senha e recebe um cookie de sessão. Toda rota que
não é declarada pública nega a requisição sem sessão. A API não sobe com o ambiente incompleto e não
escreve segredo no log.

Os termos vêm do SRS:

- **Gestor** é o usuário que administra pessoas, câmeras, cadastros biométricos e sessões de chamada
  ([glossário](../../requirements/glossary.md)). Ele é o único que autentica
  ([FR-ACC-01](../../requirements/functional/access.md#fr-acc-01)).
- **Rota de dado** é qualquer rota da API que não seja a verificação de saúde
  ([NFR-SEC-03](../../requirements/non-functional/security.md#nfr-sec-03)).
- **Segredo** é a senha, o token de sessão, a credencial de banco e, nos épicos seguintes, a chave da
  câmera e o vetor ([NFR-SEC-04](../../requirements/non-functional/security.md#nfr-sec-04)).

## Decisões confirmadas

Confirmadas por Theo em 2026-10-21.

1. O gestor é criado pelo comando `manager:create`. Nenhuma rota cria gestor, troca senha ou recupera
   senha.
2. O login é por e-mail e senha, e a sessão vai num cookie guardado no PostgreSQL. As rotas são
   `POST /session`, `GET /session` e `DELETE /session`, e `GET /health` é pública. Nenhuma rota tem
   prefixo de versão.
3. O épico não usa o `@nestjs/authorization`. Há um papel só, e o guard global do
   `@nestjs/authentication` nega por padrão.
4. O login é limitado por IP com o `@nestjs/throttler` guardando o contador em memória.
5. O `infra/compose.dev.yaml` sobe só o PostgreSQL. O Redis entra no épico C
   ([#5](https://github.com/Vultra-Facial-Attendence/vultra/issues/5)).
6. O CI do `apps/api` e a varredura de segredos com `gitleaks` entram neste épico.
7. São três tarefas, cada uma num estágio.
8. O login não vai para a trilha de auditoria. O
   [FR-GOV-01](../../requirements/functional/governance.md#fr-gov-01) cobre operação biométrica.
9. A interface do OpenAPI em `/docs` é pública.
10. O `.env` é carregado pelo `dotenv`, importado só nos pontos de entrada.
11. Os valores das regras abaixo (vida da sessão, limite de login, tamanhos e mensagens) foram
    confirmados na mesma data.

## Critérios de aceite

### Contrato

| Método | Rota | Autenticação | Idempotente |
| --- | --- | --- | --- |
| `POST` | `/session` | pública, limitada por IP | Não |
| `GET` | `/session` | sessão do gestor | Sim |
| `DELETE` | `/session` | sessão do gestor | Não |
| `GET` | `/health` | pública | Sim |
| `GET` | `/docs`, `/docs/json` | pública | Sim |

### Requisição

`POST /session`

| Campo | Tipo | Obrigatório | Validação |
| --- | --- | --- | --- |
| `email` | `string` | Sim | E-mail válido pelo `z.email()` do zod, com no máximo 254 caracteres. Os espaços das pontas são removidos e as letras viram minúsculas antes da busca |
| `password` | `string` | Sim | De 1 a 128 caracteres. A regra de tamanho mínimo vale só na criação do gestor (regra 2) |

```json
{ "email": "gestor@example.com", "password": "uma senha longa o bastante" }
```

As rotas `GET /session`, `DELETE /session` e `GET /health` não têm corpo.

### Resposta

**`POST /session` → `200 OK`**, com o cabeçalho
`Set-Cookie: __Host-sid=<token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200`

```json
{ "id": "0199f2a4-6c1e-7d3a-9b5e-2f8c4a1d7e60", "email": "gestor@example.com" }
```

**`GET /session` → `200 OK`**, com o mesmo corpo.

**`DELETE /session` → `204 No Content`**, com o cabeçalho que apaga o cookie `__Host-sid`.

**`GET /health` → `200 OK`**

```json
{ "status": "ok", "info": { "database": { "status": "up" } }, "error": {}, "details": { "database": { "status": "up" } } }
```

| Campo da resposta | Tipo | Origem |
| --- | --- | --- |
| `id` | `string` (UUID v7) | `managers.id` |
| `email` | `string` | `managers.email` |

| Status | Quando |
| --- | --- |
| `200` | Login aceito, sessão lida, ou saúde com o banco no ar |
| `204` | Sessão encerrada |
| `400` | Corpo do login fora do esquema |
| `401` | Credencial recusada, ou rota de dado sem sessão válida |
| `403` | Requisição que altera estado vinda de outra origem |
| `429` | Sexta tentativa de login do mesmo IP dentro de 900 s |
| `503` | Saúde com o banco fora do ar |

### Papéis e privilégios

| Papel | Permissão | Nota |
| --- | --- | --- |
| Anônimo | nenhuma | Chega só a `POST /session`, `GET /health` e `/docs` |
| Gestor | sessão válida | Chega a toda rota de dado. Não existe permissão nomeada, porque há um papel só |

---

## Regras de negócio

### 1. Autorização que nega por padrão

- O `AuthenticationModule` registra o guard global. Toda rota exige sessão, a não ser as marcadas com
  `@Public()`: `POST /session` e `GET /health`. O `/docs` é registrado pelo `@nestjs/swagger` fora dos
  controllers e não carrega dado.
- **Verificação:** antes do handler, em cada requisição. Sem cookie, com cookie desconhecido, expirado
  ou de gestor apagado, a API responde `401` com o código `missing_credentials`.
- Um teste percorre todas as rotas registradas no Fastify e confirma o `401` sem cookie em toda rota
  fora da lista pública. Uma rota nova entra na lista pública só se o teste for alterado junto.

### 2. Criação do gestor

- **Quando:** Theo roda `bun run --filter api manager:create <email>`, com o banco migrado.
- **O que acontece:** o comando anuncia cada passo, pede a senha duas vezes sem eco pelo
  `@inquirer/password`, grava o e-mail em minúsculas e o hash scrypt do `PasswordHasher` e termina com
  o resumo.
- A senha tem de 15 a 128 caracteres, o mínimo para fator único do NIST SP 800-63B-4.
- Mensagens do comando, exatas:

  | Momento | Mensagem | Saída |
  | --- | --- | --- |
  | Início | "Validando o e-mail…" | — |
  | Prompt | "Senha do gestor:" e depois "Repita a senha:" | — |
  | Conexão | "Conectando ao banco…" | — |
  | Gravação | "Criando o gestor…" | — |
  | Sucesso | "Gestor <id> criado para <email>." | `0` |
  | E-mail inválido | "E-mail inválido: <email>." | `1` |
  | Tamanho da senha | "A senha precisa ter de 15 a 128 caracteres." | `1` |
  | Senhas diferentes | "As senhas não conferem." | `1` |
  | E-mail repetido | "Já existe um gestor com o e-mail <email>." | `1` |
  | Banco fora do ar | "Não foi possível conectar ao banco: <mensagem do driver>." | `1` |

- A senha nunca é argumento do comando, porque argumento fica no histórico do shell e na lista de
  processos.

### 3. Login sem revelar se o gestor existe

- **Quando:** `POST /session` com o corpo válido.
- **O que acontece:** a API busca o gestor pelo e-mail normalizado e chama
  `PasswordHasher.verify(password, hash)`. Para e-mail desconhecido, passa `undefined`, e o pacote
  confere um hash falso no mesmo tempo. Se a senha confere, `SignInService.signIn(managerId)` apaga a
  sessão anterior do navegador, cria a nova e escreve o cookie. Quando `needsRehash(hash)` é verdadeiro,
  a API grava o hash novo antes de responder.
- E-mail desconhecido e senha errada respondem igual: `401`, código `invalid_credentials`, mensagem
  "Invalid e-mail or password".

### 4. Limite de tentativas de login

- **Quando:** cada `POST /session`, com qualquer desfecho.
- **O que acontece:** o `ThrottlerGuard` conta as requisições por IP numa janela de 900 s. A sexta
  requisição recebe `429`, com o cabeçalho `Retry-After` e a mensagem "ThrottlerException: Too Many
  Requests". O contador fica na memória do processo e zera quando a API reinicia.
- O limite vale só para `POST /session`.

### 5. Vida da sessão

- O token é opaco, de 256 bits. O banco guarda só o SHA-256 dele.
- A sessão dura no máximo 12 horas desde a criação e expira depois de 2 horas sem requisição. A última
  atividade é gravada no máximo uma vez por minuto.
- `DELETE /session` apaga a sessão e o cookie. A mesma requisição repetida depois recebe `401`
  `missing_credentials`.
- Um cookie enviado por requisição que altera estado vinda de outra origem é ignorado pelo pacote. O
  `app.enableCsrfProtection()` do Nest recusa essa requisição com `403`.

### 6. Ambiente obrigatório

- **Quando:** a API, as migrations e o `manager:create` iniciam.
- **O que acontece:** o `ConfigModule` valida o `process.env` com um esquema zod. Toda variável é
  obrigatória e nenhuma tem valor padrão. A primeira variável ausente encerra o processo com código
  diferente de zero, e a mensagem começa por "Config validation error:" e traz uma linha por variável
  inválida. Para uma variável ausente, a linha é "<VARIÁVEL>: Invalid input: expected string, received
  undefined".
- O worker já atende ao NFR-SEC-05: o `download-models` lê `os.environ["PIPELINE_MODEL_DIR"]`, que
  encerra com `KeyError` nomeando a variável. O painel entra no E2.
- As variáveis de `apps/api`:

  | Variável | Formato |
  | --- | --- |
  | `API_HOST` | endereço em que a API escuta, como `127.0.0.1` |
  | `API_PORT` | inteiro de 1 a 65535 |
  | `DATABASE_URL` | URL `postgres://` com o papel da API, sem superusuário |
  | `MIGRATIONS_DATABASE_URL` | URL `postgres://` com o papel das migrations |

- O `dotenv` 18.0.8 carrega o `apps/api/.env`. A primeira linha de cada ponto de entrada (`main.ts`, o
  data source das migrations e o `manager:create`) é `import 'dotenv/config'`. Uma variável que já
  está no `process.env` prevalece, e sem `.env`, como na produção, nada é carregado. O `ConfigModule`
  lê só o `process.env` (`ignoreEnvFile: true`). Os testes não importam nenhum ponto de entrada, então
  o `.env` de desenvolvimento não chega a eles.
- As variáveis do `infra/compose.dev.yaml` entram como `${NOME:?}`: `POSTGRES_USER`,
  `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_HOST_PORT`, `API_DB_USER` e `API_DB_PASSWORD`. Um
  script de init do PostgreSQL cria o papel `API_DB_USER` sem superusuário. O papel `POSTGRES_USER` é o
  das migrations.

### 7. Segredo fora do log e do repositório

- O `nestjs-pino` redige `req.headers.cookie`, `req.headers.authorization` e
  `res.headers["set-cookie"]` como `[Redacted]`. O `pino-http` não registra corpo de requisição, então a
  senha nunca chega ao log.
- O log registra o login e o logout com `managerId`, a partir de `AuthenticationEvents.events$`. As
  mensagens são "manager signed in" e "manager signed out". O e-mail não entra no log.
- O `.gitignore` já ignora `.env` e `.env.*`, a não ser `.env.example`. O CI roda o `gitleaks` em todo
  Pull Request, sobre o histórico inteiro.

### 8. Persistência e auditoria

- **Tabelas alteradas:** `managers`, pela criação do gestor e pelo rehash. `manager_sessions`, pelo
  login, pela atividade, pelo logout e pela limpeza das sessões vencidas.
- **Auditoria:** N/A. A trilha do FR-GOV-01 registra operação biométrica, e este épico não tem
  nenhuma.
- **Eventos e integrações:** os eventos `sign-in` e `sign-out` do `AuthenticationEvents` viram as linhas
  de log da regra 7. Nenhuma integração externa.

---

## Erros

O corpo segue o `HttpException` do Nest: `{ "statusCode", "message", "error", "errorCode" }`. O painel
decide o texto que mostra a partir do `errorCode`. A mensagem da API é em inglês, como o log.

| Código | HTTP | Quando | Mensagem |
| --- | --- | --- | --- |
| — | `400` | Corpo do login fora do esquema. O `StandardSchemaValidationPipe` responde sem `errorCode`, com uma linha por campo | "email: Invalid email address", "password: Too big: expected string to have <=128 characters", ou "<campo>: Invalid input: expected string, received undefined" para campo ausente |
| `invalid_credentials` | `401` | E-mail desconhecido ou senha errada | "Invalid e-mail or password" |
| `missing_credentials` | `401` | Rota de dado sem sessão válida | "Unauthorized" |
| — | `403` | Requisição que altera estado vinda de outra origem, com `Sec-Fetch-Site` | "Cross-origin request detected from Sec-Fetch-Site header" |
| — | `403` | O mesmo, sem `Sec-Fetch-Site` e com `Origin` diferente de `Host` | "Cross-origin request detected, and/or browser is out of date: Sec-Fetch-Site is missing, and Origin does not match Host" |
| — | `429` | Sexta tentativa de login do IP em 900 s | "ThrottlerException: Too Many Requests" |
| — | `503` | `GET /health` com o banco fora do ar | Corpo do `@nestjs/terminus`, com `"status": "error"` |

## Efeitos colaterais

- **Persistência:** o login grava uma linha em `manager_sessions` e, quando há rehash, atualiza
  `managers.password_hash`. O logout apaga a linha. Cada login apaga as sessões cujo `expires_at` já
  passou.
- **Concorrência:** a gravação da atividade é um `UPDATE` condicional que só avança `last_active_at`
  numa sessão que ainda existe. Um logout simultâneo não é desfeito. Dois `manager:create` com o mesmo
  e-mail esbarram no índice único, e o segundo recebe a mensagem de e-mail repetido.
- **Transação:** cada operação escreve uma tabela só, então não há transação entre tabelas. O
  `manager:create` grava uma linha.

---

## Cenários de aceite (Gherkin)

### Cenário 1 — Login aceito (caminho feliz)

```gherkin
Dado um gestor criado com o e-mail "gestor@example.com" e uma senha válida
Quando ele envia `POST /session` com esse e-mail e essa senha
Então a API responde `200` com o `id` e o `email` do gestor
E o cabeçalho `Set-Cookie` traz `__Host-sid` com `HttpOnly`, `Secure` e `SameSite=Lax`
E `manager_sessions` ganha uma linha cujo `id` é o SHA-256 do token
E o log tem uma linha "manager signed in" com o `managerId`
```

### Cenário 2 — Rota de dado com sessão

```gherkin
Dado um gestor com sessão aberta
Quando ele envia `GET /session` com o cookie
Então a API responde `200` com o `id` e o `email` do gestor
```

### Cenário 3 — Senha errada e e-mail desconhecido respondem igual (exceção)

```gherkin
Dado um gestor criado com o e-mail "gestor@example.com"
Quando se envia `POST /session` com esse e-mail e uma senha errada
E se envia `POST /session` com o e-mail "ninguem@example.com"
Então as duas respostas são `401` com o código `invalid_credentials` e a mensagem "Invalid e-mail or password"
E nenhuma resposta traz `Set-Cookie`
```

### Cenário 4 — Toda rota de dado nega sem sessão (exceção)

```gherkin
Dado a API iniciada com todas as rotas registradas
Quando se envia uma requisição sem cookie a cada rota fora de `POST /session`, `GET /health` e `/docs`
Então todas respondem `401` com o código `missing_credentials`
```

### Cenário 5 — Logout encerra a sessão

```gherkin
Dado um gestor com sessão aberta
Quando ele envia `DELETE /session` com o cookie
Então a API responde `204` e apaga o cookie `__Host-sid`
E a linha da sessão some de `manager_sessions`
E um `GET /session` com o mesmo cookie responde `401` com o código `missing_credentials`
```

### Cenário 6 — Sessão expirada por inatividade (exceção)

```gherkin
Dado um gestor cuja última requisição aconteceu há mais de 2 horas
Quando ele envia `GET /session` com o cookie
Então a API responde `401` com o código `missing_credentials`
```

### Cenário 7 — Corpo de login inválido (exceção)

```gherkin
Quando se envia `POST /session` com o e-mail "não é e-mail"
Então a API responde `400` com a mensagem "email: Invalid email address"
E nenhuma sessão é criada
```

### Cenário 8 — Excesso de tentativas de login (exceção)

```gherkin
Dado um IP que enviou 5 vezes `POST /session` nos últimos 900 s
Quando ele envia o sexto `POST /session`, mesmo com a senha certa
Então a API responde `429` com o cabeçalho `Retry-After`
E nenhuma sessão é criada
```

### Cenário 9 — Login vindo de outra origem (exceção)

```gherkin
Dado um gestor criado com uma senha válida
Quando um navegador envia `POST /session` com `Sec-Fetch-Site: cross-site`
Então a API responde `403` com a mensagem "Cross-origin request detected from Sec-Fetch-Site header"
E nenhuma sessão é criada
```

### Cenário 10 — Ambiente incompleto impede a inicialização (exceção)

```gherkin
Dado o ambiente de `apps/api` sem a variável `DATABASE_URL`
Quando a API inicia
Então o processo encerra com código diferente de zero
E a mensagem de erro começa por "Config validation error:" e traz a linha "DATABASE_URL: Invalid input: expected string, received undefined"
```

### Cenário 11 — Segredo fora do log (exceção)

```gherkin
Dado o log capturado de um login, de um `GET /session` e de um logout
Quando se procura nele a senha usada, o token do cookie e o valor de `DATABASE_URL`
Então nenhum dos três aparece
E os cabeçalhos `cookie` e `set-cookie` aparecem como "[Redacted]"
```

### Cenário 12 — Saúde pública

```gherkin
Dado a API no ar com o banco no ar
Quando se envia `GET /health` sem cookie
Então a API responde `200` com `"status": "ok"`
E com o banco fora do ar a mesma requisição responde `503` com `"status": "error"`
```

### Cenário 13 — Criação do gestor pelo comando

```gherkin
Dado o banco migrado e nenhum gestor com o e-mail "gestor@example.com"
Quando Theo roda `manager:create gestor@example.com` e digita duas vezes uma senha de 15 caracteres
Então o comando encerra com `0` e imprime "Gestor <id> criado para gestor@example.com."
E `managers` ganha uma linha com o e-mail em minúsculas e um hash que começa por "$scrypt$"
```

### Cenário 14 — Criação recusada pelo comando (exceção)

```gherkin
Dado um gestor com o e-mail "gestor@example.com"
Quando Theo roda `manager:create gestor@example.com`
Então o comando encerra com `1` e imprime "Já existe um gestor com o e-mail gestor@example.com."
E com uma senha de 14 caracteres o comando encerra com `1` e imprime "A senha precisa ter de 15 a 128 caracteres."
```

### Cenário 15 — Segredo fora do repositório

```gherkin
Dado um Pull Request aberto contra a `staging`
Quando o CI roda
Então o job do `gitleaks` varre o histórico inteiro e falha se encontrar um segredo
E o job do `apps/api` roda os gates da área e falha se algum falhar
```

---

## Impacto na arquitetura

- **[API](../../architecture/building-blocks/api.md):** nasce o `apps/api`. O módulo `access` passa a
  ser "login e sessão do gestor", sem política por rota. Em `src/core` ficam o ambiente validado, a
  conexão TypeORM, o log redigido e a rota de saúde. O diagrama
  [components-api](../../architecture/diagrams/components-api.drawio.svg) troca o rótulo do `access`.
- **[PostgreSQL](../../architecture/building-blocks/postgres.md):** sobe pelo `infra/compose.dev.yaml`,
  com o papel da API criado por um script de init.
- **[Segurança](../../architecture/concepts/security.md):** ganha duas linhas. O login é limitado por IP
  na API. O log redige cookie e autorização na API.
- **[Implantação](../../architecture/deployment.md):** passa a existir o workflow de CI do `apps/api` e o
  do `gitleaks`.
- **[Riscos](../../architecture/risks.md):** o contador de tentativas de login fica em memória e zera
  num restart.

## Impacto no modelo de dados

- **Gestor:** ganha os atributos "hash da senha" e "criado em". O e-mail é único e guardado em
  minúsculas.
- **Sessão do gestor**, entidade nova do E1: id (o SHA-256 do token), criada em, expira em e última
  atividade. Ligada a um Gestor, que tem de 0 a N sessões. Apagar o gestor apaga as sessões.
- **Tabelas**, criadas pela primeira migration:

  | Tabela | Coluna | Tipo | Restrição |
  | --- | --- | --- | --- |
  | `managers` | `id` | `uuid` | chave primária, `DEFAULT uuidv7()` |
  | | `email` | `text` | `NOT NULL`, `UNIQUE`, `CHECK (email = lower(email))`, `CHECK (char_length(email) <= 254)` |
  | | `password_hash` | `text` | `NOT NULL` |
  | | `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` |
  | `manager_sessions` | `id` | `text` | chave primária, o SHA-256 do token |
  | | `manager_id` | `uuid` | `NOT NULL`, `REFERENCES managers (id) ON DELETE CASCADE`, com índice |
  | | `created_at` | `timestamptz` | `NOT NULL` |
  | | `expires_at` | `timestamptz` | `NOT NULL` |
  | | `last_active_at` | `timestamptz` | `NOT NULL` |

- **Padrões de acesso:** autenticar gestor lê `managers` pelo e-mail, um por login. Ler a sessão faz
  `manager_sessions JOIN managers` pelo id, uma por requisição autenticada. As horas vêm do relógio do
  `SessionService`, e não do banco.

## Fora do escopo

- **Rota de criação de gestor, troca e recuperação de senha:** o gestor nasce pelo comando. A
  recuperação exigiria envio de e-mail, que o sistema não tem.
- **MFA, link mágico, OIDC e JWT:** nenhum requisito pede.
- **Política por rota com `@nestjs/authorization`:** entra quando existir um segundo papel ou uma regra
  por recurso.
- **Tela de login:** é do `apps/web`, no E2.
- **Gerar o `openapi.json` em arquivo para o painel:** é do primeiro épico do `apps/web`, no E2.
- **Dockerfile da API, `trustProxy` atrás do Coolify e HTTPS local da API:** a imagem e a implantação
  são do épico E ([#7](https://github.com/Vultra-Facial-Attendence/vultra/issues/7)), que mede os dois
  ambientes. O HTTPS local serve à câmera e é do épico C
  ([#5](https://github.com/Vultra-Facial-Attendence/vultra/issues/5)).
- **Redis no compose e cota por câmera:** épico C.
- **Proteção de branch:** é uma configuração do GitHub, fora do repositório, e o AGENTS.md já a trata
  como convenção.

## Tarefas

| # | Issue | Título | Escopo | Critério de aceite | Depende de |
| --- | --- | --- | --- | --- | --- |
| 1 | [#9](https://github.com/Vultra-Facial-Attendence/vultra/issues/9) | Criar o esqueleto do `apps/api` com ambiente obrigatório, log redigido e saúde | `package.json` da raiz com os workspaces e `bun.lock`; `apps/api` com `package.json`, `tsconfig`, `nest-cli.json`, oxlint, prettier, Vitest, `.env.example`, `src/main.ts`, `src/app.module.ts` e `src/core` (ambiente, TypeORM, log, saúde, data source das migrations); `infra/compose.dev.yaml`, script de init do papel da API e `infra/.env.example`; `apps/api/AGENTS.md`, linha da API no `AGENTS.md` da raiz e tarefas do `.vscode`; testes do ambiente, da saúde e da redação do log. Cerca de 24 arquivos | Cenários 10, 11 (redação dos cabeçalhos) e 12 | — |
| 2 | [#10](https://github.com/Vultra-Facial-Attendence/vultra/issues/10) | Autenticar o gestor por sessão e negar toda rota de dado sem ela | `src/access`: módulo, entidades `Manager` e `ManagerSession`, `SessionStore` no PostgreSQL, provider de sessão, controller e service de `/session`; limite de login; `app.enableCsrfProtection()`; primeira migration; comando `manager:create`; testes do login, da negação por padrão, do contrato do store com `authenticationStoreContract()` e do comando. Cerca de 15 arquivos | Cenários 1 a 9, 11 (fluxo completo), 13 e 14 | 1 |
| 3 | [#11](https://github.com/Vultra-Facial-Attendence/vultra/issues/11) | Rodar os gates do `apps/api` e o `gitleaks` no CI | `.github/workflows/api.yml`, com filtro de caminho em `apps/api/**`, e `.github/workflows/secrets.yml`, com a imagem `ghcr.io/gitleaks/gitleaks:v8.30.1` sobre o histórico; linha do CI em `deployment.md`. Cerca de 4 arquivos | Cenário 15 | 2 |
