var CACHE_NAME = 'gasgame_cache';
var host = '/gas_game';
var urlsToCache = [
  '/assets/BGM/meka_ge_renketu02.mp3',
  '/assets/BGM/natsuyasuminotanken.mp3',
  '/assets/building_house1.png',
  '/assets/gasball.png',
  '/assets/money.png',
  '/assets/pipe1_straight.png',
  '/assets/pipe2_curve.png',
  '/assets/saisei.png',
  '/assets/sora.png',
  '/assets/stone.png',
  '/assets/backimage.jpeg',
  '/assets/gas_tank.png',
  'gasGame.html',
  'gasGame.js',
  '/stage/stage1.json',
  '/stage/stage2.json',
  '/stage/stage3.json',
  '/stage/stage4.json',
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