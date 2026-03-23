let churchChart;
let categoryChart;
let statusChart;

async function loadDashboard() {
  try {
    const response = await fetch(API_URL);
    const text = await response.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      alert("Erro de ligação: o API_URL não está a devolver JSON válido. Verifique o link do Apps Script publicado em /exec.");
      console.error("Resposta recebida:", text);
      return;
    }

    if (!json.success) {
      alert("Erro ao carregar dados: " + (json.error || "Erro desconhecido"));
      return;
    }

    const data = json.data || [];

    renderKPIs(data);
    renderChurchSummary(data);
    renderRecentRecords(data);
    renderCharts(data);
    initMobileTabs();

  } catch (error) {
    alert("Erro de ligação: " + error.message);
  }
}

function renderKPIs(data) {
  const total = data.length;

  const present = data.filter(r => normalize(r["Situação Final"]) === "presente").length;
  const delegates = data.filter(r => normalize(r["Categoria Final"]) === "delegado").length;
  const suplentes = data.filter(r => normalize(r["Categoria Final"]).includes("suplente")).length;
  const substitutions = data.filter(r => clean(r["Substitui (Nome)"]) !== "").length;

  const presencePercent = TOTAL_DELEGADOS_OFICIAIS > 0
    ? ((present / TOTAL_DELEGADOS_OFICIAIS) * 100).toFixed(1)
    : "0.0";

  const absencePercent = TOTAL_DELEGADOS_OFICIAIS > 0
    ? (((TOTAL_DELEGADOS_OFICIAIS - present) / TOTAL_DELEGADOS_OFICIAIS) * 100).toFixed(1)
    : "0.0";

  const quorumRequired = Math.floor(TOTAL_DELEGADOS_OFICIAIS / 2) + 1;
  const quorumReached = present >= quorumRequired;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("delegateCount").textContent = delegates;
  document.getElementById("suplenteCount").textContent = suplentes;
  document.getElementById("substitutionCount").textContent = substitutions;
  document.getElementById("presencePercent").textContent = `${presencePercent}%`;
  document.getElementById("absencePercent").textContent = `${absencePercent}%`;
  document.getElementById("quorumRequired").textContent = quorumRequired;
  document.getElementById("quorumStatus").textContent = quorumReached ? "Atingido" : "Não atingido";

  const quorumCard = document.getElementById("quorumCard");
  quorumCard.classList.remove("ok", "warn");
  quorumCard.classList.add(quorumReached ? "ok" : "warn");
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

function initMobileTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const sections = document.querySelectorAll(".tab-section");

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      buttons.forEach(btn => btn.classList.remove("active"));
      sections.forEach(section => section.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
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
