# Padrões de acesso

As operações que os requisitos pedem ao modelo. O volume só é conhecido onde um requisito o fixa. O
restante sai da medição de [OQ-03](../requirements/open-questions.md#oq-03).

| Operação | Lê ou escreve | Filtro e ordem | Volume |
| --- | --- | --- | --- |
| Comparar o vetor de uma captura com a galeria | Lê Cadastro biométrico | Vizinho mais próximo por distância de cosseno | 10.000 cadastros ([NFR-PERF-02](../requirements/non-functional/performance.md#nfr-perf-02)) |
| Gravar evento de reconhecimento | Escreve Evento e Registro de auditoria | — | Um por captura |
| Criar cadastro biométrico | Escreve Cadastro e Registro de auditoria | Pessoa sem cadastro | Um por pessoa |
| Revogar cadastro biométrico | Escreve Cadastro e Registro de auditoria | Pessoa | Esporádico |
| Autenticar câmera | Lê Câmera | Chave | Um no handshake e um por mensagem |
| Criar pessoa | Escreve Pessoa | Unicidade do identificador externo | Até 10.000 |
| Abrir sessão de chamada (E2) | Escreve Sessão | Nenhuma sessão aberta na câmera | Uma por demonstração |
| Registrar presença (E2) | Escreve Presença | Sessão aberta da câmera; unicidade por pessoa e sessão | Uma por pessoa e sessão |
| Ler a tela ao vivo (E2) | Lê Sessão, Presença e Evento | Sessão; eventos mais recentes da câmera primeiro | Uma leitura por intervalo de polling |
