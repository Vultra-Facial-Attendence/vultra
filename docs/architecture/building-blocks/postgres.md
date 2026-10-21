# PostgreSQL

Imagem `pgvector/pgvector:0.8.7-pg18-trixie` · estágio E1 · no ambiente de desenvolvimento sobe pelo
`infra/compose.dev.yaml`, que ainda não existe.

## O que faz

Guarda todo o estado durável: gestores, pessoas, câmeras, vetores, eventos de reconhecimento, sessões de
chamada, presenças e trilha de auditoria. Faz a comparação 1:N do vetor de uma captura contra a galeria
com pgvector.

## O que nunca faz

- Guarda quadro ([BR-01](../../requirements/business-rules.md#br-01)).
- Permite alterar ou apagar um registro de auditoria
  ([FR-GOV-01](../../requirements/functional/governance.md#fr-gov-01)).

## Para mudar com segurança

- A versão do pgvector é fixada por tag exata, para o experimento do artigo poder ser reproduzido.
- Há dois papéis de banco: o da API, sem superusuário, e o das migrations, que cria a extensão `vector`
  ([0001](../../decisions/0001-stack-do-backend.md)).
- No ambiente local, um script de init do compose cria o papel da API sem superusuário. O papel do
  `POSTGRES_USER` é o das migrations ([spec do acesso do gestor](../../specs/3-manager-access/manager-session.md)).
- As tabelas e as chaves estão em [../../data-model/](../../data-model/README.md).
