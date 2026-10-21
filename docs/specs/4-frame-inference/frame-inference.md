# B-01 — Processar um quadro no worker

> **Status:** published
> **Perfil:** API
> **Módulo:** `apps/worker`, `proto` e `apps/api/src/common/inference`
> **Épico:** [#4](https://github.com/Vultra-Facial-Attendence/vultra/issues/4)
> **Requisitos:** FR-BIO-02, FR-BIO-03, FR-AFF-01
> **Sprint:** 1

A API recebe um quadro e a finalidade dele e chama o worker por gRPC. O worker devolve uma de duas
respostas: a recusa, com o motivo, ou o vetor do rosto. No reconhecimento, a resposta também traz a
expressão facial. O épico entrega o contrato em `proto/`, o servidor do worker e o cliente da API. Quem
chama o cliente e grava o resultado é o épico D
([#6](https://github.com/Vultra-Facial-Attendence/vultra/issues/6)).

Os termos vêm do SRS ([glossário](../../requirements/glossary.md)):

- **Quadro** é a imagem de uma captura, que só existe em memória
  ([BR-01](../../requirements/business-rules.md#br-01)).
- **Finalidade** é o motivo da captura: cadastro ou reconhecimento.
- **Vetor** é a representação numérica do rosto e o único dado biométrico guardado.
- **Vivacidade** é a evidência de que o quadro vem de uma pessoa fisicamente presente, e não de foto ou
  tela ([FR-BIO-03](../../requirements/functional/biometrics.md#fr-bio-03)).
- **Emoção** é o rótulo de expressão facial inferido do quadro, com a confiança da inferência
  ([FR-AFF-01](../../requirements/functional/affective.md#fr-aff-01)).

## Decisões confirmadas

Confirmadas por Theo em 2026-10-21.

1. O #4 entra no Sprint 1. O objetivo do sprint já foi entregue, e o pipeline não depende do enquadramento
   do artigo, que é o que a [OQ-01](../../requirements/open-questions.md#oq-01) decide.
2. O épico entrega o `.proto`, o servidor `grpc.aio` do worker, as etapas de inferência e o cliente gRPC
   da API, com prazo por chamada. Chamar o cliente e gravar o resultado é do #6.
3. A resposta traz ou a recusa com o motivo, ou o vetor normalizado de 512 dimensões. No reconhecimento,
   a resposta traz também a emoção, que pode faltar. A recusa leva só o código, sem score.
4. As etapas rodam da mais barata para a mais cara, e a primeira que reprova encerra a chamada. A
   qualidade tem um motivo para cada defeito, e os limiares são os mesmos no cadastro e no reconhecimento.
5. A vivacidade segue a regra do repositório oficial do Silent-Face: as saídas dos dois modelos são
   somadas e o quadro é real quando vence a classe 1. A emoção não tem limiar de abstenção.
6. Os limiares são constantes no código. No ambiente ficam só o diretório dos modelos e o endereço do
   worker. O canal é gRPC sem TLS, em `127.0.0.1` no desenvolvimento e na rede interna em produção.
7. O worker processa um quadro de cada vez e para entre duas etapas quando a chamada é cancelada. Os
   modelos carregam antes de a porta abrir.
8. O `pytest` vira gate do worker, que ganha o `.github/workflows/worker.yml`. Os testes usam os modelos
   reais e o `t1.jpg` que vem no pacote `insightface`.
9. O teste da API sobe no próprio processo um servidor gRPC falso, montado a partir do mesmo `.proto`.
   A chamada da API ao worker real é verificada ao vivo na entrega, não em teste, porque o CI da API
   precisaria do Python e dos 300 MB de modelos.
10. Os valores das regras abaixo (tamanhos, limiares, prazo, códigos e mensagens) foram confirmados na
    mesma data.

## Critérios de aceite

### Contrato

O serviço é `vultra.inference.v1.InferenceService`, em `proto/vultra/inference/v1/inference.proto`, e
segue as regras `STANDARD` do `buf lint`.

| Método | Rota | Autenticação | Idempotente |
| --- | --- | --- | --- |
| gRPC unário | `/vultra.inference.v1.InferenceService/ProcessFrame` | nenhuma: o worker só escuta em `127.0.0.1` ou na rede interna | Sim: o mesmo quadro e a mesma finalidade dão o mesmo resultado, e nada é gravado |

```proto
syntax = "proto3";

package vultra.inference.v1;

service InferenceService {
  rpc ProcessFrame(ProcessFrameRequest) returns (ProcessFrameResponse);
}

message ProcessFrameRequest {
  bytes frame = 1;
  Purpose purpose = 2;
}

enum Purpose {
  PURPOSE_UNSPECIFIED = 0;
  PURPOSE_ENROLLMENT = 1;
  PURPOSE_RECOGNITION = 2;
}

message ProcessFrameResponse {
  oneof outcome {
    Refusal refusal = 1;
    Face face = 2;
  }
}

message Refusal {
  RefusalReason reason = 1;
}

enum RefusalReason {
  REFUSAL_REASON_UNSPECIFIED = 0;
  REFUSAL_REASON_INVALID_IMAGE = 1;
  REFUSAL_REASON_NO_FACE = 2;
  REFUSAL_REASON_MULTIPLE_FACES = 3;
  REFUSAL_REASON_FACE_TOO_SMALL = 4;
  REFUSAL_REASON_NOT_FRONTAL = 5;
  REFUSAL_REASON_UNDEREXPOSED = 6;
  REFUSAL_REASON_OVEREXPOSED = 7;
  REFUSAL_REASON_BLURRY = 8;
  REFUSAL_REASON_SPOOF = 9;
}

message Face {
  repeated float vector = 1;
  Emotion emotion = 2;
}

message Emotion {
  EmotionLabel label = 1;
  float confidence = 2;
}

enum EmotionLabel {
  EMOTION_LABEL_UNSPECIFIED = 0;
  EMOTION_LABEL_ANGRY = 1;
  EMOTION_LABEL_DISGUST = 2;
  EMOTION_LABEL_FEARFUL = 3;
  EMOTION_LABEL_HAPPY = 4;
  EMOTION_LABEL_NEUTRAL = 5;
  EMOTION_LABEL_SAD = 6;
  EMOTION_LABEL_SURPRISED = 7;
}
```

O código gerado fica versionado e nunca é editado à mão:

| Lado | Gerador | Destino | Comando, de dentro da área |
| --- | --- | --- | --- |
| Worker | `grpcio-tools` 1.84.0, com os stubs tipados do `mypy-protobuf` 5.1.0 | `apps/worker/pipeline/contract/` | o `grpc_tools.protoc` registrado no `AGENTS.md` do worker |
| API | `buf` 1.74.0 com o plugin local do `ts-proto` 2.18.0, opção `nestJs=true` | `apps/api/src/common/inference/contract/` | `bun run contract:generate` |

### Requisição

| Campo | Tipo | Obrigatório | Validação |
| --- | --- | --- | --- |
| `frame` | `bytes` | Sim | JPEG, conferido pelos dois primeiros bytes `FF D8`. A mensagem inteira tem no máximo 1 048 576 bytes. Vem da câmera, pela API |
| `purpose` | `Purpose` | Sim | `PURPOSE_ENROLLMENT` ou `PURPOSE_RECOGNITION`. `PURPOSE_UNSPECIFIED` é recusado com `INVALID_ARGUMENT`. Vem da API, que sabe qual comando de captura disparou o quadro |

### Resposta

**Reconhecimento aceito**

```json
{ "face": { "vector": [0.0123, -0.0456, "… 512 floats"], "emotion": { "label": "EMOTION_LABEL_HAPPY", "confidence": 0.97 } } }
```

**Cadastro aceito**: o mesmo, sem `emotion`.

**Recusa**

```json
{ "refusal": { "reason": "REFUSAL_REASON_MULTIPLE_FACES" } }
```

| Campo da resposta | Tipo | Origem |
| --- | --- | --- |
| `refusal.reason` | `RefusalReason`, nunca `UNSPECIFIED` | A primeira etapa que reprova (regra 2) |
| `face.vector` | 512 `float` de 32 bits, norma L2 igual a 1 | O `w600k_r50.onnx` do `buffalo_l` sobre o rosto alinhado em 112×112, normalizado depois (regra 5) |
| `face.emotion` | `Emotion`, ausente no cadastro e quando a inferência de emoção falha | O `facial_expression_recognition_mobilefacenet_2022july.onnx` (regra 6) |
| `face.emotion.label` | `EmotionLabel`, nunca `UNSPECIFIED` | O argmax das 7 saídas, na ordem do modelo |
| `face.emotion.confidence` | `float` de 0 a 1 | O softmax da saída vencedora |

| Status gRPC | Quando |
| --- | --- |
| `OK` | Quadro aceito ou recusado. Uma recusa é resposta, não erro |
| `INVALID_ARGUMENT` | `purpose` ausente ou `PURPOSE_UNSPECIFIED` |
| `RESOURCE_EXHAUSTED` | Mensagem acima de 1 048 576 bytes. Recusada pelo próprio `grpcio`, antes do handler |
| `CANCELLED` ou `DEADLINE_EXCEEDED` | A API cancelou a chamada ou o prazo dela venceu. O worker para na etapa seguinte |
| `INTERNAL` | Exceção não prevista numa etapa fora da emoção |
| `UNAVAILABLE` | O worker está fora do ar. Quem informa é o `@grpc/grpc-js`, no lado da API |

### Cliente da API

| Peça | Onde | O que faz |
| --- | --- | --- |
| `InferenceModule` | `apps/api/src/common/inference/inference.module.ts` | Registra o cliente gRPC do `@nestjs/microservices` (`Transport.GRPC`, pacote `vultra.inference.v1`, o `.proto` de `proto/`, `url` igual a `WORKER_ADDRESS`, `maxSendMessageLength` de 1 048 576) e exporta o `InferenceClient` |
| `InferenceClient.processFrame(frame: Buffer, purpose: Purpose)` | `apps/api/src/common/inference/inference.client.ts` | Devolve `Promise<ProcessFrameResponse>` com o tipo gerado. Depois de 2000 ms sem resposta, rejeita com o `TimeoutError` do `rxjs`, e a chamada é cancelada. Qualquer outro erro do gRPC sai como o canal o entrega, para o #6 decidir o desfecho |

### Papéis e privilégios

| Papel | Permissão | Nota |
| --- | --- | --- |
| API | rede | O worker não autentica quem chama. A barreira é a rede: `WORKER_HOST` é `127.0.0.1` no desenvolvimento, e na produção o contêiner fica só na rede interna ([0003](../../decisions/0003-repositorio-e-infraestrutura.md)). O gestor e a câmera nunca chegam ao worker |

---

## Regras de negócio

### 1. Autorização

- O worker atende qualquer cliente que alcance a porta dele. Autenticação, cota e auditoria ficam com a
  API, antes de o quadro sair dela.
- **Verificação:** feita pela rede, quando a conexão abre. O worker escuta só no endereço de
  `WORKER_HOST`.

### 2. Ordem das etapas

As etapas rodam nesta ordem, e a primeira que reprova devolve a recusa. Nenhuma etapa seguinte roda.

| # | Etapa | Recusa com | Roda quando |
| --- | --- | --- | --- |
| 1 | Decodificação do JPEG em memória (`cv2.imdecode`) | `INVALID_IMAGE`, se o quadro não começa por `FF D8` ou não decodifica | Sempre |
| 2 | Detecção (`det_10g.onnx`, entrada 640×640, score mínimo 0,5) | `NO_FACE` com 0 rostos, `MULTIPLE_FACES` com 2 ou mais ([BR-02](../../requirements/business-rules.md#br-02)) | Sempre |
| 3 | Qualidade (regra 3) | `FACE_TOO_SMALL`, `NOT_FRONTAL`, `UNDEREXPOSED`, `OVEREXPOSED`, `BLURRY` | Sempre |
| 4 | Vivacidade (regra 4) | `SPOOF` | Sempre: no cadastro e no reconhecimento |
| 5 | Vetor (regra 5) | — | Sempre |
| 6 | Emoção (regra 6) | nunca recusa | Só em `PURPOSE_RECOGNITION` |

O vetor só é extraído depois da vivacidade. Um quadro recusado não tem vetor, então nenhum cadastro nem
evento com pessoa pode sair dele (FR-BIO-02.1, FR-BIO-03.1).

### 3. Qualidade do quadro

Os cálculos usam a caixa e os 5 pontos que a detecção devolve (olho esquerdo, olho direito, nariz, canto
esquerdo e canto direito da boca). Os pixels são os da caixa, recortada aos limites do quadro e convertida
para tons de cinza. Os critérios são conferidos nesta ordem, e o primeiro que falha dá o motivo:

| Critério | Recusa quando | Motivo |
| --- | --- | --- |
| Menor lado da caixa | menor que 64 px | `FACE_TOO_SMALL` |
| Guinada: `abs(‖olho esq. − nariz‖ − ‖olho dir. − nariz‖) / ‖olho esq. − olho dir.‖` | maior que 0,35 | `NOT_FRONTAL` |
| Rolagem: `abs(atan2(Δy, Δx))` entre os dois olhos, em graus | maior que 25 | `NOT_FRONTAL` |
| Brilho médio | menor que 40 | `UNDEREXPOSED` |
| Brilho médio | maior que 220 | `OVEREXPOSED` |
| Variância do Laplaciano (`cv2.Laplacian`, `CV_64F`) | menor que 100 | `BLURRY` |

A exposição vem antes da nitidez porque um quadro escuro também tem Laplaciano baixo. Medido no quadro de
referência escurecido: brilho 30,3 e Laplaciano 9,6. O gestor precisa ouvir "escuro", não "borrado".

Os seis valores são constantes de `apps/worker/pipeline` e são iniciais. A calibração contra a ESP32-CAM
instalada fica fora deste épico.

### 4. Vivacidade

- Dois modelos rodam sobre recortes do quadro original feitos com a regra `CropImage._get_new_box` do
  Silent-Face-Anti-Spoofing (commit `b6d5f04`): o `2.7_80x80_MiniFASNetV2.onnx` com fator 2,7 e o
  `4_0_0_80x80_MiniFASNetV1SE.onnx` com fator 4,0. A caixa é a da detecção. Cada recorte é redimensionado
  para 80×80 e entra em BGR, `float32` de 0 a 255, sem normalização.
- As duas saídas passam por softmax e são somadas. O quadro é real quando o argmax da soma é a classe 1.
  Caso contrário, a recusa é `SPOOF`. A regra é a do `test.py` oficial e não tem limiar próprio.
- A vivacidade mede o quadro inteiro: um recorte apertado em volta do rosto do quadro de referência cai
  na classe 2. Por isso o recorte usa o quadro original, nunca uma cópia já cortada.

### 5. Vetor

- O rosto é alinhado em 112×112 pelos 5 pontos com o `insightface.utils.face_align.norm_crop`, e o
  `w600k_r50.onnx` extrai 512 valores. O worker devolve o vetor dividido pela própria norma L2.
- O worker carrega só os 5 arquivos do `MODEL_SHA256` de `download_models.py`, pelo
  `insightface.model_zoo`, sem o `FaceAnalysis`. Assim os modelos de gênero, idade e marcos 2D e 3D do
  `buffalo_l` nunca carregam: nenhum requisito pede esses dados.

### 6. Emoção

- Roda só em `PURPOSE_RECOGNITION`. O alinhamento é o mesmo da regra 5: o modelo de referência do OpenCV
  Zoo usa os mesmos 5 pontos de destino. A entrada é RGB, `(x / 255 − 0,5) / 0,5`, no formato
  `1×3×112×112`.
- O modelo devolve 7 logits na ordem `angry`, `disgust`, `fearful`, `happy`, `neutral`, `sad` e
  `surprised`, que viram `EMOTION_LABEL_ANGRY` até `EMOTION_LABEL_SURPRISED`, nessa ordem. O rótulo é o
  argmax, e a confiança é o softmax dele. Não há limiar de abstenção.
- Uma exceção na emoção não recusa o quadro: a resposta sai com o vetor e sem `emotion` (FR-AFF-01.2), e
  o log registra "emotion inference failed" com a classe da exceção.

### 7. Um quadro de cada vez e cancelamento

- O pipeline roda num `ThreadPoolExecutor` de uma thread. Uma chamada que chega com outra em curso
  espera na fila do executor.
- Quando a chamada é cancelada ou o prazo dela vence, o servidor marca um `threading.Event`. O pipeline
  confere esse evento antes de cada etapa, para sem rodar a próxima e registra
  "inference cancelled stage=<etapa>". Uma chamada vencida na fila não roda nenhuma etapa.
- Na API, o `InferenceClient` aplica o `timeout(2000)` do `rxjs` sobre o `Observable` do cliente gRPC.
  Ao vencer, a inscrição é desfeita e o Nest chama `call.cancel()`, e o worker recebe o cancelamento. O
  prazo é uma constante de 2000 ms até a [OQ-03](../../requirements/open-questions.md#oq-03) fixar o
  orçamento.

### 8. Inicialização e ambiente

- `uv run serve` lê o ambiente, carrega as 5 sessões do `onnxruntime` só com o `CPUExecutionProvider` e
  com `log_severity_level` 3, e só depois abre a porta. O modelo de emoção imprime avisos de inicializador
  com o nível padrão, e o 3 os cala. O log registra "models loaded from <diretório>" e
  "listening on <host>:<porta>".
- Um modelo ausente ou corrompido encerra o processo com a exceção do `onnxruntime` e código diferente de
  zero, antes de a porta abrir. Não existe estado "carregando".
- As variáveis do worker, lidas por `os.environ[...]`. Uma variável ausente encerra com o `KeyError` do
  Python, que nomeia a variável, como o `download-models` já faz:

  | Variável | Formato |
  | --- | --- |
  | `PIPELINE_MODEL_DIR` | caminho absoluto de uma pasta com os 5 modelos (já existe) |
  | `WORKER_HOST` | endereço em que o worker escuta, como `127.0.0.1` |
  | `WORKER_PORT` | inteiro de 1 a 65535 |

- A API ganha `WORKER_ADDRESS`, no formato `<host>:<porta>`, como `127.0.0.1:50051`, no esquema zod de
  `src/core/config/environment.ts`. Sem ela, a API não sobe e mostra "Config validation error:".

### 9. O quadro e o vetor fora do log

- O worker registra uma linha por chamada concluída:
  "frame processed purpose=<PURPOSE_…> outcome=<ACCEPTED|REFUSAL_REASON_…> emotion=<yes|no>
  duration_ms=<inteiro>".
- Uma exceção não prevista responde `INTERNAL` com a mensagem "inference failed" e registra
  "inference failed stage=<etapa> error=<classe da exceção>". A mensagem da exceção e o traceback não
  entram no log, porque o `numpy` e o `cv2` podem escrever valores de matriz neles.
- O quadro, recortes dele e o vetor nunca entram no log, na mensagem de erro gRPC nem em disco
  ([BR-01](../../requirements/business-rules.md#br-01),
  [NFR-SEC-04](../../requirements/non-functional/security.md#nfr-sec-04)). O worker não grava arquivo,
  nem temporário.
- O `InferenceClient` não registra nada. O log do quadro é do #6.

### 10. Contrato gerado e gates

- O `.github/workflows/worker.yml` roda em todo Pull Request que muda `apps/worker/**`, `proto/**` ou o
  próprio workflow. Os passos: `uv sync`, os modelos pelo `download-models` com `actions/cache` (a chave é
  o hash de `apps/worker/pipeline/download_models.py`), `ruff check`, `ruff format --check`, `mypy`,
  `pytest`, e a regeneração do contrato seguida de `git diff --exit-code`.
- O `api.yml` passa a disparar também com `proto/**` e ganha `bun run contract:lint` (`buf lint` sobre
  `proto/`) e a regeneração seguida de `git diff --exit-code`.
- O código gerado fica fora do `ruff`, do `oxlint` e do `prettier`. O `mypy --strict` passa sobre o
  `pipeline` com os stubs do `mypy-protobuf`, do `types-grpcio` e do `types-protobuf`.

### 11. Persistência e auditoria

- **Tabelas alteradas:** nenhuma. O worker não acessa banco nem Redis, e o cliente da API não grava nada.
- **Auditoria:** N/A. A trilha do [FR-GOV-01](../../requirements/functional/governance.md#fr-gov-01) é
  gravada pela API no #6, a partir desta resposta.
- **Eventos e integrações:** nenhum. A única saída é a resposta gRPC e as linhas de log da regra 9.

---

## Erros

As mensagens são em inglês, como o log. Nenhuma ecoa o quadro, o vetor nem o texto de uma exceção. A
mensagem que o gestor vê é decidida pelo #6 e pelo painel, a partir do código.

| Código | Status gRPC | Quando | Mensagem |
| --- | --- | --- | --- |
| — | `INVALID_ARGUMENT` | `purpose` é `PURPOSE_UNSPECIFIED` | "purpose is required" |
| — | `RESOURCE_EXHAUSTED` | Mensagem acima de 1 048 576 bytes | A do próprio `grpcio`, que informa o tamanho recebido e o limite |
| — | `INTERNAL` | Exceção não prevista numa etapa fora da emoção | "inference failed" |
| — | `CANCELLED` | A API desistiu da chamada | A do `grpcio` |
| `TimeoutError` | — | O `InferenceClient` passou 2000 ms sem resposta | A do `rxjs`: "Timeout has occurred" |

As recusas são respostas `OK`, com estes códigos:

| Código | Quando |
| --- | --- |
| `REFUSAL_REASON_INVALID_IMAGE` | O quadro não começa por `FF D8` ou não decodifica |
| `REFUSAL_REASON_NO_FACE` | Nenhum rosto com score de 0,5 ou mais |
| `REFUSAL_REASON_MULTIPLE_FACES` | Dois ou mais rostos com score de 0,5 ou mais |
| `REFUSAL_REASON_FACE_TOO_SMALL` | Menor lado da caixa abaixo de 64 px |
| `REFUSAL_REASON_NOT_FRONTAL` | Guinada acima de 0,35 ou rolagem acima de 25° |
| `REFUSAL_REASON_UNDEREXPOSED` | Brilho médio abaixo de 40 |
| `REFUSAL_REASON_OVEREXPOSED` | Brilho médio acima de 220 |
| `REFUSAL_REASON_BLURRY` | Variância do Laplaciano abaixo de 100 |
| `REFUSAL_REASON_SPOOF` | O argmax da soma das saídas da vivacidade não é a classe 1 |

## Efeitos colaterais

- **Persistência:** nenhuma. O quadro existe como `bytes` e `numpy.ndarray` na memória do worker até o
  fim da chamada, e como `Buffer` na API até a resposta.
- **Concorrência:** uma inferência por vez (regra 7). As sessões do `onnxruntime` são criadas na
  inicialização e só lidas depois. Duas chamadas com o mesmo quadro dão o mesmo resultado.
- **Transação:** N/A. Nada é gravado.

---

## Quadros de teste

Todos saem do `t1.jpg` do pacote `insightface` 2.1 (`insightface/data/images/t1.jpg`, 1280×886, com 6
rostos), que já vem instalado pelo `uv sync`. A imagem tem origem identificada
([BR-03](../../requirements/business-rules.md#br-03)), e nenhum rosto entra no repositório. Cada
variante é montada em memória e codificada em JPEG pelo `cv2.imencode`. Os números foram medidos com os
modelos do `MODEL_SHA256` em 2026-10-21.

| Quadro | Como é montado | Medido |
| --- | --- | --- |
| Referência | `t1.jpg` com os outros 5 rostos tampados por retângulos cinza (128, 128, 128), 10 px maiores que a caixa de cada um, mantendo o rosto de caixa (466, 268)–(573, 415) | 1 rosto, lado de 107 px, guinada 0,017, rolagem 11,6°, brilho 151,9, Laplaciano 211,3, vivacidade na classe 1, emoção `happy` |
| Vários rostos | `t1.jpg` sem alteração | 6 rostos |
| Sem rosto | 640×480 de cinza (128, 128, 128) | 0 rostos |
| Pequeno | Referência reduzida à metade com `INTER_AREA` | lado de 54 px |
| Inclinado | Referência girada −35° em torno do centro do rosto | rolagem 48,8° |
| Escuro | Referência com `convertScaleAbs(alpha=0.2)` | brilho 30,3 |
| Claro | Referência com `convertScaleAbs(alpha=0.4, beta=170)` | brilho 229,1 |
| Borrado | Referência com `GaussianBlur` de sigma 6 | brilho 152,4, Laplaciano 5,8 |

Nenhum quadro de teste imita um ataque por foto ou tela. A taxa de bloqueio de ataque é uma medição do
artigo, com dataset público ([OQ-06](../../requirements/open-questions.md#oq-06)). A regra de fusão da
regra 4 é testada direto, com vetores de probabilidade fixos.

---

## Cenários de aceite (Gherkin)

### Cenário 1 — Reconhecimento aceito com emoção (caminho feliz)

```gherkin
Dado o worker no ar com os 5 modelos carregados
Quando a API chama `ProcessFrame` com o quadro de referência e `PURPOSE_RECOGNITION`
Então a resposta traz `face` com 512 floats de norma L2 entre 0,999 e 1,001
E `face.emotion.label` é `EMOTION_LABEL_HAPPY`, com `confidence` entre 0 e 1
E o log tem uma linha "frame processed purpose=PURPOSE_RECOGNITION outcome=ACCEPTED emotion=yes"
E o log não contém nenhum valor do vetor nem bytes do quadro
```

### Cenário 2 — Cadastro aceito sem emoção (alternativo)

```gherkin
Dado o worker no ar com os 5 modelos carregados
Quando a API chama `ProcessFrame` com o quadro de referência e `PURPOSE_ENROLLMENT`
Então a resposta traz `face` com 512 floats
E `face.emotion` está ausente
E o modelo de emoção não é executado
```

### Cenário 3 — Mais de um rosto (exceção)

```gherkin
Quando o pipeline processa o quadro de vários rostos com `PURPOSE_RECOGNITION`
Então a resposta traz `refusal.reason` igual a `REFUSAL_REASON_MULTIPLE_FACES`
E não há vetor
E as etapas de qualidade, vivacidade, vetor e emoção não rodam
```

### Cenário 4 — Nenhum rosto (exceção)

```gherkin
Quando o pipeline processa o quadro sem rosto
Então a resposta traz `refusal.reason` igual a `REFUSAL_REASON_NO_FACE`
```

### Cenário 5 — Quadro que não é JPEG (exceção)

```gherkin
Quando o pipeline processa o quadro de referência codificado em PNG
E processa um quadro vazio
E processa os 4 bytes `FF D8 FF 00`
Então as três respostas trazem `refusal.reason` igual a `REFUSAL_REASON_INVALID_IMAGE`
E nenhum modelo roda
```

### Cenário 6 — Recusa por qualidade, com o motivo de cada defeito (exceção)

```gherkin
Quando o pipeline processa, com `PURPOSE_ENROLLMENT`, cada quadro da tabela
Então o motivo da recusa é o da tabela
E a vivacidade e o vetor não rodam

| quadro    | motivo                        |
| pequeno   | REFUSAL_REASON_FACE_TOO_SMALL |
| inclinado | REFUSAL_REASON_NOT_FRONTAL    |
| escuro    | REFUSAL_REASON_UNDEREXPOSED   |
| claro     | REFUSAL_REASON_OVEREXPOSED    |
| borrado   | REFUSAL_REASON_BLURRY         |
```

### Cenário 7 — Regra de fusão da vivacidade (exceção)

```gherkin
Dado as saídas em softmax [0,0, 0,52, 0,48] do MiniFASNetV2 e [0,0, 0,42, 0,58] do MiniFASNetV1SE
Quando a regra de fusão decide
Então a soma [0,0, 0,94, 1,06] tem argmax 2 e o quadro é recusado com `REFUSAL_REASON_SPOOF`
E com as saídas [0,0, 0,91, 0,09] e [0,0, 0,78, 0,22] o argmax é 1 e o quadro segue para o vetor
```

### Cenário 8 — Falha na emoção não recusa o quadro (exceção)

```gherkin
Dado o modelo de emoção trocado por uma sessão que lança `RuntimeError`
Quando o pipeline processa o quadro de referência com `PURPOSE_RECOGNITION`
Então a resposta traz `face` com 512 floats e sem `emotion`
E o log registra "emotion inference failed error=RuntimeError"
```

### Cenário 9 — Finalidade ausente (exceção)

```gherkin
Dado o worker no ar
Quando a API chama `ProcessFrame` com o quadro de referência e `PURPOSE_UNSPECIFIED`
Então a chamada falha com `INVALID_ARGUMENT` e a mensagem "purpose is required"
E nenhum modelo roda
```

### Cenário 10 — Quadro acima do limite (exceção)

```gherkin
Dado o worker no ar
Quando a API envia uma mensagem de 1 048 577 bytes
Então a chamada falha com `RESOURCE_EXHAUSTED`
E nenhum modelo roda
```

### Cenário 11 — Chamada cancelada para entre etapas (exceção)

```gherkin
Dado o evento de cancelamento já marcado
Quando o pipeline recebe o quadro de referência
Então nenhuma etapa roda
E o log registra "inference cancelled stage=decode"
```

### Cenário 12 — Exceção não prevista numa etapa (exceção)

```gherkin
Dado o modelo de vetor trocado por uma sessão que lança `RuntimeError`
Quando a API chama `ProcessFrame` com o quadro de referência e `PURPOSE_ENROLLMENT`
Então a chamada falha com `INTERNAL` e a mensagem "inference failed"
E o log registra "inference failed stage=vector error=RuntimeError"
E o worker atende a chamada seguinte normalmente
```

### Cenário 13 — Ambiente incompleto impede a inicialização (exceção)

```gherkin
Dado o ambiente do worker sem `WORKER_PORT`
Quando `uv run serve` inicia
Então o processo encerra com código diferente de zero e com `KeyError: 'WORKER_PORT'`
E nenhuma porta é aberta
E, dado o ambiente da API sem `WORKER_ADDRESS`, a API encerra com "Config validation error:" e a linha "WORKER_ADDRESS: Invalid input: expected string, received undefined"
```

### Cenário 14 — Cliente da API devolve a resposta do worker

```gherkin
Dado um servidor gRPC falso, montado a partir de `proto/`, que responde `face` com 512 floats e a emoção `EMOTION_LABEL_NEUTRAL` de confiança 0,8
Quando o `InferenceClient.processFrame` é chamado com um `Buffer` e `PURPOSE_RECOGNITION`
Então a promessa resolve com o `vector` de 512 floats e a emoção `EMOTION_LABEL_NEUTRAL` de confiança 0,8
E o servidor falso recebeu o mesmo `Buffer` e a mesma finalidade
```

### Cenário 15 — Prazo vencido cancela a chamada (exceção)

```gherkin
Dado um servidor gRPC falso que nunca responde
Quando o `InferenceClient.processFrame` é chamado
Então a promessa rejeita com `TimeoutError` depois de 2000 ms
E o servidor falso vê a chamada cancelada
```

### Cenário 16 — Contrato gerado diverge do `.proto` (exceção)

```gherkin
Dado um Pull Request que muda `proto/vultra/inference/v1/inference.proto` sem regenerar o código
Quando o CI roda
Então o `worker.yml` e o `api.yml` falham no `git diff --exit-code` depois da regeneração
E um `.proto` fora das regras `STANDARD` falha no `buf lint` do `api.yml`
```

### Cenário 17 — Modelos antes da porta, só no endereço configurado

```gherkin
Dado o ambiente do worker com `WORKER_HOST` igual a `127.0.0.1` e os 5 modelos em `PIPELINE_MODEL_DIR`
Quando `uv run serve` inicia
Então o log registra "models loaded from <PIPELINE_MODEL_DIR>" antes de "listening on 127.0.0.1:<WORKER_PORT>"
E só os 5 arquivos do `MODEL_SHA256` são abertos
E, com um dos modelos apagado, o processo encerra com código diferente de zero sem registrar "listening on"
```

---

## Impacto na arquitetura

- **[Worker](../../architecture/building-blocks/worker.md):** ganha o serviço
  `vultra.inference.v1.InferenceService/ProcessFrame`, a ordem das etapas com os motivos de recusa, a
  vivacidade pela soma dos dois modelos, o processamento de um quadro por vez com cancelamento entre
  etapas, o comando `serve` e as variáveis `WORKER_HOST` e `WORKER_PORT`. E1.
- **[API](../../architecture/building-blocks/api.md):** ganha o `InferenceClient` em
  `src/common/inference`, que o `biometrics` e o `recognition` vão usar no #6, com o prazo de 2000 ms e a
  variável `WORKER_ADDRESS`. O diagrama de componentes já mostra a chamada gRPC dos módulos ao Worker e
  não muda. E1.
- **[Implantação](../../architecture/deployment.md):** o CI ganha o `worker.yml`, e o `api.yml` passa a
  disparar com `proto/**`. E1.
- **[Cenários de execução](../../architecture/runtime/README.md):** o passo do Worker no cadastro e no
  reconhecimento não muda. A recusa já encerra o cenário com o motivo.

## Impacto no modelo de dados

N/A. Nada é gravado neste épico. Os conjuntos fechados de `RefusalReason` e `EmotionLabel` são os
domínios que o #6 vai gravar no evento de reconhecimento.

## Fora do escopo

- Chamar o `InferenceClient`, gravar cadastro, evento, emoção e auditoria, e transformar timeout e
  `UNAVAILABLE` em desfecho registrado: #6, que cobre FR-BIO-01, FR-AFF-02, FR-GOV-01 e NFR-REL-01.
- O orçamento de latência e o prazo definitivo: [OQ-03](../../requirements/open-questions.md#oq-03), no
  #7. Até lá o prazo é 2000 ms.
- A calibração dos seis limiares de qualidade contra a ESP32-CAM instalada: depende do quadro real que o
  #5 entrega e não tem issue.
- A taxa de bloqueio de foto e tela e o harness do artigo:
  [OQ-06](../../requirements/open-questions.md#oq-06) e `docs/research/`.
- Dockerfile do worker, o `.proto` dentro da imagem da API e o healthcheck do contêiner: #7.
- TLS ou mTLS entre a API e o worker: o canal fica em `127.0.0.1` ou na rede interna, e nenhum requisito
  pede cifra nesse trecho.
- Serviço de saúde gRPC: os modelos carregam antes de a porta abrir, e a API descobre o worker fora do ar
  pelo `UNAVAILABLE`.
- Limiar de abstenção da emoção e limiar de qualidade mais duro no cadastro: nenhum requisito pede, e
  mudariam a distribuição que o artigo mede.
- GPU: o alvo é CPU, e só o `onnxruntime` de CPU está instalado.
- Mais de um rosto por quadro: a [BR-02](../../requirements/business-rules.md#br-02) recusa.

## Tarefas

| # | Issue | Título | Escopo | Critério de aceite | Depende de |
| --- | --- | --- | --- | --- | --- |
| 1 | [#13](https://github.com/Vultra-Facial-Attendence/vultra/issues/13) | Servir quadros aceitos pelo contrato de inferência | `proto/vultra/inference/v1/inference.proto`, `proto/buf.yaml`, `apps/worker/pipeline/contract/` (gerado), `pipeline/server.py`, `pipeline/models.py`, `pipeline/process_frame.py`, `pipeline/detection.py`, `pipeline/vector.py`, `pyproject.toml`, `uv.lock`, `.env.example`, `apps/worker/AGENTS.md`, `tests/`, `.github/workflows/worker.yml`, cerca de 16 arquivos | Cenários 2, 3, 4, 5, 9, 10, 11, 12, 13 (lado do worker) e 17 | — |
| 2 | [#14](https://github.com/Vultra-Facial-Attendence/vultra/issues/14) | Chamar o worker pela API com prazo | `apps/api/buf.gen.yaml`, `src/common/inference/contract/` (gerado), `inference.module.ts`, `inference.client.ts`, `src/core/config/environment.ts`, `.env.example`, `package.json`, `bun.lock`, `nest-cli.json`, `test/common/inference.spec.ts`, `apps/api/AGENTS.md`, `.github/workflows/api.yml`, cerca de 13 arquivos | Cenários 13 (lado da API), 14, 15 e 16 | 1 |
| 3 | [#15](https://github.com/Vultra-Facial-Attendence/vultra/issues/15) | Recusar quadros por qualidade e vivacidade | `pipeline/quality.py`, `pipeline/liveness.py`, `pipeline/process_frame.py`, `tests/` | Cenários 6 e 7 | 1 |
| 4 | [#16](https://github.com/Vultra-Facial-Attendence/vultra/issues/16) | Inferir a expressão facial no reconhecimento | `pipeline/emotion.py`, `pipeline/process_frame.py`, `tests/` | Cenários 1 e 8 | 3 |
