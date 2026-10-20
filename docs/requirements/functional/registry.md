# REG — Registro de pessoas

Como as pessoas passam a existir no sistema para poderem ter o rosto cadastrado.

<a id="fr-reg-01"></a>
## FR-REG-01 — Criar pessoa

> Como gestor, quero criar o registro de uma pessoa, para que o rosto dela possa ser cadastrado.

O sistema deve permitir que um gestor crie, pela API, o registro de uma pessoa com identificador
externo e nome.

| Atributo | Valor |
| --- | --- |
| Rationale | O cadastro biométrico precisa de alguém a quem se vincular, e o núcleo não tem tela |
| Source | Theo, entrevista de 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E1 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-REG-01.1** — Dado um gestor autenticado, quando ele cria uma pessoa com identificador externo e
  nome, então a pessoa passa a existir e pode receber cadastro biométrico.
- **FR-REG-01.2** — Dado um identificador externo já usado, quando o gestor cria outra
  pessoa com ele, então a criação é recusada com o motivo.
