# O quadro só em memória

Regra: [BR-01](../../requirements/business-rules.md#br-01). O quadro é a imagem de uma captura, e o
único dado biométrico guardado é o vetor derivado dele.

## Por onde o quadro passa

| Bloco | O quadro existe como | Até quando |
| --- | --- | --- |
| Câmera | Buffer da captura | O envio |
| Borda TLS (Cloudflare e Coolify, só em produção) | Bytes em trânsito | O encaminhamento |
| API | `Buffer` da mensagem WebSocket | O fim da chamada gRPC |
| Worker | Bytes da requisição gRPC e matriz de imagem | O fim da inferência |

## Por onde ele nunca passa

PostgreSQL, Redis, disco, log, trilha de auditoria, mensagem de erro e resposta de API.

## O que isso exige de cada bloco

- A API não inclui o quadro nem um recorte dele em log ou em exceção, e o log HTTP não registra corpo.
- A API não coloca o quadro em fila.
- O Worker não grava arquivo temporário.
