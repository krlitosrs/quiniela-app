// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ⏱️ REGLAS DE CIERRE
const CIERRE_GRUPOS = new Date("2026-06-01T19:00:00Z"); // 1h antes

// 🧠 FASES
const FASES = {
  GRUPOS: "GRUPOS",
  R16: "R16"
};

// 🧠 EQUIPOS
const equipos = {
  BRA:{nombre:"Brasil"},
  GER:{nombre:"Alemania"},
  ARG:{nombre:"Argentina"},
  FRA:{nombre:"Francia"}
};

// 🧠 GRUPOS
const grupos = {
  A:["BRA","GER","ARG","FRA"]
};

// 🧠 PARTIDOS
const partidos = [
  {
    id:1,
    fase:FASES.GRUPOS,
    grupo:"A",
    local:"BRA",
    visitante:"GER",
    fechaUTC:"2026-06-01T20:00:00Z"
  },
  {
    id:2,
    fase:FASES.GRUPOS,
    grupo:"A",
    local:"ARG",
    visitante:"FRA",
    fechaUTC:"2026-06-01T23:00:00Z"
  }
];

// 🔒 CIERRE POR PARTIDO
function cierrePartido(p){
  if(p.fase === FASES.GRUPOS){
    return CIERRE_GRUPOS;
  }

  const f = new Date(p.fechaUTC);
  f.setHours(f.getHours()-2);
  return f;
}

function estaCerrado(p){
  return new Date() >= cierrePartido(p);
}

// 🧭 VISTAS
function mostrarPantalla(id){
  ["pantallaLogin","pantallaNickname","pantallaApp"]
  .forEach(p=>document.getElementById(p).style.display=p===id?"block":"none");
}

function mostrarVista(v){
  document.getElementById("vistaPredicciones").style.display="none";
  document.getElementById("vistaGrupos").style.display="none";

  if(v==="predicciones") document.getElementById("vistaPredicciones").style.display="block";
  if(v==="grupos") document.getElementById("vistaGrupos").style.display="block";
}

// 🔐 AUTH
function registrar(){
  auth.createUserWithEmailAndPassword(email.value,password.value)
  .then(async c=>{
    await db.collection("usuarios").doc(c.user.uid).set({
      permitido:false
    });
    auth.signOut();
  });
}

function login(){
  auth.signInWithEmailAndPassword(email.value,password.value);
}

function logout(){ auth.signOut(); }

// 🔒 ACCESO
async function verificarAcceso(){
  const doc=await db.collection("usuarios").doc(auth.currentUser.uid).get();

  if(!doc.exists || doc.data().permitido!==true){
    alert("Sin acceso");
    auth.signOut();
    return;
  }

  if(!doc.data().nickname) mostrarPantalla("pantallaNickname");
  else mostrarPantalla("pantallaApp");
}

// 👤 NICKNAME
async function guardarNickname(){
  await db.collection("usuarios").doc(auth.currentUser.uid)
  .set({nickname:nickname.value},{merge:true});

  mostrarPantalla("pantallaApp");
}

// 🎨 RENDER
function render(){
  const c=document.getElementById("partidos");
  c.innerHTML="";

  partidos.forEach(p=>{
    const cerrado = estaCerrado(p);

    c.innerHTML+=`
      <div>
        ${equipos[p.local].nombre} vs ${equipos[p.visitante].nombre}
        <input id="p_l_${p.id}" ${cerrado?"disabled":""}>
        -
        <input id="p_v_${p.id}" ${cerrado?"disabled":""}>
        ${cerrado?"<span style='color:red'>Cerrado</span>":""}
      </div>
    `;
  });
}

// 💾 GUARDAR
async function guardarPredicciones(){
  const user=auth.currentUser;

  const doc=await db.collection("predicciones").doc(user.uid).get();
  const existentes = doc.exists ? doc.data().partidos : {};

  let datos={};

  for(let p of partidos){

    if(estaCerrado(p)){
      if(existentes[p.id]){
        datos[p.id]=existentes[p.id];
      }
      continue;
    }

    let l=document.getElementById(`p_l_${p.id}`).value;
    let v=document.getElementById(`p_v_${p.id}`).value;

    if(l===""||v==="") continue;

    datos[p.id]={l:parseInt(l),v:parseInt(v)};
  }

  await db.collection("predicciones").doc(user.uid).set({
    uid:user.uid,
    partidos:datos
  });

  alert("Guardado");
}

// 🚀 INIT
window.onload=()=>{
  render();
  mostrarPantalla("pantallaLogin");
};

auth.onAuthStateChanged(u=>{
  if(!u) mostrarPantalla("pantallaLogin");
  else verificarAcceso();
});

// 🚀 INIT
window.onload=()=>{
  render();
  escucharRanking();
  mostrarPantalla("pantallaLogin");
};

auth.onAuthStateChanged(user=>{
  if(!user) mostrarPantalla("pantallaLogin");
  else verificarAcceso();
});