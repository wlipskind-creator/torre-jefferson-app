// Configuración de la app Torre Jefferson (piloto).
// Los datos de firebaseConfig son públicos por diseño: la seguridad la dan las reglas de Firestore.
window.TJ_CONFIG = {
  firebaseConfig: {
    apiKey: "AIzaSyDvFLC_L0rQEuilg7H5viuHQZ1ugXunSdQ",
    authDomain: "torre-jefferson.firebaseapp.com",
    projectId: "torre-jefferson",
    storageBucket: "torre-jefferson.firebasestorage.app",
    messagingSenderId: "1042107525755",
    appId: "1:1042107525755:web:c69d063fbc39cf9bec50de"
  },
  // Código común para la prueba (mínimo 6 caracteres). Cambiarlo antes de abrir la app a todos.
  codigoPrueba: "Torre2026",
  // Dominio interno para armar los usuarios (no se envían correos).
  dominio: "torrejefferson.app",
  telefonoRecepcion: "[TELÉFONO DE RECEPCIÓN]",
  // Videos: requieren el plan Blaze de Firebase. Cambiar a true cuando esté activado Storage.
  videos: false
};
