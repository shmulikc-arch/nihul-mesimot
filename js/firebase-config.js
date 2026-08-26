// ============================================================================
// הגדרות חיבור לפרויקט Firebase
// ============================================================================
// יש להחליף את הערכים למטה בערכים האמיתיים מפרויקט ה-Firebase שלך.
// איך מוצאים אותם: Firebase Console -> אייקון גלגל השיניים (הגדרות פרויקט)
// -> גלול למטה ל"האפליקציות שלך" -> אם אין אפליקציית ווב עדיין, לחצו על
// סמל ה-</> כדי ליצור אחת -> שם תופיע בדיוק האובייקט הזה, פשוט העתיקו-הדביקו.
// ============================================================================

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
