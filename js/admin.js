import { db } from "./firebase-config.js";
import { requireRole, logout } from "./auth.js";
import {
  collection, onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const DEPTS = [
  { key: "facilities", label: "אב בית", chipClass: "fac" },
  { key: "it", label: "מחשוב", chipClass: "it" },
  { key: "secretary", label: "מזכירות", chipClass: "sec" },
];
const STATUS_LABELS = { open: "פתוח", in_progress: "בטיפול", handled: "טופל" };
const STATUS_BADGE_CLASS = { open: "open", in_progress: "prog", handled: "done" };

document.getElementById("logout-btn").addEventListener("click", logout);

let allTickets = [];

function applyFilters() {
  const search = document.getElementById("search-input").value.trim().toLowerCase();
  const dept = document.getElementById("dept-filter").value;
  const status = document.getElementById("status-filter").value;

  return allTickets.filter((t) => {
    if (dept !== "all" && t.assignedRole !== dept) return false;
    if (status !== "all" && t.status !== status) return false;
    if (search && !(t.description || "").toLowerCase().includes(search)) return false;
    return true;
  });
}

function renderStats() {
  document.getElementById("stat-total").textContent = allTickets.length;
  document.getElementById("stat-open").textContent = allTickets.filter((t) => t.status === "open").length;
  document.getElementById("stat-prog").textContent = allTickets.filter((t) => t.status === "in_progress").length;
  document.getElementById("stat-done").textContent = allTickets.filter((t) => t.status === "handled").length;
}

function renderChart() {
  const counts = DEPTS.map((d) => {
    const items = allTickets.filter((t) => t.assignedRole === d.key);
    return {
      ...d,
      open: items.filter((t) => t.status === "open").length,
      in_progress: items.filter((t) => t.status === "in_progress").length,
      handled: items.filter((t) => t.status === "handled").length,
      total: items.length,
    };
  });
  const max = Math.max(1, ...counts.map((c) => c.total));

  document.getElementById("chart-rows").innerHTML = counts.map((c) => `
    <div class="chart-row">
      <div class="chart-label">${c.label}</div>
      <div class="bar-track">
        ${c.open ? `<div class="seg open" style="flex-basis:${(c.open / max) * 100}%"></div>` : ""}
        ${c.in_progress ? `<div class="seg prog" style="flex-basis:${(c.in_progress / max) * 100}%"></div>` : ""}
        ${c.handled ? `<div class="seg done" style="flex-basis:${(c.handled / max) * 100}%"></div>` : ""}
      </div>
      <div class="chart-total">${c.total}</div>
    </div>
  `).join("");
}

function fmtDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

function renderTable() {
  const filtered = applyFilters().slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  document.getElementById("result-count").textContent = `מציג ${filtered.length} מתוך ${allTickets.length}`;

  const tbody = document.getElementById("tickets-tbody");
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="meta-muted">אין תקלות התואמות לסינון.</td></tr>';
    return;
  }
  tbody.innerHTML = filtered.map((t) => {
    const dept = DEPTS.find((d) => d.key === t.assignedRole);
    return `
      <tr>
        <td class="desc-cell">${escapeHtml(t.description)}</td>
        <td><span class="dept-chip ${dept ? dept.chipClass : ""}">${dept ? dept.label : t.assignedRole}</span></td>
        <td class="meta-muted">${escapeHtml(t.reporterName || "-")}</td>
        <td class="meta-muted">${fmtDate(t.createdAt)}</td>
        <td><span class="badge ${STATUS_BADGE_CLASS[t.status]}">${STATUS_LABELS[t.status] || t.status}</span></td>
      </tr>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderAll() {
  renderStats();
  renderChart();
  renderTable();
}

["search-input", "dept-filter", "status-filter"].forEach((id) => {
  document.getElementById(id).addEventListener("input", renderTable);
  document.getElementById(id).addEventListener("change", renderTable);
});

requireRole("admin").then(({ user, profile }) => {
  document.getElementById("user-name").textContent = profile.name || user.email;

  onSnapshot(collection(db, "tickets"), (snap) => {
    allTickets = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, createdAt: data.createdAt ? data.createdAt.toDate() : null };
    });
    renderAll();
  });
});
