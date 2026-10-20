# Questões abertas

Cada questão sai daqui quando é decidida, substituída por um link para o que a decidiu.

<a id="oq-01"></a>
## OQ-01 — Conteúdo do artigo

A hipótese de trabalho é uma arquitetura de referência avaliada no pipeline real, com o experimento de
isolamento entre instituições sobre busca vetorial como seção. O sistema atende uma instalação só, então
esse experimento roda no harness, com instituições sintéticas. Faltam o orientador confirmar o
enquadramento e o veículo, confirmar se a seção continua no artigo e registrar o desvio em
[`../research/pre-registro.md`](../research/pre-registro.md), que hoje trata a arquitetura de referência
como trabalho futuro.

**Dono:** Theo e Vinicius, com o orientador. **Fechar até:** antes de o E1 ser planejado em sprint.
**Bloqueia:** a prioridade de todo o SRS.

<a id="oq-02"></a>
## OQ-02 — Aprovação ética para usar os rostos dos autores

Não há decisão sobre a necessidade de aprovação em comitê de ética quando as únicas pessoas reais
capturadas são os dois autores.

**Dono:** Theo e Vinicius, com o orientador. **Fechar até:** antes da primeira captura usada em
resultado do artigo. **Bloqueia:** [BR-03](business-rules.md#br-03) e a submissão.

<a id="oq-03"></a>
## OQ-03 — Latência máxima da captura ao resultado

O número sai de uma medição do pipeline real nos dois ambientes; nenhum valor foi fixado.

**Dono:** Theo e Vinicius. **Fechar até:** o fim do primeiro sprint em que o E1 rodar de ponta a
ponta. **Bloqueia:** [NFR-PERF-01](non-functional/performance.md#nfr-perf-01) e
[NFR-PERF-02](non-functional/performance.md#nfr-perf-02).

<a id="oq-04"></a>
## OQ-04 — Base legal do dado biométrico e de emoção

Faltam a base legal e a finalidade declarada para tratar o rosto e a emoção de qualquer pessoa fora do
time. Até lá valem [BR-03](business-rules.md#br-03) e [BR-04](business-rules.md#br-04).

**Dono:** Theo e Vinicius, com o orientador. **Fechar até:** antes de qualquer dado de pessoa fora do
time entrar no sistema. **Bloqueia:** [BR-03](business-rules.md#br-03).

<a id="oq-05"></a>
## OQ-05 — Prazos de retenção

Não há prazo decidido para manter vetores, eventos de reconhecimento e emoção, nem o que executa o
descarte.

**Dono:** Theo e Vinicius. **Fechar até:** antes de o E2 ser planejado. **Bloqueia:** um requisito de
retenção ainda não escrito.

<a id="oq-06"></a>
## OQ-06 — Datasets públicos da avaliação

Faltam escolher os datasets de rosto, de vivacidade e de expressão, e conferir se a licença de cada um
permite o uso no artigo.

**Dono:** Theo e Vinicius. **Fechar até:** antes de o harness de avaliação ser construído.
**Bloqueia:** as medições do artigo.
