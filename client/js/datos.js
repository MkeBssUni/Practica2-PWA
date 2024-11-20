// Cargar películas desde el servidor y mostrarlas en la pantalla
async function loadMovies() {
  try {
    const response = await fetch('http://localhost:3000/peliculas');
    const data = await response.json();

    // Generar HTML para las películas en línea
    let tab = '';
    data.forEach((movie) => {
      tab += `
          <div class="col-sm-3 mb-5">  
              <div class="card">
                  <div class="card-body">
                      <h5 class="card-title">${movie.nombre}</h5>
                      <p class="card-text">${movie.director}</p>
                      <p class="card-text">${movie.clasificacion}</p>
                  </div>  
              </div>
          </div>`;
    });

    // Insertar las películas en la sección online
    const onlineContainer = document.getElementById('datos-registrados-online');
    onlineContainer.innerHTML = tab;

    // Cargar las películas guardadas localmente (offline)
    await loadMoviesFromIndexedDB();
  } catch (error) {
    console.error('Error al cargar las películas del servidor:', error);

    // Si falla la conexión, mostrar solo las películas de IndexedDB
    document.getElementById('datos-registrados-online').innerHTML = '<p>No se pudo cargar las películas en línea.</p>';
    await loadMoviesFromIndexedDB();
  }
}

// Función para cargar películas desde IndexedDB (offline)
async function loadMoviesFromIndexedDB() {
  const db = await getDatabaseClient();
  const tx = db.transaction('post-requests', 'readonly');
  const store = tx.objectStore('post-requests');
  const requests = await store.getAll(); // Obtener todos los registros

  // Asegurarse de que `requests` sea un array
  if (!Array.isArray(requests)) {
      console.error('No se pudieron obtener las películas offline. Inicializando como vacío.');
      return;
  }

  // Generar HTML para las películas guardadas localmente
  let tab = '';
  requests.forEach((req) => {
      const { nombre, director, clasificacion } = req.body;
      tab += `
          <div class="col-sm-3 mb-5" data-id="${req.id}">  
              <div class="card bg-warning">
                  <div class="card-body">
                      <h5 class="card-title">${nombre} <span class="badge bg-secondary">Offline</span></h5>
                      <p class="card-text">${director}</p>
                      <p class="card-text">${clasificacion}</p>
                  </div>  
              </div>
          </div>`;
  });

  // Insertar las películas en la sección offline
  const offlineContainer = document.getElementById('datos-registrados-offline');
  offlineContainer.innerHTML = tab;
}


// Inicializar IndexedDB en el cliente
function getDatabaseClient() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('pwa-database', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('post-requests')) {
        db.createObjectStore('post-requests', {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// Función para registrar el evento de sincronización
function registerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then((sw) => sw.sync.register('sync-post-requests'))
      .then(() => console.log('Sincronización registrada'))
      .catch((err) => console.error('Error al registrar sincronización:', err));
  }
}

// Escuchar el evento de envío del formulario
const form = document.getElementById('add-movie-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const movieName = document.getElementById('movie-name').value.trim();
  const movieDirector = document.getElementById('movie-director').value.trim();
  const movieRating = document.getElementById('movie-rating').value;

  // Validar campos del formulario
  if (!movieName || !movieDirector || !movieRating) {
    alert('Todos los campos son obligatorios');
    return;
  }

  const newMovie = {
    nombre: movieName,
    director: movieDirector,
    clasificacion: movieRating,
  };

  try {
    const response = await fetch('http://localhost:3000/peliculas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newMovie),
    });

    if (response.ok) {
      alert('Película agregada con éxito');
      form.reset();
      loadMovies();
    } else {
      throw new Error('Error al agregar la película');
    }
  } catch (error) {
    console.error('Sin conexión, guardando localmente:', error);

    const db = await getDatabaseClient();
    const tx = db.transaction('post-requests', 'readwrite');
    tx.objectStore('post-requests').add({
      url: 'http://localhost:3000/peliculas',
      body: newMovie,
    });
    alert('Película guardada localmente. Se sincronizará cuando haya conexión.');
    registerSync(); // Registrar sincronización
    await loadMoviesFromIndexedDB(); // Mostrar inmediatamente en pantalla
  }
});

// Escuchar mensajes del Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'SYNC_COMPLETED') {
      console.log(`Película con ID ${event.data.id} sincronizada con el servidor.`);
      removeSyncedMovieFromScreen(event.data.id);
    }
  });
}

// Función para eliminar una película sincronizada de la pantalla
function removeSyncedMovieFromScreen(id) {
  const offlineContainer = document.getElementById('datos-registrados-offline');
  const cards = offlineContainer.querySelectorAll('.card');

  cards.forEach((card) => {
    if (card.parentElement.dataset.id === id.toString()) {
      card.parentElement.remove();
    }
  });
}

// Cargar las películas al iniciar la aplicación
loadMovies();
