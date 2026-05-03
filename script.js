// 🔥 FIREBASE CONFIG
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
}

// 🔐 AUTH
function registrar() {
  const email = emailInput();
  const pass = passInput();

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => alert("Registrado"))
    .catch(e => alert(e.message));
}

function login() {
  const email = emailInput();
  const pass = passInput();

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => alert("Bienvenido"))
    .catch(e => alert(e.message));
}

function logout() {
  auth.signOut();
}

function emailInput() {
  return document.getElementById("email").value;
}

function passInput() {
  return document.getElementById("password").value;
}

// 👤 NICKNAME
async function guardarNickname() {
  const user = auth.currentUser;
  if (!user) return alert("Debes iniciar sesión");

  const nick = document.getElementById("nickname").value;

  await db.collection("usuarios").doc(user.uid).set({
    email: user.email,
    nickname: nick
  });

  alert("Nickname guardado");
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
    user: user.email,
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
      console.log("Resultados actualizados:", doc.data());
    });
}

// 🚀 INIT
window.onload = () => {
  render();
  escucharResultados();
};

auth.onAuthStateChanged(user => {
  if (user) {
    console.log("Logueado:", user.email);
  }
});