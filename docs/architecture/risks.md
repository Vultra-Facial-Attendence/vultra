# Riscos e dívida

Um item sem issue própria é rastreado pelo ADR ou pela questão aberta indicada.

| Risco ou dívida | Consequência | Rastreio |
| --- | --- | --- |
| O conteúdo do artigo não foi confirmado com o orientador | A prioridade de todo o SRS pode mudar | [OQ-01](../requirements/open-questions.md#oq-01) |
| A latência máxima não tem número | NFR-PERF-01 e 02 não podem ser verificados | [OQ-03](../requirements/open-questions.md#oq-03) |
| Não há base legal decidida para dado biométrico e de emoção | Nenhuma pessoa fora do time pode entrar no sistema | [OQ-04](../requirements/open-questions.md#oq-04) |
| Com a câmera ligada, o rádio da ESP32-CAM não sustenta o canal com sinal pior que cerca de -60 dBm | A câmera instalada longe do ponto de acesso não entrega quadro | medido no repositório anterior |
| O tempo de reconexão da câmera depois de uma queda de rede não foi medido | Se for longo, o firmware precisa de outra política de reconexão | medido no repositório anterior, sem número |
| Os pesos do `buffalo_l` só podem ser usados em pesquisa não comercial | O sistema não pode ser vendido sem licenciar ou trocar o modelo de vetor | [worker](building-blocks/worker.md) |
| A robustez do par MiniFASNetV2 e MiniFASNetV1SE depende do modelo da câmera e da cena | A taxa de bloqueio de ataque na ESP32-CAM pode ser baixa | [worker](building-blocks/worker.md) |
| A autenticação e a autorização da API dependem de pacotes 0.x do Nest | Uma atualização pode quebrar a API dos pacotes | [0001](../decisions/0001-stack-do-backend.md) |
| O `typescript` fica em 6.0.3 até o `@nestjs/cli` suportar a 7 | A troca para o TypeScript 7 fica parada | [0001](../decisions/0001-stack-do-backend.md) |
| Não existe CI nem proteção de branch | Todo gate depende da máquina de quem desenvolve | [0003](../decisions/0003-repositorio-e-infraestrutura.md) |
