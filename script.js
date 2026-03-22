let churchChart;
let categoryChart;
let statusChart;

async function loadDashboard() {
  try {
    const response = await fetch(API_URL);
    const json = await response.json();

    if (!json.success) {
      alert("Erro ao carregar dados: " + (json.error || "Erro desconhecido"));
      return;
    }

    const data = json.data || [];

    console.log("DATA:", data); // debug

    renderKPIs(data);
    renderChurchSummary(data);
    renderRecentRecords(data);
    renderSubstitutions(data);
    renderCharts(data);

  } catch (error) {
    alert("Erro de ligação: " + error.message);
  }
}

function renderKPIs(data) {
  const total = data.length;

  const present = data.filter(r =>
    normalize(r["Situação Final"]) === "presente"
  ).length;

  const absent = data.filter(r =>
    normalize(r["Situação Final"]) === "ausente"
  ).length;

  const delegates = data.filter(r => {
    const cat = normalize(r["Categoria Final"]);
    return cat === "delegado";
  }).length;

  const suplentes = data.filter(r => {
    const cat = normalize(r["Categoria Final"]);
    return cat.includes("suplente");
  }).length;

  const substitutions = data.filter(r =>
    clean(r["Substitui (Nome)"]) !== ""
  ).length;

  setText("totalCount", total);
  setText("presentCount", present);
  setText("absentCount", absent);
  setText("delegateCount", delegates);
  setText("suplenteCount", suplentes);
  setText("substitutionCount", substitutions);
}

function renderChurchSummary(data) {
  const map = countBy(data, "Igreja Final");

  const tbody = document.getElementById("churchSummaryBody");
  tbody.innerHTML = "";

  Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .forEach(([church, count]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(church)}</td>
        <td>${count}</td>
      `;
      tbody.appendChild(tr);
    });
}

function renderRecentRecords(data) {
  const tbody = document.getElementById("recentRecordsBody");
  tbody.innerHTML = "";

  data.slice(-10).reverse().forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(clean(row["Nome Final"]))}</td>
      <td>${escapeHtml(clean(row["Igreja Final"]))}</td>
      <td>${escapeHtml(clean(row["Categoria Final"]))}</td>
      <td>${escapeHtml(clean(row["Situação Final"]))}</td>
      <td>${escapeHtml(clean(row["Substitui (Nome)"]) || "-")}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderSubstitutions(data) {
  const tbody = document.getElementById("substitutionsBody");
  tbody.innerHTML = "";

  const substitutions = data.filter(r =>
    clean(r["Substitui (Nome)"]) !== ""
  );

  substitutions.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(clean(row["Nome Final"]))}</td>
      <td>${escapeHtml(clean(row["Igreja Final"]))}</td>
      <td>${escapeHtml(clean(row["Categoria Final"]))}</td>
      <td>${escapeHtml(clean(row["Substitui (Nome)"]))}</td>
    `;

    tbody.appendChild(tr);
  });
}

function renderCharts(data) {
  const churchMap = countBy(data, "Igreja Final");
  const categoryMap = countBy(data, "Categoria Final");
  const statusMap = countBy(data, "Situação Final");

  if (churchChart) churchChart.destroy();
  if (categoryChart) categoryChart.destroy();
  if (statusChart) statusChart.destroy();

  churchChart = new Chart(document.getElementById("churchChart"), {
    type: "bar",
    data: {
      labels: Object.keys(churchMap),
      datasets: [{
        label: "Total",
        data: Object.values(churchMap)
      }]
    }
  });

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap)
      }]
    }
  });

  statusChart = new Chart(document.getElementById("statusChart"), {
    type: "pie",
    data: {
      labels: Object.keys(statusMap),
      datasets: [{
        data: Object.values(statusMap)
      }]
    }
  });
}

function countBy(data, field) {
  const map = {};

  data.forEach(row => {
    const key = clean(row[field]) || "Sem informação";
    map[key] = (map[key] || 0) + 1;
  });

  return map;
}

function normalize(value) {
  return clean(value).toLowerCase();
}

function clean(value) {
  return String(value || "").trim();
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDashboard();