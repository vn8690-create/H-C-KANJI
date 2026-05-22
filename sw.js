const CACHE_NAME = 'cyber-kanji-v3'; // Đổi lên v3 để kích hoạt làm mới cache toàn hệ thống
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

// Cài đặt Service Worker và lưu trữ file vào bộ nhớ đệm
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    }).then(() => self.skipWaiting()) // Ép kích hoạt ngay lập tức
  );
});

// Xóa bỏ các bộ nhớ cache cũ lỗi thời
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Xử lý phản hồi mạng khi offline hoặc online
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
