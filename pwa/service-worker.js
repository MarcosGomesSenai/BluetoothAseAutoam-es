self.addEventListener('install', function (e) {
  e.waitUntil(caches.open('portao-cache').then(function (cache) {
    return cache.addAll(['/', '/painel.php', '/style.css']);
  }));
});
self.addEventListener('fetch', function (e) {
  e.respondWith(caches.match(e.request).then(function (r) {
    return r || fetch(e.request);
  }));
});
