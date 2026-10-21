# 0004. Canal da câmera por WebSocket sobre TLS

- Status: accepted
- Date: 2026-10-20
- Requisitos: FR-DEV-01, FR-DEV-04, FR-BIO-01, FR-REC-01, NFR-SEC-01, NFR-PERF-01

## Contexto

A captura é disparada sem interface ([FR-DEV-04](../requirements/functional/devices.md#fr-dev-04)), o
quadro só trafega sobre TLS ([NFR-SEC-01](../requirements/non-functional/security.md#nfr-sec-01)), e o
artigo mede o tempo da captura ao resultado
([NFR-PERF-01](../requirements/non-functional/performance.md#nfr-perf-01)).

Uma requisição HTTPS avulsa refaz o handshake TLS. Se o canal repete o handshake a cada captura, o custo
dele entra na latência que o artigo reporta.

## Decisão

**Cada câmera mantém uma conexão WebSocket sobre TLS com a API.** A câmera abre a conexão e se autentica
com a própria chave ([FR-DEV-01](../requirements/functional/devices.md#fr-dev-01)). A API envia o comando
de captura com a finalidade, e a câmera devolve o quadro JPEG como mensagem binária pela mesma conexão.

**No ambiente local, a câmera valida a API pela CA do projeto, fixada no firmware.** Atrás da
Cloudflare, ela valida pelo pacote de CAs raiz do ESP-IDF, como decide o
[ADR 0003](0003-repositorio-e-infraestrutura.md).

O cliente é o `esp_websocket_client` da Espressif.

## Teste de bancada

A decisão dependia de um teste na ESP32-CAM real. Ele foi feito em 2026-10-08, no repositório anterior,
com o mesmo firmware que está em `esp32-cam`.

| Item | Valor |
| --- | --- |
| Placa | AI-Thinker ESP32-CAM, OV2640, PSRAM, flash de 4 MB |
| Versões | ESP-IDF v6.1, `esp_websocket_client` 1.8.0, `esp32-camera` 2.1.8, mbedTLS 4.1.0 |
| Quadro | VGA em JPEG, de 11 a 16 kB |
| Sinal do Wi-Fi | -57 dBm |

| Critério | Medido | Resultado |
| --- | --- | --- |
| 1. `wss://` com o certificado fixado | canal aberto em 2917 ms, contando TCP, TLS e upgrade HTTP | aprovado |
| 1. Servidor assinado por outra CA | 22 tentativas recusadas com `MBEDTLS_ERR_X509_CERT_VERIFY_FAILED`, nenhum quadro enviado | aprovado |
| 2. Quadro como mensagem binária | 160 quadros em 330 s, todos íntegros, nenhuma falha de envio, nenhum reset | aprovado |
| 2. Memória | heap interno livre de 157075 bytes depois do quadro 1 e 151571 depois do quadro 100, variação de 3,5%; mínimo desde o boot de 116148 bytes | aprovado |
| 3. Reconexão após queda da rede | a placa reassociou e voltou a enviar sozinha depois de perder o ponto de acesso; o tempo não foi medido | pendente |

Theo aceitou a decisão em 2026-10-08 com o critério 3 pendente. A reconexão automática foi observada, mas
o tempo dela, com limite de 30 s, não foi medido.

Com a câmera ligada, o rádio da placa perde margem. Com sinal de -64 a -70 dBm, o canal abriu em 5 a
16 s, os envios estouraram o tempo e a placa perdeu o ponto de acesso. No mesmo enlace, sem a câmera, o
firmware entregou um quadro de 12 kB a cada 2 s sem falha. Baixar o clock da câmera de 20 para 10 MHz
não mudou nada, e não se descobriu se a causa é a alimentação ou interferência.

O firmware importado para este repositório foi gravado de novo em 2026-10-20. A -59 dBm, o canal abriu
em 3004 ms e 27 quadros chegaram íntegros em 90 s, com heap mínimo de 117236 bytes. Nos primeiros 30 s
os quadros saíram com 7 a 10 s de intervalo, e o canal caiu uma vez e reabriu sozinho em 2712 ms.

## Consequências

- O handshake TLS acontece uma vez por conexão, e não a cada captura.
- O mesmo canal serve à captura contínua da sessão de chamada no E2, sem protocolo novo.
- A API mantém conexões longas. Ela precisa detectar câmera desconectada e recusar o disparo para ela
  com um desfecho tratado.
- Revogar ou rotacionar a chave da câmera derruba a conexão aberta
  ([FR-DEV-02](../requirements/functional/devices.md#fr-dev-02),
  [FR-DEV-03](../requirements/functional/devices.md#fr-dev-03)).
- O firmware é mais complexo que um cliente HTTP, porque mantém a conexão, reconecta e trata mensagens.
- A CA local precisa ser gerada e gravada no firmware antes do primeiro teste local.
- No ponto de instalação, a câmera precisa de sinal melhor que cerca de -60 dBm. Abaixo disso o canal
  não sustenta a captura.

## Alternativas consideradas

| Alternativa | Por que foi rejeitada |
| --- | --- |
| HTTPS com consulta periódica de comandos | O firmware fica mais simples, mas o disparo atrasa até a próxima consulta e cada captura avulsa paga um handshake. Era o plano B caso o teste de bancada falhasse. |
| MQTT sobre TLS para os comandos e HTTPS para o quadro | Exige um broker e mantém dois canais por câmera. |
| HTTP sem TLS na rede local | O NFR-SEC-01 proíbe: o quadro e a chave trafegariam legíveis. |
