# Worker

`apps/worker` · Python 3.13, `uv`, InsightFace, ONNX Runtime, servidor `grpc.aio` · estágio E1 · existem o
projeto e o download dos modelos. A inferência e o servidor gRPC ainda não existem.

## O que faz

Recebe pelo contrato de `proto/` um quadro e a finalidade (cadastro ou reconhecimento) e devolve o
resultado: a recusa com o motivo, ou o vetor de 512 dimensões e, no reconhecimento, a emoção com a
confiança. O serviço é `vultra.inference.v1.InferenceService/ProcessFrame`, aberto por `uv run serve` em
`WORKER_HOST` e `WORKER_PORT` depois que os cinco modelos carregam
([spec](../../specs/4-frame-inference/frame-inference.md)). E1.

As etapas rodam na ordem da tabela, e a primeira que reprova devolve a recusa sem rodar as seguintes.

| Etapa | Modelo | Requisito |
| --- | --- | --- |
| Decodificação do JPEG em memória | `cv2.imdecode` | [BR-01](../../requirements/business-rules.md#br-01) |
| Detecção e contagem de rostos | InsightFace `buffalo_l`, módulo `detection` | [BR-02](../../requirements/business-rules.md#br-02) |
| Qualidade do quadro: tamanho, pose, exposição e nitidez | sobre a caixa e os 5 pontos da detecção | [FR-BIO-02](../../requirements/functional/biometrics.md#fr-bio-02) |
| Vivacidade | MiniFASNetV2 e MiniFASNetV1SE, com as saídas somadas | [FR-BIO-03](../../requirements/functional/biometrics.md#fr-bio-03) |
| Vetor | InsightFace `buffalo_l`, módulo `recognition` | [FR-BIO-01](../../requirements/functional/biometrics.md#fr-bio-01) |
| Emoção, só no reconhecimento | FER MobileFaceNet do OpenCV Zoo | [FR-AFF-01](../../requirements/functional/affective.md#fr-aff-01) |

## O que nunca faz

- Acessa banco ou Redis, ou conhece a API.
- Grava o quadro em disco, mesmo em arquivo temporário.
- Compara o vetor com a galeria. A busca 1:N é da [API](api.md), no PostgreSQL.

## Para mudar com segurança

- Um quadro é processado por vez. Quando a API cancela a chamada ou o prazo vence, o pipeline para antes
  da etapa seguinte.
- Os limiares de qualidade são constantes iniciais. A calibração contra a ESP32-CAM instalada ainda não foi
  feita.
- O harness do artigo importa o pipeline diretamente, sem passar pelo gRPC. Mudar a função de entrada
  muda o que o artigo mede.
- Os pesos do `buffalo_l` só podem ser usados em pesquisa não comercial.
- Os cinco arquivos de modelo ficam fora do git e são baixados por um comando que confere o SHA-256 de
  cada um.
- O worker só aceita conexão da rede interna
  ([0003](../../decisions/0003-repositorio-e-infraestrutura.md)).
