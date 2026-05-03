function guardar() {
  const g1l = document.getElementById("g1_local").value;
  const g1v = document.getElementById("g1_visit").value;

  const g2l = document.getElementById("g2_local").value;
  const g2v = document.getElementById("g2_visit").value;

  const datos = {
    g1: { l: g1l, v: g1v },
    g2: { l: g2l, v: g2v }
  };

  // Guardar en localStorage
  localStorage.setItem("quiniela", JSON.stringify(datos));

  calcular(datos);
}

function cargar() {
  const datos = JSON.parse(localStorage.getItem("quiniela"));

  if (!datos) return;

  document.getElementById("g1_local").value = datos.g1.l;
  document.getElementById("g1_visit").value = datos.g1.v;

  document.getElementById("g2_local").value = datos.g2.l;
  document.getElementById("g2_visit").value = datos.g2.v;

  calcular(datos);
}

function calcular(datos) {
  const real = [
    { l: 2, v: 1 },
    { l: 1, v: 1 }
  ];

  const user = [
    { l: parseInt(datos.g1.l), v: parseInt(datos.g1.v) },
    { l: parseInt(datos.g2.l), v: parseInt(datos.g2.v) }
  ];

  let puntos = 0;

  for (let i = 0; i < real.length; i++) {
    if (user[i].l === real[i].l && user[i].v === real[i].v) {
      puntos += 3;
    } else if (
      (user[i].l > user[i].v && real[i].l > real[i].v) ||
      (user[i].l < user[i].v && real[i].l < real[i].v) ||
      (user[i].l === user[i].v && real[i].l === real[i].v)
    ) {
      puntos += 1;
    }
  }

  document.getElementById("resultado").innerText =
    "Puntos obtenidos: " + puntos;
}

// Ejecutar al cargar la página
window.onload = cargar;