const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const btnIniciar = document.getElementById('btn-iniciar');
const btnDetener = document.getElementById('btn-detener');
const btnCapturar = document.getElementById('btn-capturar');
const mensaje = document.getElementById('mensaje');

const contexto = canvas.getContext('2d');
let flujoCamara = null;

btnIniciar.addEventListener('click', async () => {
    if (!window.isSecureContext) {
        mensaje.textContent = 'El acceso a la cámara requiere una conexión segura (HTTPS o localhost).';
        return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
        mensaje.textContent = 'Tu navegador no soporta el acceso a la cámara.';
        return;
    }

    btnIniciar.disabled = true;
    mensaje.textContent = 'Solicitando acceso a la cámara...';

    try {
        flujoCamara = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        video.srcObject = flujoCamara;
        await video.play();

        if (!video.videoWidth || !video.videoHeight) {
            throw new Error('La cámara no proporcionó un tamaño de video válido.');
        }

        btnCapturar.disabled = false;
        btnDetener.disabled = false;
        mensaje.textContent = 'Cámara encendida correctamente.';
    } catch (error) {
        flujoCamara?.getTracks().forEach((pista) => pista.stop());
        flujoCamara = null;
        video.srcObject = null;
        btnIniciar.disabled = false;
        btnCapturar.disabled = true;

        const mensajesError = {
            NotAllowedError: 'Se denegó el permiso para usar la cámara. Revisa los permisos del navegador.',
            NotFoundError: 'No se encontró una cámara disponible en este dispositivo.',
            NotReadableError: 'La cámara está siendo usada por otra aplicación o no está disponible.'
        };
        mensaje.textContent = mensajesError[error.name] ?? `No se pudo iniciar la cámara: ${error.message}`;
    }
});

btnDetener.addEventListener('click', () => {
    flujoCamara?.getTracks().forEach((pista) => pista.stop());
    flujoCamara = null;
    video.srcObject = null;
    btnIniciar.disabled = false;
    btnDetener.disabled = true;
    btnCapturar.disabled = true;
    mensaje.textContent = 'Cámara apagada.';
});

btnCapturar.addEventListener('click', () => {
    if (!contexto) {
        mensaje.textContent = 'No se pudo preparar el canvas para la fotografía.';
        return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
        mensaje.textContent = 'La cámara todavía no está lista. Inténtalo de nuevo en un momento.';
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    mensaje.textContent = '¡Fotografía capturada en el canvas!';
});