let personajeDiario = null;
let lista = [];
let personajesUsados = new Set();
let juegoTerminado = false;

window.onload = preparacion;

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('personaje');
  const button = document.getElementById('btnBuscar');

  if (input) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        buscar();
      }
    });
  }

  if (button) {
    button.addEventListener('click', buscar);
  }
});

function preparacion() {
  const xhr = new XMLHttpRequest();
  const url = 'https://www.demonslayer-api.com/api/v1/characters?limit=1000';

  xhr.open('GET', url, true);
  xhr.onload = async function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      const respuesta = JSON.parse(xhr.responseText);
      lista = respuesta.content || [];

      const hoy = new Date();
      const dia = hoy.getDate();
      const mes = hoy.getMonth() + 1;
      const anio = hoy.getFullYear();
      const numero = dia * mes * 3 + anio;
      const indice = Math.abs(numero % lista.length);

      const nombreDiario = lista[indice]?.name;
      if (!nombreDiario) {
        mostrarMensaje('No se pudo cargar el personaje del día.', 'error');
        return;
      }

      try {
        const personaje = await devolverObjeto(nombreDiario);
        personajeDiario = personaje.content?.[0] || null;

        if (!personajeDiario) {
          mostrarMensaje('El personaje del día no está disponible.', 'error');
        }
      } catch (error) {
        console.error(error);
        mostrarMensaje('Ha ocurrido un error al cargar la selección del día.', 'error');
      }
    }
  };

  xhr.onerror = function () {
    mostrarMensaje('No se pudo conectar con la API.', 'error');
  };

  xhr.send();
}

function buscar() {
  if (juegoTerminado) {
    return;
  }

  const input = document.getElementById('personaje');
  const nombre = input.value.trim();

  if (!nombre) {
    mostrarMensaje('Escribe el nombre de un personaje primero.', 'info');
    input.focus();
    return;
  }

  const nombreNormalizado = nombre.toLowerCase();

  if (personajesUsados.has(nombreNormalizado)) {
    mostrarMensaje('Ese personaje ya ha sido usado. Busca otro.', 'info');
    input.value = '';
    return;
  }

  const xhr = new XMLHttpRequest();
  const url = 'https://www.demonslayer-api.com/api/v1/characters?name=' + encodeURIComponent(nombre);

  xhr.open('GET', url, true);
  xhr.onload = function () {
    if (xhr.readyState !== 4 || xhr.status !== 200) {
      mostrarMensaje('No se ha encontrado ese personaje.', 'error');
      return;
    }

    const respuesta = JSON.parse(xhr.responseText);
    const personaje = respuesta.content?.[0];

    if (!personaje || !personajeDiario) {
      mostrarMensaje('El personaje no existe o aún no está listo.', 'error');
      return;
    }

    const nombrePersonajeNormalizado = personaje.name.toLowerCase();

    if (personajesUsados.has(nombrePersonajeNormalizado)) {
      mostrarMensaje('Ese personaje ya ha sido usado. Busca otro.', 'info');
      input.value = '';
      return;
    }

    input.value = '';
    personajesUsados.add(nombrePersonajeNormalizado);
    lista = lista.filter((item) => item.name.toLowerCase() !== nombrePersonajeNormalizado);
    crearFila(personaje);

    if (personaje.name === personajeDiario.name) {
      finalizarVictoria(personaje);
    }
  };

  xhr.onerror = function () {
    mostrarMensaje('Ha ocurrido un problema al buscar el personaje.', 'error');
  };

  xhr.send();
}

function crearFila(personaje) {
  const tabla = document.getElementById('tabla');
  const fila = document.createElement('tr');

  const columnaImagen = document.createElement('th');
  const img = document.createElement('img');
  img.src = personaje.img || '';
  img.alt = personaje.name;
  img.className = 'character-thumb';
  columnaImagen.appendChild(img);
  fila.appendChild(columnaImagen);

  const columnaRaza = document.createElement('th');
  const raza = document.createElement('span');
  raza.textContent = personaje.race || 'Desconocida';
  columnaRaza.appendChild(raza);
  fila.appendChild(columnaRaza);
  columnaRaza.className = personaje.race === personajeDiario.race ? 'correcto' : 'incorrecto';

  const columnaGenero = document.createElement('th');
  const genero = document.createElement('span');
  genero.textContent = personaje.gender || 'Desconocido';
  columnaGenero.appendChild(genero);
  fila.appendChild(columnaGenero);
  columnaGenero.className = personaje.gender === personajeDiario.gender ? 'correcto' : 'incorrecto';

  const columnaEstilo = document.createElement('th');
  const estilosPersonaje = personaje.combat_style || [];
  const estilosDiario = personajeDiario.combat_style || [];
  const contenedorEstilos = document.createElement('div');

  if (estilosPersonaje.length === 0) {
    const texto = document.createElement('span');
    texto.textContent = 'Ninguno';
    contenedorEstilos.appendChild(texto);
  } else {
    estilosPersonaje.forEach((estilo) => {
      const item = document.createElement('div');
      item.textContent = estilo.name || 'Desconocido';
      contenedorEstilos.appendChild(item);
    });
  }

  columnaEstilo.appendChild(contenedorEstilos);
  fila.appendChild(columnaEstilo);

  let coincidenciaParcial = false;
  let coincidenciaCompleta = false;

  if (JSON.stringify(estilosDiario) === JSON.stringify(estilosPersonaje)) {
    coincidenciaCompleta = true;
  } else {
    for (const estiloDiario of estilosDiario) {
      for (const estiloPersonaje of estilosPersonaje) {
        if (estiloDiario.name === estiloPersonaje.name) {
          coincidenciaParcial = true;
        }
      }
    }
  }

  if (coincidenciaCompleta) {
    columnaEstilo.className = 'correcto';
  } else if (coincidenciaParcial) {
    columnaEstilo.className = 'parcial';
  } else {
    columnaEstilo.className = 'incorrecto';
  }

  const columnaArco = document.createElement('th');
  const arco = document.createElement('span');
  arco.textContent = personaje.first_arc_appearance?.name || 'Desconocido';
  columnaArco.appendChild(arco);
  fila.appendChild(columnaArco);
  columnaArco.className = personaje.first_arc_appearance?.name === personajeDiario.first_arc_appearance?.name ? 'correcto' : 'incorrecto';

  tabla.appendChild(fila);
}

function finalizarVictoria(personaje) {
  juegoTerminado = true;
  const input = document.getElementById('personaje');
  const button = document.getElementById('btnBuscar');

  if (input) input.disabled = true;
  if (button) button.disabled = true;

  const contenedor = document.getElementById('sugerencias');
  if (contenedor) {
    contenedor.innerHTML = '';
  }

  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'victory-overlay';

  // Crear modal
  const modal = document.createElement('div');
  modal.className = 'victory-modal';

  // Imagen del personaje
  const img = document.createElement('img');
  img.src = personaje.img || '';
  img.alt = personaje.name;
  img.className = 'victory-image';

  // Título
  const title = document.createElement('div');
  title.className = 'victory-title';
  title.textContent = '¡FELICIDADES!';

  // Nombre del personaje
  const characterName = document.createElement('div');
  characterName.className = 'victory-character';
  characterName.textContent = personaje.name;

  // Mensaje
  const message = document.createElement('div');
  message.className = 'victory-message';
  message.textContent = `Has adivinado correctamente. El personaje del día era ${personaje.name}.`;

  // Botón para cerrar
  const button2 = document.createElement('button');
  button2.className = 'victory-button';
  button2.textContent = 'Volver a Intentar Mañana';
  button2.onclick = () => {
    location.reload();
  };

  // Agregar elementos al modal
  modal.appendChild(img);
  modal.appendChild(title);
  modal.appendChild(characterName);
  modal.appendChild(message);
  modal.appendChild(button2);

  // Agregar modal al overlay
  overlay.appendChild(modal);

  // Agregar overlay al body
  document.body.appendChild(overlay);
}

function devolverObjeto(nombre) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = 'https://www.demonslayer-api.com/api/v1/characters?name=' + encodeURIComponent(nombre);

    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error('Error en la petición: ' + xhr.status));
        }
      }
    };

    xhr.onerror = function () {
      reject(new Error('Error de red'));
    };

    xhr.send();
  });
}

function sugerencia() {
  const input = document.getElementById('personaje').value.trim().toLowerCase();
  const contenedor = document.getElementById('sugerencias');
  contenedor.innerHTML = '';

  if (juegoTerminado) {
    return;
  }

  if (!lista || lista.length === 0) {
    contenedor.textContent = 'Cargando personajes...';
    return;
  }

  if (!input) {
    return;
  }

  const coincidencias = lista
    .filter((personaje) => !personajesUsados.has(personaje.name.toLowerCase()))
    .filter((personaje) => personaje.name.toLowerCase().startsWith(input))
    .slice(0, 5);

  if (coincidencias.length === 0) {
    contenedor.textContent = 'No hay coincidencias';
    return;
  }

  const ul = document.createElement('ul');

  coincidencias.forEach((personaje) => {
    const div = document.createElement('div');
    div.className = 'lista';
    div.onclick = () => {
      document.getElementById('personaje').value = personaje.name;
      contenedor.innerHTML = '';
      buscar();
    };

    const img = document.createElement('img');
    img.src = personaje.img;
    img.alt = personaje.name;

    const text = document.createElement('a');
    text.textContent = personaje.name;

    div.appendChild(img);
    div.appendChild(text);
    ul.appendChild(div);
  });

  contenedor.appendChild(ul);
}

function mostrarMensaje(texto, tipo) {
  const bloque = document.getElementById('mensajeEstado');
  if (!bloque) {
    return;
  }

  bloque.textContent = texto;
  bloque.className = 'status-message visible ' + tipo;
}
