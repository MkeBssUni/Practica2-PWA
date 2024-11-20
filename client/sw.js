const STATIC_CACHE_NAME = 'static-cache-v1.1';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1.1';
const INMUTABLE_CACHE_NAME = 'inmutable-cache-v1.1';

// Archivos que se almacenarán en el cache estático
const STATIC_FILES = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/datos.js',
    '/manifest.json',
    '/pages/recent.html',
    '/pages/offline.html',
    '/images/error.png',
    '/images/icons/android-launchericon-192-192.png',
    '/images/icons/android-launchericon-512-512.png',
];

// Archivos inmutables (generalmente CDN o librerías externas)
const INMUTABLE_FILES = [
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/js/bootstrap.bundle.min.js',
];

// Al instalar, guardar archivos estáticos e inmutables
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)),
            caches.open(INMUTABLE_CACHE_NAME).then((cache) => cache.addAll(INMUTABLE_FILES)),
        ])
    );
});

// Al activar, limpiar cachés antiguos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => ![STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME, INMUTABLE_CACHE_NAME].includes(key))
                    .map((key) => caches.delete(key))
            );
        })
    );
});

// Estrategia de fetch para manejar peticiones dinámicas y estáticas
self.addEventListener('fetch', (event) => {
    if (event.request.method === 'POST') {
        const clonedRequest = event.request.clone();
        event.respondWith(
            fetch(event.request).catch(() => savePostRequest(clonedRequest))
        );
    } else if (event.request.method === 'GET') {
        event.respondWith(
            caches.match(event.request).then((response) => {
                return (
                    response ||
                    fetch(event.request).then((fetchResponse) => {
                        return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
                            cache.put(event.request, fetchResponse.clone());
                            return fetchResponse;
                        });
                    })
                );
            }).catch(() => {
                if (event.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/pages/offline.html');
                }
                if (event.request.headers.get('accept').includes('image')) {
                    return caches.match('/images/error.png');
                }
            })
        );
    }
});

// Guardar solicitudes POST en IndexedDB desde el Service Worker
async function savePostRequest(request) {
    try {
        const body = await request.json(); // Leer el cuerpo una sola vez
        const db = await getDatabase();
        const tx = db.transaction('post-requests', 'readwrite');
        tx.objectStore('post-requests').add({ url: request.url, body });

        return new Response(
            JSON.stringify({ message: 'Guardado localmente. Sincronización pendiente.' }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error al guardar en IndexedDB:', error);
        throw error;
    }
}




// Sincronizar POST guardados cuando vuelva la conexión
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-post-requests') {
        event.waitUntil(syncPostRequests());
    }
});

// Función para sincronizar las solicitudes POST pendientes
async function syncPostRequests() {
    const db = await getDatabase();
    const tx = db.transaction('post-requests', 'readonly');
    const requests = await tx.objectStore('post-requests').getAll();

    await Promise.all(
        requests.map(async (req) => {
            try {
                const response = await fetch(req.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(req.body),
                });

                if (response.ok) {
                    // Eliminar solicitud de IndexedDB
                    const deleteTx = db.transaction('post-requests', 'readwrite');
                    deleteTx.objectStore('post-requests').delete(req.id);

                    // Notificar al cliente que se sincronizó
                    self.clients.matchAll().then((clients) => {
                        clients.forEach((client) => {
                            client.postMessage({ type: 'SYNC_COMPLETED', id: req.id });
                        });
                    });
                }
            } catch (error) {
                console.error('Error sincronizando:', error);
            }
        })
    );
}


// Inicializar IndexedDB
function getDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('pwa-database', 1);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('post-requests')) {
                db.createObjectStore('post-requests', { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

