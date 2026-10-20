# Documentação do Vultra

Cada pasta trata de um assunto e abre com um `README.md` que lista o que ela guarda.

| Pasta | O que guarda |
| --- | --- |
| [requirements/](requirements/README.md) | O SRS versionado: requisitos, regras de negócio e questões abertas |
| [decisions/](decisions/README.md) | Os ADRs, com o motivo de cada decisão que cruza áreas |
| [research/](research/README.md) | O pré-registro do experimento do artigo |

Cada diagrama fica na pasta `diagrams/` do documento que ele ilustra, como `.drawio.svg`. Ele abre e é
editado no VS Code pela extensão `hediet.vscode-drawio`.

## Abrir o site local

A documentação é lida localmente e não é publicada.

```
uvx zensical==0.0.71 serve --open
```

O site abre em `http://localhost:8000`. No VS Code, a tarefa `docs: serve` roda o mesmo comando.
