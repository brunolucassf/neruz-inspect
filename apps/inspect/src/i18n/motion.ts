import type { GroupMessages } from '../tools/types';

export default {
  'pt-BR': {
    'motion.motionInspector.name': 'Inspetor de movimento',
    'motion.motionInspector.desc':
      'Animações em câmera lenta, com duração, easing e biblioteca usada.',
    'motion.motionInspector.keywords':
      'câmera lenta, animação, transição, gsap, lenis, three, easing, duração, slow motion',
    'motion.motionInspector.retry': 'Tentar de novo',
    'motion.motionInspector.section.animations': 'Animações',
    'motion.motionInspector.libraries': 'Bibliotecas detectadas',
    'motion.motionInspector.probeError':
      'Não foi possível detectar bibliotecas nesta página. As animações CSS continuam na lista.',
    'motion.motionInspector.noLibraries': 'Nenhuma biblioteca de movimento detectada.',
    'motion.motionInspector.speed': 'Velocidade',
    'motion.motionInspector.pause': 'Pausar',
    'motion.motionInspector.resume': 'Continuar',
    'motion.motionInspector.stepBack': 'Voltar um quadro',
    'motion.motionInspector.stepForward': 'Avançar um quadro',
    'motion.motionInspector.appliedTo': 'Aplicado também em: {list}.',
    'motion.motionInspector.empty.title': 'Nenhuma animação ativa agora',
    'motion.motionInspector.empty.hint':
      'Passe o mouse sobre botões, role a página ou recarregue para ver animações aparecerem.',
    'motion.motionInspector.kind.css-animation': 'Animação CSS',
    'motion.motionInspector.kind.css-transition': 'Transição CSS',
    'motion.motionInspector.kind.web-animation': 'Web Animations',
    'motion.motionInspector.easing': 'Easing',
    'motion.motionInspector.name.label': 'Nome',
    'motion.motionInspector.duration': 'Duração',
    'motion.motionInspector.delay': 'Atraso',
    'motion.motionInspector.iterations': 'Repetições',
    'motion.motionInspector.scroll': 'pelo scroll',
    'motion.motionInspector.note':
      'Funciona com animações CSS e Web Animations; em bibliotecas como GSAP, quando a página permite.',

    'motion.pageToggles.name': 'Liga e desliga',
    'motion.pageToggles.desc': 'Desligue CSS, animações ou imagens para ver o que sobra.',
    'motion.pageToggles.keywords':
      'desativar css, sem animação, sem imagens, reduzir movimento, desligar',
    'motion.pageToggles.cssOff.title': 'Desligar o CSS',
    'motion.pageToggles.cssOff.desc': 'Desativa as folhas de estilo e os estilos inline da página.',
    'motion.pageToggles.hideMedia.title': 'Esconder imagens e vídeos',
    'motion.pageToggles.hideMedia.desc': 'Esconde mídia e imagens de fundo, mantendo o espaço.',
    'motion.pageToggles.stopMotion.title': 'Parar animações e transições',
    'motion.pageToggles.stopMotion.desc':
      'Zera duração e atraso no CSS. Não afeta movimento feito por JavaScript.',
    'motion.pageToggles.reducedMotion.title': 'Simular movimento reduzido',
    'motion.pageToggles.reducedMotion.desc':
      'Aplica as regras prefers-reduced-motion da página e para animações CSS. Só via CSS: o que o JavaScript lê não muda.',
    'motion.pageToggles.reducedMotion.applied': '{n} regras da própria página aplicadas.',
    'motion.pageToggles.reset': 'Desfazer tudo',
    'motion.pageToggles.note':
      'Os efeitos valem só nesta aba e somem ao fechar a ferramenta. O JavaScript da página não é desligado.',
  },
  en: {
    'motion.motionInspector.name': 'Motion inspector',
    'motion.motionInspector.desc':
      'Play animations in slow motion and see duration, easing and library.',
    'motion.motionInspector.keywords':
      'slow motion, animation, transition, gsap, lenis, three.js, easing, duration',
    'motion.motionInspector.retry': 'Try again',
    'motion.motionInspector.section.animations': 'Animations',
    'motion.motionInspector.libraries': 'Detected libraries',
    'motion.motionInspector.probeError':
      "Couldn't detect libraries on this page. CSS animations are still listed.",
    'motion.motionInspector.noLibraries': 'No motion library detected.',
    'motion.motionInspector.speed': 'Speed',
    'motion.motionInspector.pause': 'Pause',
    'motion.motionInspector.resume': 'Resume',
    'motion.motionInspector.stepBack': 'Back one frame',
    'motion.motionInspector.stepForward': 'Forward one frame',
    'motion.motionInspector.appliedTo': 'Also applied to: {list}.',
    'motion.motionInspector.empty.title': 'No active animation right now',
    'motion.motionInspector.empty.hint':
      'Hover over buttons, scroll the page or reload to see animations appear.',
    'motion.motionInspector.kind.css-animation': 'CSS animation',
    'motion.motionInspector.kind.css-transition': 'CSS transition',
    'motion.motionInspector.kind.web-animation': 'Web Animations',
    'motion.motionInspector.easing': 'Easing',
    'motion.motionInspector.name.label': 'Name',
    'motion.motionInspector.duration': 'Duration',
    'motion.motionInspector.delay': 'Delay',
    'motion.motionInspector.iterations': 'Iterations',
    'motion.motionInspector.scroll': 'scroll-driven',
    'motion.motionInspector.note':
      'Works with CSS and Web Animations; with libraries like GSAP, when the page allows it.',

    'motion.pageToggles.name': 'Page toggles',
    'motion.pageToggles.desc': "Turn off CSS, animations or images to see what's left.",
    'motion.pageToggles.keywords':
      'disable css, no animations, hide images, reduced motion, turn off',
    'motion.pageToggles.cssOff.title': 'Turn off CSS',
    'motion.pageToggles.cssOff.desc': "Disables the page's stylesheets and inline styles.",
    'motion.pageToggles.hideMedia.title': 'Hide images and videos',
    'motion.pageToggles.hideMedia.desc': 'Hides media and background images, keeping the space.',
    'motion.pageToggles.stopMotion.title': 'Stop animations and transitions',
    'motion.pageToggles.stopMotion.desc':
      "Zeroes duration and delay in CSS. Doesn't affect motion driven by JavaScript.",
    'motion.pageToggles.reducedMotion.title': 'Simulate reduced motion',
    'motion.pageToggles.reducedMotion.desc':
      "Applies the page's own prefers-reduced-motion rules and stops CSS animations. CSS only: what JavaScript reads doesn't change.",
    'motion.pageToggles.reducedMotion.applied': "{n} of the page's own rules applied.",
    'motion.pageToggles.reset': 'Undo all',
    'motion.pageToggles.note':
      "Effects apply to this tab only and disappear when you close the tool. The page's JavaScript is not turned off.",
  },
  es: {
    'motion.motionInspector.name': 'Inspector de movimiento',
    'motion.motionInspector.desc':
      'Animaciones en cámara lenta, con duración, easing y librería usada.',
    'motion.motionInspector.keywords':
      'cámara lenta, animación, transición, gsap, lenis, three, easing, duración',
    'motion.motionInspector.retry': 'Reintentar',
    'motion.motionInspector.section.animations': 'Animaciones',
    'motion.motionInspector.libraries': 'Librerías detectadas',
    'motion.motionInspector.probeError':
      'No se pudieron detectar librerías en esta página. Las animaciones CSS siguen en la lista.',
    'motion.motionInspector.noLibraries': 'No se detectó ninguna librería de movimiento.',
    'motion.motionInspector.speed': 'Velocidad',
    'motion.motionInspector.pause': 'Pausar',
    'motion.motionInspector.resume': 'Continuar',
    'motion.motionInspector.stepBack': 'Retroceder un cuadro',
    'motion.motionInspector.stepForward': 'Avanzar un cuadro',
    'motion.motionInspector.appliedTo': 'Aplicado también en: {list}.',
    'motion.motionInspector.empty.title': 'Ninguna animación activa ahora',
    'motion.motionInspector.empty.hint':
      'Pasa el mouse sobre botones, haz scroll o recarga para ver aparecer animaciones.',
    'motion.motionInspector.kind.css-animation': 'Animación CSS',
    'motion.motionInspector.kind.css-transition': 'Transición CSS',
    'motion.motionInspector.kind.web-animation': 'Web Animations',
    'motion.motionInspector.easing': 'Easing',
    'motion.motionInspector.name.label': 'Nombre',
    'motion.motionInspector.duration': 'Duración',
    'motion.motionInspector.delay': 'Retraso',
    'motion.motionInspector.iterations': 'Repeticiones',
    'motion.motionInspector.scroll': 'por el scroll',
    'motion.motionInspector.note':
      'Funciona con animaciones CSS y Web Animations; con librerías como GSAP, cuando la página lo permite.',

    'motion.pageToggles.name': 'Interruptores',
    'motion.pageToggles.desc': 'Desactiva CSS, animaciones o imágenes para ver qué queda.',
    'motion.pageToggles.keywords':
      'desactivar css, sin animaciones, sin imágenes, reducir movimiento',
    'motion.pageToggles.cssOff.title': 'Desactivar el CSS',
    'motion.pageToggles.cssOff.desc':
      'Desactiva las hojas de estilo y los estilos inline de la página.',
    'motion.pageToggles.hideMedia.title': 'Ocultar imágenes y videos',
    'motion.pageToggles.hideMedia.desc':
      'Oculta medios e imágenes de fondo, conservando el espacio.',
    'motion.pageToggles.stopMotion.title': 'Detener animaciones y transiciones',
    'motion.pageToggles.stopMotion.desc':
      'Pone duración y retraso en cero en el CSS. No afecta el movimiento hecho con JavaScript.',
    'motion.pageToggles.reducedMotion.title': 'Simular movimiento reducido',
    'motion.pageToggles.reducedMotion.desc':
      'Aplica las reglas prefers-reduced-motion de la página y detiene animaciones CSS. Solo con CSS: lo que lee JavaScript no cambia.',
    'motion.pageToggles.reducedMotion.applied': '{n} reglas de la propia página aplicadas.',
    'motion.pageToggles.reset': 'Deshacer todo',
    'motion.pageToggles.note':
      'Los efectos valen solo en esta pestaña y desaparecen al cerrar la herramienta. El JavaScript de la página no se desactiva.',
  },
} satisfies GroupMessages;
