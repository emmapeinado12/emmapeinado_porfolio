/* =========================================================
   Emma Peinado — portfolio
   1. Carrusel de proyectos: quieto, se recorre con las flechas
      y al terminar vuelve a empezar sin costura
   1 bis. Galerías de las páginas de proyecto
   2. Menú desplegable
   3. Barras de herramientas
   4. Botón de volver arriba
   5. Reloj del pie
   6. Sección visible marcada en el menú
   Sin JavaScript la tira de proyectos sigue siendo desplazable.
   ========================================================= */
(function () {
  'use strict';

  var menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ------------------------------------------------------
     1 · Carrusel de proyectos
     ------------------------------------------------------ */
  var carrusel = document.getElementById('carrusel');
  var btnAntes = document.getElementById('carrusel-antes');
  var btnDespues = document.getElementById('carrusel-despues');

  if (carrusel && btnAntes && btnDespues) {
    var pista = carrusel.querySelector('.carrusel-pista');
    var originales = Array.prototype.slice.call(pista.children);
    var cuantas = originales.length;

    // Copia de las tarjetas para que al llegar al final se pueda seguir
    // sin que se note el salto. La copia queda fuera del lector de
    // pantalla y del tabulador: no se anuncia ni se navega dos veces.
    originales.forEach(function (li) {
      var copia = li.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(
        copia.querySelectorAll('a, button, [tabindex]'),
        function (f) { f.setAttribute('tabindex', '-1'); }
      );
      pista.appendChild(copia);
    });

    // Distancia de un juego completo de tarjetas y de una sola tarjeta.
    // Se miden una vez y se guardan: leer offsetLeft en cada evento de
    // scroll obligaría al navegador a recalcular la maquetación sin parar.
    var medidas = { periodo: 0, paso: 0 };
    var medir = function () {
      var base = pista.children[0].offsetLeft;
      medidas.periodo = pista.children[cuantas].offsetLeft - base;
      // El paso se saca del periodo, no midiendo una tarjeta suelta: así
      // los pasos dividen la vuelta exacta y no se acumula deriva de 1 px.
      medidas.paso = medidas.periodo / cuantas;
    };
    medir();

    var remedir = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(remedir);
      remedir = window.setTimeout(medir, 200);
    });

    // La posición se lleva aparte y en coma flotante: scrollLeft solo
    // admite enteros, y redondear en cada paso acumularía un píxel de
    // deriva por vuelta. Mientras se mueve por botón, el vigilante de
    // scroll no toca nada (si no, cortaría la animación).
    var posicion = 0;
    var porBoton = false;
    var temporizador = null;

    var mover = function (sentido) {
      var p = medidas.periodo;
      if (p <= 0) return;
      porBoton = true;

      // Se normaliza SIEMPRE al empezar, no al terminar: si dependiera de
      // un temporizador, al pulsar rápido se reiniciaría y el carrusel se
      // iría al tope. Los saltos no se ven porque el contenido es idéntico.
      if (posicion >= p) { posicion -= p; carrusel.scrollLeft = Math.round(posicion); }
      else if (posicion < 0) { posicion += p; carrusel.scrollLeft = Math.round(posicion); }

      var destino = posicion + sentido * medidas.paso;
      if (destino < -0.5) {
        // Hacia atrás desde el principio: se salta al juego siguiente
        // y desde ahí se anima hacia atrás.
        posicion += p;
        carrusel.scrollLeft = Math.round(posicion);
        destino += p;
      }

      posicion = destino;
      carrusel.scrollTo({
        left: destino,
        behavior: menosMovimiento.matches ? 'auto' : 'smooth'
      });

      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(function () { porBoton = false; },
                                       menosMovimiento.matches ? 60 : 700);
    };

    btnDespues.addEventListener('click', function () { mover(1); });
    btnAntes.addEventListener('click', function () { mover(-1); });

    // Si se recorre a mano (táctil o trackpad), se mantiene dentro del bucle
    // Si se recorre a mano (táctil o trackpad), se sigue el bucle y se
    // sincroniza la posición que lleva el script.
    carrusel.addEventListener('scroll', function () {
      if (porBoton) return;
      var p = medidas.periodo;
      if (p <= 0) return;
      if (carrusel.scrollLeft >= p) {
        porBoton = true;
        carrusel.scrollLeft -= p;
        porBoton = false;
      }
      posicion = carrusel.scrollLeft;
    }, { passive: true });
  }

  /* ------------------------------------------------------
     1 bis · Galerías de las páginas de proyecto
     Una imagen a la vez, con una flecha a cada lado. La de la
     derecha pasa a la siguiente y, en la última, vuelve a la
     primera; la de la izquierda hace el camino contrario. Sin
     esto la tira se sigue recorriendo a mano.
     ------------------------------------------------------ */
  Array.prototype.forEach.call(
    document.querySelectorAll('.galeria'),
    function (galeria) {
      var pista = galeria.querySelector('.galeria-pista');
      var botones = Array.prototype.slice.call(
        galeria.querySelectorAll('.galeria-flecha')
      );
      var cuenta = galeria.querySelector('.galeria-actual');
      if (!pista || !botones.length) return;
      var fotos = Array.prototype.slice.call(pista.children);
      if (fotos.length < 2) {
        botones.forEach(function (b) { b.hidden = true; });
        return;
      }

      var actual = 0;

      var marcar = function () {
        if (cuenta) { cuenta.textContent = String(actual + 1); }
      };

      botones.forEach(function (boton) {
        // El sentido viene del propio botón; si no lo lleva, avanza.
        var sentido = Number(boton.getAttribute('data-sentido')) || 1;
        boton.addEventListener('click', function () {
          // El módulo de JavaScript devuelve negativo con números
          // negativos, así que se suma la vuelta antes de reducir.
          actual = (actual + sentido + fotos.length) % fotos.length;
          pista.scrollTo({
            left: fotos[actual].offsetLeft - fotos[0].offsetLeft,
            behavior: menosMovimiento.matches ? 'auto' : 'smooth'
          });
          marcar();
        });
      });

      // Si se recorre a mano (táctil o trackpad), el contador sigue a la
      // foto que se esté viendo, para que la flecha no dé un salto raro.
      var espera = null;
      pista.addEventListener('scroll', function () {
        window.clearTimeout(espera);
        espera = window.setTimeout(function () {
          var paso = fotos.length > 1
            ? fotos[1].offsetLeft - fotos[0].offsetLeft
            : pista.clientWidth;
          if (paso > 0) {
            actual = Math.max(0, Math.min(fotos.length - 1,
                     Math.round(pista.scrollLeft / paso)));
            marcar();
          }
        }, 120);
      }, { passive: true });

      marcar();
    }
  );

  /* ------------------------------------------------------
     2 · Menú desplegable
     El <details> ya abre y cierra solo. Esto solo añade los
     cierres que se esperan: al elegir opción, con Esc y al
     pulsar fuera.
     ------------------------------------------------------ */
  var desplegable = document.getElementById('menu-desplegable');
  if (desplegable) {
    var resumen = desplegable.querySelector('summary');
    var cerrarMenu = function (devolverFoco) {
      if (!desplegable.hasAttribute('open')) return;
      desplegable.removeAttribute('open');
      if (devolverFoco) { resumen.focus(); }
    };

    desplegable.addEventListener('click', function (e) {
      if (e.target.closest('.menu-lista a')) { cerrarMenu(false); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && desplegable.hasAttribute('open')) {
        e.preventDefault();
        cerrarMenu(true);
      }
    });

    document.addEventListener('click', function (e) {
      if (desplegable.hasAttribute('open') && !desplegable.contains(e.target)) {
        cerrarMenu(false);
      }
    });

    desplegable.addEventListener('focusout', function () {
      window.setTimeout(function () {
        if (desplegable.hasAttribute('open') &&
            !desplegable.contains(document.activeElement)) { cerrarMenu(false); }
      }, 0);
    });
  }

  /* ------------------------------------------------------
     3 · Barras de herramientas: se rellenan al aparecer
     ------------------------------------------------------ */
  var tools = document.getElementById('lista-tools');
  if (tools && 'IntersectionObserver' in window && !menosMovimiento.matches) {
    tools.classList.add('con-animacion');
    var vigia = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        tools.classList.add('visible');
        obs.disconnect();
      });
    }, { threshold: 0.25 });
    vigia.observe(tools);
  }

  /* ------------------------------------------------------
     4 · Botón de volver arriba
     Asoma cuando ya se ha bajado casi una pantalla y se va
     solo al volver al principio.
     ------------------------------------------------------ */
  var subir = document.getElementById('arriba');
  if (subir) {
    var asomar = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      // 80 % de la ventana: no asoma al primer golpe de rueda, pero está
      // ahí en cuanto la portada deja de verse.
      if (y > window.innerHeight * 0.8) { subir.classList.add('visible'); }
      else { subir.classList.remove('visible'); }
    };

    // El scroll dispara cientos de veces por segundo; se atiende como mucho
    // una vez por fotograma para no estar tocando clases sin parar.
    var enCola = false;
    window.addEventListener('scroll', function () {
      if (enCola) return;
      enCola = true;
      window.requestAnimationFrame(function () {
        enCola = false;
        asomar();
      });
    }, { passive: true });

    // Al recargar a media página el botón ya tiene que estar puesto.
    asomar();

    subir.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: menosMovimiento.matches ? 'auto' : 'smooth'
      });
    });
  }

  /* ------------------------------------------------------
     5 · Reloj del pie
     La hora es la de quien mira, no la de un servidor: sale de
     su propio reloj y de su propia zona horaria. Nace oculto en
     el HTML y solo se enseña si hay JavaScript, de modo que sin
     él no queda un hueco vacío; los iconos siguen centrados
     igual, porque la rejilla reserva las tres columnas.
     ------------------------------------------------------ */
  var reloj = document.getElementById('reloj');

  if (reloj) {
    var dosCifras = function (n) { return (n < 10 ? '0' : '') + n; };

    var ponerHora = function () {
      var ahora = new Date();
      var hh = dosCifras(ahora.getHours());
      var mm = dosCifras(ahora.getMinutes());
      var ss = dosCifras(ahora.getSeconds());
      reloj.textContent = hh + ':' + mm + ':' + ss;
      // datetime quiere la hora en formato máquina, sin los dos puntos
      // de adorno: así el dato sigue siendo legible para quien no ve.
      reloj.setAttribute('datetime', hh + ':' + mm + ':' + ss);
    };

    ponerHora();
    reloj.hidden = false;

    // Se engancha al segundo en curso en vez de disparar cada 1000 ms a
    // ciegas: si no, el salto de cifra se va desfasando poco a poco.
    var alSiguienteSegundo = function () {
      window.setTimeout(function () {
        ponerHora();
        alSiguienteSegundo();
      }, 1000 - (Date.now() % 1000));
    };
    alSiguienteSegundo();
  }

  /* ------------------------------------------------------
     6 · Sección activa en el menú
     ------------------------------------------------------ */
  var enlaces = Array.prototype.slice.call(
    document.querySelectorAll('.menu-lista a[href*="#"]')
  );
  if (!enlaces.length || !('IntersectionObserver' in window)) return;

  var pares = enlaces
    .map(function (a) {
      var id = a.getAttribute('href').split('#')[1];
      var seccion = id ? document.getElementById(id) : null;
      return seccion ? { a: a, seccion: seccion } : null;
    })
    .filter(Boolean);

  if (!pares.length) return;

  var observador = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (entrada) {
      if (!entrada.isIntersecting) return;
      pares.forEach(function (p) {
        if (p.seccion === entrada.target) { p.a.setAttribute('aria-current', 'page'); }
        else { p.a.removeAttribute('aria-current'); }
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  pares.forEach(function (p) { observador.observe(p.seccion); });
})();
