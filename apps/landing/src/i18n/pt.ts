import type { LandingCopy } from './types';

export const pt: LandingCopy = {
  locale: 'pt-BR',
  htmlLang: 'pt-BR',
  path: '/',
  privacyPath: '/privacy/',
  meta: {
    title: 'Neruz Inspect: conta-gotas, fontes e tecnologias grátis',
    description:
      'Extensão grátis para inspecionar qualquer site: conta-gotas, fontes, design system, tecnologias, pixels, SEO e relatório em PDF. Sem coleta de dados.',
    ogDescription:
      'Veja como qualquer site foi feito: cores, fontes, medidas, animações e tecnologias. Grátis e de código aberto.',
  },
  skipLink: 'Pular para o conteúdo',
  languageLabel: 'Idioma',
  languageNames: { 'pt-BR': 'Português', en: 'English', es: 'Español' },
  language: { current: 'Idioma: {idioma}', short: 'PT', selected: 'selecionado' },
  header: { navLabel: 'Principal', github: 'GitHub' },
  cta: {
    addTo: {
      chrome: 'Instalar grátis no Chrome',
      edge: 'Instalar grátis no Edge',
      firefox: 'Instalar grátis no Firefox',
      brave: 'Instalar grátis no Brave',
      opera: 'Instalar grátis no Opera',
    },
    addShort: 'Instalar grátis',
    chooseBrowser: 'Escolher navegador',
    alsoFor: 'Também para',
    browserNotes: {
      brave: 'No Brave, instale pela Chrome Web Store.',
      opera: 'No Opera, instale pela Chrome Web Store.',
    },
    mobileInstall: 'Abra no computador para instalar.',
    copyLink: 'Copiar link',
    linkCopied: 'Link copiado',
    share: 'Compartilhar link',
    comingSoon: 'Chegando às lojas',
    followOnGithub: 'Acompanhar no GitHub',
    viewOnGithub: 'Ver no GitHub',
  },
  hero: {
    title: 'Veja como qualquer site foi feito.',
    subtitle:
      'Cores, fontes, medidas, animações e tecnologias de qualquer página, numa barra que abre por cima do site. Extensão gratuita, de código aberto e sem coleta de dados.',
    micro: ['Grátis', 'Código aberto (MIT)', 'Sem conta', 'Alt+Shift+I'],
    stageLabel:
      'Página de exemplo de um ateliê de cerâmica. A lupa octogonal mostra por baixo dela as caixas, medidas, cores e fontes.',
    skipIntro: 'Pular animação',
  },
  demo: {
    nav: ['Peças', 'Ateliê', 'Contato'],
    title: 'Cerâmica feita à mão, uma peça por vez.',
    text: 'Xícaras, pratos e vasos queimados em forno a lenha, no litoral.',
    button: 'Ver peças',
    swatchLabel: 'argila',
  },
  explode: {
    eyebrow: 'Por baixo da página',
    title: 'A página aberta em oito camadas.',
    subtitle:
      'Cada camada é um grupo de ferramentas. Role para separá-las e toque num número para ir até ele.',
    indexLabel: 'Camadas do Neruz Inspect',
    layerWord: 'Camada',
  },
  groups: [
    { name: 'Cor', desc: 'Pegue, compare e converta as cores de qualquer página.' },
    { name: 'Tipografia', desc: 'Descubra, liste e teste as fontes de qualquer site.' },
    { name: 'Layout', desc: 'Meça, ache o que quebra e compare o layout com o design.' },
    { name: 'Código', desc: 'Leve estilos, componentes e o design system para o seu projeto.' },
    { name: 'Movimento', desc: 'Desacelere animações e ligue ou desligue partes da página.' },
    { name: 'Tecnologia', desc: 'Descubra com o que o site foi feito e o que ele rastreia.' },
    { name: 'Página', desc: 'SEO, links, arquivos, desempenho e acessibilidade, num relatório.' },
    { name: 'Utilitários', desc: 'Pequenas ferramentas do dia a dia de quem faz sites.' },
  ],
  sections: [
    {
      id: 'cor',
      layers: ['01', '02'],
      title: 'Passe o mouse. A cor e a fonte aparecem.',
      text: 'Pegue qualquer cor em HEX, RGB, HSL ou OKLCH, veja a paleta inteira do site e confira se o texto é legível no fundo. Passe sobre um texto para saber a fonte, o peso e o tamanho, ou troque a fonte do site para testar outra.',
      tools: [
        'Conta-gotas',
        'Paleta da página',
        'Checar contraste',
        'Qual é a fonte',
        'Testar fonte',
      ],
    },
    {
      id: 'design-system',
      layers: ['04'],
      title: 'O design system de qualquer site, num arquivo.',
      text: 'A extensão lê as cores, fontes, espaçamentos e cantos arredondados que o site usa e entrega tudo organizado em variáveis CSS, configuração do Tailwind ou JSON. Bom para estudar uma referência ou começar um projeto sem copiar valor por valor.',
      tools: ['Extrair design system', 'Escala tipográfica', 'Copiar estilos'],
    },
    {
      id: 'componente',
      layers: ['04'],
      title: 'Gostou de um bloco? Leve o código.',
      text: 'Clique numa seção e copie o HTML com o CSS, em classes Tailwind ou como JSX para React. A versão Tailwind é uma aproximação: serve de ponto de partida, não de cópia final. Quer testar outro texto antes? Edite a página ao vivo e exporte o CSS que mudou.',
      tools: ['Copiar componente', 'Editar ao vivo'],
    },
    {
      id: 'layout',
      layers: ['03'],
      title: 'A página rola para o lado? Ache o culpado.',
      text: 'A extensão aponta o elemento que passa da largura da tela. Meça distâncias como no Figma, veja margin e padding, descubra quem está na frente no z-index e destaque o contorno de cada bloco da página.',
      tools: [
        'Rolagem lateral',
        'Régua',
        'Caixa do elemento',
        'Grid e Flexbox',
        'Mapa de camadas',
        'Breakpoints',
      ],
    },
    {
      id: 'movimento',
      layers: ['05'],
      title: 'Aquela animação, em câmera lenta.',
      text: 'Desacelere as animações da página e veja a duração, a curva de aceleração (o easing) e a biblioteca usada, como GSAP, Lenis ou Three.js, quando ela aparece. Também dá para desligar CSS, animações ou imagens e ver o que sobra.',
      tools: ['Inspetor de movimento', 'Liga e desliga'],
    },
    {
      id: 'tecnologia',
      layers: ['06'],
      title: 'O pixel está disparando? Veja aqui.',
      text: 'Veja o Meta Pixel, o GA4, o Google Tag Manager e outras tags da página, com os eventos que saem enquanto você navega. E descubra com o que o site foi feito: framework, CMS, construtor de sites e bibliotecas, com versão quando ela aparece.',
      tools: ['Pixels e tags', 'Tecnologias do site', 'Cookies e storage', 'Visualizar JSON'],
    },
    {
      id: 'pagina',
      layers: ['07'],
      title: 'Um relatório do site em PDF, pronto para enviar.',
      text: 'Junte SEO, meta tags, links quebrados, tecnologias, desempenho e acessibilidade num PDF limpo. Útil para mostrar a um cliente o que pode melhorar no site dele, com dados da própria página.',
      tools: [
        'Relatório em PDF',
        'SEO e meta tags',
        'Links da página',
        'Desempenho',
        'Acessibilidade',
        'Imagens e arquivos',
      ],
      note: 'Desempenho é medido na sua máquina e conexão; não são os dados de campo do Google.',
    },
    {
      id: 'utilitarios',
      layers: ['08'],
      title: 'E as pequenas coisas do dia a dia.',
      text: 'Converta px em rem, gere lorem ipsum, preencha formulários com dados fictícios, abra a página no celular por QR code e recupere o que você copiou.',
      tools: [
        'Conversor de unidades',
        'Lorem ipsum',
        'Preencher formulário',
        'QR code',
        'Histórico de cópias',
      ],
    },
  ],
  visuals: {
    exampleTag: 'exemplo',
    contrastLabel: 'Texto no fundo',
    contrastPass: 'AA passa',
    codeTabs: ['CSS', 'Tailwind', 'Tokens'],
    easingLabel: 'Curva de easing',
    speedLabel: 'Velocidade',
    techChips: ['Framework', 'CMS', 'Construtor', 'Biblioteca', 'Tag de métrica'],
    techLabel: 'Fundação do site',
    ogTitle: 'Como a prévia do link aparece',
    ogHost: 'mare.exemplo',
    vitals: [
      { name: 'LCP', value: '1,8 s' },
      { name: 'INP', value: '120 ms' },
      { name: 'CLS', value: '0,04' },
    ],
    boxLabels: { margin: 'margin', padding: 'padding', content: 'conteúdo' },
    typeLabel: 'altura-x · linha de base · versal',
    utilsChips: ['px → rem', 'Lorem ipsum', 'QR code', 'Histórico'],
  },
  privacy: {
    eyebrow: 'Privacidade e código aberto',
    title: 'Grátis, aberta e sem coletar nada.',
    text: 'O Neruz Inspect não tem servidor, não pede conta e não coleta dados. Só roda na aba em que você clica no ícone, e fechar a barra desfaz o que ela mostrou na página. O código está no GitHub sob licença MIT: dá para ler cada linha, relatar um problema ou sugerir uma ferramenta. Não existe versão paga.',
    ask: 'Se a extensão te ajudar, uma estrela no GitHub ajuda outras pessoas a encontrá-la.',
    policy: 'Ler a política de privacidade',
    proofsTitle: 'O que você pode conferir',
    proofs: [
      'Gratuita, sem versão paga',
      'Código aberto, licença MIT',
      'Sem servidor, sem conta, sem coleta de dados',
      'Permissões mínimas: só a aba que você abrir',
    ],
    permsTitle: 'Permissões, uma a uma',
    requiredWord: 'obrigatória',
    optionalWord: 'opcional',
    perms: [
      {
        name: 'activeTab',
        kind: 'required',
        why: 'Dá acesso só à aba em que você clica no ícone.',
      },
      { name: 'scripting', kind: 'required', why: 'Abre a barra nessa aba, quando você pede.' },
      {
        name: 'storage',
        kind: 'required',
        why: 'Guarda suas preferências e a posição da barra, só neste navegador.',
      },
      {
        name: 'clipboardWrite',
        kind: 'optional',
        why: 'Só para copiar direto para a área de transferência.',
      },
      {
        name: 'http(s)://*/*',
        kind: 'optional',
        why: 'Só para checar links e baixar arquivos de outros sites, se você permitir.',
      },
    ],
    familyText:
      'Da mesma família do Neruz Page View, para ver seu site em várias telas e capturar prints e vídeos.',
    familyLink: 'Conhecer o Neruz Page View',
  },
  faq: {
    title: 'Perguntas rápidas',
    items: [
      {
        q: 'É grátis mesmo?',
        a: 'Sim. Não há versão paga, plano Pro nem cadastro. O código é aberto (MIT) e qualquer pessoa pode conferir.',
      },
      {
        q: 'A extensão lê ou envia meus dados?',
        a: 'Não envia nada: não existe servidor. Ela só roda na aba em que você clica no ícone, e o que você copia ou salva fica no seu navegador.',
      },
      {
        q: 'Em quais navegadores funciona?',
        a: 'Chrome, Edge, Opera, Brave e Firefox (versão 128 ou mais nova). No Firefox, o conta-gotas usa uma lupa própria.',
      },
      {
        q: 'Por que não abre em algumas páginas?',
        a: 'O próprio navegador bloqueia extensões em páginas internas (como configurações e a nova aba), na loja de extensões e no visualizador de PDF. Em sites comuns, funciona.',
      },
      {
        q: 'Ela muda o site de verdade?',
        a: 'Não. Edições, fontes trocadas e contornos aparecem só na sua tela. Recarregue a página e tudo volta como era.',
      },
    ],
  },
  final: {
    title: 'Abra no próximo site que te chamar atenção.',
    subtitle: 'Grátis, sem cadastro e sem coleta. Se não servir, é só remover.',
  },
  trail: { label: 'Posição na página' },
  footer: {
    navLabel: 'Rodapé',
    privacy: 'Privacidade',
    github: 'Código no GitHub',
    license: 'Licença MIT',
    family: 'Neruz Extensions',
    credit: 'Desenvolvido por Fonte Dev · Bruno Lucas',
  },
  privacyPage: {
    title: 'Privacidade · Neruz Inspect',
    description:
      'O Neruz Inspect não coleta, não envia e não vende dados. Tudo acontece no seu navegador.',
    heading: 'Política de privacidade',
    updated: 'Atualizada em 22 de novembro de 2026',
    back: 'Voltar ao início',
    blocks: [
      {
        title: 'Em uma frase',
        paragraphs: [
          'O Neruz Inspect não coleta, não envia e não vende nenhum dado. Tudo acontece no seu navegador.',
        ],
      },
      {
        title: 'O que a extensão faz',
        paragraphs: [
          'Quando você clica no ícone (ou usa Alt+Shift+I), a barra abre na aba atual e lê a própria página para mostrar cores, fontes, medidas e outras informações. Essa leitura acontece só no seu computador. Nada é enviado para servidor algum, porque não existe servidor.',
        ],
      },
      {
        title: 'O que fica salvo',
        paragraphs: ['Ficam guardados apenas neste navegador, e você pode apagar quando quiser:'],
        items: [
          'suas preferências (idioma, formato de cor, unidade)',
          'a posição da barra por site',
          'o histórico de cópias, se você ligar essa opção',
        ],
      },
      {
        title: 'Permissões',
        paragraphs: [
          'Obrigatórias: activeTab, scripting e storage. Opcionais, pedidas só quando você usa a ferramenta que precisa delas: clipboardWrite e acesso a outros sites, para checar links e baixar arquivos. Você pode negar ou remover a qualquer momento nas Configurações.',
        ],
      },
      {
        title: 'Este site',
        paragraphs: [
          'Esta página não usa cookies, não usa analytics e não carrega recursos de terceiros. Guardamos apenas, no seu navegador, uma marca de sessão para não repetir a animação de entrada.',
        ],
      },
      {
        title: 'Contato',
        paragraphs: [
          'Dúvidas ou relatos: abra uma issue no GitHub do projeto. O código é aberto, sob licença MIT.',
        ],
      },
    ],
  },
};
