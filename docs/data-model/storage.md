# Armazenamento

## O que está decidido

- **Banco:** PostgreSQL 18 com pgvector 0.8.7, imagem `pgvector/pgvector:0.8.7-pg18-trixie`
  ([0003](../decisions/0003-repositorio-e-infraestrutura.md)).
- **Vetor:** 512 dimensões, a saída do módulo de reconhecimento do `buffalo_l`, numa coluna `vector`
  ([0001](../decisions/0001-stack-do-backend.md)).
- **Migrations:** TypeORM, rodando pelo `typeorm-ts-node-esm` sobre `src/core/database/migrations` com um
  papel privilegiado. A API conecta com um papel sem superusuário
  ([0001](../decisions/0001-stack-do-backend.md)).
- **Redis:** guarda só a cota. Nada nele é fonte de verdade.

## Tabelas

Os nomes e as restrições exatas estão na spec que cria cada uma. Os índices e o tipo de índice vetorial
das próximas tabelas entram aqui com a spec que criar cada uma.

| Tabela | Entidade | Spec | Migration |
| --- | --- | --- | --- |
| `managers` | Gestor | [acesso do gestor](../specs/3-manager-access/manager-session.md#impacto-no-modelo-de-dados) | `CreateManagers` |
| `manager_sessions` | Sessão do gestor | [acesso do gestor](../specs/3-manager-access/manager-session.md#impacto-no-modelo-de-dados) | `CreateManagers` |

O `ManagerSessionRepository` não roda o `authenticationStoreContract()` do `@nestjs/authentication`, porque o
contrato cria sessões para usuários que não existem em `managers` e espera guardar `mfa` e `metadata`. A
tabela tem chave estrangeira para `managers` e nenhuma das duas colunas. Os testes de `/session` cobrem o
store.
