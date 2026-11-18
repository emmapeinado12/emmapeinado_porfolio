# Portfolio de Emma Peinado — web

Sitio estático reconstruido a partir de los cinco PDF del diseño hecho en
InDesign.

## Arrancar

```powershell
cd "D:\Descargas\porfolio_web 2.0\web"
node servidor.js
```

Abre <http://localhost:8080/>. Para pararlo, `Ctrl + C`.
Si el puerto está ocupado: `node servidor.js 8081`.

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Portada: hero, 5 proyectos, sobre mí, docencia, qué hago, herramientas y contacto |
| `packaging.html` | Rediseño de packaging |
| `camins.html` | Camins per recòrrer |
| `onada.html` | Onada: centro cultural |
| `carteles.html` | Carteleria (Renault, Animalcoi y Hellín) |

## De dónde sale cada cosa

Todo se extrajo de los PDF, nada es inventado:

| Dato | Valor |
|---|---|
| Azul de marca | `#4A509A` |
| Naranja de marca | `#ED5C01` |
| Texto de páginas de proyecto | `#000000` |
| Tipografía principal | Archivo SemiExpanded (Regular, Medium, SemiBold, Bold) |
| Tipografía de las cursivas | Instrument Serif Italic |

Las dos tipografías son gratuitas y se cargan desde Google Fonts. Sin
conexión se usan las del sistema como respaldo. El ancho SemiExpanded se
reproduce con el eje variable `wdth: 112`.

Los textos son los del documento, extraídos del PDF carácter a carácter, no
transcritos a mano.

**Las erratas del PDF ya están corregidas**, como pediste:

| Estaba | Ahora |
|---|---|
| `Carteleria` | `Cartelería` (título, tarjeta, etiqueta y disciplina) |
| `Que hago? (y que me encanta hacer)` | `Qué hago? (y qué me encanta hacer)` |
| `Sobre mi` | `Sobre mí` (en el menú de las cinco páginas) |
| `Contactame!` | `Contáctame!` |
| `carteleria.Cuido` | `cartelería. Cuido` (faltaba el espacio) |
| `Camins per recòrrer` | `Camins per recórrer` (en valenciano va aguda) |
| `Adobe Illustator` | `Adobe Illustrator` |
| `Adobe Indesign` | `Adobe InDesign` |
| `Adobe After effects` | `Adobe After Effects` |
| `Politica de privacidad` | `Política de privacidad` |
| `Merchandaising` | `Merchandising` |
| `triptico` | `tríptico` |
| `2º Puesto: Accesit` | `2º Puesto: Accésit` |

**Los signos de apertura también están puestos**, como pediste: `¿Qué hago?`,
`¿Tienes una idea?`, `¡Contáctame!`, `¡Holaa, soy Emma!` y `¡HABLEMOS!`.

Lo único que **no** se ha tocado es el **`Holaa`** con dos aes, que es tu
tono y no una errata. El aviso legal del pie va como lo mandaste en la
captura: **`©Emma Peinado | Política de privacidad`**, todo junto a la
izquierda. Con eso, el antiguo `copyright emmape` de la derecha sobraba
(decía lo mismo dos veces) y se ha quitado. La línea legal queda ahora en
tres: **la firma a la izquierda, los iconos en el centro y la hora a la
derecha**.

Los iconos van centrados con una rejilla de tres columnas y no con un
`space-between`: así caen en el centro exacto de la página y no en el punto
medio entre la firma y la hora, que miden distinto.

**Cambios de redacción que pediste después:**

| Dónde | Estaba | Ahora |
|---|---|---|
| carteles | `Cartel para Animalcoi, VI Festival Internacional de Animació d’Alcoi, 2026` | `Cartel para el VI Festival Internacional de Animació d’Alcoi, 2026` |
| packaging | `ilustraciones flat design` | `ilustraciones `*`flat design`* |
| camins | `promoción de / patrimonio` | `promoción / de patrimonio` |
| portada | `Adobe After Effects 3/5` | `Adobe After Effects 3,5/5` (barra al 70 %) |

No se han incluido dos notas que estaban en los PDF porque eran recordatorios
tuyos, no parte del diseño: *«SUBIR INTENDIDAD Y HACER MOCKUP CON FONDO EN
NARANJA»* y *«cambiar mockup»*.

## Las imágenes

Las 53 imágenes salieron de dentro de los propios PDF, a resolución
original (hasta 5799 × 4500 px). Están en `assets/img/<proyecto>/`.

A esas se han sumado después las que pasaste por WhatsApp, ya rebajadas al
tamaño en que se usan:

| Archivo | Qué es |
|---|---|
| `onada/entradas.jpg` | Las dos entradas, amarilla y azul |
| `onada/acreditaciones-colgantes.jpg` | Acreditaciones «Invitat» y «Vigilant» |
| `onada/bolsa.jpg` | Bolsa take away con el cruasán |
| `onada/portada-logo.gif` | Logo amarillo animado, portada de la página |
| `home/card-onada.jpg` | Logo azul, tarjeta del carrusel |
| `home/emma.jpg` | El retrato, recortado al canto de la polaroid |

Para sacarlas hizo falta deshacer tres formas distintas de guardarlas:

- **JPEG** (`DCTDecode`), a veces con una capa extra de compresión Flate.
- **Mapas de bits** RGB y CMYK crudos (`FlateDecode`), convertidos a PNG.
- **Paleta indexada**, que necesitaba resolver la tabla de color del PDF.
  Sin esto, tres imágenes salían en blanco y negro: la banderola naranja de
  camins y los dos banners de Animalcoi. (Esas tres ya no se usan: las
  sustituyen los GIF animados.)

Los scripts que lo hacen están en `herramientas/` por si hay que repetirlo:

```powershell
node herramientas\extraer.js         "ruta.pdf" "salida"   # JPEG
node herramientas\extraer-flate.js   "ruta.pdf" "salida"   # bitmaps crudos
node herramientas\extraer-indexado.js "ruta.pdf" "salida"  # paleta indexada
node herramientas\texto.js           "ruta.pdf"            # texto
node herramientas\colores.js         "ruta.pdf"            # colores y fuentes
node herramientas\revisar.js                               # enlaces e imágenes rotas
```

Y para preparar material nuevo:

```powershell
# Pasa una página de PDF a PNG. Hay que abrir la dirección que indica.
node herramientas\rasterizar.js "plano.pdf" "salida.png" 2200

# Reduce una foto al tamaño en que se usa de verdad
powershell -File herramientas\reducir.ps1 "foto.jpg" "destino.jpg" 2200

# Reduce un GIF animado conservando animación, retardos y bucle
powershell -File herramientas\reducir-gif.ps1 "anim.gif" "destino.gif" 1400
```

## Cambios sobre la maqueta original

Estos son los puntos en los que la web se aparta a propósito de los PDF:

1. **El contenido ocupa todo el ancho de la pantalla**, con un margen lateral
   proporcional (`--margen`, de 1,25 rem a 4 rem). Los párrafos largos llevan
   su propio `max-width` para que la línea no se vuelva ilegible en
   pantallas anchas.
2. **Los proyectos son un carrusel horizontal a sangre**, de borde a borde.
   Está **quieto**: se recorre con **una flecha a cada lado**, centradas
   sobre las imágenes, que se ponen naranjas al pasar el ratón. Al llegar
   al final vuelve a empezar, y hacia atrás igual.
   - Las tarjetas se duplican por JavaScript. Al salirse de una vuelta, el
     carrusel salta al punto equivalente del otro juego; como el contenido
     es idéntico, el salto no se ve.
   - **No hay barra de desplazamiento ni botón de pausa.**
   - La posición se lleva aparte y en coma flotante, porque `scrollLeft`
     solo admite enteros y redondear en cada paso acumulaba un píxel de
     deriva por vuelta.
   - La normalización del bucle se hace **al empezar cada movimiento**, no
     al terminarlo: si dependiera de un temporizador, al pulsar rápido se
     reiniciaría y el carrusel se iba al tope y se quedaba clavado.
   - **Sin JavaScript** sigue siendo una tira desplazable a mano, no se
     pierde ningún proyecto.
   - La sección lleva `overflow-x: clip`. Sin eso, el ancho de la tira
     contaba para el de la página entera y dejaba una barra de
     desplazamiento horizontal a pie de pantalla en todo el sitio.
3. **En «Que hago?» se quitó el «Diseño digital» duplicado** que aparecía
   en cursiva bajo el primero. El que quedaba se cambió luego por
   «Packaging», como pediste.
3 bis. **El texto de «Sobre mí» va más grande que en la maqueta**: la
   biografía y las filas de Docencia a 1,2 rem, y la ficha de la columna
   izquierda (nombre, descriptor y datos de contacto) un punto por encima
   de lo que estaba. Los titulares no se han tocado.
4. **Las disciplinas se reparten a lo ancho** en dos franjas desplazadas
   entre sí, en vez de quedar apelotonadas en el centro. En el HTML son
   **una sola lista** en el orden en que se leen alternando las dos
   franjas (Tipografía, Packaging, Cartelería, Branding, Ilustración,
   Dirección creativa); el CSS las coloca en dos filas en pantalla ancha
   y las deja caer en columna en pantalla estrecha, ya en ese orden.
5. **El menú está plegado.** Solo se ve «MENÚ», con una flechita que gira al
   abrir. **Va todo en lila**, flechita y filete incluidos: el naranja aquí
   queda solo para el rollover de las opciones. Al pulsarlo
   **aparecen solo las opciones**: sin
   recuadro, sin fondo, sin filetes ni sombra. Alineadas bajo «MENÚ».
   - **Las tres opciones llevan el rollover de marca** (ver más abajo).
   - Las opciones entran escalonadas (60 / 110 / 160 ms).
   - **Solo en las páginas de proyecto** las opciones caen sobre la foto de
     portada, así que al abrir el menú se funde un velo blanco que se
     desvanece hacia abajo. No tiene ningún borde, de modo que no se lee
     como un recuadro: parece luz sobre la foto. En la portada no aparece,
     porque el fondo ya es claro.
7. **El enlace al CV sigue el mismo criterio que el menú**: «CV» con el
   rollover de marca, pero **sin filete**. El círculo va relleno en el
   lila de marca con la flecha en blanco (SVG, no un glifo), y en hover
   pasa a naranja, crece un poco y la flecha se desplaza en su diagonal.
   - **Ya descarga el CV de verdad**: apunta a
     `assets/cv/cv-emma-peinado.pdf` con `download`, de modo que el
     navegador lo guarda con el nombre bonito («CV Emma Peinado.pdf») en
     vez de abrirlo en una pestaña. Antes era un salto a `#contacto`.
   - Está hecho con `<details>`, así que **abre y cierra sin JavaScript** y
     el lector de pantalla anuncia solo si está plegado o desplegado.
   - El JS solo añade los cierres esperables: al elegir una opción, con
     `Esc` (devolviendo el foco a «MENÚ») y al pulsar fuera.
6. **Las herramientas son barras de progreso** proporcionales a la nota, en
   vez de líneas de puntos. Se rellenan al entrar en pantalla y pasan a
   naranja al pasar el ratón.
   - El porcentaje va en `--valor` en cada barra (4/5 → 80 %).
   - La barra es decorativa (`aria-hidden`): el lector de pantalla lee el
     texto «4/5», que sigue estando.
   - Sin JavaScript las barras salen directamente con su valor, sin
     animación.
   - **Apilado** (menos de 54 rem) el rótulo «Herramientas que utilizo»
     sube y sale justo debajo de la raya, antes de la lista. En el HTML
     sigue yendo después; solo cambia el orden en pantalla.
   - **Por debajo de 34 rem** cada herramienta ocupa tres líneas (nombre,
     barra y nota) y **la nota va pegada al borde derecho**, justo donde
     termina la línea gris de la barra.
8. **Botones y descriptores son píldoras de borde naranja**, con las
   esquinas completamente redondeadas. El botón «Contáctame!» se invierte
   al pasar por encima: se rellena de naranja y la letra pasa a blanco.
9. **Un solo naranja en toda la web**, `#ED5C01`. Antes había una variante
   oscurecida para el texto pequeño; ver la nota de *Accesibilidad*.
10. **Las dos franjas de disciplinas comparten una rejilla de seis
    columnas.** La de abajo reparte sus palabras a lo ancho y la de arriba
    va desplazada media columna, de modo que cada palabra cae justo en el
    hueco entre dos de la otra fila: «Tipografía» entre «Packaging» y
    «Branding», y «Cartelería» entre «Branding» y «Dirección creativa».
    Arriba, en naranja, van «Tipografía», «Cartelería» e «Ilustración»;
    abajo, en lila, «Packaging», «Branding» y «Dirección creativa».
    La rejilla entera va corrida un poco hacia la izquierda (`--corre`):
    como las palabras van centradas en su celda, la primera arrancaba muy
    por dentro del margen mientras la última llegaba al borde, y el bloque
    se veía escorado. Lo que se quita por un lado se añade por el otro, de
    modo que la rejilla no cambia de tamaño y el cuadre entre las dos
    filas se mantiene exacto.
    **«Dirección creativa» va siempre partida en dos líneas** y centrada
    en su celda: en pantallas anchas le cabía de sobra en una y rompía el
    ritmo de la franja. El ancho de esa celda se estrecha solo lo justo
    para que no quepan las dos palabras seguidas (`max-width: 12ch`).
    **«Ilustración» se devuelve al borde.** Como la rejilla entera va
    corrida hacia la izquierda, la última palabra de arriba se quedaba
    justo encima de «Dirección creativa» y las dos se chafaban. Se le
    aplica el `--corre` en sentido contrario (`margin-right` negativo):
    cierra la franja al filo del margen derecho y deja aire entre las dos.
    **En pantallas de menos de 60 rem caen en columna**, una palabra por
    línea, alternando naranja y lila: Tipografía, Packaging, Cartelería,
    Branding, Ilustración y Dirección creativa — que ahí sí va en una
    sola línea, porque no hay franja con la que cuadrar. Ahí `--corre`
    vale 0, así que el ajuste de «Ilustración» se desactiva solo.
11. **«Rediseño de identidad» avisa de que está en marcha**: al pasar por
    encima de la foto se funde un velo con «en proceso...». En pantallas
    sin ratón el aviso se queda puesto, porque allí no hay forma de pasar
    por encima; el velo es translúcido y la foto se sigue viendo. El
    estado también está en el titular para el lector de pantalla.
12. **La pastilla lila del contacto llega a los dos bordes de la
    pantalla.** Sale de la caja con un margen negativo y recupera por
    dentro el mismo margen, así que el texto sigue alineado con el del
    resto de la página.
13. **Todos los textos de las páginas de proyecto van al mismo cuerpo,
    1,35 rem**: el corrido, los pies de foto, los rótulos de sección y las
    fichas técnicas. Es bastante más que en la maqueta, donde a 1 rem se
    quedaban cortos en pantalla. Lo único que va aparte son los
    titulares grandes (`CAMINS PER RECÓRRER` y su subtítulo) y el
    contador de la galería de onada, que es un indicador, no texto.
13 bis. **El contenido de las páginas de proyecto va en negro**, como en
    la maqueta, titulares incluidos. El color se aplica a `main` y no a
    `body`, de modo que la cabecera sigue en lila como en la portada.
13 ter. **La misma tipografía en todos los textos de proyecto.** Ya lo era
    (todo Archivo), salvo el eslogan *Camins per recórrer* dentro del
    primer párrafo de camins: iba en cursiva, y como Archivo no tiene
    itálica el navegador la inclinaba a la fuerza y parecía otra letra.
    Ahora va recto y se destaca con el peso (`.lema`), que sí existe en la
    familia.
14. **Al pie de cada proyecto se puede pasar al siguiente.** A la
    izquierda sigue el «Volver a proyectos» y a la derecha hay un
    «Siguiente proyecto →». El orden es el del carrusel de la portada
    (packaging → camins → onada → cartelería) y desde el último se vuelve
    al primero, así que se pueden ver los cuatro seguidos.
15. **Onada tiene una galería del brandbook**: se ve una imagen a la vez y
    con **una flecha a cada lado** van pasando. La de la derecha avanza y
    al llegar a la última vuelve a la primera; la de la izquierda
    retrocede y desde la primera salta a la última. Debajo, a la derecha,
    un contador discreto.
    - El sentido de cada botón va en su `data-sentido` (1 o -1), de modo
      que añadir flechas a otra galería no toca el JavaScript.
    - **Ocupa el hueco que antes tenía la segunda foto de la página**, a su
      mismo tamaño (4:3 en la columna ancha), con el texto de presentación
      al lado. Antes iba a todo el ancho, más abajo, y se veía enorme.
    - El orden empieza por el manual de identidad y sigue por el brandbook
      abierto; la foto que ocupaba ese hueco (`brandbook-2`) se ha metido
      como última de la galería, que pasa a tener **7** imágenes.
    - Va con `scroll-snap`, de modo que **sin JavaScript** sigue siendo
      una tira que se recorre a mano.
    - Si se recorre a mano, el contador sigue a la imagen que se esté
      viendo para que luego la flecha no dé un salto raro.
16. **En Animalcoi y en Hellín la ficha técnica se mete en la columna del
    texto**, pegada al filo de arriba de la foto, y el texto descriptivo
    cae al pie de esa misma foto (`.ficha-foto`): los dos bloques cuadran
    con los dos bordes de la imagen, como en tu montaje.
    - La columna se estira hasta la altura de la foto y reparte el aire
      entre los dos (`justify-content: space-between`).
    - Para que la primera línea arranque a la altura exacta de la foto se
      descuenta la mitad del interlineado (`.al-filo`); si no, el texto
      empieza unos píxeles por debajo.
    - En Renault la ficha se queda donde estaba, a todo el ancho, porque
      va justo debajo de la foto de portada.
    - En pantallas de menos de 48 rem, al apilarse, deja de haber foto con
      la que cuadrar y los dos bloques van seguidos.
17. **El GIF cuadrado de Animalcoi sale a la mitad de ancho** (`.mitad`).
    Viene a 300 px y a todo el ancho de la columna se veía desproporcionado
    al lado del alargado. En pantallas estrechas va al 70 %.
18. **Hay un botón de volver arriba** en las cinco páginas: un redondel del
    lila de marca con la flecha en blanco, abajo a la derecha. Asoma
    cuando ya se ha bajado el 80 % de la pantalla y se va solo al llegar
    de nuevo al principio.
    - Apagado va con `visibility: hidden`, no solo transparente: así no se
      puede pulsar sin querer ni se alcanza con el tabulador.
    - El scroll dispara cientos de veces por segundo; se atiende como mucho
      una vez por fotograma (`requestAnimationFrame`).
    - **Sin JavaScript no aparece nunca**, así que no estorba.
    - No sale al imprimir.
19. **El retrato de «Sobre mí» es la polaroid con su marco**, pero recortada
    por el canto mismo de la cartulina: lo que se quita es el blanco de la
    mesa que la rodeaba. Queda en 9:14 —la proporción de la cartulina—, a
    900 px de ancho (135 KB).
    - La cartulina no sale girada sino un poco escorzada: el canto derecho
      cae recto y el izquierdo se abre unos píxeles de arriba abajo. Por
      eso no se endereza con un giro; se recorta por el canto más metido de
      cada lado, de modo que no entra ni un píxel de fondo a cambio de
      perder medio punto porcentual de cartulina en el lado contrario.
    - Como el marco es del mismo blanco que la página, el filo se sigue
      marcando con una línea finísima del lila de marca; si no, la foto se
      desangraría contra el fondo.
19 bis. **El pie lleva un reloj en marcha**, abajo a la derecha, en
    `hh:mm:ss`. Es la hora **de quien mira**, no la de un servidor: sale de
    su propio reloj y de su propia zona horaria.
    - Las cifras van de ancho fijo (`tabular-nums`), para que al pasar de un
      1 a un 8 no baile toda la línea.
    - No se dispara cada 1000 ms a ciegas, sino que se engancha al segundo
      en curso; si no, el salto de cifra se iría desfasando poco a poco.
    - Nace oculto en el HTML y solo se enseña si hay JavaScript, así que
      sin él no queda un hueco raro. Los iconos siguen centrados igual,
      porque la rejilla reserva las tres columnas pase lo que pase.
    - No se anuncia a cada segundo al lector de pantalla: es un dato de
      adorno, y una región «viva» repitiendo la hora sería insoportable.
20. **El logo de la cabecera va más pequeño**, de 1,6–2,2 rem de alto a
    1,25–1,75 rem.
21. **Cursivas de texto corrido** (`.termino`): los extranjerismos y
    términos como *flat design* en packaging van en cursiva. Archivo no
    tiene itálica de verdad —el navegador la inclinaría a la fuerza—, así
    que la cursiva sale de la Instrument Serif de la casa, sin cambiar de
    color para que no se lea como un destacado. Va un punto más grande
    (`1.15em`) porque la serif pinta más pequeña al mismo cuerpo.
22. **Trozos de texto que no se parten** (`.junto`): en la ficha de camins,
    «de patrimonio» va junto, de modo que al cortarse la línea la
    preposición baja con su sustantivo en vez de quedarse colgada al final.

## El rollover de marca

De normal la palabra va en **Archivo bold y en lila**; al pasar el ratón
pasa a la **cursiva Instrument Serif en naranja**. Lo llevan las tres
opciones del menú (con filete que crece desde la derecha) y el enlace al
CV, que además cambia de «CV» a «cv».

Cambiar de tipografía a media animación movería el texto de sitio, así que
cada rótulo lleva las dos versiones de la palabra apiladas **en la misma
celda de una rejilla**: la celda mide lo que la más ancha de las dos y lo
único que cambia es cuál de ellas se ve. La versión en cursiva va marcada
como `aria-hidden`, de modo que el lector de pantalla lee la palabra una
sola vez.

El filete del menú cuelga de la cursiva, no del enlace: así mide justo lo
que la palabra y no se asoma por los lados.

## Peso de las imágenes

Las imágenes salieron de los PDF a resolución de imprenta (hasta
5799 × 4500 px) y el sitio pesaba **70 MB**. Una tarjeta del carrusel de
2918 px se mostraba a 558: el navegador se atascaba decodificándolas y el
desplazamiento del carrusel iba a tirones.

Están reducidas al tamaño que realmente se usa — 1400 px de ancho las del
carrusel, 2200 px las de las páginas de proyecto — y dos fotos que estaban
guardadas como PNG (`banderola-naranja` y `triptico`) pasaron a JPEG.

El sitio pesa **22,9 MB**. De ellos, **3 MB son el GIF de las banderolas**
de camins: venía a 4500 px y 11 MB, y reducirlo a 1400 px lo deja en 3.
Sigue siendo con diferencia lo más pesado del sitio (lo siguiente son 722
KB); si alguna vez molesta, lo suyo sería pasarlo a vídeo, que para lo
mismo pesa unas diez veces menos. Para reducirlo hay que conservar a mano
los retardos de cada fotograma y la marca de bucle, que es lo que hace
`herramientas/reducir-gif.ps1`.

Si alguna vez hacen falta las originales, se vuelven a sacar de los PDF con
los scripts de `herramientas/`.

## El logo y los iconos

En `assets/img/ui/` están el logo y los tres iconos del pie (Instagram,
LinkedIn y mail), tal y como los enviaste. Venían a 1400 px los iconos y
2990 px el logo, para verse a 30 y a 120: reducidos al tamaño en que se
usan (×3, para pantallas de mucha resolución) pasan de 194 KB a 37 KB en
total, sin que se note ninguna diferencia en pantalla.

- El logo sustituye a la palabra «LOGO» en la cabecera de las cinco
  páginas, y sigue siendo el enlace a la portada.
- Los tres iconos enlazan ya: Instagram al perfil, mail abre el correo y
  **LinkedIn apunta a tu perfil**.
- Al pasar el ratón crecen un poco y se aclaran. No cambian de color
  porque son imágenes, no trazados.

## Decisiones que conviene que revises

1. **Las páginas de proyecto llevan cabecera.** En los PDF empiezan
   directamente con la foto de portada, sin menú. Se la he puesto para que
   haya forma de volver a la portada; si la quieres fuera, se quita en un
   momento.
2. **«Rediseño de identidad» no enlaza a ninguna parte**, porque no hay PDF
   de esa página. Las otras cuatro tarjetas sí enlazan.
3. ~~Los banners de Animalcoi son imágenes fijas.~~ **Resuelto**: son los
   GIF animados que pasaste, 41 y 46 KB, puestos tal cual.
4. ~~Las planimetrías del packaging son de baja resolución.~~ **Resuelto**:
   las dos salen ahora de los PDF que pasaste, rasterizados a 2200 px con
   `herramientas/rasterizar.js`. Dentro del PDF no eran una imagen que se
   pudiera extraer, sino dibujo vectorial; lo único guardado como imagen
   era la silueta del troquel.
5. ~~Falta la dirección del perfil de LinkedIn.~~ **Resuelto**: el icono del
   pie enlaza ya a tu perfil.
6. **«Política de privacidad»** apunta a `#` porque esa página no existe aún.
7. **`assets/img/packaging/caja-roja.jpg` ya no se usa.** La sustituye
   `caja-naranja.jpg`, el mockup con fondo naranja que pasaste. El archivo
   viejo sigue en disco por si lo quieres recuperar; dime y lo borro.
8. **En Hellín la foto sigue a la izquierda y el texto a la derecha**, al
   revés que en Animalcoi. La alineación con la foto es la que pediste en
   las dos; si las prefieres las dos con el texto a la izquierda, se
   cambia en un momento.
9. **Onada estrena portada y tarjeta con el logotipo.** La tarjeta del
   carrusel («cuando lo ves desde fuera») lleva el logo azul y, al abrir la
   página, la portada es el logo amarillo.
   - La **portada es el GIF animado** (`portada-logo.gif`), no la versión
     fija: 1920 × 1080, 11 fotogramas a medio segundo y bucle infinito, 83
     KB. Va tal cual, sin reducir, porque ya pesa menos que el JPG que
     sustituye. Viene a 16:9 y el hueco de portada es 3:2, así que el
     `object-fit: cover` le recorta un 8 % por cada lado; el logotipo
     queda holgado dentro, también en el 4:3 de las pantallas estrechas.
   - La **tarjeta** sí es un montaje: se recorta el logo azul por su caja y
     se centra en un lienzo blanco de 16:8,6, el formato del hueco, para
     que no lo deforme ni lo recorte nada.
   - El fondo se deja en blanco puro, el mismo de la página. Con el hueso
     de los huecos de imagen no vale: el logo trae su propio recuadro
     blanco y se marcaría como un rectángulo dentro de la tarjeta.
   - La foto que antes era la portada (`brandbook-1.jpg`) no se ha perdido:
     ha pasado a ser la **primera imagen de la galería del brandbook**, que
     ahora tiene 8 en vez de 7.

## Accesibilidad

- `lang="es"`, con `lang="ca"` en los fragmentos en valenciano.
- Enlace para saltar al contenido, landmarks y un solo `h1` por página.
- Las 53 imágenes tienen `alt` descriptivo; las flechas `→` decorativas
  están marcadas como `aria-hidden` para que no las lea el lector de
  pantalla.
- Foco visible en todos los elementos interactivos.
- Contraste: el azul `#4A509A` sobre blanco da 7,4:1 y el negro de las
  páginas de proyecto, 21:1. Los dos cumplen AA y AAA de sobra.
- **El naranja es uno solo en toda la web, `#ED5C01`**, tal y como pediste.
  Sobre blanco da 3,1:1, que cumple AA para texto grande, para los bordes
  de las píldoras y para el recuadro de foco, pero **no para el texto
  pequeño**: el rótulo «DISEÑADORA GRÁFICA», los descriptores de las
  tarjetas, «Estudiante de diseño gráfico» y los enlaces de la ficha de
  contacto se quedan por debajo del mínimo. Antes esos sitios llevaban un
  naranja oscurecido (`#B84500`) que sí cumplía. Si en algún momento
  quieres recuperarlo solo para esos casos, está hecho en un momento.
- Soporta `prefers-reduced-motion` y tiene hoja de impresión.
- La web funciona entera sin JavaScript: el carrusel y la galería se
  recorren a mano, el menú abre y cierra solo y las barras salen con su
  valor.
- La sección que se está viendo se marca en el menú con `aria-current`,
  que es lo que lee el lector de pantalla, **pero ya no cambia de color**:
  las tres opciones van siempre en lila y el naranja queda reservado al
  rollover.

## Estructura

```
web/
├─ index.html  packaging.html  camins.html  onada.html  carteles.html
├─ servidor.js              servidor local con Node
├─ LEEME.md
├─ herramientas/            scripts de extracción desde los PDF
└─ assets/
   ├─ css/style.css
   ├─ js/app.js
   └─ img/
      ├─ ui/                   logo e iconos de Instagram, LinkedIn y mail
      └─ {home,packaging,camins,onada,carteles}/
```

`herramientas/` tiene los scripts de extracción desde los PDF
(`extraer*.js`, `texto.js`, `colores.js`), los de preparar material nuevo
(`rasterizar.js`, `reducir.ps1`, `reducir-gif.ps1`) y `revisar.js`, que
comprueba que no haya enlaces ni imágenes rotas:

```
Comprobaciones: 136   Problemas: 0
Imagenes en disco: 64   usadas: 63   sin usar: 1
  sin usar: assets/img/packaging/caja-roja.jpg
```

La que sale «sin usar» es la foto de la caja sobre fondo rojo, sustituida
por la de fondo naranja. Se queda en disco hasta que digas.
