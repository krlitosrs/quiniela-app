const partidos = [
  { id: 1, local: "Brasil", visitante: "Alemania" },
  { id: 2, local: "Argentina", visitante: "Francia" }
];

function render() {
  const contenedor = document.getElementById("partidos");
  contenedor.innerHTML = "";

  partidos.forEach(p => {
    contenedor.innerHTML += `
      <div class="match">
        <span>${p.local} vs ${p.visitante}</span>
        <input type="number" id="l_${p.id}" placeholder="0" min="0" max="30">
-
	<input type="number" id="v_${p.id}" placeholder="0" min="0" max="30">
      </div>
    `;
  });
}

function guardarNombre() {
  const nombre = document.getElementById("nombre").value;
  localStorage.setItem("usuario", nombre);
}

function cargarNombre() {
  const nombre = localStorage.getItem("usuario");
  if (nombre) {
    document.getElementById("nombre").value = nombre;
  }
}

function guardar() {
  const nombre = document.getElementById("nombre").value?.trim();
  if (!nombre) {
    alert("Ingresa tu nombre primero");
    return;
  }

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`l_${p.id}`).value);
let v = parseInt(document.getElementById(`v_${p.id}`).value);

// Validación
if (isNaN(l) || l < 0) l = 0;
if (isNaN(v) || v < 0) v = 0;

if (l > 30) l = 30;
if (v > 30) v = 30;

datos[p.id] = { l, v };
  });

  localStorage.setItem("quiniela", JSON.stringify(datos));
  localStorage.setItem("usuario", nombre);

  const puntos = calcular(datos, false);

  let jugadores = JSON.parse(localStorage.getItem("jugadores")) || [];

  const idx = jugadores.findIndex(j => j.nombre === nombre);

  const registro = {
    nombre,
    puntos,
    fecha: new Date().toISOString()
  };

  if (idx >= 0) {
    jugadores[idx] = registro;
  } else {
    jugadores.push(registro);
  }

  localStorage.setItem("jugadores", JSON.stringify(jugadores));

  mostrarRanking();
}

function cargar() {
  const datos = JSON.parse(localStorage.getItem("quiniela"));
  if (!datos) return;

  partidos.forEach(p => {
    const inputL = document.getElementById(`l_${p.id}`);
    const inputV = document.getElementById(`v_${p.id}`);

    if (inputL && inputV && datos[p.id]) {
      inputL.value = datos[p.id].l;
      inputV.value = datos[p.id].v;
    }
  });

  calcular(datos);
}

function calcular(datos, pintar = true) {
  const reales = {
    1: { l: 2, v: 1 },
    2: { l: 1, v: 1 }
  };

  let puntos = 0;

  partidos.forEach(p => {
    const user = datos[p.id];
    const real = reales[p.id];

    if (!user) return;

    const ul = parseInt(user.l);
    const uv = parseInt(user.v);

    if (ul === real.l && uv === real.v) {
      puntos += 3;
    } else if (
      (ul > uv && real.l > real.v) ||
      (ul < uv && real.l < real.v) ||
      (ul === uv && real.l === real.v)
    ) {
      puntos += 1;
    }
  });

  if (pintar) {
    document.getElementById("resultado").innerText =
      "Puntos obtenidos: " + puntos;
  }

  return puntos;
}

function mostrarRanking() {
  const cont = document.getElementById("ranking");
  let jugadores = JSON.parse(localStorage.getItem("jugadores")) || [];

  jugadores.sort((a, b) => b.puntos - a.puntos);

  if (jugadores.length === 0) {
    cont.innerHTML = "<p>Sin datos aún</p>";
    return;
  }

  let html = "<table border='1' style='width:100%; color:white'>";
  html += "<tr><th>#</th><th>Nombre</th><th>Puntos</th></tr>";

  jugadores.forEach((j, i) => {
    html += `<tr>
      <td>${i + 1}</td>
      <td>${j.nombre}</td>
      <td>${j.puntos}</td>
    </tr>`;
  });

  html += "</table>";

  cont.innerHTML = html;
}

window.onload = () => {
  render();
  cargar();
  cargarNombre();
  mostrarRanking();
};