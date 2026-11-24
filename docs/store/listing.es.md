# Ficha de la tienda · Neruz Inspect · es

Fuentes: apps/inspect/src/i18n (nombres reales de las herramientas), apps/inspect/wxt.config.ts, .equipe/dossie-neruz-inspect.md.
Reglas: sin cantidad de herramientas, usuarios, notas ni testimonios; sin nombres de competidores.
Español neutro (carpeta `_locales/es`, cubre todo el español).

## Nombre
Neruz Inspect

## Resumen corto (Chrome: sale del manifest, `extDescription` en `_locales/es`)
Texto actual del paquete (95/132), se mantiene: "Toma colores, descubre fuentes, mide espacios y conoce la tecnología detrás de cualquier sitio." No tiene listas de formatos ni marcas, así que puede quedarse. Propuesta opcional más segura, sin lista (88/132), solo si se cambia `extDescription` en `_locales` antes del build:

```
Mira cómo está hecha cualquier página y copia lo que necesites, desde una barra encima.
```

## Resumen AMO (≤250, aprox. 165)
```
Estudia cómo está hecha cualquier página desde una barra encima de ella y copia lo que necesites como código listo para pegar. Gratis, código abierto y sin cuenta. Envía solo estadísticas anónimas de uso, que puedes desactivar.
```

## Descripción larga (texto plano; Chrome ≤16000, aprox. 1.750)
```
Mira cómo está hecha una página y llévate lo que necesitas. Neruz Inspect abre una barra encima de la página que estás visitando, para que la estudies sin herramientas de desarrollador.

Toma cualquier color con el cuentagotas y cópialo en el formato que usas. Luego revisa si el texto tiene contraste suficiente para leerse con comodidad.

Pasa el mouse sobre un texto para descubrir su fuente y de dónde viene, y prueba otra en la misma página para comparar.

Mide el espacio entre dos elementos y encuentra lo que hace que la página se desplace de lado.

Copia los estilos de un elemento, o de un bloque entero, como código listo para pegar. La versión en Tailwind es aproximada, así que revísala antes de publicar.

Mira las animaciones en cámara lenta y descubre con qué tecnología está hecha la página. También puedes medir la velocidad de carga en tu pestaña y detectar problemas comunes de accesibilidad. Al final, genera un informe para enviar a tu equipo o a tu cliente.

PRIVACIDAD
• Sin cuenta y sin servidor propio
• Solo funciona en la pestaña donde haces clic en el ícono
• Lo que inspeccionas y copias se queda en tu navegador
• Envía estadísticas anónimas de uso a Google Analytics: un identificador aleatorio y qué herramientas se usaron, sin dirección de página, contenido ni capturas
• Puedes desactivarlo en las opciones; en Firefox solo envía si aceptas el permiso opcional
• Los cambios se ven solo en tu pantalla; al recargar se deshacen
• El acceso a otros sitios es opcional y solo se pide para revisar enlaces o descargar archivos
• Código abierto: cada línea es pública

CÓMO SE USA
1. Abre una página y haz clic en el ícono de Neruz Inspect (o Alt+Shift+I)
2. Elige una herramienta en la barra o presiona / para buscar
3. Esc sale de la herramienta; Esc otra vez cierra todo

Bueno saber: las extensiones no funcionan en las páginas internas del navegador. "Probar fuente" carga desde Google Fonts la fuente que elijas en la página abierta.

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
| 1 | Barra + color/paleta | Toma cualquier color de la página | Cópialo en el formato que usas y revisa el contraste. |
| 2 | Tipografía | Descubre la fuente pasando el mouse | Mira sus detalles y de dónde viene. |
| 3 | Medir/inspeccionar | Mide el espacio entre elementos | Guías dibujadas sobre la misma página. |
| 4 | Tecnologías + SEO | Mira con qué está hecha la página | Y cómo se ve cuando alguien comparte el enlace. |
| 5 | Rendimiento/accesibilidad | Revisa velocidad y accesibilidad | Medido en tu pestaña, con los problemas comunes señalados. |
| 6 | Informe PDF | Genera un informe de la página | Todo lo que encontraste en un archivo para enviar. |

## Arte promocional (≤6 palabras)
- Principal: Mira cómo está hecha cualquier página (6)
- Alternativa: Aprende de cada página que visitas (6)
