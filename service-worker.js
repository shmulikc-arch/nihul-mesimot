// Service Worker פשוט - מאפשר "הוספה למסך הבית" וטעינה מהירה של קבצי האתר.
// לא נוגע בבקשות לפיירבייס (Firestore/Storage/Auth) - אלו תמיד יוצאות ישירות לרשת.

const CACHE_NAME = "moked-taklot-v2"; // כדי לאלץ עדכון קבצים ישנים אצל משתמשים, שנו את המספר בסוף

const APP_SHELL = [
  "./",
  "./index.html",
  "./report.html",
  "./facilities.html",
  "./it.html",
  "./secretary.html",
  "./admin.html",
  "./css/style.css",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // רק בקשות GET מאותו מקור (האתר עצמו) - הכל מה שקשור לפיירבייס נשאר ללא נגיעה
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
