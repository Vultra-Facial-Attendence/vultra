# Armazenamento

## O que está decidido

- **Banco:** PostgreSQL 18 com pgvector 0.8.7, imagem `pgvector/pgvector:0.8.7-pg18-trixie`
  ([0003](../decisions/0003-repositorio-e-infraestrutura.md)).
- **Vetor:** 512 dimensões, a saída do módulo de reconhecimento do `buffalo_l`, numa coluna `vector`
  ([0001](../decisions/0001-stack-do-backend.md)).
- **Migrations:** TypeORM, rodando a partir do `dist` com um papel privilegiado. A API conecta com um
  papel sem superusuário ([0001](../decisions/0001-stack-do-backend.md)).
- **Redis:** guarda só a cota. Nada nele é fonte de verdade.

## O que não existe ainda

Nenhuma migration. As tabelas, os índices e o tipo de índice vetorial entram aqui com a spec que criar
cada uma.

## Tabelas especificadas

Ainda não construídas. Os nomes e as restrições exatas estão na spec que cria cada uma.

| Tabela | Entidade | Spec | Estágio |
| --- | --- | --- | --- |
| `managers` | Gestor | [acesso do gestor](../specs/3-manager-access/manager-session.md#impacto-no-modelo-de-dados) | E1 |
| `manager_sessions` | Sessão do gestor | [acesso do gestor](../specs/3-manager-access/manager-session.md#impacto-no-modelo-de-dados) | E1 |
