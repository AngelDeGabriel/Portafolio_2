const inputTexto = document.getElementById('input-texto');
const btnGuardar = document.getElementById('btn-guardar');
const listaRegistros = document.getElementById('lista-registros');
const estado = document.getElementById('estado');
const nombreBase = 'MiBaseDeDatosLocal';
const nombreAlmacen = 'registros';

let db = null;
btnGuardar.disabled = true;
inputTexto.disabled = true;
estado.textContent = 'Abriendo la base de datos local...';

if (!('indexedDB' in window)) {
    estado.textContent = 'Tu navegador no soporta IndexedDB.';
} else {
    const peticion = indexedDB.open(nombreBase, 1);

    peticion.onupgradeneeded = (evento) => {
        const base = evento.target.result;
        const objectStore = base.objectStoreNames.contains(nombreAlmacen)
            ? evento.target.transaction.objectStore(nombreAlmacen)
            : base.createObjectStore(nombreAlmacen, { keyPath: 'id', autoIncrement: true });

        if (!objectStore.indexNames.contains('texto')) {
            objectStore.createIndex('texto', 'texto', { unique: false });
        }
    };

    peticion.onsuccess = (evento) => {
        db = evento.target.result;
        db.onversionchange = () => {
            db.close();
            db = null;
            btnGuardar.disabled = true;
            inputTexto.disabled = true;
            estado.textContent = 'La base de datos cambió en otra pestaña. Recarga esta página.';
        };
        btnGuardar.disabled = false;
        inputTexto.disabled = false;
        estado.textContent = 'Base de datos lista. Tus registros se guardan en este dispositivo.';
        consultarRegistros();
    };

    peticion.onerror = () => {
        estado.textContent = `No se pudo abrir la base de datos: ${peticion.error?.message ?? 'error desconocido'}`;
    };

    peticion.onblocked = () => {
        estado.textContent = 'Cierra otras pestañas que estén usando esta base de datos y vuelve a cargar.';
    };
}

btnGuardar.addEventListener('click', guardarRegistro);
inputTexto.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') {
        guardarRegistro();
    }
});

function guardarRegistro() {
    const texto = inputTexto.value.trim();
    if (!db) {
        estado.textContent = 'La base de datos todavía no está disponible.';
        return;
    }
    if (!texto) {
        estado.textContent = 'Escribe un texto antes de guardar.';
        inputTexto.focus();
        return;
    }

    btnGuardar.disabled = true;
    estado.textContent = 'Guardando registro...';

    try {
        const transaccion = db.transaction(nombreAlmacen, 'readwrite');
        transaccion.objectStore(nombreAlmacen).add({ texto });
        transaccion.oncomplete = () => {
            inputTexto.value = '';
            btnGuardar.disabled = false;
            estado.textContent = 'Registro guardado en este dispositivo.';
            consultarRegistros();
        };
        transaccion.onabort = () => {
            btnGuardar.disabled = false;
            estado.textContent = `No se pudo guardar el registro: ${transaccion.error?.message ?? 'transacción cancelada'}`;
        };
    } catch (error) {
        btnGuardar.disabled = false;
        estado.textContent = `No se pudo guardar el registro: ${error.message}`;
    }
}

function consultarRegistros() {
    if (!db) return;

    try {
        const transaccion = db.transaction(nombreAlmacen, 'readonly');
        const peticion = transaccion.objectStore(nombreAlmacen).getAll();

        peticion.onsuccess = () => {
            listaRegistros.replaceChildren();
            if (peticion.result.length === 0) {
                const vacio = document.createElement('p');
                vacio.textContent = 'No hay registros. Escribe algo arriba.';
                listaRegistros.appendChild(vacio);
                return;
            }

            peticion.result.forEach((registro) => {
                const div = document.createElement('div');
                div.className = 'registro';

                const span = document.createElement('span');
                span.textContent = registro.texto;

                const btnEliminar = document.createElement('button');
                btnEliminar.textContent = 'Eliminar';
                btnEliminar.className = 'btn-eliminar';
                btnEliminar.setAttribute('aria-label', `Eliminar registro: ${registro.texto}`);
                btnEliminar.addEventListener('click', () => eliminarRegistro(registro.id));

                div.append(span, btnEliminar);
                listaRegistros.appendChild(div);
            });
        };
        peticion.onerror = () => {
            estado.textContent = `No se pudieron consultar los registros: ${peticion.error?.message ?? 'error desconocido'}`;
        };
    } catch (error) {
        estado.textContent = `No se pudieron consultar los registros: ${error.message}`;
    }
}

function eliminarRegistro(id) {
    if (!db) {
        estado.textContent = 'La base de datos no está disponible.';
        return;
    }

    try {
        const transaccion = db.transaction(nombreAlmacen, 'readwrite');
        transaccion.objectStore(nombreAlmacen).delete(id);
        transaccion.oncomplete = () => {
            estado.textContent = 'Registro eliminado.';
            consultarRegistros();
        };
        transaccion.onabort = () => {
            estado.textContent = `No se pudo eliminar el registro: ${transaccion.error?.message ?? 'transacción cancelada'}`;
        };
    } catch (error) {
        estado.textContent = `No se pudo eliminar el registro: ${error.message}`;
    }
}
