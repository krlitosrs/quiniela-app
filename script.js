function guardar() {
  const g1l = document.getElementById("g1_local").value;
  const g1v = document.getElementById("g1_visit").value;

  const g2l = document.getElementById("g2_local").value;
  const g2v = document.getElementById("g2_visit").value;

  // Resultados reales (ejemplo)
  const real = [
    { l: 2, v: 1 },
    { l: 1, v: 1 }
  ];

  const user = [
    { l: parseInt(g1l), v: parseInt(g1v) },
    { l: parseInt(g2l), v: parseInt(g2v) }
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