# apps/worker

O worker de inferência: o pipeline de um quadro e, quando existir, o servidor `grpc.aio` que o expõe à
API. Soma-se ao `AGENTS.md` da raiz e não o contradiz.

## Estado real

Existem o projeto `uv`, com as cinco bibliotecas de inferência instaladas, e o comando `download-models`,
importados do repositório anterior sem mudança de código. `process_frame` não existe: nenhuma etapa de
inferência foi escrita, e nenhum código importa ainda as bibliotecas de inferência. O servidor gRPC e o
`grpcio` do [ADR 0001](../../docs/decisions/0001-stack-do-backend.md) também não. A Release `models-v1`
deste repositório ainda não foi publicada: até lá, o `download-models` falha com `HTTPError 404` no
primeiro ONNX do MiniFASNet. Não há teste nem pasta `tests/`.

## Stack

Projeto `uv` próprio, com `pyproject.toml` e `uv.lock`, fora dos workspaces do Bun. O código fica em
`pipeline/`, sem `src/`, e é empacotado com o `uv_build`, que exige o `pipeline/__init__.py`, para o
`uv sync` instalar o executável `download-models` e para o harness de `docs/research` importar
`pipeline`. Python 3.13, que o `uv` instala sozinho no primeiro `uv sync`. As versões exatas estão no
`pyproject.toml`.

`insightface` declara `opencv-python`; `override-dependencies` em `[tool.uv]` a tira da resolução, e só a
`opencv-python-headless` é instalada.

## Comandos

Todos executados dentro de `apps/worker`. No VS Code, a tarefa `worker: gates` roda os três gates.

```
uv sync
uv run ruff check
uv run ruff format --check
uv run mypy
uv run download-models
```

O `mypy` roda em modo `strict` sobre `pipeline`. O `pytest` está instalado e configurado para tratar aviso
como erro, mas sem nenhum teste ele encerra com código 5, por isso ainda não é gate.

## Modelos

`download-models` lê o diretório de `PIPELINE_MODEL_DIR`, que precisa existir, e deixa nele os cinco
arquivos de `MODEL_SHA256`:

- Baixa só o que falta. O `buffalo_l.zip`, de 288 MB, só é baixado quando falta `det_10g.onnx` ou
  `w600k_r50.onnx`; ele vai para um arquivo temporário no próprio diretório, tem o SHA-256 conferido e
  some ao fim.
- Confere o SHA-256 dos cinco e imprime `models ready: <diretório>`.
- Com um SHA-256 diferente, apaga o arquivo, imprime `checksum mismatch: <arquivo>` e encerra com código
  1. Rodar de novo baixa o que foi apagado. Um download interrompido segue o mesmo caminho.
- Sem a variável, o comando encerra com o `KeyError` do próprio Python.

Os dois ONNX do MiniFASNet vêm da Release `models-v1` deste repositório, gerados por
`docs/research/liveness/convert_minifasnet.py`. O modelo de emoção vem do
OpenCV Zoo por `media.githubusercontent.com`: o arquivo está em Git LFS, e `raw.githubusercontent.com`
devolve só o ponteiro. Nenhum peso entra no git.

## Arquitetura

```
pipeline/download_models.py   o comando `download-models`: a tabela de modelos, o download e a conferência
```

Funções e dados. O worker não acessa banco nem Redis, não conhece `apps/api` e não grava o quadro em
lugar nenhum. A rede só é usada pelo `download-models`.
