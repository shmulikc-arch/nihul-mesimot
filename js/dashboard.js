// ============================================================================
// לוגיקה משותפת לשלושת דשבורדי התפקידים (אב בית / מחשוב / מזכירות)
// כל דף תפקיד קורא ל-initDashboard עם ההגדרות שלו בלבד.
// ============================================================================
import { db } from "./firebase-config.js";
import { requireRole, logout, relativeTime } from "./auth.js";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const STATUS_LABELS = { open: "פתוח", in_progress: "בטיפול", handled: "טופל" };

const ICONS = {
  open: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.2v.1"/></svg>',
  in_progress: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  handled: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m4 12 5 5L20 6"/></svg>',
};
const STATUS_CLASS = { open: "open", in_progress: "prog", handled: "done" };

export function initDashboard({ role, roleLabel, roleIconSvg }) {
  document.getElementById("logout-btn").addEventListener("click", logout);
  document.querySelector(".role-pill").innerHTML = `${roleIconSvg} דשבורד ${roleLabel}`;

  let allTickets = [];
  let activeTab = "all";

  const toolbar = document.getElementById("toolbar");
  const listEl = document.getElementById("ticket-list");

  function countFor(status) {
    if (status === "all") return allTickets.length;
    return allTickets.filter((t) => t.status === status).length;
  }

  function renderTabs() {
    const tabs = [
      { key: "all", label: "הכל" },
      { key: "open", label: "פתוח" },
      { key: "in_progress", label: "בטיפול" },
      { key: "handled", label: "טופל" },
    ];
    toolbar.innerHTML = tabs.map((t) => `
      <button class="tab ${activeTab === t.key ? "active" : ""}" data-tab="${t.key}">
        ${t.label} <span class="count">${countFor(t.key)}</span>
      </button>
    `).join("");
    toolbar.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = btn.dataset.tab;
        renderTabs();
        renderList();
      });
    });
  }

  function renderList() {
    const filtered = activeTab === "all" ? allTickets : allTickets.filter((t) => t.status === activeTab);
    if (!filtered.length) {
      listEl.innerHTML = '<div class="empty-state">אין תקלות להצגה בקטגוריה הזו.</div>';
      return;
    }
    listEl.innerHTML = filtered.map((t) => `
      <div class="ticket" data-id="${t.id}">
        <div class="thumb">
          ${t.photoUrl
            ? `<img src="${t.photoUrl}" class="thumb" alt="תמונת התקלה">`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5-9 9"/></svg>`}
        </div>
        <div class="t-main">
          <div class="t-desc">${escapeHtml(t.description)}</div>
          <div class="t-meta">דווח ע״י: ${escapeHtml(t.reporterName || "לא ידוע")}${t.location ? " · " + escapeHtml(t.location) : ""} · ${relativeTime(t.createdAt)}</div>
        </div>
        <span class="badge ${STATUS_CLASS[t.status]}">${ICONS[t.status]} ${STATUS_LABELS[t.status]}</span>
        ${renderAction(t)}
      </div>
    `).join("");

    listEl.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.closest(".ticket").dataset.id;
        const newStatus = btn.dataset.action;
        btn.disabled = true;
        try {
          await updateDoc(doc(db, "tickets", id), { status: newStatus, updatedAt: serverTimestamp() });
        } catch (err) {
          console.error(err);
          alert("אירעה שגיאה בעדכון הסטטוס.");
          btn.disabled = false;
        }
      });
    });
  }

  function renderAction(t) {
    if (t.status === "open") {
      return `<button class="progress-btn" data-action="in_progress">התחלת טיפול</button>`;
    }
    if (t.status === "in_progress") {
      return `<button class="action-btn" data-action="handled">סמן כטופל</button>`;
    }
    return `<div class="done-label">${ICONS.handled} סומן כטופל</div>`;
  }

  function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  requireRole(role).then(({ user, profile }) => {
    document.getElementById("user-name").textContent = profile.name || user.email;
    document.getElementById("user-role-label").textContent = roleLabel;

    const q = query(collection(db, "tickets"), where("assignedRole", "==", role));
    onSnapshot(q, (snap) => {
      allTickets = snap.docs.map((d) => {
        const data = d.data();
        return { ...data, id: d.id, createdAt: data.createdAt ? data.createdAt.toDate() : null };
      });
      allTickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      renderTabs();
      renderList();
    });
  });
}
