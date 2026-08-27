import { db, storage } from "./firebase-config.js";
import { requireAuth, ROLE_PAGES, logout, relativeTime } from "./auth.js";
import {
  collection, addDoc, query, where, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

const STATUS_LABELS = { open: "פתוח", in_progress: "בטיפול", handled: "טופל" };
const STATUS_CLASS = { open: "open", in_progress: "prog", handled: "done" };

let currentUser = null;
let selectedRole = null;
let selectedFile = null;

document.getElementById("logout-btn").addEventListener("click", logout);

// --- בחירת גורם אחראי ---
document.querySelectorAll(".assign-pill").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".assign-pill").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedRole = btn.dataset.role;
  });
});

// --- העלאת תמונה + תצוגה מקדימה ---
const uploadZone = document.getElementById("upload-zone");
const photoInput = document.getElementById("photo-input");
const preview = document.getElementById("attachment-preview");
const thumb = document.getElementById("attachment-thumb");
const nameEl = document.getElementById("attachment-name");

uploadZone.addEventListener("click", () => photoInput.click());
photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  if (!file) return;
  selectedFile = file;
  thumb.src = URL.createObjectURL(file);
  nameEl.textContent = file.name;
  preview.hidden = false;
  uploadZone.hidden = true;
});
document.getElementById("attachment-remove").addEventListener("click", () => {
  selectedFile = null;
  photoInput.value = "";
  preview.hidden = true;
  uploadZone.hidden = false;
});

// --- שליחת הדיווח ---
const form = document.getElementById("report-form");
const submitBtn = document.getElementById("submit-btn");
const errorBox = document.getElementById("form-error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const description = document.getElementById("description").value.trim();
  const location = document.getElementById("location").value.trim();

  if (!description) {
    errorBox.textContent = "נא למלא תיאור של התקלה.";
    errorBox.hidden = false;
    return;
  }
  if (!selectedRole) {
    errorBox.textContent = "נא לבחור לאן לשייך את הדיווח.";
    errorBox.hidden = false;
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "שולח...";

  try {
    let photoUrl = null;
    if (selectedFile) {
      const path = `tickets/${currentUser.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, selectedFile);
      photoUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "tickets"), {
      description,
      location: location || null,
      photoUrl,
      assignedRole: selectedRole,
      status: "open",
      reporterUid: currentUser.uid,
      reporterName: currentProfileName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    form.reset();
    document.querySelectorAll(".assign-pill").forEach((b) => b.classList.remove("selected"));
    selectedRole = null;
    selectedFile = null;
    photoInput.value = "";
    preview.hidden = true;
    uploadZone.hidden = false;
  } catch (err) {
    console.error(err);
    errorBox.textContent = "אירעה שגיאה בשליחת הדיווח. נסה/י שוב.";
    errorBox.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'שליחת דיווח <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3 3 10.5l7 2.5 2.5 7L21 3Z"/></svg>';
  }
});

// --- "הדיווחים האחרונים שלי" - עדכון חי ---
function renderRecent(tickets) {
  const list = document.getElementById("recent-list");
  if (!tickets.length) {
    list.innerHTML = '<div class="empty-state">עדיין לא דיווחת על תקלות.</div>';
    return;
  }
  list.innerHTML = tickets.slice(0, 5).map((t) => `
    <div class="mini-card">
      <div class="txt">
        <div class="desc">${escapeHtml(t.description)}</div>
        <div class="meta">${escapeHtml(roleLabel(t.assignedRole))} · ${relativeTime(t.createdAt)}</div>
      </div>
      <span class="badge ${STATUS_CLASS[t.status] || "open"}">${STATUS_LABELS[t.status] || "פתוח"}</span>
    </div>
  `).join("");
}

function roleLabel(role) {
  return { facilities: "אב בית", it: "מחשוב", secretary: "מזכירות" }[role] || role;
}
function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

let currentProfileName = "";

requireAuth().then(({ user, profile }) => {
  currentUser = user;
  currentProfileName = profile.name || "";
  document.getElementById("user-name").textContent = profile.name || user.email;

  if (profile.role !== "teacher") {
    const backLink = document.getElementById("back-link");
    backLink.href = ROLE_PAGES[profile.role] || "index.html";
    backLink.hidden = false;
  }

  const q = query(collection(db, "tickets"), where("reporterUid", "==", user.uid));
  onSnapshot(q, (snap) => {
    const tickets = snap.docs.map((d) => {
      const data = d.data();
      return { ...data, id: d.id, createdAt: data.createdAt ? data.createdAt.toDate() : null };
    });
    tickets.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    renderRecent(tickets);
  });
});
