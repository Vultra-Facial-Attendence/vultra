# Painel

`apps/web` · Next.js 16 com App Router, Mantine 9, Node 26 · estágio E2 · ainda não existe.

## O que faz

Dá ao gestor o login, a abertura e o encerramento da sessão de chamada numa câmera e a tela ao vivo da
sessão, com as presenças e o desfecho de cada captura
([FR-ATT-01 a 04](../../requirements/functional/attendance.md)).

## O que nunca faz

- Decide autorização. A tela reflete o que a API permite.
- Mostra a emoção de uma pessoa identificável fora da tela ao vivo
  ([BR-04](../../requirements/business-rules.md#br-04)).
- Guarda regra de negócio ou usa Server Actions.

## Para mudar com segurança

- A leitura acontece em Server Component, repassando o cookie de sessão. A escrita vai do navegador para
  `/api`, e o `src/proxy.ts` reescreve essa rota para a API em tempo de execução
  ([0002](../../decisions/0002-stack-do-frontend.md)).
- A tela ao vivo atualiza por polling com `router.refresh()`.
- Os tipos da API são gerados do `openapi.json`.
- Toda tela funciona em 390 px e pelo teclado, e o carregamento não desloca o layout
  ([NFR-INTR](../../requirements/non-functional/interaction.md)).
