const estadoPermiso = document.getElementById('estado-permiso');
const btnUbicacion = document.getElementById('btn-ubicacion');
const coordenadasDiv = document.getElementById('coordenadas');
const mapa = document.getElementById('mapa');

const estadosPermiso = {
    granted: 'Concedido',
    denied: 'Denegado',
    prompt: 'Pendiente de autorización'
};

if (!navigator.permissions) {
    estadoPermiso.textContent = 'La API de permisos no está soportada en tu navegador.';
} else {
    navigator.permissions.query({ name: 'geolocation' })
        .then((resultado) => {
            const actualizarEstado = () => {
                estadoPermiso.textContent = estadosPermiso[resultado.state] ?? resultado.state;
            };

            actualizarEstado();
            resultado.addEventListener('change', actualizarEstado);
        })
        .catch(() => {
            estadoPermiso.textContent = 'No se pudo consultar el permiso en este navegador.';
        });
}

btnUbicacion.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
        coordenadasDiv.textContent = 'Tu navegador no soporta la geolocalización.';
        return;
    }

    if (!window.isSecureContext) {
        coordenadasDiv.textContent = 'La geolocalización requiere una conexión segura (HTTPS o localhost).';
        return;
    }

    btnUbicacion.disabled = true;
    coordenadasDiv.textContent = 'Buscando coordenadas...';

    navigator.geolocation.getCurrentPosition(
        (posicion) => {
            const lat = posicion.coords.latitude;
            const lon = posicion.coords.longitude;

            coordenadasDiv.innerHTML = `<strong>Latitud:</strong> ${lat}<br><strong>Longitud:</strong> ${lon}`;

            const urlMapa = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
            mapa.src = urlMapa;
            mapa.style.display = 'block';
            btnUbicacion.disabled = false;
        },
        (error) => {
            const mensajesError = {
                1: 'Permiso de ubicación denegado. Revisa los permisos del navegador.',
                2: 'No se pudo determinar la ubicación. Inténtalo de nuevo.',
                3: 'La solicitud de ubicación tardó demasiado. Inténtalo de nuevo.'
            };

            coordenadasDiv.textContent = mensajesError[error.code] ?? `Error al obtener la ubicación: ${error.message}`;
            btnUbicacion.disabled = false;
        }
    );
});