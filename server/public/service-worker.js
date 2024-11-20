/* const STATIC_CACHE_NAME = 'static-cache-v1.1';
const INMUTABLE_CACHE_NAME = 'inmutable-cache-v1.1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1.1';

self.addEventListener('install', function(event) {
  console.log('SW Registrado')
  
//DATOS DE APPSHELL
const respCache = caches.open(STATIC_CACHE_NAME).then((cache) => {
  return cache.addAll([
      '/',
      '/index.html',
      '/css/style.css',
      '/js/app.js',
    
  ])
})

//event.waitUntil(respCache)

//Rutas inmutables (que son CDN, o recursos que usamos)
const respCacheInmutable = caches.open(INMUTABLE_CACHE_NAME)
  .then((cache)=>{
      return cache.addAll([
              'https://reqres.in/api/users',
              'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css',
              'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js',
              'https://unpkg.com/sweetalert/dist/sweetalert.min.js'
          ]);
  });

event.waitUntil(Promise.all[respCache, respCacheInmutable]); //espera a que se terminen de crear esos dos caches.


//cache2.waitUntil(cache2)

})

self.addEventListener('fetch', function(event) {
  console.log('used to intercept requests so we can check for the file or data in the cache')
})

self.addEventListener('activate', function(event) {
  console.log('this event triggers when the service worker activates')
})

const cleanCache = (cacheName, maxSize) =>{ //recibes un máximo de caches
  caches.open(cacheName)
  .then((cache)=>{
      return cache.keys().then((items)=>{
          console.log(items.length);
          if(items.length >= maxSize){ //comparar si se supera el tamaño de caches
              cache.delete(items[0])//eliminar el primer cache
              .then(()=>{cleanCache(cacheName, maxSize)}); //revisar si no hay más caches para eliminar.
                  
          }
      })
  })
} */
const currentCache = "current-cache-v1.2";

const files = [
  "/",
  "index.html",
  "/js/app.js",
  "manifest.json",
  "images/gato1.jpg",
  "images/perro1.jpg",
  "/views/dogs.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(currentCache).then((cache) => {
      return cache.addAll(files);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== currentCache;
          })
          .map(cacheName => caches.delete(cacheName))
      )
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});