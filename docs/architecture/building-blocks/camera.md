# Câmera

`esp32-cam` · AI-Thinker ESP32-CAM, firmware C++ sobre ESP-IDF 6.1 · estágio E1 · existe o firmware de
bancada, que envia um quadro a cada 2 s sem credencial nem comando de captura.

## O que faz

Fica na porta da sala. Abre uma conexão WebSocket sobre TLS com a API e se autentica com a própria
chave. Recebe o comando de captura com a finalidade e devolve o quadro JPEG como mensagem binária pela
mesma conexão.

## O que nunca faz

- Envia quadro ou chave sem TLS ([NFR-SEC-01](../../requirements/non-functional/security.md#nfr-sec-01)).
- Guarda o quadro depois de enviá-lo.
- Decide identidade. Toda inferência acontece no servidor.

## Para mudar com segurança

- No ambiente local a câmera valida a API pela CA do projeto, fixada no firmware. Trocar a CA exige
  regravar o aparelho.
- Atrás da Cloudflare, o firmware valida pelo pacote de CAs raiz do ESP-IDF (`esp_crt_bundle`) e manda
  uma mensagem de aplicação em menos de 100 s, porque a Cloudflare fecha o WebSocket ocioso
  ([0003](../../decisions/0003-repositorio-e-infraestrutura.md)).
- Com a câmera ligada, o rádio da placa precisa de sinal melhor que cerca de -60 dBm. A linha
  `wifi connected rssi=` do boot mostra o sinal no ponto de instalação.
