# INTR — Capacidade de interação

A qualidade de uso da tela ao vivo. Valem a partir do E2, quando ela existe.

<a id="nfr-intr-01"></a>
## NFR-INTR-01 — Uso em largura de telefone

O sistema deve apresentar a tela ao vivo utilizável em 390 px de largura.

| Atributo | Valor |
| --- | --- |
| Rationale | Na demonstração, a sessão é aberta e acompanhada com o celular na mão |
| Source | Contrato de trabalho de Theo; aceito em 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **NFR-INTR-01.1** — Dada a tela ao vivo em 390 px de largura, quando ela é exibida, então
  tem 0 px de rolagem horizontal e todos os controles são alcançáveis por toque.

<a id="nfr-intr-02"></a>
## NFR-INTR-02 — Quatro estados sem deslocamento

O sistema deve apresentar, em toda superfície que carrega dado, os estados carregando, vazio, erro com
saída e sucesso, com o estado de carregamento ocupando o espaço do conteúdo final.

| Atributo | Valor |
| --- | --- |
| Rationale | Uma tela que pula ou fica em branco durante a demonstração faz o gestor errar o toque e confunde quem assiste |
| Source | Contrato de trabalho de Theo; aceito em 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **NFR-INTR-02.1** — Dada uma superfície que carrega dado, quando ela passa de carregando para
  sucesso, então o deslocamento cumulativo de layout é 0.
- **NFR-INTR-02.2** — Dada uma falha de carregamento, quando o erro é exibido, então a tela oferece uma
  ação para sair dele.

<a id="nfr-intr-03"></a>
## NFR-INTR-03 — Operação por teclado

O sistema deve permitir operar todo controle da tela ao vivo e do login por teclado, com foco visível e rótulo associado
a cada campo.

| Atributo | Valor |
| --- | --- |
| Rationale | É a base de acessibilidade sem a qual parte dos usuários não consegue usar a tela |
| Source | Contrato de trabalho de Theo; aceito em 2026-10-06 |
| Priority | Must |
| Status | approved |
| Milestone | E2 |
| Since | v1.0.0 |

**Critérios de aceite**
- **NFR-INTR-03.1** — Dada a tela ao vivo ou o login, quando a tela é percorrida só com o teclado, então
  100% dos controles são alcançáveis e acionáveis, com o foco visível em cada um.
- **NFR-INTR-03.2** — Dado qualquer formulário, quando ele é inspecionado, então 100% dos campos têm
  rótulo associado.
