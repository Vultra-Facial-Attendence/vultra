# AFF — Emoção

A inferência de expressão facial, onde ela fica guardada e como é exposta.

<a id="fr-aff-01"></a>
## FR-AFF-01 — Inferir expressão facial

> Como pesquisador, quero a expressão facial de cada captura reconhecida, para medi-la no artigo.

O sistema deve inferir, no mesmo quadro de uma captura de reconhecimento, a expressão facial e
classificá-la em um conjunto fechado de rótulos, com a confiança da inferência.

| Atributo | Valor |
| --- | --- |
| Rationale | A emoção é parte do núcleo que o artigo avalia, e usar o mesmo quadro evita uma segunda captura |
| Source | Theo, entrevista de 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E1 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-AFF-01.1** — Dada uma captura de reconhecimento aceita, quando o quadro é processado, então o
  resultado traz um rótulo do conjunto fechado e a confiança, ou a indicação de que não houve
  inferência.
- **FR-AFF-01.2** — Dada uma falha na inferência de expressão, quando o quadro é processado, então o
  evento de reconhecimento é gravado mesmo assim, sem emoção.

<a id="fr-aff-02"></a>
## FR-AFF-02 — Gravar emoção da pessoa reconhecida

> Como pesquisador, quero a emoção guardada com o evento, para analisá-la depois.

O sistema deve gravar a emoção inferida e sua confiança no evento de reconhecimento da pessoa
reconhecida.

| Atributo | Valor |
| --- | --- |
| Rationale | Guardar por pessoa mantém aberta qualquer análise futura sem refazer a coleta |
| Source | Theo, entrevista de 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E1 |
| Since | v1.0.0 |

**Critérios de aceite**
- **FR-AFF-02.1** — Dado um evento de reconhecimento com pessoa e emoção inferida, quando ele é
  gravado, então o rótulo e a confiança ficam no mesmo evento.
