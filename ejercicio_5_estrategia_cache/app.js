const btnCargar = document.getElementById('btn-cargar');
const contenedorDatos = document.getElementById('contenedor-datos');
const estadoRed = document.getElementById('estado-red');

const URL_API = 'https://jsonplaceholder.typicode.com/users';
const NOMBRE_CACHE = 'mi-cache-dinamica-v1';
let solicitudActual = 0;

async function obtenerDatosNetworkFirst({ usarCachePrimero = false } = {}) {
    const idSolicitud = ++solicitudActual;
    contenedorDatos.textContent = 'Cargando datos...';

    if (usarCachePrimero) {
        await mostrarDatosCache(idSolicitud, 'Sin conexión. Mostrando los últimos datos guardados.');
        return;
    }

    try {
        const respuestaRed = await fetch(URL_API);
        if (!respuestaRed.ok) {
            throw new Error(`La API respondió con estado ${respuestaRed.status}.`);
        }

        const datos = await respuestaRed.json();
        if (!Array.isArray(datos)) {
            throw new Error('La respuesta de la API no tiene el formato esperado.');
        }

        let guardadoLocal = false;
        try {
            const cache = await caches.open(NOMBRE_CACHE);
            await cache.put(URL_API, new Response(JSON.stringify(datos), {
                headers: { 'Content-Type': 'application/json' }
            }));
            guardadoLocal = true;
        } catch (error) {
            console.error('No se pudo guardar la respuesta en la caché local:', error);
        }

        if (idSolicitud !== solicitudActual) return;
        renderizarDatos(datos);
        actualizarEstado(
            guardadoLocal
                ? 'Datos obtenidos de Internet y guardados localmente.'
                : 'Datos en línea; no se pudieron guardar localmente.',
            guardadoLocal ? 'online' : 'offline'
        );
    } catch (error) {
        if (idSolicitud !== solicitudActual) return;
        console.warn('No se pudieron obtener datos de la red. Se intentará usar la caché local.', error);
        await mostrarDatosCache(idSolicitud, 'Sin conexión. Mostrando los últimos datos guardados.', error);
    }
}

async function mostrarDatosCache(idSolicitud, mensajeOffline, errorRed) {
    try {
        const cache = await caches.open(NOMBRE_CACHE);
        const respuestaCache = await cache.match(URL_API);

        if (idSolicitud !== solicitudActual) return;
        if (!respuestaCache) {
            actualizarEstado('Sin conexión y todavía no hay datos guardados.', 'offline');
            contenedorDatos.textContent = 'Conéctate a Internet una vez para guardar los datos y consultarlos sin conexión.';
            return;
        }

        const datosGuardados = await respuestaCache.json();
        if (!Array.isArray(datosGuardados)) {
            throw new Error('Los datos guardados no tienen el formato esperado.');
        }
        if (idSolicitud !== solicitudActual) return;

        renderizarDatos(datosGuardados);
        actualizarEstado(
            errorRed ? `${mensajeOffline} Error de red: ${errorRed.message}` : mensajeOffline,
            'offline'
        );
    } catch (error) {
        if (idSolicitud !== solicitudActual) return;
        console.error('No se pudieron recuperar los datos de la caché local:', error);
        actualizarEstado(`No se pudieron recuperar los datos locales: ${error.message}`, 'offline');
        contenedorDatos.textContent = 'No fue posible leer los datos guardados en este dispositivo.';
    }
}

function renderizarDatos(usuarios) {
    contenedorDatos.replaceChildren();

    usuarios.forEach((usuario) => {
        const tarjeta = document.createElement('div');
        tarjeta.className = 'usuario-card';

        const nombre = document.createElement('h3');
        nombre.textContent = usuario.name ?? 'Usuario sin nombre';

        const correo = document.createElement('p');
        correo.textContent = `📧 ${usuario.email ?? 'Sin correo'}`;

        const empresa = document.createElement('p');
        empresa.textContent = `🏢 ${usuario.company?.name ?? 'Sin empresa'}`;

        tarjeta.append(nombre, correo, empresa);
        contenedorDatos.appendChild(tarjeta);
    });
}

function actualizarEstado(mensaje, clase) {
    estadoRed.textContent = mensaje;
    estadoRed.className = clase;
}

btnCargar.addEventListener('click', () => obtenerDatosNetworkFirst());

window.addEventListener('offline', () => {
    obtenerDatosNetworkFirst({ usarCachePrimero: true });
});

window.addEventListener('online', () => {
    obtenerDatosNetworkFirst();
});

obtenerDatosNetworkFirst();
