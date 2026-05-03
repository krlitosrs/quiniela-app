const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0",
  storageBucket: "quiniela-app-7cbb0.firebasestorage.app",
  messagingSenderId: "712745211307",
  appId: "1:712745211307:web:bd9853fa27efc17df46eee"
};

// Inicializar Firebase (FORMA CORRECTA PARA TU SETUP)
firebase.initializeApp(firebaseConfig);

// Base de datos
const db = firebase.firestore();

// Verificación
console.log("Firebase conectado:", !!db);
const partidos = [
  { id: 1, grupo: "A", local: "Brasil", visitante: "Alemania" },
  { id: 2, grupo: "A", local: "Brasil", visitante: "Argentina" },
  { id: 3, grupo: "A", local: "Brasil", visitante: "Francia" },
  { id: 4, grupo: "A", local: "Alemania", visitante: "Argentina" },
  { id: 5, grupo: "A", local: "Alemania", visitante: "Francia" },
  { id: 6, grupo: "A", local: "Argentina", visitante: "Francia" }
];

const ES_ADMIN = false; // 🔥 cambia a true solo para ti

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
            
            <!-- Predicción -->
            <input type="number" id="p_l_${p.id}" min="0" max="30" placeholder="P">
            -
            <input type="number" id="p_v_${p.id}" min="0" max="30" placeholder="P">

            ${ES_ADMIN ? `
              <!-- Resultado real -->
              <input type="number" id="r_l_${p.id}" min="0" max="30" placeholder="R">
              -
              <input type="number" id="r_v_${p.id}" min="0" max="30" placeholder="R">
            ` : ""}
          </div>
        `;
      });

    contenedor.innerHTML += `<div id="tabla_${grupo}"></div>`;
  });
}

async function guardarPredicciones() {
  const nombre = document.getElementById("nombre").value.trim();

  if (!nombre) {
    alert("Ingresa tu nombre");
    return;
  }

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`p_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`p_v_${p.id}`).value);

    if (isNaN(l)) l = 0;
    if (isNaN(v)) v = 0;

    datos[p.id] = { l, v };
  });

  try {
    await db.collection("predicciones").doc(nombre).set({
      nombre: nombre,
      partidos: datos,
      fecha: new Date()
    });

    alert("Predicciones guardadas en Firebase ✅");

  } catch (error) {
    console.error("Error guardando:", error);
    alert("Error al guardar");
  }
}
  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`p_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`p_v_${p.id}`).value);

    if (isNaN(l)) l = 0;
    if (isNaN(v)) v = 0;

    datos[p.id] = { l, v };
  });

  localStorage.setItem("predicciones", JSON.stringify(datos));

  alert("Predicciones guardadas");
}

function guardarResultados() {
  if (!ES_ADMIN) return;

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`r_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`r_v_${p.id}`).value);

    if (isNaN(l)) return;

    datos[p.id] = { l, v };
  });

  localStorage.setItem("resultados", JSON.stringify(datos));

  calcularTablas(datos);
}

function calcularTablas(resultados) {
  const grupos = [...new Set(partidos.map(p => p.grupo))];

  grupos.forEach(grupo => {
    let tabla = {};

    const partidosGrupo = partidos.filter(p => p.grupo === grupo);

    partidosGrupo.forEach(p => {
      const { local, visitante } = p;

      if (!tabla[local]) tabla[local] = crearEquipo();
      if (!tabla[visitante]) tabla[visitante] = crearEquipo();

      const res = resultados[p.id];
      if (!res) return;

      const l = res.l;
      const v = res.v;

      tabla[local].gf += l;
      tabla[local].gc += v;

      tabla[visitante].gf += v;
      tabla[visitante].gc += l;

      if (l > v) tabla[local].pts += 3;
      else if (l < v) tabla[visitante].pts += 3;
      else {
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
  return { pts: 0, gf: 0, gc: 0 };
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

window.onload = () => {
  render();
};