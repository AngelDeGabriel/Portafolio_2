const btnPermiso = document.getElementById('btn-permiso');
const btnNotificar = document.getElementById('btn-notificar');
const estadoPermiso = document.getElementById('estado-permiso');

const estadosPermiso = {
    granted: 'Concedido',
    denied: 'Denegado',
    default: 'Pendiente de autorización'
};

let serviceWorkerListo = false;

const actualizarInterfaz = () => {
    const permisoConcedido = Notification.permission === 'granted';
    estadoPermiso.textContent = estadosPermiso[Notification.permission] ?? Notification.permission;
    btnPermiso.disabled = permisoConcedido;
    btnNotificar.disabled = !permisoConcedido || !serviceWorkerListo;
};

if (!window.isSecureContext) {
    estadoPermiso.textContent = 'Se requiere HTTPS o localhost.';
    btnPermiso.disabled = true;
    btnNotificar.disabled = true;
} else if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    estadoPermiso.textContent = 'Tu navegador no soporta notificaciones o Service Workers.';
    btnPermiso.disabled = true;
    btnNotificar.disabled = true;
} else {
    actualizarInterfaz();

    navigator.serviceWorker.register('./sw.js')
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
            serviceWorkerListo = true;
            actualizarInterfaz();
        })
        .catch((error) => {
            console.error('Error al registrar o activar el Service Worker:', error);
            estadoPermiso.textContent = 'No se pudo iniciar el Service Worker.';
            btnPermiso.disabled = true;
            btnNotificar.disabled = true;
        });

    navigator.serviceWorker.addEventListener('message', (evento) => {
        if (evento.data?.tipo === 'NOTIFICACION_ENVIADA') {
            estadoPermiso.textContent = 'Notificación enviada correctamente.';
            btnNotificar.disabled = false;
        } else if (evento.data?.tipo === 'ERROR_NOTIFICACION') {
            console.error('Error al mostrar la notificación:', evento.data.mensaje);
            estadoPermiso.textContent = `No se pudo mostrar la notificación: ${evento.data.mensaje}`;
            btnNotificar.disabled = false;
        }
    });

    btnPermiso.addEventListener('click', async () => {
        btnPermiso.disabled = true;
        try {
            const resultado = await Notification.requestPermission();
            actualizarInterfaz();
            if (resultado !== 'granted') {
                estadoPermiso.textContent = resultado === 'denied'
                    ? 'Permiso denegado. Puedes cambiarlo en la configuración del navegador.'
                    : 'No se concedió el permiso de notificaciones.';
            }
        } catch (error) {
            console.error('Error al solicitar permiso de notificaciones:', error);
            estadoPermiso.textContent = 'No se pudo solicitar el permiso de notificaciones.';
            btnPermiso.disabled = false;
        }
    });

    btnNotificar.addEventListener('click', async () => {
        if (Notification.permission !== 'granted' || !serviceWorkerListo) {
            actualizarInterfaz();
            return;
        }

        btnNotificar.disabled = true;
        estadoPermiso.textContent = 'Enviando notificación...';

        try {
            const registro = await navigator.serviceWorker.ready;
            if (!registro.active) {
                throw new Error('El Service Worker no está activo.');
            }
            registro.active.postMessage({ tipo: 'MOSTRAR_NOTIFICACION' });
        } catch (error) {
            console.error('Error al enviar la solicitud al Service Worker:', error);
            estadoPermiso.textContent = `No se pudo enviar la notificación: ${error.message}`;
            btnNotificar.disabled = false;
        }
    });
}
