
self.addEventListener('message', (evento) => {
    if (evento.data?.tipo !== 'MOSTRAR_NOTIFICACION') {
        return;
    }

    const titulo = '¡Hola desde el Service Worker!';
    const opciones = {
        body: 'Esta es una notificación local personalizada. ¡Funciona!',
        icon: './icon.svg',
        vibrate: [200, 100, 200]
    };

    evento.waitUntil(
        self.registration.showNotification(titulo, opciones)
            .then(() => {
                evento.source?.postMessage({ tipo: 'NOTIFICACION_ENVIADA' });
            })
            .catch((error) => {
                console.error('Error al mostrar la notificación:', error);
                evento.source?.postMessage({
                    tipo: 'ERROR_NOTIFICACION',
                    mensaje: error.message
                });
            })
    );
});