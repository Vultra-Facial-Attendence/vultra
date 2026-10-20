# Redis

Imagem `redis:8.10.2-trixie`, com `maxmemory-policy noeviction` · estágio E1.

## O que faz

Guarda o estado da cota por câmera
([NFR-SEC-02](../../requirements/non-functional/security.md#nfr-sec-02)).

## O que nunca faz

- Carrega quadro.
- Libera uma requisição quando está fora do ar: a cota nega.

## Para mudar com segurança

- Qualquer uso novo do Redis precisa ser decidido em ADR, porque o dado guardado nele é gravado em
  disco pelo próprio Redis.
