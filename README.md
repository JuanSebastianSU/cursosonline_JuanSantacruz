# Plataforma de Cursos Online – `cursosonlinejs`

Sistema web fullstack para la **gestión de cursos online** con soporte para:

- Roles: **Administrador**, **Instructor** y **Alumno**  
- Creación y gestión de cursos, módulos, lecciones y evaluaciones  
- Inscripciones, pagos básicos (simulados), intentos de evaluación y calificaciones  
- Cálculo de progreso del curso  
- Emisión y verificación de **certificados digitales**  

Proyecto desarrollado con:

- **Backend:** Spring Boot (Java), Spring Security, JWT, MongoDB  
- **Frontend:** React, Tailwind CSS, Axios  
- **BD:** MongoDB (local o Atlas)

---

## 1. Objetivo del proyecto

El objetivo de esta aplicación es implementar una plataforma de **gestión de cursos online** que permita:

- A un **Administrador** gestionar usuarios, cursos e inscripciones a nivel global.
- A un **Instructor** crear cursos, organizar contenidos en módulos y lecciones, configurar evaluaciones y revisar el desempeño de sus estudiantes.
- A un **Alumno** inscribirse en cursos, avanzar en los módulos, rendir evaluaciones, ver sus calificaciones y solicitar un certificado digital una vez que apruebe el curso.

Este proyecto sirve como ejemplo completo de:

- Arquitectura **Frontend → Backend → Base de Datos**
- Diseño e implementación de una **API REST** con seguridad basada en **JWT**
- Manejo de **roles y permisos**
- Integración de un frontend moderno en React con un backend en Spring Boot
- Uso de **MongoDB** como base de datos NoSQL

---

## 2. Arquitectura general

### 2.1. Diagrama lógico

Arquitectura monolítica con separación clara entre frontend y backend:

```text
[ Cliente (Navegador) ]
          |
          v
[ Frontend React ]
  - Vite/CRA (Dev server)
  - Axios para llamadas HTTP
          |
          v
[ Backend Spring Boot (API REST) ]
  - Controladores / Servicios
  - Seguridad (JWT, filtros, roles)
          |
          v
[ MongoDB ]
  - Colecciones: usuarios, cursos, módulos, lecciones,
    evaluaciones, inscripciones, intentos, calificaciones,
    certificados, etc.
2.2. Roles de usuario
ADMIN

Gestiona usuarios

Gestiona todos los cursos

Revisa inscripciones de cualquier curso

Puede emitir y revocar certificados de cualquier curso

Accede a panel global de calificaciones

INSTRUCTOR

Crea y gestiona SUS cursos

Crea módulos, lecciones y evaluaciones

Gestiona inscripciones de sus cursos

Revisa intentos de evaluación y califica

Puede emitir certificados para sus alumnos (según reglas)

ALUMNO

Se registra e inicia sesión

Se inscribe en cursos disponibles

Accede al contenido del curso (módulos y lecciones)

Rinde evaluaciones

Visualiza progreso y calificaciones

Solicita su certificado del curso cuando lo aprueba

3. Tecnologías utilizadas
3.1. Backend
Java + Spring Boot

Spring Web (REST)

Spring Data MongoDB

Spring Security (JWT)

MongoDB

Almacenamiento de usuarios, cursos, inscripciones, etc.

JWT (JSON Web Token)

Autenticación y autorización

Otras dependencias típicas:

Lombok (para getters/setters)

Bean Validation (jakarta.validation)

Controladores REST con anotaciones (@RestController, @RequestMapping, etc.)

3.2. Frontend
React

React Router DOM

Axios (consumo de API)

Tailwind CSS (diseño responsivo)

Componentes y páginas personalizadas:

Home, Login, Register, MisCursos, CursoInstructor, CursoAdmin, etc.

3.3. Herramientas de soporte
Git y GitHub

Postman / Insomnia (pruebas de endpoints)

Swagger / OpenAPI (documentación de la API – configurable)

VS Code / IntelliJ / Eclipse para edición de código

4. Estructura del repositorio
Se asume un solo repositorio con frontend y backend:

text
Copiar código
cursosonlinejs/
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/cursosonline/cursosonlinejs/
│       │   ├── Controladores/
│       │   ├── Servicios/
│       │   ├── Entidades/
│       │   ├── Repositorios/
│       │   ├── Seguridad/
│       │   └── CursosonlinejsApplication.java
│       └── main/resources/
│           ├── application.properties (o application.yml)
│           └── ...
└── frontend-cursosonline/
    ├── package.json
    ├── src/
    │   ├── App.jsx / main.jsx
    │   ├── AppRoutes.js
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── cursoService.js
    │   │   ├── moduloService.js
    │   │   ├── leccionService.js
    │   │   ├── evaluacionService.js
    │   │   ├── inscripcionService.js
    │   │   ├── progresoService.js
    │   │   ├── certificadoService.js
    │   │   └── ...
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── MisCursos.jsx
    │   │   ├── CursoInstructor.jsx
    │   │   ├── CursoAdmin.jsx
    │   │   ├── CursoModulosGestion.jsx
    │   │   ├── ModuloLeccionesGestion.jsx
    │   │   ├── LeccionEvaluacionesGestion.jsx
    │   │   ├── EvaluacionTomar.jsx
    │   │   ├── EvaluacionIntentosGestion.jsx
    │   │   ├── CalificacionesInstructor.jsx
    │   │   ├── CalificacionesAdmin.jsx
    │   │   ├── AdminPanel.jsx
    │   │   └── ...
    │   └── components/
    │       ├── ProtectedRoute.jsx
    │       ├── CursoDetalle.jsx
    │       └── ...
    └── tailwind.config.js / vite.config.js / etc.
Ajusta nombres de carpetas según tu proyecto real, pero la idea general se mantiene.

5. Requisitos previos
Java 17+ (o la versión usada por tu Spring Boot)

Maven 3.8+

Node.js 18+ y npm o yarn

MongoDB

Local (por ejemplo: mongodb://localhost:27017/cursosonlinejs)

o MongoDB Atlas

Git

6. Configuración del Backend
6.1. Variables de configuración
En backend/src/main/resources/application.properties (o .yml) se requiere configurar:

properties
Copiar código
# Nombre de la aplicación
spring.application.name=cursosonlinejs

# URI de MongoDB
spring.data.mongodb.uri=mongodb://localhost:27017/cursosonlinejs

# JWT
jwt.secret=TU_SECRETO_SUPER_SEGURO
jwt.issuer=cursosonline-api
jwt.access.ttl.seconds=1800

# (Opcional) CORS / puertos
# server.port=8080
En la práctica, en el proyecto se ha usado algo similar a:

spring.data.mongodb.uri=mongodb+srv://.../cursosOnlineJS

jwt.secret ya definido

jwt.issuer=cursosonline-api

Ajusta según tus credenciales reales.

6.2. Ejecutar el Backend
Desde la carpeta backend/:

bash
Copiar código
mvn clean install
mvn spring-boot:run
El backend normalmente arrancará en:

text
Copiar código
http://localhost:8080
La API REST estará bajo algo como:

text
Copiar código
http://localhost:8080/api/v1/...
(Depende de tu @RequestMapping raíz – en este proyecto se usan rutas del tipo /api/v1/...).

7. Configuración del Frontend
7.1. Configuración de api.js
En frontend-cursosonline/src/services/api.js se suele definir:

javascript
Copiar código
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api/v1", // ajustar según backend
});

// Si usas JWT:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
Asegúrate de que el baseURL coincida con tu backend (/api o /api/v1 según tu configuración real).

7.2. Ejecutar el Frontend
Desde frontend-cursosonline/:

bash
Copiar código
npm install
npm run dev
Por defecto el frontend se levanta en algo tipo:

text
Copiar código
http://localhost:5173
o si usas otro puerto (por ejemplo 9090 según tu configuración de CORS), ajústalo.

8. Autenticación y seguridad
8.1. Flujo de autenticación
El usuario se registra:

Endpoint típico: POST /api/v1/auth/register

Datos: nombre, email, password

Respuesta: datos del usuario + token JWT

El usuario hace login:

Endpoint típico: POST /api/v1/auth/login

Respuesta: token + datos del usuario (rol, id, email, etc.)

El frontend guarda:

token en localStorage

user en localStorage

Configura Authorization: Bearer <token> en Axios

Rutas protegidas en el frontend:

Se usa AuthContext y componentes tipo ProtectedRoute para bloquear acceso si no hay user.

Rutas protegidas en el backend:

Se utilizan anotaciones como @PreAuthorize("hasRole('ADMIN')"),
@PreAuthorize("hasRole('ADMIN') or @cursoPermisos.esDueno(#idCurso)"),
@PreAuthorize("isAuthenticated()"), etc.

También se usan componentes como CertificadoPermisos para validar permisos sobre certificados.

9. Recursos principales y endpoints (resumen)
Nota: Las rutas exactas pueden variar, esto es un resumen orientativo conforme a la estructura del proyecto.

9.1. Autenticación
POST /api/v1/auth/register

POST /api/v1/auth/login

GET /api/v1/auth/me (opcional, según implementación)

9.2. Usuarios / administración
GET /api/v1/usuarios (ADMIN)

GET /api/v1/usuarios/{id} (ADMIN)

PATCH/PUT /api/v1/usuarios/{id} (ADMIN)

(Según tus controladores reales)

9.3. Cursos
GET /api/v1/cursos (público / filtrado)

GET /api/v1/cursos/{id} (público / autenticado)

POST /api/v1/cursos (ADMIN / INSTRUCTOR)

PUT /api/v1/cursos/{id} (ADMIN / instructor dueño)

DELETE /api/v1/cursos/{id} (ADMIN)

GET /api/v1/cursos/{id}/inscripciones (ADMIN / instructor del curso)

9.4. Módulos
Controlador ModuloControlador:

GET /api/v1/cursos/{idCurso}/modulos

Si es alumno, solo ve módulos PUBLICADOS.

Si es ADMIN / instructor del curso, ve todos.

GET /api/v1/cursos/{idCurso}/modulos/{id}

POST /api/v1/cursos/{idCurso}/modulos (crear módulo)

PUT /api/v1/cursos/{idCurso}/modulos/{id} (actualizar)

DELETE /api/v1/cursos/{idCurso}/modulos/{id} (eliminar)

PATCH /api/v1/cursos/{idCurso}/modulos/{id}/publicar

PATCH /api/v1/cursos/{idCurso}/modulos/{id}/archivar

Rutas adicionales para reordenar: /orden, /mover, etc.

9.5. Lecciones y evaluaciones
GET /api/v1/modulos/{idModulo}/lecciones

POST /api/v1/modulos/{idModulo}/lecciones

GET /api/v1/lecciones/{idLeccion}/evaluaciones

POST /api/v1/lecciones/{idLeccion}/evaluaciones

GET /api/v1/evaluaciones/{idEvaluacion}/intentos (instructor)

POST /api/v1/evaluaciones/{idEvaluacion}/intentos (alumno empieza evaluación)

etc.

9.6. Inscripciones
GET /api/v1/inscripciones/mis-cursos (alumno)

POST /api/v1/cursos/{idCurso}/inscribirme (registrar inscripción)

GET /api/v1/cursos/{idCurso}/inscripciones (ADMIN / instructor)

9.7. Progreso
GET /api/v1/progreso/mis-cursos/{idCurso} (alumno logueado)

Devuelve: nota final, aprobadoFinal, detalle de modulos y lecciones.

GET /api/v1/progreso/cursos/{idCurso}/estudiantes/{idEstudiante} (instructor/admin)

9.8. Certificados
Controladores CertificadoAlumnoControlador y CertificadoControlador:

Alumno solicita su certificado:

POST /api/v1/cursos/{idCurso}/mi-certificado

Verifica que:

esté inscrito

se recalcula progreso

el curso esté aprobado

no exista ya un certificado

Instructor/Admin emiten certificado normal:

POST /api/v1/cursos/{idCurso}/certificados

Emisión manual (sin verificar elegibilidad):

POST /api/v1/cursos/{idCurso}/certificados/manual

Ver un certificado:

GET /api/v1/certificados/{id}

Verificar por código:

GET /api/v1/certificados/verificar/{codigo}

Listar por curso:

GET /api/v1/cursos/{idCurso}/certificados

Listar por estudiante:

GET /api/v1/estudiantes/{idEstudiante}/certificados

Revocar:

PATCH /api/v1/certificados/{id}/revocar

Eliminar:

DELETE /api/v1/certificados/{id}

10. Frontend: principales páginas y flujo
10.1. Rutas públicas
/ → página de inicio (Home)

/login → formulario de inicio de sesión

/register → formulario de registro

/cursos → listado de cursos públicos

/cursos/:id → detalle de curso (información, instructor, precio, etc.)

/contacto → página de contacto (informativa)

10.2. Rutas protegidas (usuario logueado)
/perfil → dashboard general del usuario

/mi-perfil → datos personales

/mis-cursos → cursos en los que el alumno está inscrito

Botón “Ir al curso”

Estado de inscripción: EN PROGRESO, COMPLETADO, etc.

/inscripciones/:idInscripcion/pago → pantalla de pago (alumno)

10.3. Rutas de contenido de curso para alumno
/cursos/:idCurso/modulos/:idModulo

Lista de lecciones del módulo

Botones para ir a evaluaciones de cada lección

Panel con el contenido de la lección seleccionada (video, recurso, etc.)

Resumen de progreso y nota del curso (si está implementado)

10.4. Panel de Instructor
/instructor/cursos → listar cursos del instructor

/instructor/cursos/nuevo → crear curso

/instructor/cursos/editar/:id → editar curso

/instructor/cursos/:id/modulos → gestionar módulos

/instructor/modulos/:idModulo/lecciones → gestionar lecciones

/instructor/lecciones/:idLeccion/evaluaciones → gestionar evaluaciones

/instructor/lecciones/:idLeccion/evaluaciones/:idEvaluacion/preguntas → gestionar preguntas

/instructor/evaluaciones/:idEvaluacion/intentos → ver intentos / calificar

/instructor/inscripciones/:idInscripcion/pagos → revisión de pagos

/instructor/calificaciones → panel de calificaciones del instructor

10.5. Panel de Admin
/admin → hub admin

/admin/cursos → gestión global de cursos

/admin/cursos/nuevo → crear curso

/admin/cursos/editar/:id → editar curso

/admin/cursos/:id/inscripciones → inscripciones por curso

/admin/calificaciones → panel global de calificaciones

/admin/usuarios → gestión de usuarios

/admin/inscripciones/:idInscripcion/pagos → revisión de pagos

11. Pruebas
11.1. Colección Postman / Insomnia
Se recomienda (y en este proyecto ya se ha preparado) una colección con:

Auth:

Login

Register

Cursos:

Listar

Crear, editar, eliminar (ADMIN/INSTRUCTOR)

Módulos:

Listar por curso

Crear, editar, publicar, archivar

Lecciones y evaluaciones:

CRUD y asociación a módulos / lecciones

Inscripciones:

Inscribirse a un curso

Listar inscripciones por curso

Progreso:

Ver progreso del curso (alumno)

Certificados:

Solicitar certificado (alumno)

Emitir manual / normal (instructor/admin)

Verificar certificado por código

En el informe se pueden adjuntar capturas de Postman mostrando:

Respuestas 200 OK para pruebas exitosas

Respuestas 401 / 403 cuando falta el token o no hay permisos

11.2. Swagger (OpenAPI)
Se puede habilitar Swagger en el backend para:

Documentar endpoints

Mostrar ejemplos de request/response

Probar rápidamente endpoints en navegador

12. Microservicios (opcional)
Actualmente, la aplicación está implementada como backend monolítico bien estructurado.

Para una evolución futura hacia microservicios, se podrían separar:

Servicio de notificaciones (email/SMS al completar curso)

Servicio de estadísticas (reporte de uso, progreso, etc.)

Servicio de certificados como microservicio independiente

Comunicación posible:

REST síncrono (HTTP)

Asíncrono con colas de mensajes (RabbitMQ, Kafka, etc.)

Este apartado es opcional según la rúbrica.
Aunque no se haya implementado un microservicio separado, la arquitectura actual permite hacerlo en el futuro.

13. Instrucciones rápidas de ejecución
Clonar el repositorio:

bash
Copiar código
git clone https://github.com/tu-usuario/cursosonlinejs.git
cd cursosonlinejs
Configurar y ejecutar el backend:

bash
Copiar código
cd backend
# editar application.properties con tu URI de MongoDB y JWT secret
mvn spring-boot:run
Configurar y ejecutar el frontend:

bash
Copiar código
cd ../frontend-cursosonline
npm install
npm run dev
Abrir el navegador:

Frontend: http://localhost:5173 (o el puerto configurado)

Backend: http://localhost:8080 (API)

14. Manual de usuario (resumen)
14.1. Alumno
Registrarse en la plataforma.

Iniciar sesión.

Explorar cursos disponibles.

Inscribirse en un curso.

Acceder a Mis cursos:

Ver estado de cada curso (En progreso, Completado, etc.).

Ir al contenido del curso (módulos, lecciones, evaluaciones).

Realizar evaluaciones.

Ver sus calificaciones y progreso.

Cuando el curso esté aprobado:

Solicitar certificado (si el botón está disponible en la interfaz).

Ver y/o descargar el certificado.

14.2. Instructor
Iniciar sesión (rol instructor o usuario promovido a instructor).

Crear cursos desde el panel de instructor.

Crear módulos dentro de cada curso.

Crear lecciones y asignar recursos (videos, enlaces, etc.).

Crear evaluaciones y preguntas.

Ver intentos de evaluación, revisar y calificar.

Emitir certificados para estudiantes que han aprobado.

14.3. Administrador
Iniciar sesión (rol ADMIN).

Gestionar usuarios (asignar roles, activar/inactivar).

Gestionar cursos a nivel global.

Ver inscripciones, pagos y calificaciones generales.

Emitir y revocar certificados.

Acceder a paneles de administración y supervisar la plataforma.

15. Futuras mejoras
Implementar microservicios real (notificaciones, analíticas).

Integrar pasarela de pagos real.

Sistema de mensajería interna entre instructor y alumnos.

Descarga de certificados en PDF con plantillas personalizadas.

Internacionalización (multi-idioma).

16. Licencia
(Opcional) Indicar la licencia: MIT, GPL, uso académico, etc.

17. Autoría
Proyecto desarrollado como parte de un trabajo académico de desarrollo de aplicaciones web con API REST y arquitectura cliente-servidor, utilizando:

React (frontend)

Spring Boot (backend)

MongoDB (base de datos)

JWT (autenticación)

GitHub (control de versiones y entrega)

yaml
Copiar código

---

Con este README + tu colección de Postman + Swagger + tu informe, de verdad estás **muy por encima** de lo que pide la rúbrica.

Mañana, cuando vayas a hacer el Swagger y terminar el informe, si quieres, me dices: *“ayúdame a ajustar el README para que coincida exactamente con mis endpoints finales”* y lo afinamos aún más.
::contentReference[oaicite:0]{index=0}