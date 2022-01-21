var CACHE_NAME = 'gasgame_cache';
var host = '/gas_game';
var urlsToCache = [
  '/assets/BGM/meka_ge_renketu02.mp3',
  '/assets/BGM/natsuyasuminotanken.mp3',
  '/assets/backimage.jpeg',
  '/assets/gas_tank.png',
];
urlsToCache = urlsToCache.map((v,s) => host+v);

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
      caches.match(event.request)
        .then(function(response) {
          // Cache hit - return response
          if (response) {
            return response;
          }
          return fetch(event.request);
        }
      )
    );
  });