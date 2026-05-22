const CACHE_NAME = 'cyber-kanji-v2'; // Đổi tên v2 để ép điện thoại xóa cache cũ ngay lập tức
const assets = [
  'index.html',
  'script.js',
  'style.css',
  'manifest.json',
  'n5.json',
  'n4.json',
  'n3.json',
  'n2.json',
  'n1.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Đọc dữ liệu từ bộ nhớ đệm giúp app load siêu tốc khi đi tàu ngầm
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
