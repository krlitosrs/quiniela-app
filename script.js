// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// 🔐 ADMIN
const ES_ADMIN = true;

// ⚽ PARTIDOS
const partidos = [
  { id: 1, grupo: "A", local: "Brasil", visitante: "Alemania" },
  { id: 2, grupo: "A", local: "Brasil", visitante: "Argentina" },
  { id: 3, grupo: "A", local: "Brasil", visitante: "Francia" },
  { id: 4, grupo: "A", local: "Alemania", visitante: "Argentina" },
  { id: 5, grupo: "A", local: "Alemania", visitante: "Francia" },
  { id: 6, grupo: "A", local: "Argentina", visitante: "Francia" }
];

// 🎨 RENDER
function render() {
  const cont = document.getElementById("partidos");
  cont.innerHTML = "<h3>Grupo A</h3>";

  partidos.forEach(p => {
    cont.innerHTML += `
      <div>
        ${p.local} vs ${p.visitante}
        <input type="number" id="p_l_${p.id}" min="0" max="30">
        -
        <input type="number" id="p_v_${p.id}" min="0" max="30">

        ${ES_ADMIN ? `
        <input type="number" id="r_l_${p.id}" placeholder="R">
        -
        <input type="number" id="r_v_${p.id}" placeholder="R">
        ` : ""}
      </div>
    `;
  });

  cont.innerHTML += `<div id="tabla_A"></div>`;
}

// 🔐 AUTH
function registrar() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => alert("Registrado"))
    .catch(e => alert(e.message));
}

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => alert("Bienvenido"))
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut();
}

// 🧠 VALIDAR NICKNAME
function validarNickname(nick) {
  return /^[a-zA-Z0-9]{1,25}$/.test(nick);
}

// 👤 GUARDAR NICKNAME
async function guardarNickname() {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión");

  const nick = document.getElementById("nickname").value.trim();

  if (!validarNickname(nick)) {
    alert("Nickname inválido (solo letras/números, máx 25)");
    return;
  }

  await db.collection("usuarios").doc(user.uid).set({
    email: user.email,
    nickname: nick
  });

  alert("Nickname guardado");
  verificarNickname();
}

// 🔒 BLOQUEO SI NO TIENE NICK
async function verificarNickname() {
  const user = auth.currentUser;
  if (!user) return;

  const doc = await db.collection("usuarios").doc(user.uid).get();

  const tieneNick = doc.exists && doc.data().nickname;

  const app = document.getElementById("partidos");

  app.style.display = tieneNick ? "block" : "none";
}

// 💾 PREDICCIONES
async function guardarPredicciones() {
  const user = auth.currentUser;
  if (!user) return alert("Inicia sesión");

  const doc = await db.collection("usuarios").doc(user.uid).get();
  if (!doc.exists || !doc.data().nickname) {
    return alert("Debes crear nickname primero");
  }

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`p_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`p_v_${p.id}`).value);

    if (isNaN(l)) l = 0;
    if (isNaN(v)) v = 0;

    datos[p.id] = { l, v };
  });

  await db.collection("predicciones").doc(user.uid).set({
    user: user.email,
    uid: user.uid,
    partidos: datos
  });

  alert("Predicciones guardadas");
}

// 🧾 RESULTADOS
async function guardarResultados() {
  if (!ES_ADMIN) return;

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`r_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`r_v_${p.id}`).value);

    if (!isNaN(l) && !isNaN(v)) {
      datos[p.id] = { l, v };
    }
  });

  await db.collection("resultados").doc("grupoA").set(datos);
  alert("Resultados guardados");
}

// 📊 TABLA
function escucharResultados() {
  db.collection("resultados").doc("grupoA")
    .onSnapshot(doc => {
      if (!doc.exists) return;
      calcularTabla(doc.data());
    });
}

function calcularTabla(resultados) {
  let tabla = {};

  partidos.forEach(p => {
    const { local, visitante } = p;

    if (!tabla[local]) tabla[local] = { pts: 0, gf: 0, gc: 0 };
    if (!tabla[visitante]) tabla[visitante] = { pts: 0, gf: 0, gc: 0 };

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

  let lista = Object.entries(tabla).map(([equipo, d]) => ({
    equipo,
    ...d,
    dg: d.gf - d.gc
  }));

  lista.sort((a, b) =>
    b.pts - a.pts || b.dg - a.dg || b.gf - a.gf
  );

  pintarTabla(lista);
}

function pintarTabla(lista) {
  const cont = document.getElementById("tabla_A");

  let html = "<table border='1' style='width:100%'>";
  html += "<tr><th>#</th><th>Equipo</th><th>Pts</th></tr>";

  lista.forEach((e, i) => {
    html += `<tr><td>${i + 1}</td><td>${e.equipo}</td><td>${e.pts}</td></tr>`;
  });

  cont.innerHTML = html;
}

// 🏆 RANKING
function calcularPuntos(pred, real) {
  let puntos = 0;

  Object.keys(real).forEach(id => {
    if (!pred[id]) return;

    const pr = pred[id];
    const re = real[id];

    if (pr.l === re.l && pr.v === re.v) puntos += 3;
    else if (
      (pr.l > pr.v && re.l > re.v) ||
      (pr.l < pr.v && re.l < re.v) ||
      (pr.l === pr.v && re.l === re.v)
    ) puntos += 1;
  });

  return puntos;
}

function escucharRanking() {
  let resultados = null;
  let predicciones = [];
  let usuarios = {};

  db.collection("resultados").doc("grupoA")
    .onSnapshot(doc => {
      if (!doc.exists) return;
      resultados = doc.data();
      actualizar();
    });

  db.collection("predicciones")
    .onSnapshot(snapshot => {
      predicciones = snapshot.docs.map(d => d.data());
      actualizar();
    });

  db.collection("usuarios")
    .onSnapshot(snapshot => {
      usuarios = {};
      snapshot.docs.forEach(d => usuarios[d.id] = d.data());
      actualizar();
    });

  function actualizar() {
    if (!resultados) return;

    let ranking = predicciones.map(p => ({
      uid: p.uid,
      nombre: usuarios[p.uid]?.nickname || p.user,
      puntos: calcularPuntos(p.partidos, resultados)
    }));

    ranking.sort((a, b) => b.puntos - a.puntos);

    pintarRanking(ranking);
  }
}

// 🎨 RANKING + POSICIÓN
function pintarRanking(lista) {
  const cont = document.getElementById("ranking");
  const user = auth.currentUser;

  let posicion = null;

  let html = "<h3 id='miPosicion'></h3>";
  html += "<table border='1' style='width:100%; text-align:center'>";
  html += "<tr><th>#</th><th>Jugador</th><th>Puntos</th></tr>";

  lista.forEach((j, i) => {
    let estilo = "";
    let pos = i + 1;

    if (user && j.uid === user.uid) {
      posicion = pos;
      estilo += "border: 3px solid red;";
    }

    if (i === 0) {
      estilo += "background: gold; font-weight:bold;";
      pos = "🥇";
    } else if (i === 1) {
      estilo += "background: silver; font-weight:bold;";
      pos = "🥈";
    } else if (i === 2) {
      estilo += "background: #cd7f32; font-weight:bold;";
      pos = "🥉";
    }

    html += `
      <tr style="${estilo}">
        <td>${pos}</td>
        <td>${j.nombre}</td>
        <td>${j.puntos}</td>
      </tr>
    `;
  });

  html += "</table>";

  cont.innerHTML = html;

  if (posicion) {
    document.getElementById("miPosicion").innerText =
      "Tu posición actual: #" + posicion;
  }
}

// 🚀 INIT
window.onload = () => {
  render();
  escucharResultados();
  escucharRanking();
};

auth.onAuthStateChanged(user => {
  if (user) verificarNickname();
});