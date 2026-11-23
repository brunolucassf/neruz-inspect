# Decisões · Neruz Inspect

Registro das decisões materiais do projeto, no formato de ADR (contexto, decisão, alternativas, consequências). Cada decisão tem data e status. Para contratos técnicos detalhados, ver [ARQUITETURA](ARQUITETURA.md).

| ADR | Decisão | Status | Data |
| --- | --- | --- | --- |
| 001 | Stack herdada do Neruz Page View | Aceita | 2026-11-22 |
| 002 | Assinatura visual própria, por licença MIT | Aceita | 2026-11-22 |
| 003 | Sem IA e sem telemetria | Aceita | 2026-11-22 |
| 004 | Permissões mínimas com `activeTab` | Aceita | 2026-11-22 |
| 005 | Barra flutuante e painel lateral sobre a página | Aceita | 2026-11-22 |
| 006 | Relatório em PDF pelo `window.print()` | Aceita | 2026-11-22 |

---

## ADR-001 · Stack herdada do Neruz Page View

**Data:** 2026-11-22 (registrada nesta versão; a stack vem do Page View).

**Contexto.** O Inspect e o Page View são extensões da mesma família, com o mesmo autor e a mesma exigência: rodar em Chrome, Edge, Opera, Brave e Firefox a partir de um único código.

**Decisão.** Reaproveitar a stack do Page View: pnpm workspaces, WXT (extensão Manifest V3), React, TypeScript, Biome para lint, Vitest para testes. Node 22.23.4 ou mais novo, pnpm 12. Versões exatas, sem `^`, em pacotes novos. A landing segue o mesmo padrão com Astro, Three.js, GSAP e Lenis.

**Alternativas.** A definir: as alternativas não foram registradas na época.

**Consequências.**
- Ferramentas, scripts e fluxo de contribuição são iguais aos do Page View, o que facilita manter os dois projetos.
- Atualizações de versão são feitas em conjunto e devem ser testadas nos dois navegadores-alvo.
- Os pacotes `packages/core`, `packages/i18n`, `packages/ui` e `packages/config` são compartilhados entre os apps do monorepo.

---

## ADR-002 · Assinatura visual própria, por licença MIT

**Data:** 2026-11-22.

**Contexto.** O código é público e distribuído sob a licença MIT. A família Neruz tem uma cor de assinatura por produto: ciano no Page View e magenta (#FF4FD0) no Inspect, sobre a mesma base Noite (#080D14).

**Decisão.** Ícones, cores, banners e símbolos são próprios do projeto. A interface, a landing e a documentação não usam logos de frameworks nem de marcas de terceiros. Nomes de concorrentes não aparecem em textos do produto. O ciano não é usado no Inspect.

**Alternativas.**
- Usar logos de frameworks para identificar tecnologias. Descartada: a detecção de tecnologias mostra o nome em texto, sem marca de terceiros.
- Usar a cor ciano do Page View. Descartada: cada produto da família tem sua própria assinatura.

**Consequências.**
- Menos risco de conflito de marca ou de licença com ativos de terceiros, num projeto aberto.
- Manter a identidade própria exige cuidado nos novos ícones e banners (ver `docs/assets`).
- Os banners da Fonte Dev reaproveitam a arte do Page View, que é do mesmo autor.

---

## ADR-003 · Sem IA e sem telemetria

**Data:** 2026-11-22.

**Contexto.** A extensão lê o conteúdo de páginas inteiras, inclusive tags de rastreamento e cookies. O público (devs, designers, agências) desconfia de qualquer envio de dados. Por isso a promessa de privacidade precisa valer na arquitetura, não só na política.

**Decisão.**
- Nenhum recurso de IA no produto.
- Nenhuma telemetria, analytics, conta de usuário nem servidor próprio.
- "Zero rede própria": a extensão só se conecta quando a pessoa pede (checar links ou baixar arquivos de outros domínios; carregar uma fonte do Google em "Testar fonte").
- Preferências e histórico de cópias ficam no `storage` local do navegador.

**Alternativas.** A definir: as alternativas não foram registradas.

**Consequências.**
- Não há como medir uso ou instalações pelo produto. Números de usuários só existirão se vierem de fontes públicas das lojas.
- A política de privacidade pode ser curta e verificável no código. O documento `docs/PRIVACIDADE.md` ainda não existe e está pendente.
- Quem audita o projeto pode confirmar a promessa pelo código-fonte, que é público (MIT).

---

## ADR-004 · Permissões mínimas com `activeTab`

**Data:** 2026-11-22.

**Contexto.** A extensão precisa ler e alterar a página só quando a pessoa pede. Permissões amplas, como acesso a todos os sites, assustam quem instala e pesam na revisão das lojas.

**Decisão.**
- Obrigatórias: `storage`, `scripting`, `activeTab`.
- Opcionais: `clipboardWrite`, e `http://*/*` e `https://*/*`. Os hosts são pedidos somente em gesto do usuário, na página de relatório ou de opções.
- Não usar `<all_urls>` obrigatório, `debugger`, `cookies`, `webRequest` nem `tabs`.
- O script é injetado na aba atual, sob demanda, pelo clique no ícone ou pelo atalho `Alt+Shift+I`. Ativar de novo desmonta a barra.

**Alternativas.** Acesso permanente a todos os sites com `<all_urls>`. Descartada: a extensão deixaria de depender de um gesto do usuário e pediria mais do que precisa.

**Consequências.**
- Cada uso exige um gesto do usuário na aba. A extensão não enxerga outras abas.
- Checar links de outros domínios depende da permissão opcional. Sem ela, a ferramenta mostra só o que consegue ler, com aviso.
- Na justificativa das lojas, cada permissão precisa de uma frase de "por quê" (ver a seção de permissões do README).

---

## ADR-005 · Barra flutuante e painel lateral sobre a página

**Data:** 2026-11-22.

**Contexto.** As ferramentas precisam atuar sobre a própria página: medir elementos, destacar caixas, mostrar distâncias. O resultado precisa ficar visível ao lado do que foi inspecionado, e o site não pode ser alterado de forma permanente.

**Decisão.**
- A interface é um overlay em React dentro de Shadow DOM, com z-index máximo e CSS isolado.
- A barra flutuante tem alça de arrastar, os 8 grupos, busca (`/`) e o chip da ferramenta ativa.
- Ao escolher uma ferramenta, um painel lateral de 340 px abre, encaixado à esquerda ou à direita.
- A camada de destaque desenha caixas, linhas e rótulos em coordenadas de viewport, sem tocar no DOM do site.
- Cada ferramenta é um módulo com `Panel`; desmontar o painel limpa tudo o que a ferramenta fez na página.

**Alternativas.** A definir: as alternativas não foram registradas.

**Consequências.**
- Toda ferramenta precisa de limpeza (cleanup) no `useEffect`, senão deixa marcas na página.
- Estilo só com as variáveis `--ni-*` e as classes `ni-*`, para não vazar para o site nem ser afetado por ele.
- A barra não muda de tema conforme o site. Ela é sempre escura e legível sobre qualquer fundo.

---

## ADR-006 · Relatório em PDF pelo `window.print()`

**Data:** 2026-11-22.

**Contexto.** A ferramenta de relatório junta SEO, tecnologias, desempenho e acessibilidade num PDF para enviar a um cliente. Não há servidor para gerar o arquivo, e a extensão não deve carregar uma biblioteca de PDF pesada.

**Decisão.** Os dados da análise são gravados em `storage.session` e abertos numa página de relatório da própria extensão, que chama `window.print()`. A pessoa escolhe "Salvar como PDF" como destino na janela de impressão. A página de relatório também é o lugar em que se pedem permissões opcionais, porque só páginas da extensão podem fazer esse pedido.

**Alternativas.** A definir: bibliotecas de geração de PDF no cliente não foram avaliadas no registro.

**Consequências.**
- Sem dependência de biblioteca de PDF; o arquivo sai com o mecanismo do próprio navegador.
- A aparência do PDF depende do motor de impressão de cada navegador. O layout de impressão precisa ser testado nos navegadores-alvo.
- O relatório ainda não está disponível: a ferramenta "Relatório em PDF" está em desenvolvimento e não aparece nos índices de registro.
