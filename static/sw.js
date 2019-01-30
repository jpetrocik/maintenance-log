var CACHE_NAME = 'mileage_cache-v1';
var urlsToCache = [
  '/mileage',
  '/scripts/bootstrap_4_2_1.min.js',
  '/css/bootstrap_4_2_1.min.css',
  '/scripts/jquery_3_3_1.min.js',
  '/scripts/popper_1_14_6.min.js',
  '/css/fontawesome_all_5_5_0.css',
  '/css/mileage.css'
];

self.addEventListener('install', function(event) {
 // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});


self.addEventListener('fetch', function (event) {
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