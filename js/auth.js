// ============================================================================
// עזרי התחברות והרשאות - משותף לכל הדפים המוגנים
// ============================================================================
import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// לכל תפקיד יש דף בית משלו במערכת
export const ROLE_PAGES = {
  teacher: "report.html",
  facilities: "facilities.html",
  it: "it.html",
  secretary: "secretary.html",
  admin: "admin.html",
};

export const ROLE_LABELS = {
  teacher: "מורה",
  facilities: "אב בית",
  it: "אחראי מחשבים",
  secretary: "מזכירה",
  admin: "מנהל/ת מערכת",
};

// שולף את פרופיל המשתמש (שם + תפקיד) ממסמך users/{uid}
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data();
}

export function redirectForRole(role) {
  location.href = ROLE_PAGES[role] || "index.html";
}

// שומר על דף מוגן: מוודא שהמשתמש מחובר, שיש לו פרופיל תקין במערכת,
// ושהתפקיד שלו תואם לדף הזה. אחרת - מפנה אותו לדף הנכון עבורו.
// שימוש: const { user, profile } = await requireRole("facilities");
export function requireRole(expectedRole) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "index.html";
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (!profile || !profile.role) {
        alert("החשבון שלך קיים אך עדיין לא הוגדר תפקיד במערכת. יש לפנות למנהל המערכת.");
        await signOut(auth);
        location.href = "index.html";
        return;
      }
      if (profile.role !== expectedRole) {
        redirectForRole(profile.role);
        return;
      }
      resolve({ user, profile });
    });
  });
}

export async function logout() {
  await signOut(auth);
  location.href = "index.html";
}

// עיצוב זמן יחסי פשוט בעברית ("לפני 3 שעות", "אתמול"...)
export function relativeTime(date) {
  if (!date) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "עכשיו";
  if (diffMin < 60) return `לפני ${diffMin} דקות`;
  if (diffHr < 24) return `לפני ${diffHr} שעות`;
  if (diffDay === 1) return "אתמול";
  if (diffDay < 7) return `לפני ${diffDay} ימים`;
  return date.toLocaleDateString("he-IL");
}
