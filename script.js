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

    renderKPIs(data);
    renderChurchSummary(data);
    renderRecentRecords(data);
    renderCharts(data);

  } catch (error) {
    alert("Erro de ligação: " + error.message);
  }
}

function renderKPIs(data) {
  const total = data.length;

  const present = data.filter(r => normalize(r["Situação Final"]) === "presente").length;
  const absent = data.filter(r => normalize(r["Situação Final"]) === "ausente").length;

  const delegates = data.filter(r => normalize(r["Categoria Final"]) === "delegado").length;

  const suplentes = data.filter(r => normalize(r["Categoria Final"]).includes("suplente")).length;

  const substitutions = data.filter(r => clean(r["Substitui (Nome)"]) !== "").length;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("presentCount").textContent = present;
  document.getElementById("absentCount").textContent = absent;
  document.getElementById("delegateCount").textContent = delegates;
  document.getElementById("suplenteCount").textContent = suplentes;
  document.getElementById("substitutionCount").textContent = substitutions;
}

function renderChurchSummary(data) {
  const map = countBy(data, "Igreja Final");
  const tbody = document.getElementById("churchSummaryBody");
  tbody.innerHTML = "";

  Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .forEach(([church, count]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${escapeHtml(church)}</td><td>${count}</td>`;
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
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{
        data: Object.values(categoryMap)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  statusChart = new Chart(document.getElementById("statusChart"), {
    type: "pie",
    data: {
      labels: Object.keys(statusMap),
      datasets: [{
        data: Object.values(statusMap)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
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

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDashboard();
