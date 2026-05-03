// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

// 🔐 ADMIN (solo visual)
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
        <input type="number" id="r_l_${p.id}" min="0" max="30" placeholder="R">
        -
        <input type="number" id="r_v_${p.id}" min="0" max="30" placeholder="R">
        ` : ""}
      </div>
    `;
  });

  cont.innerHTML += `<div id="tabla_A"></div>`;
}

// 🔐 REGISTRO
function registrar() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, pass)
    .then(async (cred) => {
      await db.collection("usuarios").doc(cred.user.uid).set({
        email: email,
        permitido: false
      });

      alert("Usuario creado. Espera autorización.");
      auth.signOut();
    })
    .catch(e => alert(e.message));
}

// 🔐 LOGIN
function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, pass)
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut();
}

// 🔒 CONTROL ACCESO
async function verificarAcceso() {
  const user = auth.currentUser;
  if (!user) return;

  const doc = await db.collection("usuarios").doc(user.uid).get();

  const permitido = doc.exists && doc.data().permitido === true;

  if (!permitido) {
    alert("No tienes acceso aún");
    auth.signOut();
    return;
  }

  verificarNickname();
}

// 🧠 VALIDAR NICKNAME
function validarNickname(nick) {
  return /^[a-zA-Z0-9]{1,25}$/.test(nick);
}

// 👤 NICKNAME
async function guardarNickname() {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión");

  const nick = document.getElementById("nickname").value.trim();

  if (!validarNickname(nick)) {
    return alert("Nickname inválido");
  }

  await db.collection("usuarios").doc(user.uid).set({
    nickname: nick
  }, { merge: true });

  alert("Nickname guardado");
  verificarNickname();
}

async function verificarNickname() {
  const user = auth.currentUser;
  if (!user) return;

  const doc = await db.collection("usuarios").doc(user.uid).get();

  const tieneNick = doc.exists && doc.data().nickname;

  document.getElementById("partidos").style.display =
    tieneNick ? "block" : "none";
}

// 💾 PREDICCIONES
async function guardarPredicciones() {
  const user = auth.currentUser;
  if (!user) return alert("Inicia sesión");

  let datos = {};

  partidos.forEach(p => {
    let l = parseInt(document.getElementById(`p_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`p_v_${p.id}`).value);

    if (isNaN(l)) l = 0;
    if (isNaN(v)) v = 0;

    datos[p.id] = { l, v };
  });

  await db.collection("predicciones").doc(user.uid).set({
    uid: user.uid,
    user: user.email,
    partidos: datos
  });

  alert("Predicciones guardadas");
}

// 🧾 RESULTADOS
async function guardarResultados() {
  if (!ES_ADMIN) return;

  let datos = {};

  for (let p of partidos) {
    let l = parseInt(document.getElementById(`r_l_${p.id}`).value);
    let v = parseInt(document.getElementById(`r_v_${p.id}`).value);

    if (isNaN(l) || isNaN(v)) continue;

    if (l < 0 || v < 0 || l > 30 || v > 30) {
      alert("Resultados inválidos");
      return;
    }

    datos[p.id] = { l, v };
  }

  await db.collection("resultados").doc("grupoA").set(datos);
  alert("Resultados guardados");
}

// 🧠 ESTADÍSTICAS (puntos + desempate)
function calcularEstadisticas(pred, real) {
  let puntos = 0;
  let exactos = 0;
  let resultados = 0;

  Object.keys(real).forEach(id => {
    if (!pred[id]) return;

    const pr = pred[id];
    const re = real[id];

    if (pr.l === re.l && pr.v === re.v) {
      puntos += 5;
      exactos++;
      resultados++;
      return;
    }

    if (
      (pr.l > pr.v && re.l > re.v) ||
      (pr.l < pr.v && re.l < re.v) ||
      (pr.l === pr.v && re.l === re.v)
    ) {
      puntos += 3;
      resultados++;
    }
  });

  return { puntos, exactos, resultados };
}

// 🏆 RANKING
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

    let ranking = predicciones.map(p => {
      const stats = calcularEstadisticas(p.partidos, resultados);

      return {
        uid: p.uid,
        nombre: usuarios[p.uid]?.nickname || p.user,
        puntos: stats.puntos,
        exactos: stats.exactos,
        resultados: stats.resultados
      };
    });

    ranking.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.exactos !== a.exactos) return b.exactos - a.exactos;
      return b.resultados - a.resultados;
    });

    pintarRanking(ranking);
  }
}

// 🎨 RANKING
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
      estilo += "background: gold;";
      pos = "🥇";
    } else if (i === 1) {
      estilo += "background: silver;";
      pos = "🥈";
    } else if (i === 2) {
      estilo += "background: #cd7f32;";
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
  escucharRanking();
};

// 🔁 LOGIN CONTROL
auth.onAuthStateChanged(user => {
  if (user) verificarAcceso();
});