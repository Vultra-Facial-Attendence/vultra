# Segurança

As regras estão nos requisitos [NFR-SEC](../../requirements/non-functional/security.md) e nas
[regras de negócio](../../requirements/business-rules.md). Esta página diz onde cada uma é imposta.

| Regra | Onde é imposta | Requisito |
| --- | --- | --- |
| Nada trafega sem TLS entre a câmera e a API | API, firmware e a borda em produção | NFR-SEC-01 |
| A câmera autentica com a própria chave, conferida no handshake e em cada mensagem | API | FR-DEV-01 |
| Revogar ou rotacionar a chave fecha a conexão aberta | API | FR-DEV-02, FR-DEV-03 |
| Cota por câmera, e Redis fora do ar nega | API e Redis | NFR-SEC-02 |
| Toda rota exige autenticação, a não ser as declaradas públicas, e a autorização nega por padrão | API | NFR-SEC-03 |
| Escrita vinda de outro site é recusada (CSRF) | API | [ADR 0002](../../decisions/0002-stack-do-frontend.md) |
| Segredo, chave e vetor ficam fora do repositório e do log | Todos os blocos | NFR-SEC-04 |
| Variável de ambiente ausente impede a inicialização | API, Worker e Painel | NFR-SEC-05 |
| Toda operação biométrica deixa registro de auditoria imutável, sem o conteúdo | API e PostgreSQL | FR-GOV-01 |
| O quadro nunca é persistido | API e Worker | BR-01 |

Uma regra só conta como atendida quando existe um teste que falha se o guard for removido.
