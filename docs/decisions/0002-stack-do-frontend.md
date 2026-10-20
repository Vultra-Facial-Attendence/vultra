# 0002. Stack do frontend: Next.js no Node com Mantine

- Status: accepted
- Date: 2026-10-20

## Contexto

O painel é usado por gestores e professores, sempre depois do login, e não precisa de SEO. A chamada
é feita com o celular na mão, então toda tela precisa funcionar em 390 px de largura. Os estados de
carregamento não podem deslocar o layout, e todo controle precisa funcionar pelo teclado.

A API ([0001](0001-stack-do-backend.md)) autentica pessoas por um cookie de sessão `__Host-sid` e
recusa escrita vinda de outro site pela proteção de CSRF do Nest 12. Por isso o painel e a API
precisam aparecer ao navegador como uma origem só.

O time é fluente em Next.js. O SSR não exige uma camada intermediária entre o painel e a API: o
servidor do Next pode chamar o Nest direto, repassando o cookie.

O time prefere não usar Tailwind e quer uma biblioteca de componentes pronta. Em projetos React
enterprise sem Tailwind, o mais comum é uma biblioteca de componentes com CSS Modules para o estilo
próprio.

O sistema precisa rodar a partir dos mesmos artefatos de build na máquina local e na nuvem, com
diferença só de configuração.

## Decisão

**O painel é Next.js 16 com App Router, rodando no Node 26, com Mantine 9 e CSS Modules.** O Bun
instala os pacotes e checa os tipos, como no backend.

| Necessidade | Pacote e versão |
| --- | --- |
| Framework | `next` 16.4.2 (Turbopack, saída `standalone`), `react` / `react-dom` 19.3.1 |
| Componentes | `@mantine/core`, `@mantine/hooks`, `@mantine/form`, `@mantine/notifications`, `@mantine/dates`, `@mantine/charts` 9.7.3 |
| Dependências do Mantine | `recharts` 3.10.1, `dayjs` 1.11.23 |
| Estilo próprio | CSS Modules com nesting nativo, processado pelo Lightning CSS do Turbopack, sem PostCSS |
| Cliente da API | `openapi-typescript` 7.13.0 (tipos gerados do `openapi.json` do Nest), `openapi-fetch` 0.17.0 |
| Validação | `zod` 4.6.7, pelo `schemaResolver` do `@mantine/form` |
| Testes de componente | `vitest` 5.0.5, `@testing-library/react` 16.3.3, `@testing-library/user-event` 14.6.8, `jsdom` 30.1.3, `msw` 3.0.3 |
| Testes no navegador | `@playwright/test` 1.64.1 |
| Qualidade | `bun check`, `oxlint` 1.89.0 com as regras de React, Next e acessibilidade, `prettier` 3.9.10 |
| Build | `typescript` 6.0.3 |

O fluxo de dados segue a prova feita antes deste ADR:

- Leitura: um Server Component chama o Nest com `openapi-fetch`, repassando o cookie lido por
  `cookies()`. Uma resposta `401` ou `403` redireciona para o login.
- Escrita: o client component chama `/api` no navegador e depois roda `router.refresh()`. O painel não
  usa Server Actions. A regra de negócio fica só no Nest.
- Mesma origem: o `src/proxy.ts` do Next reescreve `/api/*` para o endereço da API, lido de
  `API_URL` a cada requisição.
- Contrato: o `@nestjs/swagger` 12 converte os schemas zod de entrada e de saída para o
  `openapi.json`, e o `openapi-typescript` gera os tipos do painel a partir dele.
- Chamada aberta: atualiza por polling com `router.refresh()`.

## Consequências

- O `rewrites` do `next.config` não serve para chegar à API. Ele grava o destino no build, e a mesma
  imagem deixaria de servir os dois ambientes. O `proxy.ts` lê o ambiente em tempo de execução.
- O cliente do navegador monta a URL a partir de `location.origin` no momento da chamada. Uma
  `baseUrl` relativa quebra nos testes, porque o `Request` do Node exige URL absoluta.
- Quando a API serve HTTPS com a CA própria do ambiente local, o servidor do Next confia nela por
  `NODE_EXTRA_CA_CERTS`.
- O Vitest não renderiza Server Component assíncrono. Fluxos que passam por um deles são testados
  com Playwright. Os componentes de cliente são testados com Vitest e msw.
- O painel é um container Node a mais na produção.
- O cookie `__Host-sid`, que é `Secure`, funciona no navegador em `http://localhost` durante o
  desenvolvimento.
- O Mantine roda os componentes no cliente. As páginas continuam sendo Server Components e só os
  componentes interativos usam `'use client'`.

## Alternativas consideradas

- SPA com Vite e TanStack Router: sem servidor próprio, mas sem dado na primeira pintura. O time
  tem mais fluência em Next.
- TanStack Start: SSR com server functions que duplicariam o papel do Nest.
- Server Actions para escrita: o login teria que repassar o cookie de sessão, o que é uma camada
  intermediária. Além disso, uma exceção lançada numa action perde a mensagem em produção.
- `rewrites` do `next.config`: grava o endereço da API no build.
- Tailwind com shadcn: descartado por preferência do time.
- Radix Themes: tem menos componentes e não traz formulário, gráfico nem datas.
- CSS Modules com Base UI: todo o estilo seria escrito à mão.
- Panda CSS: a escrita continua no estilo de classes utilitárias.
- MUI e Chakra: dependem do Emotion em runtime.
- `postcss-preset-mantine`: só serve para helpers no estilo Sass. O CSS nativo cobre o mesmo com as
  variáveis do Mantine e `light-dark()`.
- TanStack Query: a leitura é feita no servidor e a atualização é feita com `router.refresh()`.
- Bun como runtime do Next: funciona, mas o Next é testado no Node e a stack fica com um runtime só.
- Angular: combina com o estilo do Nest, mas o time é fluente em React.
