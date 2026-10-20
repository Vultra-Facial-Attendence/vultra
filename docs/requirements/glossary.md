# Glossário

| Termo | Significado |
| --- | --- |
| **Pessoa** | Registro mínimo de alguém que pode ter o rosto cadastrado: identificador externo e nome. |
| **Gestor** | Usuário que administra pessoas, câmeras, cadastros biométricos e sessões de chamada. |
| **Câmera** | Uma ESP32-CAM registrada no sistema, com credencial própria. |
| **Quadro** | A imagem de uma captura, existente apenas em memória durante o processamento. |
| **Captura** | O ato de a câmera obter um quadro e enviá-lo, com a finalidade de cadastro ou de reconhecimento. |
| **Vetor** | Representação numérica do rosto derivada do quadro; o único dado biométrico guardado. |
| **Cadastro biométrico** | O vínculo entre uma pessoa e o vetor do rosto dela. |
| **Galeria** | O conjunto de cadastros biométricos ativos. |
| **Reconhecimento** | Comparação 1:N do vetor de uma captura contra a galeria. |
| **Evento de reconhecimento** | O registro de um reconhecimento: pessoa, instante, câmera e confiança; sem pessoa quando não há correspondência. |
| **Vivacidade** | Evidência de que o quadro vem de uma pessoa fisicamente presente, e não de foto ou tela. |
| **Emoção** | O rótulo de expressão facial inferido de um quadro, com a confiança da inferência. |
| **Sessão de chamada** | O intervalo, aberto e encerrado pelo gestor numa câmera, em que os eventos de reconhecimento dela viram presença. |
| **Presença** | O registro de que uma pessoa foi reconhecida durante uma sessão de chamada. |
| **Tela ao vivo** | A tela que acompanha uma sessão de chamada aberta, usada na demonstração. |
| **Estágio** | Uma das duas etapas de entrega: E1 núcleo, E2 demonstração. |
