// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ⏱️ CIERRE
const CIERRE_GRUPOS = new Date("2026-06-01T19:00:00Z");

// 🧠 EQUIPOS + BANDERAS
const equipos = {
  BRA:{nombre:"Brasil", bandera:"https://flagcdn.com/w40/br.png"},
  GER:{nombre:"Alemania", bandera:"https://flagcdn.com/w40/de.png"},
  ARG:{nombre:"Argentina", bandera:"https://flagcdn.com/w40/ar.png"},
  FRA:{nombre:"Francia", bandera:"https://flagcdn.com/w40/fr.png"}
};

// 🧠 GRUPOS
const grupos = {
  A:["BRA","GER","ARG","FRA"]
};

// 🧠 PARTIDOS CON FECHA
const partidos = [
  {id:1,grupo:"A",local:"BRA",visitante:"GER",fechaUTC:"2026-06-01T20:00:00Z"},
  {id:2,grupo:"A",local:"ARG",visitante:"FRA",fechaUTC:"2026-06-01T23:00:00Z"},
  {id:3,grupo:"A",local:"BRA",visitante:"ARG",fechaUTC:"2026-06-02T20:00:00Z"},
  {id:4,grupo:"A",local:"GER",visitante:"FRA",fechaUTC:"2026-06-02T23:00:00Z"},
  {id:5,grupo:"A",local:"BRA",visitante:"FRA",fechaUTC:"2026-06-03T20:00:00Z"},
  {id:6,grupo:"A",local:"GER",visitante:"ARG",fechaUTC:"2026-06-03T23:00:00Z"}
];

// 🕒 HORA GUATEMALA
function horaGT(fechaUTC){
  return new Date(fechaUTC).toLocaleString("es-GT", {
    timeZone:"America/Guatemala",
    dateStyle:"short",
    timeStyle:"short"
  });
}

// 🔒 CIERRE
function estaCerrado(){
  return new Date() >= CIERRE_GRUPOS;
}

// 🎨 RENDER NUEVO
function render(){
  const c = document.getElementById("partidos");
  c.innerHTML = "";

  partidos.forEach(p=>{
    const cerrado = estaCerrado();

    c.innerHTML += `
      <div class="partido-card">

        <div class="partido-header">
          <span>Grupo ${p.grupo}</span>
          <span>${horaGT(p.fechaUTC)}</span>
        </div>

        <div class="partido-body">

          <div class="equipo">
            <img src="${equipos[p.local].bandera}">
            <span>${equipos[p.local].nombre}</span>
          </div>

          <div class="marcador">
            <input id="p_l_${p.id}" type="number" ${cerrado?"disabled":""}>
            <span>-</span>
            <input id="p_v_${p.id}" type="number" ${cerrado?"disabled":""}>
          </div>

          <div class="equipo">
            <img src="${equipos[p.visitante].bandera}">
            <span>${equipos[p.visitante].nombre}</span>
          </div>

        </div>

        ${cerrado ? "<div class='cerrado'>Cerrado</div>" : ""}

      </div>
    `;
  });
}

// 🔐 AUTH (igual)
function registrar(){
  auth.createUserWithEmailAndPassword(email.value,password.value)
  .then(async c=>{
    await db.collection("usuarios").doc(c.user.uid).set({permitido:false});
    alert("Pendiente autorización");
    auth.signOut();
  }).catch(e=>alert(e.message));
}

function login(){
  auth.signInWithEmailAndPassword(email.value,password.value)
  .catch(e=>alert(e.message));
}

function logout(){ auth.signOut(); }

// 🚀 INIT
window.onload=()=>{
  render();
  mostrarPantalla("pantallaLogin");
};

function mostrarPantalla(id){
  ["pantallaLogin","pantallaNickname","pantallaApp"]
  .forEach(p=>document.getElementById(p).style.display=p===id?"block":"none");
}

auth.onAuthStateChanged(u=>{
  if(!u) mostrarPantalla("pantallaLogin");
  else mostrarPantalla("pantallaApp");
});