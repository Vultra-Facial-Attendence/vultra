# Roadmap

Status ao vivo: o [GitHub Project](https://github.com/orgs/Vultra-Facial-Attendence/projects/1) e os
[milestones](https://github.com/Vultra-Facial-Attendence/vultra/milestones).

## E1 — Núcleo

A ESP32-CAM envia o quadro, a API o processa em memória, e saem reconhecimento facial e emoção, com as
proteções de segurança desde o início. GitHub Milestone:
[E1 — Núcleo](https://github.com/Vultra-Facial-Attendence/vultra/milestone/1).

Os épicos estão na ordem de construção. O Acesso do gestor vem primeiro porque cria o esqueleto da API
de que os épicos C e D dependem.

| Épico | Issue | Cobre |
| --- | --- | --- |
| A · Acesso do gestor | [#3](https://github.com/Vultra-Facial-Attendence/vultra/issues/3) | FR-ACC-01, NFR-SEC-03, NFR-SEC-04, NFR-SEC-05 |
| B · Pipeline de inferência de um quadro | [#4](https://github.com/Vultra-Facial-Attendence/vultra/issues/4) | FR-BIO-02, FR-BIO-03, FR-AFF-01 |
| C · Câmera registrada e captura disparada | [#5](https://github.com/Vultra-Facial-Attendence/vultra/issues/5) | FR-DEV-01, FR-DEV-02, FR-DEV-03, FR-DEV-04, NFR-SEC-01, NFR-SEC-02 |
| D · Cadastro e reconhecimento | [#6](https://github.com/Vultra-Facial-Attendence/vultra/issues/6) | FR-REG-01, FR-BIO-01, FR-BIO-04, FR-REC-01, FR-REC-02, FR-AFF-02, FR-GOV-01, NFR-REL-01 |
| E · Núcleo medido nos dois ambientes | [#7](https://github.com/Vultra-Facial-Attendence/vultra/issues/7) | NFR-PERF-01, NFR-PERF-02, NFR-FLEX-01 |

O E2 é planejado quando o E1 fechar.

## Cobertura dos requisitos

Cada requisito aprovado de um milestone planejado pertence a exatamente um épico.

| Requisito | Épico | Milestone |
| --- | --- | --- |
| [FR-ACC-01](../requirements/functional/access.md#fr-acc-01) | A | E1 |
| [NFR-SEC-03](../requirements/non-functional/security.md#nfr-sec-03) | A | E1 |
| [NFR-SEC-04](../requirements/non-functional/security.md#nfr-sec-04) | A | E1 |
| [NFR-SEC-05](../requirements/non-functional/security.md#nfr-sec-05) | A | E1 |
| [FR-BIO-02](../requirements/functional/biometrics.md#fr-bio-02) | B | E1 |
| [FR-BIO-03](../requirements/functional/biometrics.md#fr-bio-03) | B | E1 |
| [FR-AFF-01](../requirements/functional/affective.md#fr-aff-01) | B | E1 |
| [FR-DEV-01](../requirements/functional/devices.md#fr-dev-01) | C | E1 |
| [FR-DEV-02](../requirements/functional/devices.md#fr-dev-02) | C | E1 |
| [FR-DEV-03](../requirements/functional/devices.md#fr-dev-03) | C | E1 |
| [FR-DEV-04](../requirements/functional/devices.md#fr-dev-04) | C | E1 |
| [NFR-SEC-01](../requirements/non-functional/security.md#nfr-sec-01) | C | E1 |
| [NFR-SEC-02](../requirements/non-functional/security.md#nfr-sec-02) | C | E1 |
| [FR-REG-01](../requirements/functional/registry.md#fr-reg-01) | D | E1 |
| [FR-BIO-01](../requirements/functional/biometrics.md#fr-bio-01) | D | E1 |
| [FR-BIO-04](../requirements/functional/biometrics.md#fr-bio-04) | D | E1 |
| [FR-REC-01](../requirements/functional/recognition.md#fr-rec-01) | D | E1 |
| [FR-REC-02](../requirements/functional/recognition.md#fr-rec-02) | D | E1 |
| [FR-AFF-02](../requirements/functional/affective.md#fr-aff-02) | D | E1 |
| [FR-GOV-01](../requirements/functional/governance.md#fr-gov-01) | D | E1 |
| [NFR-REL-01](../requirements/non-functional/reliability.md#nfr-rel-01) | D | E1 |
| [NFR-PERF-01](../requirements/non-functional/performance.md#nfr-perf-01) | E | E1 |
| [NFR-PERF-02](../requirements/non-functional/performance.md#nfr-perf-02) | E | E1 |
| [NFR-FLEX-01](../requirements/non-functional/flexibility.md#nfr-flex-01) | E | E1 |

## Sprints

- [Sprint 1](sprints/sprint-01.md): o gestor se autentica na API local, e toda rota de dado nega sem
  sessão.
