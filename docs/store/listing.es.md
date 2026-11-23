# Ficha de la tienda · Neruz Inspect · es

Fuentes: apps/inspect/src/i18n (nombres reales de las herramientas), apps/inspect/wxt.config.ts, .equipe/dossie-neruz-inspect.md.
Reglas: sin cantidad de herramientas, usuarios, notas ni testimonios; sin nombres de competidores.
Español neutro (carpeta `_locales/es`, cubre todo el español).

## Nombre
Neruz Inspect

## Resumen corto (Chrome: sale del manifest, `extDescription` en `_locales/es`)
Propuesta (129/132 caracteres):

```
Mira cómo está hecho cualquier sitio: colores, fuentes, medidas, tecnologías y SEO. Gratis, código abierto y sin recopilar datos.
```

Texto actual del paquete (95/132): "Toma colores, descubre fuentes, mide espacios y conoce la tecnología detrás de cualquier sitio." También sirve. Para usar la propuesta hay que cambiar `extDescription` en `_locales` antes del build (la Chrome Web Store lee el resumen del manifest).

## Resumen AMO (≤250, aprox. 215)
```
Mira cómo está hecho cualquier sitio desde una barra sobre la página: cuentagotas, fuentes, regla, design system, animaciones en cámara lenta, tecnologías, píxeles, SEO e informe en PDF. Gratis, código abierto (MIT) y sin recopilar datos.
```

## Descripción larga (texto plano; Chrome ≤16000, aprox. 2.700)
```
Mira cómo está hecho cualquier sitio y llévate lo que necesitas. Neruz Inspect abre una barra oscura sobre la página con herramientas de color, tipografía, layout, código, movimiento, tecnología y análisis de la página. Sin abrir DevTools y sin saltar entre varias extensiones.

COLOR
• Cuentagotas: toma el color de cualquier píxel y cópialo en HEX, RGB, HSL u OKLCH
• Paleta de la página: todos los colores del sitio, agrupados y con cuántas veces aparecen
• Revisar contraste: nota WCAG y APCA, y un color que sí pasa
• Conversor de color, degradados y sombras, simulador de daltonismo

TIPOGRAFÍA
• Qué fuente es: pasa el mouse y ve fuente, peso, tamaño, interlineado y color
• Fuentes de la página: dónde aparece cada fuente y de dónde viene
• Probar fuente: cambia la fuente del sitio y mira al instante cómo queda
• Escala tipográfica: los tamaños de texto en orden, con la proporción entre ellos

LAYOUT
• Regla: la distancia en píxeles entre dos elementos
• Modelo de caja: contenido, padding y margin dibujados sobre la página
• Grid y Flexbox, mapa de capas (z-index), breakpoints leídos del CSS y contornos
• Scroll horizontal: encuentra el elemento que hace que la página se desplace de lado

CÓDIGO
• Copiar estilos: el CSS de un elemento listo para pegar, también en Tailwind
• Copiar componente: un bloque entero en HTML y CSS, Tailwind o JSX
• Extraer design system: colores, fuentes, espacios y radios en CSS, Tailwind o JSON
• Editar en vivo: cambia textos y estilos y exporta el CSS modificado
La versión en Tailwind es aproximada; revísala antes de usarla en producción.

MOVIMIENTO
• Inspector de movimiento: animaciones en cámara lenta, con duración, easing y la librería usada, cuando aparece en la página
• Interruptores: desactiva CSS, animaciones o imágenes para ver qué queda

TECNOLOGÍA
• Tecnologías del sitio: framework, CMS, constructor y librerías, con versión si se ve
• Píxeles y etiquetas: Meta Pixel, GA4, Google Tag Manager y otras, con los eventos que envían
• Cookies y storage, visor de JSON

PÁGINA
• SEO y meta tags, con la vista previa del enlace compartido
• Datos estructurados, robots.txt y sitemap
• Enlaces: internos, externos y cuáles están rotos
• Imágenes y archivos, íconos y favicons para descargar
• Rendimiento: LCP, INP y CLS medidos en esta pestaña, en tu computadora
• Accesibilidad: imágenes sin alt, orden de encabezados, etiquetas y contraste bajo
• Informe en PDF: SEO, tecnologías, rendimiento y accesibilidad en un archivo para enviar

UTILIDADES
• Conversor de px, rem, em y %, lorem ipsum, llenar formularios con datos ficticios, código QR de la página e historial de copias

PARA QUIÉN ES
Devs front-end, diseñadores, agencias, especialistas en tráfico pago y quien estudia sitios de referencia.

TUS DATOS SE QUEDAN EN TU NAVEGADOR
• Sin servidor, sin cuenta y sin recopilar datos
• Solo funciona en la pestaña donde haces clic en el ícono
• Los cambios en la página se ven solo en tu pantalla; al recargar se deshacen
• El acceso a otros sitios es opcional, se pide solo al revisar enlaces o descargar archivos y puedes quitarlo cuando quieras
• Código abierto (MIT): revisa cada línea en GitHub

CÓMO SE USA
1. Abre un sitio y haz clic en el ícono de Neruz Inspect (o Alt+Shift+I)
2. Elige una herramienta en la barra o presiona / para buscar
3. Esc sale de la herramienta; Esc otra vez cierra todo

Bueno saber: el navegador no permite extensiones en páginas internas, en la tienda de extensiones ni en el visor de PDF. "Probar fuente" carga desde Google Fonts la fuente que elijas en la página abierta.

Código: https://github.com/brunolucassf/neruz-inspect
Privacidad: https://inspect.neruz.tech/es/privacy/
Gratis y sin versión de pago. De la familia Neruz Extensions. Desenvolvido por Fonte Dev · Bruno Lucas (https://fontedev.com).
```

## Categoría sugerida
- Chrome Web Store: Productividad > Herramientas para desarrolladores (Developer Tools)
- Firefox AMO: Desarrollo web (Web Development)

## Etiquetas AMO (elegir solo las que existan en la lista fija de AMO)
desarrollo web, diseño, colores, fuentes, accesibilidad, SEO, productividad

## Capturas (6 escenas, 1280x800)
Chrome acepta como máximo 5 capturas: usar 1, 2, 3, 4 y 6. AMO acepta las 6. En AMO la leyenda va en el campo de la captura; en Chrome, título y línea de apoyo van dentro del arte.

| # | Escena | Título | Línea de apoyo |
|---|---|---|---|
| 1 | Barra + color/paleta | Toma cualquier color y mira la paleta del sitio | Cuentagotas en HEX, RGB, HSL u OKLCH, con contraste WCAG y APCA. |
| 2 | Tipografía | Descubre la fuente pasando el mouse | Fuente, peso, tamaño, interlineado y de dónde viene. |
| 3 | Medir/inspeccionar | Mide distancias y ve margin y padding | Regla y modelo de caja dibujados sobre la página. |
| 4 | Tecnologías + SEO | Mira con qué está hecho el sitio | Framework, CMS, píxeles y etiquetas, más SEO y vista previa del enlace. |
| 5 | Rendimiento/accesibilidad | Revisa rendimiento y accesibilidad | LCP, INP y CLS medidos en tu pestaña, y los errores de accesibilidad más comunes. |
| 6 | Informe PDF | Genera un informe del sitio en PDF | SEO, tecnologías, rendimiento y accesibilidad en un archivo para enviar. |

## Arte promocional (≤6 palabras)
- Principal: Mira cómo está hecho cualquier sitio (6)
- Alternativa: Color, fuente, medida y tecnología (5)
