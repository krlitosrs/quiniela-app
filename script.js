// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ⏱️ REGLAS
const CIERRE_GRUPOS = new Date("2026-06-01T19:00:00Z");

// 🧠 FASES
const FASES = { GRUPOS:"GRUPOS", R16:"R16" };

// 🧠 EQUIPOS
const equipos = {
  BRA:{nombre:"Brasil"},
  GER:{nombre:"Alemania"},
  ARG:{nombre:"Argentina"},
  FRA:{nombre:"Francia"}
};

// 🧠 GRUPOS
const grupos = { A:["BRA","GER","ARG","FRA"] };

// 🧠 PARTIDOS (ejemplo completo grupo)
const partidos = [
  {id:1,fase:FASES.GRUPOS,grupo:"A",local:"BRA",visitante:"GER"},
  {id:2,fase:FASES.GRUPOS,grupo:"A",local:"ARG",visitante:"FRA"},
  {id:3,fase:FASES.GRUPOS,grupo:"A",local:"BRA",visitante:"ARG"},
  {id:4,fase:FASES.GRUPOS,grupo:"A",local:"GER",visitante:"FRA"},
  {id:5,fase:FASES.GRUPOS,grupo:"A",local:"BRA",visitante:"FRA"},
  {id:6,fase:FASES.GRUPOS,grupo:"A",local:"GER",visitante:"ARG"}
];

// 🔒 CIERRE
function cierrePartido(p){
  if(p.fase === FASES.GRUPOS) return CIERRE_GRUPOS;
  let f=new Date(p.fechaUTC);
  f.setHours(f.getHours()-2);
  return f;
}
function estaCerrado(p){ return new Date() >= cierrePartido(p); }

// 🧭 UI
function mostrarPantalla(id){
  ["pantallaLogin","pantallaNickname","pantallaApp"]
  .forEach(p=>document.getElementById(p).style.display=p===id?"block":"none");
}
function mostrarVista(v){
  ["vistaPredicciones","vistaRanking","vistaMisResultados","vistaGrupos"]
  .forEach(x=>document.getElementById(x).style.display="none");
  document.getElementById("vista"+capitalize(v)).style.display="block";
}
function capitalize(s){return s.charAt(0).toUpperCase()+s.slice(1);}

// 🔐 AUTH
function registrar(){
  auth.createUserWithEmailAndPassword(email.value,password.value)
  .then(async c=>{
    await db.collection("usuarios").doc(c.user.uid).set({permitido:false});
    auth.signOut();
  });
}
function login(){
  const emailVal = document.getElementById("email").value;
  const passVal = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(emailVal, passVal)
    .then(() => {
      console.log("Login correcto");
    })
    .catch((error) => {
      console.error(error);
      alert("Error: " + error.message);
    });
}
function logout(){ auth.signOut(); }

// 🔒 ACCESO
async function verificarAcceso(){
  const doc=await db.collection("usuarios").doc(auth.currentUser.uid).get();
  if(!doc.exists||doc.data().permitido!==true){
    alert("Sin acceso"); auth.signOut(); return;
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
    const cerrado=estaCerrado(p);
    c.innerHTML+=`
      <div>
        ${equipos[p.local].nombre} vs ${equipos[p.visitante].nombre}
        <input id="p_l_${p.id}" ${cerrado?"disabled":""}>
        -
        <input id="p_v_${p.id}" ${cerrado?"disabled":""}>
        ${cerrado?"<span class='cerrado'>Cerrado</span>":""}
      </div>`;
  });
}

// 💾 GUARDAR
async function guardarPredicciones(){
  const user=auth.currentUser;
  const doc=await db.collection("predicciones").doc(user.uid).get();
  const existentes=doc.exists?doc.data().partidos:{};
  let datos={};

  for(let p of partidos){
    if(estaCerrado(p)){
      if(existentes[p.id]) datos[p.id]=existentes[p.id];
      continue;
    }
    let l=document.getElementById(`p_l_${p.id}`).value;
    let v=document.getElementById(`p_v_${p.id}`).value;
    if(l===""||v==="") continue;
    datos[p.id]={l:parseInt(l),v:parseInt(v)};
  }

  await db.collection("predicciones").doc(user.uid)
  .set({uid:user.uid,partidos:datos});

  alert("Guardado");
}

// 🧠 CALCULO
function puntos(pr,re){
  if(pr.l===re.l && pr.v===re.v) return 5;
  if(
    (pr.l>pr.v && re.l>re.v)||
    (pr.l<pr.v && re.l<re.v)||
    (pr.l===pr.v && re.l===re.v)
  ) return 3;
  return 0;
}

// 🏆 RANKING
function escuchar(){
  let resultados=null,preds=[],users={};

  db.collection("resultados").doc("grupoA").onSnapshot(d=>{
    if(!d.exists) return;
    resultados=d.data(); update();
  });

  db.collection("predicciones").onSnapshot(s=>{
    preds=s.docs.map(d=>d.data()); update();
  });

  db.collection("usuarios").onSnapshot(s=>{
    users={}; s.docs.forEach(d=>users[d.id]=d.data()); update();
  });

  function update(){
    if(!resultados) return;

    let ranking=preds.map(p=>{
      let total=0,exactos=0,res=0;
      Object.keys(resultados).forEach(id=>{
        if(!p.partidos[id]) return;
        let pt=puntos(p.partidos[id],resultados[id]);
        total+=pt;
        if(pt===5) exactos++;
        if(pt>0) res++;
      });
      return {
        nombre:users[p.uid]?.nickname||"?",
        total,exactos,res
      };
    });

    ranking.sort((a,b)=>b.total-a.total||b.exactos-a.exactos||b.res-a.res);

    pintarRanking(ranking);
    pintarMisResultados(resultados);
    pintarGrupos(resultados);
  }
}

// 🎨 RENDER RANKING
function pintarRanking(lista){
  let html="<table><tr><th>#</th><th>Jugador</th><th>Puntos</th></tr>";
  lista.forEach((j,i)=>{
    let pos=i+1;
    if(i===0) pos="🥇";
    else if(i===1) pos="🥈";
    else if(i===2) pos="🥉";
    html+=`<tr><td>${pos}</td><td>${j.nombre}</td><td>${j.total}</td></tr>`;
  });
  html+="</table>";
  ranking.innerHTML=html;
}

// 📊 MIS RESULTADOS
function pintarMisResultados(resultados){
  const user=auth.currentUser;
  db.collection("predicciones").doc(user.uid).get().then(doc=>{
    if(!doc.exists) return;
    const pred=doc.data().partidos;
    let total=0;

    let html="<table><tr><th>Partido</th><th>Tú</th><th>Real</th><th>Puntos</th></tr>";

    partidos.forEach(p=>{
      const pr=pred[p.id]||{};
      const re=resultados[p.id]||{};
      const pt=(pr.l!=null && re.l!=null)?puntos(pr,re):0;
      total+=pt;

      html+=`
        <tr>
          <td>${equipos[p.local].nombre} vs ${equipos[p.visitante].nombre}</td>
          <td>${pr.l??"-"}-${pr.v??"-"}</td>
          <td>${re.l??"-"}-${re.v??"-"}</td>
          <td>${pt}</td>
        </tr>`;
    });

    html+=`<tr><td colspan="3"><b>Total</b></td><td><b>${total}</b></td></tr></table>`;
    misResultados.innerHTML=html;
  });
}

// 🧠 TABLA GRUPO
function pintarGrupos(resultados){
  let t={};
  grupos.A.forEach(e=>t[e]={Pts:0});

  partidos.forEach(p=>{
    let r=resultados[p.id];
    if(!r) return;
    if(r.l>r.v) t[p.local].Pts+=3;
    else if(r.l<r.v) t[p.visitante].Pts+=3;
    else { t[p.local].Pts++; t[p.visitante].Pts++; }
  });

  let arr=Object.entries(t).sort((a,b)=>b[1].Pts-a[1].Pts);

  let html="<h3>Grupo A</h3><table>";
  arr.forEach((e,i)=>{
    html+=`<tr><td>${i+1}</td><td>${equipos[e[0]].nombre}</td><td>${e[1].Pts}</td></tr>`;
  });
  html+="</table>";

  tablaGrupos.innerHTML=html;
}

// 🚀 INIT
window.onload=()=>{
  render();
  escuchar();
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