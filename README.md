# Little Bug's Planner - Integración con Firebase

Este proyecto implementa una gestión de usuarios y persistencia de datos utilizando Firebase Authentication y Firestore para la aplicación Little Bug's Planner.

## Características implementadas

- **Autenticación de usuarios**: Registro e inicio de sesión con email y contraseña
- **Persistencia de datos**: Almacenamiento de tareas en Firestore
- **Sincronización en tiempo real**: Los datos se sincronizan automáticamente entre dispositivos
- **Modo offline**: Funcionalidad básica cuando no hay conexión a internet
- **Exportación/Importación de datos**: Posibilidad de exportar e importar datos en formato JSON

## Configuración de Firebase

Para utilizar esta aplicación con Firebase, sigue estos pasos:

1. Crea una cuenta en [Firebase](https://firebase.google.com/) si aún no tienes una
2. Crea un nuevo proyecto en la consola de Firebase
3. Agrega una aplicación web a tu proyecto Firebase
4. Copia la configuración de Firebase que se te proporciona
5. Abre el archivo `firebase-config.js` y reemplaza el objeto `firebaseConfig` con tu configuración:

```javascript
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "tu-messaging-sender-id",
  appId: "tu-app-id",
  measurementId: "tu-measurement-id"
};
```

6. Habilita la autenticación por email/contraseña en la sección "Authentication" de Firebase
7. Crea una base de datos Firestore en la sección "Firestore Database"
8. Configura las reglas de seguridad de Firestore para permitir lectura/escritura solo a usuarios autenticados:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Estructura del proyecto

- **index.html**: Archivo principal de la aplicación
- **firebase-config.js**: Configuración y funciones de Firebase
- **auth.js**: Gestión de autenticación y datos de usuario
- **main.js**: Integración de Firebase con la aplicación existente

## Uso de la aplicación

1. **Registro de usuario**: Haz clic en "Iniciar Sesión" y luego en "Crear Cuenta"
2. **Inicio de sesión**: Introduce tu email y contraseña
3. **Gestión de tareas**: Las tareas se guardarán automáticamente en tu cuenta
4. **Cierre de sesión**: Haz clic en "Salir" para cerrar tu sesión

## Ventajas de esta solución

- **Gratuito para uso básico**: Firebase ofrece un plan gratuito generoso
- **Escalable**: Si la aplicación crece, puede escalar fácilmente
- **Seguro**: La autenticación y las reglas de seguridad protegen los datos
- **Multiplataforma**: Funciona en cualquier dispositivo con un navegador
- **Sin necesidad de backend propio**: Firebase proporciona toda la infraestructura necesaria

## Limitaciones del plan gratuito de Firebase

- 50,000 lecturas diarias de Firestore
- 20,000 escrituras diarias de Firestore
- 20,000 eliminaciones diarias de Firestore
- 1GB de almacenamiento en Firestore
- 10GB de transferencia de datos mensual

Estas limitaciones son más que suficientes para un uso personal o para un grupo pequeño de usuarios.

## Alternativas consideradas

- **LocalStorage**: Más simple pero limitado al navegador local
- **GitHub OAuth + GitHub API**: Requiere más configuración y tiene límites de API
- **Backend personalizado**: Requiere hosting adicional y mantenimiento

## Soporte

Si encuentras algún problema o tienes alguna pregunta, por favor abre un issue en este repositorio.