# Vultra — Especificação de Requisitos de Software

**Versão:** 1.0.0 · **Data:** 2026-10-20 · [Changelog](CHANGELOG.md)

## Propósito

O Vultra é o sistema de uma Iniciação Científica. Ele registra presença por reconhecimento facial a
partir de uma câmera ESP32-CAM, processa cada quadro apenas em memória e infere a expressão facial no
mesmo quadro. O sistema não é um produto: ele existe para ser o objeto que o artigo mede e para ser
demonstrado ao vivo. O que não sustenta o artigo nem a demonstração fica fora.

## Escopo

O trabalho é dividido em dois estágios. A coluna Milestone dos requisitos usa o código do estágio.

| Estágio | O que entrega | Prioridade |
| --- | --- | --- |
| **E1 — Núcleo** | A ESP32-CAM envia o quadro, a API o processa em memória, e saem reconhecimento facial e emoção, com as proteções de segurança desde o início. Sem tela. | Must |
| **E2 — Demonstração** | Sessão de chamada numa câmera e uma tela que a acompanha ao vivo, com presença e expressão facial. | Must |

**Fora de escopo**

- **Armazenar imagem facial.** O quadro existe apenas em memória; só o vetor derivado é guardado
  ([BR-01](business-rules.md#br-01)).
- **Várias instituições no mesmo sistema.** O Vultra atende uma instalação. O experimento de isolamento
  entre instituições do artigo roda no harness de pesquisa, com instituições sintéticas.
- **Professor, turma, matrícula, correção manual e relatório de frequência.** São operação de escola, não
  sustentam o artigo e não são necessários para demonstrar a presença.
- **Emoção agregada e entrega a outra equipe.** O sistema não é produto e não tem cliente para esse dado.
- **Importação de pessoas em lote.** A galeria grande do artigo é carregada pelo harness.
- **Interface e login da pessoa reconhecida.** Ela é titular do dado e não opera o sistema.
- **Integração com sistema cadastral externo.** Não há instituição parceira.
- **Vários rostos por quadro.** A câmera fica na porta e as pessoas passam uma a uma
  ([BR-02](business-rules.md#br-02)).
- **O harness de avaliação do artigo.** Injeta quadros de datasets públicos direto no pipeline e é
  artefato de pesquisa, não superfície do sistema. Vive em [`../research/`](../research/).

## Conteúdo

[Visão geral](overview.md) · [Glossário](glossary.md) · [Regras de negócio](business-rules.md) ·
[Questões abertas](open-questions.md)

## Requisitos

Todos foram aprovados por Theo em 2026-10-20.

### Funcionais

| ID | Nome | Prioridade | Status | Milestone |
| --- | --- | --- | --- | --- |
| [FR-REG-01](functional/registry.md#fr-reg-01) | Criar pessoa | Must | approved | E1 |
| [FR-DEV-01](functional/devices.md#fr-dev-01) | Registrar câmera | Must | approved | E1 |
| [FR-DEV-02](functional/devices.md#fr-dev-02) | Revogar credencial de câmera | Must | approved | E1 |
| [FR-DEV-03](functional/devices.md#fr-dev-03) | Rotacionar credencial de câmera | Must | approved | E1 |
| [FR-DEV-04](functional/devices.md#fr-dev-04) | Disparar captura sem interface | Must | approved | E1 |
| [FR-BIO-01](functional/biometrics.md#fr-bio-01) | Cadastrar rosto pela câmera | Must | approved | E1 |
| [FR-BIO-02](functional/biometrics.md#fr-bio-02) | Recusar quadro por qualidade | Must | approved | E1 |
| [FR-BIO-03](functional/biometrics.md#fr-bio-03) | Recusar captura sem vivacidade | Must | approved | E1 |
| [FR-BIO-04](functional/biometrics.md#fr-bio-04) | Revogar cadastro biométrico | Must | approved | E1 |
| [FR-REC-01](functional/recognition.md#fr-rec-01) | Registrar evento de reconhecimento | Must | approved | E1 |
| [FR-REC-02](functional/recognition.md#fr-rec-02) | Registrar evento sem identidade | Must | approved | E1 |
| [FR-AFF-01](functional/affective.md#fr-aff-01) | Inferir expressão facial | Must | approved | E1 |
| [FR-AFF-02](functional/affective.md#fr-aff-02) | Gravar emoção da pessoa reconhecida | Must | approved | E1 |
| [FR-ACC-01](functional/access.md#fr-acc-01) | Autenticar gestor | Must | approved | E1 |
| [FR-GOV-01](functional/governance.md#fr-gov-01) | Auditar operação biométrica | Must | approved | E1 |
| [FR-ATT-01](functional/attendance.md#fr-att-01) | Abrir sessão de chamada | Must | approved | E2 |
| [FR-ATT-02](functional/attendance.md#fr-att-02) | Encerrar sessão de chamada | Must | approved | E2 |
| [FR-ATT-03](functional/attendance.md#fr-att-03) | Registrar presença única por sessão | Must | approved | E2 |
| [FR-ATT-04](functional/attendance.md#fr-att-04) | Acompanhar a sessão ao vivo | Must | approved | E2 |

### Não funcionais

| ID | Nome | Prioridade | Status | Milestone |
| --- | --- | --- | --- | --- |
| [NFR-SEC-01](non-functional/security.md#nfr-sec-01) | TLS entre câmera e API | Must | approved | E1 |
| [NFR-SEC-02](non-functional/security.md#nfr-sec-02) | Cota que nega quando indisponível | Must | approved | E1 |
| [NFR-SEC-03](non-functional/security.md#nfr-sec-03) | Autorização que nega por padrão | Must | approved | E1 |
| [NFR-SEC-04](non-functional/security.md#nfr-sec-04) | Segredo fora do repositório e do log | Must | approved | E1 |
| [NFR-SEC-05](non-functional/security.md#nfr-sec-05) | Ambiente obrigatório na inicialização | Must | approved | E1 |
| [NFR-PERF-01](non-functional/performance.md#nfr-perf-01) | Latência da captura ao resultado | Must | approved | E1 |
| [NFR-PERF-02](non-functional/performance.md#nfr-perf-02) | Galeria de 10.000 pessoas | Must | approved | E1 |
| [NFR-REL-01](non-functional/reliability.md#nfr-rel-01) | Inferência indisponível é desfecho tratado | Must | approved | E1 |
| [NFR-FLEX-01](non-functional/flexibility.md#nfr-flex-01) | Mesmos artefatos em dois ambientes | Must | approved | E1 |
| [NFR-INTR-01](non-functional/interaction.md#nfr-intr-01) | Uso em largura de telefone | Must | approved | E2 |
| [NFR-INTR-02](non-functional/interaction.md#nfr-intr-02) | Quatro estados sem deslocamento | Must | approved | E2 |
| [NFR-INTR-03](non-functional/interaction.md#nfr-intr-03) | Operação por teclado | Must | approved | E2 |

### Regras de negócio

| ID | Nome | Status |
| --- | --- | --- |
| [BR-01](business-rules.md#br-01) | Imagem facial nunca é persistida | approved |
| [BR-02](business-rules.md#br-02) | Um rosto por quadro | approved |
| [BR-03](business-rules.md#br-03) | Só dados dos autores, públicos e sintéticos | approved |
| [BR-04](business-rules.md#br-04) | Emoção individual só na tela ao vivo | approved |
| [BR-05](business-rules.md#br-05) | Dado cadastral mínimo | approved |
