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
        <input type="number" id="l_${p.id}" placeholder="0">
        -
        <input type="number" id="v_${p.id}" placeholder="0">
      </div>
    `;
  });
}

function guardar() {
  let datos = {};

  partidos.forEach(p => {
    const l = document.getElementById(`l_${p.id}`).value;
    const v = document.getElementById(`v_${p.id}`).value;

    datos[p.id] = { l, v };
  });

  localStorage.setItem("quiniela", JSON.stringify(datos));

  calcular(datos);
}

function cargar() {
  const datos = JSON.parse(localStorage.getItem("quiniela"));
  if (!datos) return;

  partidos.forEach(p => {
    const inputL = document.getElementById(`l_${p.id}`);
    const inputV = document.getElementById(`v_${p.id}`);

    // 👇 validación clave
    if (inputL && inputV && datos[p.id]) {
      inputL.value = datos[p.id].l;
      inputV.value = datos[p.id].v;
    }
  });

  calcular(datos);
}

function calcular(datos) {
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

  document.getElementById("resultado").innerText =
    "Puntos obtenidos: " + puntos;
}

window.onload = () => {
 	 render();
  	cargar();
	cargarNombre();
};
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