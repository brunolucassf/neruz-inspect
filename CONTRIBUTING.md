# Contribuir com o Neruz Inspect

Obrigado por querer ajudar. Issues e pull requests são bem-vindos. Para mudanças grandes, abra uma issue antes, para alinharmos a ideia antes do código.

## Antes de abrir um PR

1. Instale as dependências com `pnpm install` (Node 22.23.4 ou mais novo, pnpm 12).
2. Rode as checagens: `pnpm lint && pnpm typecheck && pnpm test`.
3. Gere as duas versões da extensão para confirmar que o build passa: `pnpm build:ext` e `pnpm build:ext:firefox`.
4. Descreva no PR o que muda e por quê, e como você testou no navegador.

## Regras do código

- Sem comentários no código. Nomes de variáveis, funções e arquivos devem explicar o que fazem.
- Funções puras (parsers, conversões, detecção) ficam em arquivos `.ts` separados, com teste Vitest `*.test.ts` ao lado.
- Nada de `innerHTML` com conteúdo da página, nem `eval` ou `new Function`.
- Sem rede própria. Só há conexão quando a pessoa pede (checar links, baixar arquivos de outros domínios, carregar uma fonte do Google).
- Estilo só com as variáveis `--ni-*` e as classes `ni-*`. Não altere os tokens em `packages/ui`.
- Respeite `prefers-reduced-motion`, mantenha tudo operável por teclado e com foco visível.

## Textos e idiomas

- O português (pt-BR) é a fonte. Inglês e espanhol são escritos nativamente em cada idioma, nunca como tradução literal.
- Cada ferramenta precisa de `name`, `desc` e `keywords` nos três idiomas. Os testes de `apps/inspect/src/i18n/messages.test.ts` falham se faltar alguma chave.

## Criar uma ferramenta nova

O passo a passo está em [apps/inspect/src/tools/COMO-CRIAR-FERRAMENTA.md](apps/inspect/src/tools/COMO-CRIAR-FERRAMENTA.md). A arquitetura e os contratos estão em [docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Licença

O projeto é distribuído sob a [licença MIT](LICENSE). Ao enviar uma contribuição, ela segue essa mesma licença.

## Vulnerabilidades

Canal para reportar vulnerabilidades: a definir. Até lá, não publique detalhes de falhas de segurança em issues públicas.
