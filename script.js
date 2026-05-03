const partidos = [
  // Grupo A (4 equipos → 6 partidos)
  { id: 1, grupo: "A", local: "Brasil", visitante: "Alemania" },
  { id: 2, grupo: "A", local: "Brasil", visitante: "Argentina" },
  { id: 3, grupo: "A", local: "Brasil", visitante: "Francia" },
  { id: 4, grupo: "A", local: "Alemania", visitante: "Argentina" },
  { id: 5, grupo: "A", local: "Alemania", visitante: "Francia" },
  { id: 6, grupo: "A", local: "Argentina", visitante: "Francia" }
];

function render() {
  const contenedor = document.getElementById("partidos");
  contenedor.innerHTML = "";

  const grupos = [...new Set(partidos.map(p => p.grupo))];

  grupos.forEach(grupo => {
    contenedor.innerHTML += `<h3>Grupo ${grupo}</h3>`;

    partidos
      .filter(p => p.grupo === grupo)
      .forEach(p => {
        contenedor.innerHTML += `
          <div class="match">
            <span>${p.local} vs ${p.visitante}</span>
            <input type="number" id="l_${p.id}" min="0" max="30" placeholder="0">
            -
            <input type="number" id="v_${p.id}" min="0" max="30" placeholder="0">
          </div>
        `;
      });

    contenedor.innerHTML += `<div id="tabla_${grupo}"></div>`;
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

    if (isNaN(l) || l < 0) l = 0;
    if (isNaN(v) || v < 0) v = 0;

    if (l > 30) l = 30;
    if (v > 30) v = 30;

    datos[p.id] = { l, v };
  });

  localStorage.setItem("quiniela", JSON.stringify(datos));

  calcularTablas(datos);
}

function calcularTablas(datos) {
  const grupos = [...new Set(partidos.map(p => p.grupo))];

  grupos.forEach(grupo => {
    let tabla = {};

    const partidosGrupo = partidos.filter(p => p.grupo === grupo);

    partidosGrupo.forEach(p => {
      const { local, visitante } = p;

      if (!tabla[local]) tabla[local] = crearEquipo();
      if (!tabla[visitante]) tabla[visitante] = crearEquipo();

      const resultado = datos[p.id];
      if (!resultado) return;

      const l = parseInt(resultado.l);
      const v = parseInt(resultado.v);

      tabla[local].gf += l;
      tabla[local].gc += v;

      tabla[visitante].gf += v;
      tabla[visitante].gc += l;

      if (l > v) {
        tabla[local].pts += 3;
      } else if (l < v) {
        tabla[visitante].pts += 3;
      } else {
        tabla[local].pts += 1;
        tabla[visitante].pts += 1;
      }
    });

    let lista = Object.entries(tabla).map(([equipo, data]) => ({
      equipo,
      ...data,
      dg: data.gf - data.gc
    }));

    lista.sort((a, b) =>
      b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
    );

    pintarTabla(grupo, lista);
  });
}

function crearEquipo() {
  return {
    pts: 0,
    gf: 0,
    gc: 0
  };
}

function pintarTabla(grupo, lista) {
  const cont = document.getElementById(`tabla_${grupo}`);

  let html = "<table border='1' style='width:100%; color:white'>";
  html += "<tr><th>#</th><th>Equipo</th><th>Pts</th><th>DG</th></tr>";

  lista.forEach((e, i) => {
    html += `<tr>
      <td>${i + 1}</td>
      <td>${e.equipo}</td>
      <td>${e.pts}</td>
      <td>${e.dg}</td>
    </tr>`;
  });

  html += "</table>";

  cont.innerHTML = html;
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

  calcularTablas(datos);
}

window.onload = () => {
  render();
  cargar();
  cargarNombre();
};