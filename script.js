// 🔥 CONFIG FIREBASE (YA CORRECTO)
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0",
  storageBucket: "quiniela-app-7cbb0.firebasestorage.app",
  messagingSenderId: "712745211307",
  appId: "1:712745211307:web:bd9853fa27efc17df46eee"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("Firebase conectado:", !!db);

// 🔥 PARTIDOS (GRUPO A COMPLETO)
const partidos = [
  { id: 1, grupo: "A", local: "Brasil", visitante: "Alemania" },
  { id: 2, grupo: "A", local: "Brasil", visitante: "Argentina" },
  { id: 3, grupo: "A", local: "Brasil", visitante: "Francia" },
  { id: 4, grupo: "A", local: "Alemania", visitante: "Argentina" },
  { id: 5, grupo: "A", local: "Alemania", visitante: "Francia" },
  { id: 6, grupo: "A", local: "Argentina", visitante: "Francia" }
];

// 🔥 RENDER UI
function render() {
  const contenedor = document.getElementById("partidos");
  contenedor.innerHTML = "";

  contenedor.innerHTML += `<h3>Grupo A</h3>`;

  partidos.forEach(p => {
    contenedor.innerHTML += `
      <div class="match">
        <span>${p.local} vs ${p.visitante}</span>

        <input type="number" id="p_l_${p.id}" min="0" max="30" placeholder="P">
        -
        <input type="number" id="p_v_${p.id}" min="0" max="30" placeholder="P">
      </div>
    `;
  });

  contenedor.innerHTML += `<div id="tabla_A"></div>`;
}

// 🔥 GUARDAR NOMBRE
function guardarNombre() {
  const nombre = document.getElementById("nombre").value;
  localStorage.setItem("usuario", nombre);
  alert("Nombre guardado");
}

// 🔥 GUARDAR PREDICCIONES EN FIREBASE
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
      nombre,
      partidos: datos,
      fecha: new Date()
    });

    alert("Predicciones guardadas en Firebase ✅");

  } catch (error) {
    console.error("Error guardando:", error);
    alert("Error al guardar");
  }
}

// 🔥 ESCUCHAR RESULTADOS (EN TIEMPO REAL)
function escucharResultados() {
  db.collection("resultados").doc("grupoA")
    .onSnapshot(doc => {
      if (doc.exists) {
        const datos = doc.data();
        calcularTablas(datos);
      }
    });
}

// 🔥 CALCULAR TABLA
function calcularTablas(resultados) {
  let tabla = {};

  partidos.forEach(p => {
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

  pintarTabla(lista);
}

// 🔥 CREAR EQUIPO
function crearEquipo() {
  return { pts: 0, gf: 0, gc: 0 };
}

// 🔥 PINTAR TABLA
function pintarTabla(lista) {
  const cont = document.getElementById("tabla_A");

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

// 🔥 INICIO
window.onload = () => {
  render();
  escucharResultados();
};