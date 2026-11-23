# Ficha da loja · Neruz Inspect · pt-BR

Fontes: apps/inspect/src/i18n (nomes reais das ferramentas), apps/inspect/wxt.config.ts, .equipe/dossie-neruz-inspect.md.
Regras: sem número de ferramentas, usuários, notas ou depoimentos; sem nome de concorrente.

## Nome
Neruz Inspect

## Resumo curto (Chrome: vem do manifest, `extDescription` em `_locales/pt_BR`)
Proposta (120/132 caracteres):

```
Veja como qualquer site foi feito: cores, fontes, medidas, tecnologias e SEO. Grátis, código aberto e sem coletar dados.
```

Texto atual no pacote (94/132): "Pegue cores, descubra fontes, meça espaçamentos e veja a tecnologia por trás de qualquer site." Também serve. Para usar a proposta, o `extDescription` precisa ser trocado no `_locales` antes do build (a Chrome Web Store lê o resumo do manifest).

## Resumo AMO (≤250, aprox. 205)
```
Veja como qualquer site foi feito numa barra por cima da página: conta-gotas, fontes, régua, design system, animações em câmera lenta, tecnologias, pixels, SEO e relatório em PDF. Grátis, código aberto (MIT) e sem coleta de dados.
```

## Descrição longa (texto puro; Chrome ≤16000, aprox. 2.600)
```
Veja como qualquer site foi feito e leve o que precisa. O Neruz Inspect abre uma barra escura por cima da página com ferramentas de cor, tipografia, layout, código, movimento, tecnologia e análise da página. Sem abrir o DevTools e sem alternar entre várias extensões.

COR
• Conta-gotas: pegue a cor de qualquer pixel e copie em HEX, RGB, HSL ou OKLCH
• Paleta da página: todas as cores do site, agrupadas e com quantas vezes aparecem
• Checar contraste: nota WCAG e APCA e uma cor que passa
• Conversor de cor, gradientes e sombras, simulador de daltonismo

TIPOGRAFIA
• Qual é a fonte: passe o mouse e veja fonte, peso, tamanho, entrelinha e cor
• Fontes da página: onde cada fonte aparece e de onde vem
• Testar fonte: troque a fonte do site e veja na hora como fica
• Escala tipográfica: os tamanhos de texto em ordem, com a proporção entre eles

LAYOUT
• Régua: a distância em pixels entre dois elementos
• Caixa do elemento: conteúdo, padding e margin desenhados sobre a página
• Grid e Flexbox, mapa de camadas (z-index), breakpoints lidos do CSS e contornos
• Rolagem lateral: ache o elemento que faz a página rolar para o lado

CÓDIGO
• Copiar estilos: o CSS de um elemento pronto para colar, também em Tailwind
• Copiar componente: um bloco inteiro em HTML e CSS, Tailwind ou JSX
• Extrair design system: cores, fontes, espaços e raios em CSS, Tailwind ou JSON
• Editar ao vivo: mude textos e estilos e exporte o CSS alterado
A versão em Tailwind é aproximada; revise antes de usar em produção.

MOVIMENTO
• Inspetor de movimento: animações em câmera lenta, com duração, easing e a biblioteca usada, quando ela aparece na página
• Liga e desliga: desative CSS, animações ou imagens para ver o que sobra

TECNOLOGIA
• Tecnologias do site: framework, CMS, construtor e bibliotecas, com versão quando aparece
• Pixels e tags: Meta Pixel, GA4, Google Tag Manager e outras, com os eventos disparados
• Cookies e storage, visualizador de JSON

PÁGINA
• SEO e meta tags, com a prévia do link compartilhado
• Dados estruturados, robots.txt e sitemap
• Links da página: internos, externos e quais estão quebrados
• Imagens e arquivos, ícones e favicons para baixar
• Desempenho: LCP, INP e CLS medidos nesta aba, no seu computador
• Acessibilidade: imagens sem alt, ordem dos títulos, rótulos e contraste baixo
• Relatório em PDF: SEO, tecnologias, desempenho e acessibilidade num arquivo para enviar

UTILITÁRIOS
• Conversor de px, rem, em e %, lorem ipsum, preencher formulário com dados fictícios, QR code da página e histórico de cópias

PARA QUEM É
Devs front-end, designers, agências, gestores de tráfego e quem estuda sites de referência.

SEUS DADOS FICAM NO SEU NAVEGADOR
• Sem servidor, sem conta e sem coleta de dados
• Só roda na aba em que você clica no ícone
• Mudanças na página aparecem só na sua tela; recarregar a página desfaz tudo
• Acesso a outros sites é opcional, pedido só quando você checa links ou baixa arquivos, e pode ser removido quando quiser
• Código aberto (MIT): confira cada linha no GitHub

COMO USAR
1. Abra um site e clique no ícone do Neruz Inspect (ou Alt+Shift+I)
2. Escolha uma ferramenta na barra ou aperte / para buscar
3. Esc sai da ferramenta; Esc de novo fecha tudo

Bom saber: o navegador não deixa extensões rodarem em páginas internas, na loja de extensões e no visualizador de PDF. "Testar fonte" carrega a fonte escolhida do Google Fonts na página aberta.

Código: https://github.com/brunolucassf/neruz-inspect
Privacidade: https://inspect.neruz.tech/privacy/
Gratuito e sem versão paga. Da família Neruz Extensions. Desenvolvido por Fonte Dev · Bruno Lucas (https://fontedev.com).
```

## Categoria sugerida
- Chrome Web Store: Produtividade > Ferramentas do desenvolvedor (Developer Tools)
- Firefox AMO: Desenvolvimento web (Web Development)

## Tags AMO (escolher só as que existirem na lista fixa do AMO)
desenvolvimento web, design, cores, fontes, acessibilidade, SEO, produtividade

## Capturas (6 cenas, 1280x800)
A Chrome aceita no máximo 5 capturas: use 1, 2, 3, 4 e 6. O AMO aceita todas as 6. No AMO, a legenda vai no campo da captura; na Chrome, título e linha de apoio entram na arte.

| # | Cena | Título | Linha de apoio |
|---|---|---|---|
| 1 | Barra + cor/paleta | Pegue qualquer cor e veja a paleta do site | Conta-gotas em HEX, RGB, HSL ou OKLCH, com contraste WCAG e APCA. |
| 2 | Tipografia | Descubra a fonte passando o mouse | Fonte, peso, tamanho, entrelinha e de onde ela vem. |
| 3 | Medir/inspecionar | Meça distâncias e veja margin e padding | Régua e caixa do elemento desenhadas sobre a página. |
| 4 | Tecnologias + SEO | Veja com o que o site foi feito | Framework, CMS, pixels e tags, mais SEO e prévia do link. |
| 5 | Desempenho/acessibilidade | Confira desempenho e acessibilidade | LCP, INP e CLS medidos na sua aba, e os erros de acessibilidade mais comuns. |
| 6 | Relatório PDF | Gere um relatório do site em PDF | SEO, tecnologias, desempenho e acessibilidade num arquivo para enviar. |

## Arte promocional (≤6 palavras)
- Principal: Veja como qualquer site foi feito (6)
- Alternativa: Cor, fonte, medida e tecnologia (5)
