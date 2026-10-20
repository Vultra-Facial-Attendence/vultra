# ATT — Chamada

A sessão de chamada numa câmera, a presença construída sobre os eventos de reconhecimento do núcleo e a
tela que acompanha a sessão na demonstração.

<a id="fr-att-01"></a>
## FR-ATT-01 — Abrir sessão de chamada

> Como gestor, quero abrir uma sessão de chamada numa câmera, para que os reconhecimentos dela contem como presença.

O sistema deve permitir que um gestor abra uma sessão de chamada associada a uma câmera registrada.

| Atributo | Valor |
| --- | --- |
| Rationale | A sessão delimita quais eventos de qual câmera viram presença, e é o que a demonstração mostra |
| Source | Theo, 2026-10-20 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-ATT-01.1** — Dado um gestor autenticado e uma câmera registrada sem sessão aberta, quando ele
  abre a sessão nela, então a sessão fica aberta e ele a reencontra ao recarregar a página.
- **FR-ATT-01.2** — Dada uma câmera com sessão aberta, quando o gestor tenta abrir outra nela, então a
  abertura é recusada com o motivo.

<a id="fr-att-02"></a>
## FR-ATT-02 — Encerrar sessão de chamada

> Como gestor, quero encerrar a sessão, para que a presença daquela sessão fique fechada.

O sistema deve permitir que um gestor encerre uma sessão de chamada aberta.

| Atributo | Valor |
| --- | --- |
| Rationale | Um evento depois do fim da sessão não pode virar presença nela |
| Source | Theo, entrevista de 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-ATT-02.1** — Dada uma sessão encerrada, quando a câmera dela reconhece uma pessoa, então o
  evento é gravado e nenhuma presença é criada naquela sessão.

<a id="fr-att-03"></a>
## FR-ATT-03 — Registrar presença única por sessão

> Como gestor, quero a chamada preenchida sozinha, para ver a presença sem marcar ninguém à mão.

O sistema deve registrar presença, uma única vez por pessoa e sessão, quando um evento de
reconhecimento com pessoa ocorre na câmera de uma sessão aberta.

| Atributo | Valor |
| --- | --- |
| Rationale | É a substituição da chamada manual, o que o sistema demonstra |
| Source | Theo, entrevista de 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-ATT-03.1** — Dada uma sessão aberta, quando a câmera dela reconhece a mesma pessoa duas vezes,
  então existe uma única presença dessa pessoa naquela sessão.
- **FR-ATT-03.2** — Dada uma sessão aberta, quando a câmera dela grava um evento sem identidade, então
  nenhuma presença é criada.

<a id="fr-att-04"></a>
## FR-ATT-04 — Acompanhar a sessão ao vivo

> Como gestor, quero acompanhar a sessão numa tela enquanto as pessoas passam, para demonstrar o sistema funcionando.

O sistema deve apresentar ao gestor uma tela da sessão aberta que mostra as presenças registradas e o
desfecho de cada captura de reconhecimento da câmera dela, sem recarregar a página.

| Atributo | Valor |
| --- | --- |
| Rationale | A demonstração precisa mostrar, para quem assiste, o reconhecimento, a presença e a expressão saindo do mesmo quadro |
| Source | Theo, 2026-10-20 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-ATT-04.1** — Dada a tela de uma sessão aberta, quando a câmera reconhece uma pessoa, então a
  tela passa a mostrar a pessoa, o instante e a emoção inferida, e a pessoa aparece entre as
  presenças, sem que o gestor recarregue a página.
- **FR-ATT-04.2** — Dada a tela de uma sessão aberta, quando uma captura é recusada ou termina sem
  identidade, então a tela mostra o desfecho e o motivo, sem pessoa.
