// ============================================================================
// הגדרות חיבור לפרויקט Firebase
// ============================================================================
// יש להחליף את הערכים למטה בערכים האמיתיים מפרויקט ה-Firebase שלך.
// איך מוצאים אותם: Firebase Console -> אייקון גלגל השיניים (הגדרות פרויקט)
// -> גלול למטה ל"האפליקציות שלך" -> אם אין אפליקציית ווב עדיין, לחצו על
// סמל ה-</> כדי ליצור אחת -> שם תופיע בדיוק האובייקט הזה, פשוט העתיקו-הדביקו.
// ============================================================================

const firebaseConfig = {
  apiKey: "AIzaSyAFyI3XLHYWRGJzddoRLfkEySrIRg-ZpT0",
  authDomain: "moked-takalot.firebaseapp.com",
  projectId: "moked-takalot",
  storageBucket: "moked-takalot.firebasestorage.app",
  messagingSenderId: "545424996710",
  appId: "1:545424996710:web:71a6f46276f50c7bcb30a7",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
