# Visão geral

## Stakeholders

| Stakeholder | Quem é | Relação com o sistema |
| --- | --- | --- |
| **Autor** | Theo Odawara | Autor do sistema e do artigo; único com acesso ao repositório |
| **Orientador** | Supervisão acadêmica da Iniciação Científica | Valida a direção da pesquisa e o conteúdo do artigo |
| **Banca e público da demonstração** | Quem assiste à demonstração ao vivo | Vê a câmera reconhecer e a presença aparecer na tela |
| **Gestor** | Quem opera o sistema, na prática o autor | Cadastra pessoas e câmeras, dispara capturas, abre a sessão de chamada |
| **Pessoa reconhecida** | Titular do dado biométrico e de emoção | Não opera o sistema; é reconhecida pela câmera |

## Ambiente operacional

- **Captura:** câmera ESP32-CAM instalada na porta da sala, uma pessoa por vez.
- **Processamento:** o sistema roda em dois ambientes a partir dos mesmos artefatos
  ([NFR-FLEX-01](non-functional/flexibility.md#nfr-flex-01)): uma máquina local na mesma rede da
  câmera, onde se mede, e um servidor na nuvem, onde se demonstra.
- **Stack:** decidida nos ADRs em `docs/decisions/`.

## Restrições

- **O trabalho acadêmico é o foco.** Capacidade que não sustenta o artigo nem a demonstração fica fora.
- **Prazo.** O alvo é dezembro de 2026; o limite é meados de 2027.
- **Ordem de construção.** E1 antes de E2. Nada da tela começa antes de o núcleo funcionar de ponta a
  ponta.
- **Uma pessoa.** Não há revisão de um segundo integrante, então o portão de qualidade é automático e
  conclusão não é auto-declarada.
- **Dados.** Só os do autor, públicos e sintéticos ([BR-03](business-rules.md#br-03)).
- **Segurança e desempenho não são adiados por prazo.** As proteções do E1 nascem com o núcleo.

## Premissas e dependências

- **O artigo é uma arquitetura de referência avaliada no pipeline real**, com o experimento de
  isolamento entre instituições sobre busca vetorial como seção, medido no harness. É hipótese de
  trabalho até [OQ-01](open-questions.md#oq-01) fechar.
- **O pré-registro em [`../research/pre-registro.md`](../research/pre-registro.md) continua valendo
  para a seção experimental.** O enquadramento do artigo como arquitetura de referência é um desvio a
  registrar nele.
- **A avaliação com dataset público não passa pela câmera.** Ela depende de um harness de pesquisa,
  fora deste SRS.
- **Uso com pessoas além do autor depende de decisão ética e de base legal**, e nenhuma das duas existe
  ([OQ-02](open-questions.md#oq-02), [OQ-04](open-questions.md#oq-04)).
