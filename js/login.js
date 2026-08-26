import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { redirectForRole } from "./auth.js";

const form = document.getElementById("login-form");
const errorBox = document.getElementById("login-error");
const submitBtn = document.getElementById("login-btn");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "מתחבר/ת...";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const snap = await getDoc(doc(db, "users", cred.user.uid));
    if (!snap.exists() || !snap.data().role) {
      errorBox.textContent = "החשבון קיים אך עדיין לא הוגדר תפקיד במערכת. יש לפנות למנהל המערכת.";
      errorBox.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = "התחברות";
      return;
    }
    redirectForRole(snap.data().role);
  } catch (err) {
    errorBox.textContent = "אימייל או סיסמה שגויים.";
    errorBox.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "התחברות";
  }
});
