// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCXwjx7-rkh7arUF2ma7rK_gE1luwSB6ic",
  authDomain: "quiniela-app-7cbb0.firebaseapp.com",
  projectId: "quiniela-app-7cbb0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ⏱️ CIERRE DE FASE (AJUSTA ESTA FECHA)
const CIERRE_FASE = new Date("2026-06-01T18:00:00");

// ⚽ PARTIDOS (orden cronológico)
const partidos = [
  { id:1, local:"Brasil", visitante:"Alemania" },
  { id:2, local:"Brasil", visitante:"Argentina" },
  { id:3, local:"Brasil", visitante:"Francia" },
  { id:4, local:"Alemania", visitante:"Argentina" },
  { id:5, local:"Alemania", visitante:"Francia" },
  { id:6, local:"Argentina", visitante:"Francia" }
];

// 🧭 PANTALLAS
function mostrarPantalla(id){
  ["pantallaLogin","pantallaNickname","pantallaApp"].forEach(p=>{
    document.getElementById(p).style.display = p===id ? "block" : "none";
  });
}

function mostrarVista(v){
  document.getElementById("vistaPredicciones").style.display="none";
  document.getElementById("vistaRanking").style.display="none";
  document.getElementById("vistaMisResultados").style.display="none";

  if(v==="predicciones") document.getElementById("vistaPredicciones").style.display="block";
  if(v==="ranking") document.getElementById("vistaRanking").style.display="block";
  if(v==="misResultados") document.getElementById("vistaMisResultados").style.display="block";
}

// 🔐 AUTH
function registrar(){
  auth.createUserWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).then(async cred=>{
    await db.collection("usuarios").doc(cred.user.uid).set({
      email: cred.user.email,
      permitido:false
    });
    alert("Creado, espera autorización");
    auth.signOut();
  }).catch(e=>alert(e.message));
}

function login(){
  auth.signInWithEmailAndPassword(
    document.getElementById("email").value,
    document.getElementById("password").value
  ).catch(e=>alert(e.message));
}

function logout(){ auth.signOut(); }

// 🔒 ACCESO
async function verificarAcceso(){
  const user = auth.currentUser;
  if(!user) return;

  const doc = await db.collection("usuarios").doc(user.uid).get();

  if(!doc.exists || doc.data().permitido!==true){
    alert("Sin acceso");
    auth.signOut();
    return;
  }

  if(!doc.data().nickname){
    mostrarPantalla("pantallaNickname");
  } else {
    mostrarPantalla("pantallaApp");
  }
}

// 👤 NICKNAME
function validarNickname(n){
  return /^[a-zA-Z0-9]{1,25}$/.test(n);
}

async function guardarNickname(){
  const user = auth.currentUser;
  const nick = document.getElementById("nickname").value.trim().toLowerCase();

  if(!validarNickname(nick)) return alert("Nickname inválido");

  const userRef = db.collection("usuarios").doc(user.uid);
  const nickRef = db.collection("nicknames").doc(nick);

  try{
    await db.runTransaction(async tx=>{
      const u = await tx.get(userRef);
      if(u.exists && u.data().nickname) throw new Error("No editable");

      const n = await tx.get(nickRef);
      if(n.exists) throw new Error("Ya en uso");

      tx.set(nickRef,{uid:user.uid});
      tx.set(userRef,{nickname:nick},{merge:true});
    });

    mostrarPantalla("pantallaApp");

  }catch(e){ alert(e.message); }
}

// 🎨 RENDER PARTIDOS
function render(){
  const c = document.getElementById("partidos");
  c.innerHTML="";

  const bloqueado = new Date() >= CIERRE_FASE;

  partidos.forEach(p=>{
    c.innerHTML += `
      <div>
        ${p.local} vs ${p.visitante}
        <input id="p_l_${p.id}" type="number" min="0" ${bloqueado?"disabled":""}>
        -
        <input id="p_v_${p.id}" type="number" min="0" ${bloqueado?"disabled":""}>
      </div>
    `;
  });

  if(bloqueado){
    c.innerHTML += `<p style="color:red"><strong>Fase cerrada, no puedes editar</strong></p>`;
  }
}

// 💾 GUARDAR PREDICCIONES
async function guardarPredicciones(){
  const user = auth.currentUser;

  if(new Date() >= CIERRE_FASE){
    return alert("La fase ya está cerrada");
  }

  let datos = {};

  for(let p of partidos){
    let l = document.getElementById(`p_l_${p.id}`).value;
    let v = document.getElementById(`p_v_${p.id}`).value;

    if(l==="" || v===""){
      return alert("Debes llenar todos los partidos");
    }

    l=parseInt(l); v=parseInt(v);

    if(l<0 || v<0 || l>30 || v>30){
      return alert("Valores inválidos");
    }

    datos[p.id]={l,v};
  }

  await db.collection("predicciones").doc(user.uid).set({
    uid:user.uid,
    partidos:datos
  });

  alert("Guardado");
}

// 🧠 CALCULO GENERAL
function calcular(pred, real){
  let puntos=0, exactos=0, resultados=0;

  Object.keys(real).forEach(id=>{
    const pr=pred[id], re=real[id];
    if(!pr) return;

    if(pr.l===re.l && pr.v===re.v){
      puntos+=5; exactos++; resultados++; return;
    }

    if(
      (pr.l>pr.v && re.l>re.v) ||
      (pr.l<pr.v && re.l<re.v) ||
      (pr.l===pr.v && re.l===re.v)
    ){
      puntos+=3; resultados++;
    }
  });

  return {puntos,exactos,resultados};
}

// 🧠 CALCULO POR PARTIDO
function calcularPuntosPartido(pr, re){
  if(!pr || !re) return 0;

  if(pr.l===re.l && pr.v===re.v) return 5;

  if(
    (pr.l>pr.v && re.l>re.v) ||
    (pr.l<pr.v && re.l<re.v) ||
    (pr.l===pr.v && re.l===re.v)
  ) return 3;

  return 0;
}

// 🏆 RANKING
function escucharRanking(){
  let resultados=null, pred=[], users={};

  db.collection("resultados").doc("grupoA").onSnapshot(d=>{
    if(!d.exists) return;
    resultados=d.data(); update();
  });

  db.collection("predicciones").onSnapshot(s=>{
    pred=s.docs.map(d=>d.data()); update();
  });

  db.collection("usuarios").onSnapshot(s=>{
    users={}; s.docs.forEach(d=>users[d.id]=d.data()); update();
  });

  function update(){
    if(!resultados) return;

    let r = pred.map(p=>{
      const st=calcular(p.partidos,resultados);
      return {
        uid:p.uid,
        nombre:users[p.uid]?.nickname||"?",
        ...st
      };
    });

    r.sort((a,b)=>
      b.puntos-a.puntos ||
      b.exactos-a.exactos ||
      b.resultados-a.resultados
    );

    pintarRanking(r);
    pintarMisResultados(resultados);
  }
}

// 🎨 RANKING
function pintarRanking(lista){
  let html="<table><tr><th>#</th><th>Jugador</th><th>Puntos</th></tr>";

  lista.forEach((j,i)=>{
    let pos=i+1;
    if(i===0) pos="🥇";
    else if(i===1) pos="🥈";
    else if(i===2) pos="🥉";

    html+=`<tr><td>${pos}</td><td>${j.nombre}</td><td>${j.puntos}</td></tr>`;
  });

  html+="</table>";
  document.getElementById("ranking").innerHTML=html;
}

// 📊 MIS RESULTADOS (CON ACUMULADO)
function pintarMisResultados(resultados){
  const user = auth.currentUser;

  db.collection("predicciones").doc(user.uid).get().then(doc=>{
    if(!doc.exists) return;

    const pred = doc.data().partidos;
    let total = 0;

    let html = `
      <table>
        <tr>
          <th>Partido</th>
          <th>Tú</th>
          <th>Real</th>
          <th>Puntos</th>
        </tr>
    `;

    partidos.forEach(p=>{
      const pr = pred[p.id] || {};
      const re = resultados[p.id] || {};

      const puntos = calcularPuntosPartido(pr, re);
      total += puntos;

      html += `
        <tr>
          <td>${p.local} vs ${p.visitante}</td>
          <td>${pr.l ?? "-"} - ${pr.v ?? "-"}</td>
          <td>${re.l ?? "-"} - ${re.v ?? "-"}</td>
          <td><strong>${puntos}</strong></td>
        </tr>
      `;
    });

    html += `
      <tr>
        <td colspan="3"><strong>Total</strong></td>
        <td><strong>${total}</strong></td>
      </tr>
    </table>
    `;

    document.getElementById("misResultados").innerHTML = html;
  });
}

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