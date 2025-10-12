CursosOnlineJS – Backend (Spring Boot + MongoDB Atlas)

Este backend implementa la lógica de una plataforma de cursos en línea con usuarios, cursos, módulos, lecciones, evaluaciones, intentos, calificaciones, inscripciones, pagos y certificados. Está construido con Spring Boot, Spring Security (JWT + @PreAuthorize), y MongoDB (con tipos Decimal128 para importes/puntajes y optimistic locking con @Version).

A continuación se presenta cómo conectarse a MongoDB Atlas, cómo configurar JWT, cómo funciona la seguridad por roles/tipos y permisos, las restricciones por entidad, cómo consumir los endpoints (tipos de datos, cabeceras, estados), y varios flujos de negocio clave.

1) Requisitos previos

Java 17+

Maven (o Gradle si tu proyecto lo usa; los ejemplos asumen Maven)

Una cuenta y cluster en MongoDB Atlas

Un cliente HTTP (cURL, Postman, etc.)

2) Configuración de entorno

Crea un archivo application.properties (o application.yml) con las variables mínimas:

# === MongoDB Atlas ===
spring.data.mongodb.uri=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/<baseDeDatos>?retryWrites=true&w=majority

# === JWT ===
jwt.secret=CAMBIA_ESTE_SECRETO_DE_32+_BYTES_MINIMO
jwt.issuer=cursosonline-api
jwt.access.ttl.seconds=1800  # 30 minutos

# puerto - opcional
server.port=8080

2.1 Conexión a MongoDB Atlas paso a paso

En Atlas, crea un Cluster de plan gratis vale para desarrollo.

Crea un Database User con nombre y contraseña.

En Network Access, agrega tu IP o permite acceso desde cualquier lugar (solo para pruebas).

Copia el Connection String tipo MongoDB+SRV e introdúcelo como valor de spring.data.mongodb.uri.
Ejemplo:

mongodb+srv://appuser:SuperPassw0rd@cluster0.xxxxx.mongodb.net/cursosonline


Verifica que la base (CursosOnlineJS) exista o que Spring la cree al arrancar.

Precisión de decimales: Este proyecto mapea importes y puntajes como Decimal128 en Mongo (@Field(targetType = FieldType.DECIMAL128)) y BigDecimal en Java. En JSON puedes enviar números decimales normales (o strings si prefieres), y Spring los deserializa a BigDecimal con precisión.


Se debe tener en cuenta algunos aspectos, al momento de seleccionar el link de unión debe seleccionar el del ID o plataforma que esté usando en este caso se escogió el link de conexión para VisualStudioCode, una vez creada la conexión el primer paso es crear un usuario, hay tres tipos de usuarios ADMIN, INSTRUCTOR y USUARIO. Se debe tener en cuenta que el unico usuario con acceso a todos y cada uno de los campos es ADMIN, instructor tiene muchos permisos y usuario tene los permisos generales de listado, incripción, intentos, pago, etc. No tiene efecto lo que se ponga en el campo ROL en el cuerpo JSON el usuario se creará por defecto como USUARIO, si lo que desea es crear un usuario ADMIN, copie esta estructura exacta. 

{
  "nombre": "ADMIN admin",
  "email": "admin@acceso.com",
  "password": "Secreto123",
  "rol": "ADMIN"
}

Así el sistema le permitirá crear un usuario ADMIN, toda la API tiene restricciones y reglas que no pueden romperse como por ejemplo si un USUARIO crea un curso se convierte en INSTRUCTOR, si este quiere realiar cambios en CURSO, MODULOS, LECCIONES o EVALUACIONES, no podrá hacerlo a no ser que ponga el curso en estado BORRADOR o ARCHIVADO, pues una vez esté en PUBLICADO los usuarios normales podrán interactuar con el y realizar inscripciones consumir lecciones, evaluaciones, intentos y realizar pagos, si el curso está archivado o en borrador, siendo un USUARIO, no se puede interacturar con curso, modulos, lecciones, evaluaciones, intentos, pagos, pero si está el curso PUBLICADO y algún módulo archivado o en borrador el USUARIO no podrá interaccionar con modulo, lecciones, evaluaciones, intentos, pero si se puede inscribir al curso y realizar pagos pues el curso está publicado lo que no está publicado es el módulo, si se archiva o pone en borrador una lección, no puede interactuar con la misma, ni con evaluaciones, ni realizar intentos, pero si solo está archivada o en borrador una evaluacion, si puede interacturar con todo menos evaluacion e intento, y finalmente si nada está archivado o en borrador puede interactuar con todo menos la emision de certificados que depende el instructor o ADMIN, solo el INSTRUCTOR creador del curso (además del ADMIN), puede modificar aspectos de su curso, el listado d elos datos de los usuarios y datos sensibles está limitado al ADMIN, y solo el USUARIO que está realizando el pago para la inscripción (además del ADMIN) puede interactuar con el proceso de pago para dicha inscripción.

El usuario no puede acceder a los modulos, lecciones o evaluaciones si el pago no está en estado APROBADO, el USUARIO puede empezar el pago, luego puede autorizar el pago, y finalmente el INSTRUCTOR o ADMIN ponen el pago en estado APROBADO, es ahí cuando el USUARIO puede acceder a los recursos del curso. 

Hay controles para evitar repetir los usuarios e email's, los datos son autoactualizables, es decir por ejemplo un USUARIO crea un curso, ese curso en un inicio no tiene modulos, lecciones, nada, pero apenas cree un modulo y vuelva a listar al curso se verá como ahora si aparece el modulo que contiene el curso y lleva contadores de modulos y lecciones, y así para modulos, lecciones, evaluaciones, intentos, pagos, etc. Todas las entidades se van actualizando entre si.  

2.2 CORS

El backend expone CORS para http://localhost:9090 y permite credenciales:

registry.addMapping("/**")
        .allowedOriginPatterns("http://localhost:9090")
        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);


Si tu front corre en otro origen, actualiza allowedOriginPatterns.

3) Seguridad y autenticación
3.1 Filtros y esquema

JWT: JwtFilter inspecciona el header Authorization: Bearer <token>, valida el token con JWTService y autentica al usuario en el SecurityContext.

Rutas públicas (según SecurityConfig):

POST /api/auth/login y POST /api/auth/register

GET /api/tipousuario/**

GET /api/v1/cursos/*/modulos y GET /api/v1/cursos/*/modulos/** (lectura pública de módulos de un curso)

GET /api/v1/certificados/verificar/**

OPTIONS /** (preflight CORS)

Resto de rutas: requieren autenticación. Las reglas finas se aplican con @PreAuthorize y beans de permisos.

Nota: httpBasic está habilitado (útil para admin con credenciales de la BD en escenarios puntuales), pero el flujo normal es JWT.

3.2 JWT (contenido y validación)

El token incluye:

sub: email del usuario (username)

uid: id interno del usuario

roles: arreglo (p. ej. ["ROLE_ADMIN"] o ["ROLE_INSTRUCTOR"])

iss, iat, exp, jti

Requisitos:

jwt.secret debe tener 32+ bytes (HS256).

jwt.access.ttl.seconds controla la caducidad.

3.3 Tipos de usuario y autoridades

Entidad TipoUsuario (colección tipos_usuario):

Campo nombre único (e.g., ADMIN, Instructor, Usuario)

system: tipos de sistema (p. ej. ADMIN) no eliminables

isDefault: solo uno puede ser default

Reglas del servicio:

No se puede renombrar ni marcar como default a ADMIN

Si marcas un tipo como default, se quita esa marca al que la tuviera

Entidad Usuario:

Campo rol (texto). CustomUserDetailServicio mapea los roles a authorities:

rol → mayúsculas, reemplaza espacios por _, y prefija ROLE_.

Ej.: "Instructor" → ROLE_INSTRUCTOR, "ADMIN" → ROLE_ADMIN.

Restricción de cambios de rol: los endpoints de usuario no permiten actualizar rol mediante PUT/PATCH (se lanza ROL_UPDATE_NOT_ALLOWED). Los cambios de rol deben gestionarse en un flujo separado (administrativo).

3.4 Beans de permisos (@PreAuthorize)

El proyecto usa varias clases *Permisos para encapsular lógica de autorización basada en propiedad (dueño), rol y cadena de pertenencia:

CursoPermisos: valida si un usuario es autor del curso y si el curso es editable (no PUBLICADO).

LeccionPermisos, EvaluacionPermisos, IntentoPermisos: validan propiedad/visibilidad (curso/módulo/lección no ARCHIVADO, evaluación PUBLICADA, etc.) y si el estudiante está inscrito con acceso.

InscPermisos: verifica si el usuario es instructor del curso o la inscripción es suya.

PagoPermisos: dueño de la inscripción/pago o instructor del curso asociado.

CalificacionPermisos y CertificadoPermisos: lecturas/escrituras sujetas a dueño (estudiante), instructor del curso o admin.

Estas verificaciones aparecen en controladores con expresiones del tipo:

@PreAuthorize("hasRole('ADMIN') or @pagoPermisos.esInstructorDeInscripcion(#idInscripcion) or @pagoPermisos.esDuenoDeInscripcion(#idInscripcion)")

4) Modelo de datos (resumen con reglas importantes)

General: muchas entidades usan @Version (optimistic locking), @CreatedDate y @LastModifiedDate. Varias usan índices compuestos para búsquedas rápidas o unicidad lógica.

4.1 Curso (cursos)

Estados: BORRADOR, PUBLICADO, OCULTO, ARCHIVADO.

Publicación: publishedAt.

Contadores snapshot: modulosCount, leccionesCount, inscritosCount (reconstruibles).

Precio: precio, precioLista (Decimal128), moneda ISO-4217.

Idioma: ISO (es, es-EC, en).

Índices: slug único, por estado/categoria/publishedAt, y (instructor, título) único.

Reglas clave:

Solo no PUBLICADO es editable.

CursoServicio recalcula contadores y snapshots al cambiar módulos/lecciones/inscripciones.

4.2 Módulo (modulos)

Estados: BORRADOR, PUBLICADO, ARCHIVADO.

(curso, título) único, (curso, orden) único.

Reordenamientos con swap si es necesario; no reordenar si está PUBLICADO.

4.3 Lección (lecciones)

Estados: BORRADOR, PUBLICADO, ARCHIVADO.

Tipos: VIDEO, ARTICULO, QUIZ.

(módulo, título) único; (módulo, orden) único.

Mantiene evaluaciones publicadas (ids) sincronizadas desde EvaluacionServicio.

No se puede editar si está PUBLICADO (archivar primero).

4.4 Evaluación (evaluaciones)

Tipos: QUIZ, TAREA, EXAMEN.

Estados publicación: BORRADOR, PUBLICADA, ARCHIVADA.

puntajeMaximo, notaAprobatoria (Decimal128).

Ventanas (disponibleDesde/Hasta), dueAt, tardanza con penalización opcional.

Al guardar:

En creación: copia idModulo/idCurso de la lección.

En actualización: no permite cambiar de lección.

Publicar/archivar actualiza la lista de evaluaciones publicadas en la lección.

4.5 Intento (intentos)

Estados: EN_PROGRESO, ENVIADO, CALIFICADO, EXPIRADO, ANULADO.

(evaluación, estudiante, nroIntento) único.

timeLimitSeconds y usedTimeSeconds. Se valida no exceder el límite.

Detalle de respuestas por pregunta con puntajes (Decimal128).

Entregar un intento cambia a ENVIADO y sella enviadoEn.

4.6 Calificación (calificaciones)

Una por intento (idIntento único).

Estados: PENDIENTE, EN_REVISION, PUBLICADA, ANULADA.

Guarda puntaje, puntajeMaximo, porcentaje, notaCorte, aprobado, feedback.

Bloqueo de calificar si la cadena curso/módulo/lección/evaluación está ARCHIVADA.

Publicar sella calificadoAt.

4.7 Inscripción (inscripciones)

Estados: PENDIENTE_PAGO, ACTIVA, SUSPENDIDA, COMPLETADA, CANCELADA, EXPIRADA.

Ventana de acceso (accessStartAt/EndAt, accesoVitalicio).

Progreso (progresoPct, leccionesCompletadas, lastAccessAt).

Pagos enlazados: idPago (principal) y pagoIds (histórico).

Idempotencia: idempotencyKey único (sparse).

Puede enlazar certificado (certificadoId) y notaFinal/aprobadoFinal.

4.8 Pago (pagos)

Estados: PENDIENTE, AUTORIZADO, APROBADO, CAPTURADO, FALLIDO, REEMBOLSADO, CANCELADO.

Método: TARJETA, TRANSFERENCIA, PAYPAL, STRIPE, EFECTIVO, MERCADOPAGO.

Importes Decimal128 (monto, subtotal, impuestos, comisiones, descuento), moneda ISO-4217.

Idempotencia: idempotencyKey único (sparse).

Flujo:

Borrador PENDIENTE (editable por dueño).

Aceptar (usuario) → AUTORIZADO.

Aprobar/Capturar (pasarela/admin/instructor) → sella pagadoAt, enlaza a inscripción y activa si estaba PENDIENTE_PAGO.

FALLIDO, CANCELADO, REEMBOLSADO con reglas de transición claras.

4.9 Certificado (certificados)

Estados: EMITIDO, REVOCADO.

Unicidad: (curso, estudiante) único; codigoVerificacion único.

Snapshots: nombres de curso, instructor y estudiante.

Al emitir, enlaza con la inscripción (InscripcionServicio.vincularCertificado).

4.10 TipoUsuario y Usuario

Ya detallados en 3.3 y 3.4.

Usuario guarda métricas de seguridad (emailVerified, failedLoginAttempts, lockedUntil, passwordUpdatedAt, mfaEnabled) para futuras políticas.

5) Convenciones de API
5.1 Formato y cabeceras

Content-Type: application/json

En peticiones con números monetarios/puntajes envía decimales en JSON (ej. 123.45). Spring los convierte a BigDecimal.

Validación con Jakarta Validation (@NotNull, @NotBlank, @Positive, etc.). Errores típicos → 400 Bad Request con un mensaje.

401 si no hay autenticación, 403 si no hay permisos, 404 cuando el recurso no existe, 409 para conflictos de estado (p. ej. borrar un pago que ya no está PENDIENTE).

5.2 Paginación y búsqueda

TipoUsuarioControlador expone /api/tipousuario con:

GET ?q=<texto>&page=<n>&size=<m>&sort=<campo,asc|desc>

Por defecto: size=20, sort por nombre.

La búsqueda usa regex case-insensitive.

Otros controladores de listado pueden exponer paginación y filtros según su propia firma (no todos se mostraron aquí).

5.3 Ejemplos de endpoints destacables

Autenticación (público – controlador no mostrado aquí, pero la seguridad lo permite):

POST /api/auth/login → recibe credenciales, devuelve JWT.

POST /api/auth/register → alta de usuario.

Tipo de Usuario (/api/tipousuario):

GET /api/tipousuario (público, paginado).

GET /api/tipousuario/{id} (público).

POST /api/tipousuario (ADMIN).

PUT /api/tipousuario/{id} (ADMIN).

DELETE /api/tipousuario/{id} (ADMIN).

Usuarios (/api/usuarios – ADMIN):

GET /api/usuarios → lista todos.

GET /api/usuarios/{id}

PUT /api/usuarios/{id} (no cambia rol)

PATCH /api/usuarios/{id} (no cambia rol)

PATCH /api/usuarios/{id}/estado → body { "estado": "ACTIVO|INACTIVO|SUSPENDIDO" }

PATCH /api/usuarios/{id}/password (ADMIN o el mismo usuario mediante @seguridadUtil.esMismoUsuario(#id))

DELETE /api/usuarios/{id}

Pagos (propietario/instructor/admin) – base /api/v1/inscripciones/{idInscripcion}/pagos:

GET / → lista de pagos de la inscripción (admin, instructor del curso, o dueño de la inscripción).

GET /{id} → valida que el pago pertenezca a esa inscripción.

POST /borrador → crear borrador (dueño de la inscripción). Body:

{
  "monto": 100.00,
  "moneda": "USD",
  "metodo": "TARJETA",
  "referencia": "OP-123",
  "cupon": "PROMO10",
  "gateway": "stripe",
  "idempotencyKey": "uniq-123"
}


PATCH /{id} → editar borrador (PENDIENTE).

POST /{id}/checkout → aceptar (dueño) → AUTORIZADO.

DELETE /{id} → elimina si PENDIENTE.

Aprobar (admin o instructor del curso):
POST /{id}/aprobar → APROBADO, activa inscripción si estaba PENDIENTE_PAGO y recalcula inscritosCount.

Certificados (seguridad por CertificadoPermisos):

Verificación pública por código: GET /api/v1/certificados/verificar/** (público – no incluido aquí, pero seguridad lo permite).

Emisión/Revocación/Listados: restringidos a instructor del curso, dueño del certificado o admin, según el caso.

Cursos/Módulos/Lecciones/Evaluaciones/Intentos/Calificaciones

No todos los controladores están en el extracto, pero las reglas están en servicios + permisos:

Editar curso solo si no PUBLICADO.

Editar/reordenar módulo/lección solo si no PUBLICADO (archivar primero).

Evaluaciones: publicar/archivar gestiona qué ve el alumno.

Intentos: el estudiante puede crear/editar un intento EN_PROGRESO; entregar lo pasa a ENVIADO.

Calificar: crea una calificación por intento, bloqueada si cadena archivada; publicar sella fecha.

6) Flujos de negocio (de alto nivel)
6.1 Publicación de contenido

El instructor crea curso (BORRADOR) → módulos (BORRADOR) → lecciones (BORRADOR).

Al publicar módulos/lecciones/evaluaciones, se actualizan snapshots (listas, contadores).

Un curso PUBLICADO deja de ser editable (debes archivar para cambios de estructura).

6.2 Inscripción y acceso

Un curso PUBLICADO y con ventana abierta acepta inscripciones (si hay cupo).

La inscripción inicia típicamente en PENDIENTE_PAGO.

Al aprobar/capturar un pago, la inscripción puede pasar a ACTIVA (y se recalcula inscritosCount).

6.3 Evaluaciones → Intentos → Calificaciones

El alumno (con acceso) ve evaluaciones PUBLICADAS y crea intentos (se controla tiempo e intentos).

Un intento EN_PROGRESO puede editarse; entregar lo pasa a ENVIADO.

El instructor califica (una calificación por intento). Publicar la calificación sella calificadoAt.

6.4 Certificación

Elegible si la inscripción está COMPLETADA o aprobadoFinal=true.

Emitir genera codigoVerificacion único, guarda snapshots (nombres), y vincula el certificado a la inscripción.

El instructor puede revocar.

7) Tipos de datos y validaciones (práctico)

Importes/Puntajes: JSON con números decimales (ej. 123.45). Java recibe BigDecimal. Mongo guarda Decimal128.

Monedas: 3 letras mayúsculas ISO-4217 (regex ^[A-Z]{3}$), p. ej. USD.

Idioma: ^[a-z]{2}(-[A-Z]{2})?$ (ej. es, es-EC).

Campos obligatorios: anotados con @NotBlank, @NotNull, etc. Ej.:

Curso.titulo, Curso.categoria, Curso.idInstructor

Pago.monto, Pago.moneda, Pago.metodo

Estados: envía las cadenas esperadas (o usa los enums en cuerpos donde aplique). Si envías un estado inválido se devuelve 400 o lista vacía según el contexto.

8) Errores y conflictos típicos

400 Bad Request: validaciones (monto ≤ 0, moneda vacía, nivel/estado inválidos, etc.).

401 Unauthorized: falta token/credenciales.

403 Forbidden: no pasas las reglas de @PreAuthorize y beans de permisos.

404 Not Found: recurso no existe o no pertenece al path (p. ej., pago que no es de esa inscripción).

409 Conflict: conflicto de estado (e.g., eliminar pago que no está PENDIENTE).

9) Ejemplos rápidos (cURL)

Login (ejemplo conceptual; el controlador no se mostró, pero la seguridad lo permite):

curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"********"}'
# → { "token": "eyJhbGciOi..." }


Listar tipos de usuario (público):

curl "http://localhost:8080/api/tipousuario?q=ins&size=10"


Crear pago borrador (dueño de inscripción):

curl -X POST "http://localhost:8080/api/v1/inscripciones/INSCR_ID/pagos/borrador" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "monto": 99.90,
        "moneda": "USD",
        "metodo": "TARJETA",
        "referencia": "OP-2024-0001",
        "idempotencyKey": "user123-INSCR_ID-OP-2024-0001"
      }'


Aprobar pago (instructor del curso o admin):

curl -X POST "http://localhost:8080/api/v1/inscripciones/INSCR_ID/pagos/PAGO_ID/aprobar" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"gatewayPaymentId":"gw_abc123","authorizationCode":"AUTH-999"}'

10) Construcción y ejecución
10.1 Local
mvn clean spring-boot:run
# o
mvn clean package
java -jar target/cursosonline-0.0.1-SNAPSHOT.jar


Asegúrate de tener setadas las variables de entorno o application.properties con:

spring.data.mongodb.uri

jwt.secret (32+ bytes)

jwt.issuer

jwt.access.ttl.seconds

10.2 Consideraciones de despliegue

JWT secret: manejarlo como secreto (ENV/Secret Manager).

CORS: ajusta allowedOriginPatterns al dominio del front de producción.

Índices: los @CompoundIndex y @Indexed ayudan, pero en producción conviene revisar explain() y cardinalidades reales.

Decimal128: evita convertir montos a double; usa siempre BigDecimal.

## 🔒 11) Matriz de permisos (resumen)

| Recurso / Acción                                  | Dueño (Estudiante)                              | Instructor del Curso                          | ADMIN |
|---------------------------------------------------|-------------------------------------------------|-----------------------------------------------|--------|
| Ver pagos de una inscripción                      | ✔️ (suya)                                       | ✔️                                            | ✔️     |
| Crear / editar / eliminar borrador de pago        | ✔️                                              | ❌                                            | ✔️ (vía admin si procede) |
| Aceptar pago (checkout)                           | ✔️                                              | ❌                                            | ✔️     |
| Aprobar / Capturar pago                           | ❌                                              | ✔️                                            | ✔️     |
| Ver / emitir / revocar certificado                | Dueño: ver                                      | ✔️ (emitir / revocar / ver)                   | ✔️     |
| Crear / editar curso                              | N/A                                             | ✔️ (si curso no PUBLICADO)                    | ✔️     |
| Publicar / archivar módulo, lección o evaluación  | ❌                                              | ✔️                                            | ✔️     |
| Intentos (crear / editar en progreso, entregar)   | ✔️ (si inscrito y visible)                      | ❌                                            | ✔️ (operaciones administrativas) |
| Calificar intento                                 | ❌                                              | ✔️ (bloquea si cadena archivada)              | ✔️     |
| Usuarios (listar / editar / estado / eliminar)    | ❌                                              | ❌                                            | ✔️     |
| Cambiar propia contraseña                         | ✔️ (@seguridadUtil.esMismoUsuario)              | ✔️ (si aplica)                                | ✔️     |

La visibilidad para alumnos depende de: Curso ≠ ARCHIVADO, Módulo ≠ ARCHIVADO, Lección ≠ ARCHIVADA y Evaluación = PUBLICADA; además, el alumno debe estar inscrito con acceso (ACTIVA).

12) Buenas prácticas y notas

Idempotencia:

Usa idempotencyKey cuando crees pagos para evitar duplicados por reintentos del cliente/red.

Optimistic Locking:

Las entidades con @Version ayudan a evitar overwrites concurrentes; maneja 409 si aparece.

Recalcular snapshots:

CursoServicio expone métodos para reconstruir contadores (módulos/lecciones/inscritos). Los servicios de módulo/lección/pago ya los invocan cuando corresponde.

Validaciones tempranas:

Los servicios lanzan IllegalArgumentException ante valores inválidos (niveles/estados/tiempos). Controla estos errores en los controladores si necesitas formatos de respuesta más ricos.

13) Glosario rápido

BORRADOR: editable.

PUBLICADO: visible (no editable; archivar para cambios).

ARCHIVADO: oculto / sin interacción de alumno.

PENDIENTE_PAGO: reserva de asiento; cuenta para cupo.

ACTIVA: acceso vigente.

APROBADO/CAPTURADO (pago): dinero recibido; activar inscripción si procede.

Intento EN_PROGRESO: editable por el alumno.

Calificación PUBLICADA: visible para el estudiante.

14) Checklist de arranque rápido

Crear cluster y usuario en MongoDB Atlas.

Poner spring.data.mongodb.uri y JWT (jwt.secret de 32+ bytes) en application.properties.

Ejecutar mvn spring-boot:run.

(Opcional) Crear TipoUsuario de negocio: Instructor, Usuario (si no existen). ADMIN es especial (system).

Registrar/Login de usuario, asignar rol según tu flujo.

Crear curso (BORRADOR), módulos/lecciones, publicar.

Inscribir alumno → pago → aprobar/capturar → inscripción ACTIVA.

Evaluación publicada → intento → calificación → (opcional) certificado.

Se debe ingresar el token del usuario con el que quiere realizar las acciones, por ejemplo si quiere realizar una inscripción debería usar el token del usuario que desea hacer la inscripción, si lo que se quiere es probar funcionalidad directa se puede usar el ADMIN para todo pero es mejor usar cada usuario para lo que se planeó que pudera hacer.
Para consmir los endpoints puede seguir esta guía: 

USUARIO:


1. Registrar Usuario:

POST "http://localhost:8080/api/auth/register" Cualquier usuario.

Cuerpo:
```json
{
  "nombre": "Remigio Gonzales",
  "email": "remigio@gonzales.com",
  "password": "Secreto123",
  "rol": "Usuario"
}
```

Respuesta: 
```json
{
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyZW1pZ2lvQGdvbnphbGVzLmNvbSIsImp0aSI6IjgxYzc0NzQ2LTY2NTYtNGZjOC04M2IyLWE4NTI0ZjM5MDYyZiIsImlzcyI6ImN1cnNvc29ubGluZS1hcGkiLCJpYXQiOjE3NjAyMDA4MTQsImV4cCI6MTc2MDIwMjYxNCwidWlkIjoiNjhlYTg4NmUxOTFmZDA4MDdiODdmOGMxIiwicm9sZXMiOlsiUk9MRV9VU1VBUklPIl19.Ws15HfzERtw4BThSds_5A0JSfzvDoh_7LxycMNEH-i4",
    "type": "Bearer",
    "username": "Remigio Gonzales",
    "userId": "68ea886e191fd0807b87f8c1",
    "roles": [
        "ROLE_USUARIO"
    ],
    "expiresIn": 1800
}
```
2. Loguear Usuario:

POST "http://localhost:8080/api/auth/login" Cualquier usuario.

Cuerpo: 

```json
{
  "email": "admin@acceso.com",
  "password": "Secreto123"
}
```
Respuesta:
```json
{
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkBhY2Nlc28uY29tIiwianRpIjoiN2JjYWZmM2QtNjRmMi00NDczLWFiMzEtMDdiOGQwYWY4ZjAwIiwiaXNzIjoiY3Vyc29zb25saW5lLWFwaSIsImlhdCI6MTc2MDIwMDgzNSwiZXhwIjoxNzYwMjAyNjM1LCJ1aWQiOiI2OGU5MjBiZDEwNmU2YTVkZjgxOWE2NDQiLCJyb2xlcyI6WyJST0xFX0FETUlOIl19.sJ6pvuMbvl0tE7fbcihh6ESpm6FU2yATUdc8sRSv5bs",
    "type": "Bearer",
    "username": "ADMIN admin",
    "userId": "68e920bd106e6a5df819a644",
    "roles": [
        "ROLE_ADMIN"
    ],
    "expiresIn": 1800
}
```
3. Crear tipo de usuario:

POST "http://localhost:8080/api/tipousuario" Solo ADMIN.

Cuerpo:
```json
{
  "nombre": "TIPO_PRUEBA2",
  "descripcion": "Ejemplo de creacion de tipo de usuario"
}
```
Respuesta: 

```json
{
    "id": "68ea8975191fd0807b87f8c2",
    "nombre": "TIPO_PRUEBA2",
    "descripcion": "Ejemplo de creacion de tipo de usuario",
    "system": false,
    "createdAt": "2025-10-11T16:44:37.818612200Z",
    "updatedAt": "2025-10-11T16:44:37.818612200Z",
    "default": false
}
```
4. Listar tipos de usuarios creados:

GET "http://localhost:8080/api/tipousuario" Solo ADMIN.

Respuesta: 

```json
{
    "content": [
        {
            "id": "68e3b65ca29051b43d1f334d",
            "nombre": "INSTRUCTOR",
            "descripcion": "Puede crear y gestionar cursos",
            "system": false,
            "createdAt": "2025-10-06T12:30:20.052Z",
            "updatedAt": "2025-10-06T12:30:20.052Z",
            "default": false
        },
        {
            "id": "68ea8975191fd0807b87f8c2",
            "nombre": "TIPO_PRUEBA2",
            "descripcion": "Ejemplo de creacion de tipo de usuario",
            "system": false,
            "createdAt": "2025-10-11T16:44:37.818Z",
            "updatedAt": "2025-10-11T16:44:37.818Z",
            "default": false
        },
        {
            "id": "68e3b7eea29051b43d1f3350",
            "nombre": "USUARIO",
            "descripcion": "Puede navegar y consumir la mayoria de los servicios y opciones, pero no tiene permisos especiales ni puede administrar.",
            "system": false,
            "createdAt": "2025-10-06T12:37:02.138Z",
            "updatedAt": "2025-10-10T03:33:07.030Z",
            "default": false
        }
    ],
    "pageable": {
        "pageNumber": 0,
        "pageSize": 20,
        "sort": {
            "empty": false,
            "sorted": true,
            "unsorted": false
        },
        "offset": 0,
        "paged": true,
        "unpaged": false
    },
    "last": true,
    "totalElements": 3,
    "totalPages": 1,
    "first": true,
    "numberOfElements": 3,
    "size": 20,
    "number": 0,
    "sort": {
        "empty": false,
        "sorted": true,
        "unsorted": false
    },
    "empty": false
}
```
5. Listar los usuarios registrados:

GET "http://localhost:8080/api/usuarios" Solo ADMIN.

Respuesta: 
```json
[
    {
        "id": "68e3b2b0cea19dc739e6325a",
        "nombre": "Juan Santacruz Admin",
        "email": "juan@santacruzadmin.com",
        "rol": "INSTRUCTOR",
        "estado": "ACTIVO",
        "emailVerified": true,
        "lastLoginAt": "2025-10-10T16:30:13.064Z",
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-06T12:00:00Z",
        "updatedAt": "2025-10-10T16:30:14.414Z",
        "version": 39,
        "cursos": [
            {
                "id": "68e888232fba1df2ae0fd994",
                "titulo": "Ejemplo 2"
            }
        ]
    },
    {
        "id": "68e920bd106e6a5df819a644",
        "nombre": "ADMIN admin",
        "email": "admin@acceso.com",
        "rol": "ADMIN",
        "estado": "ACTIVO",
        "emailVerified": true,
        "lastLoginAt": "2025-10-11T16:43:51.067Z",
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-10T15:05:33.205Z",
        "updatedAt": "2025-10-11T16:43:51.470Z",
        "version": 17,
        "cursos": null
    },
    {
        "id": "68ea8751191fd0807b87f8bd",
        "nombre": "Pedro Gonzales",
        "email": "pedro@gonzales.com",
        "rol": "USUARIO",
        "estado": "ACTIVO",
        "emailVerified": false,
        "lastLoginAt": null,
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-11T16:35:29.025Z",
        "updatedAt": "2025-10-11T16:35:29.025Z",
        "version": 0,
        "cursos": null
    },
    {
        "id": "68ea8794191fd0807b87f8be",
        "nombre": "Antonio Gonzales",
        "email": "antonio@gonzales.com",
        "rol": "USUARIO",
        "estado": "ACTIVO",
        "emailVerified": false,
        "lastLoginAt": null,
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-11T16:36:36.226Z",
        "updatedAt": "2025-10-11T16:36:36.226Z",
        "version": 0,
        "cursos": null
    },
    {
        "id": "68ea8828191fd0807b87f8bf",
        "nombre": "Carlos Gonzales",
        "email": "carlos@gonzales.com",
        "rol": "USUARIO",
        "estado": "ACTIVO",
        "emailVerified": false,
        "lastLoginAt": null,
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-11T16:39:04.377Z",
        "updatedAt": "2025-10-11T16:39:04.377Z",
        "version": 0,
        "cursos": null
    },
    {
        "id": "68ea8840191fd0807b87f8c0",
        "nombre": "Mario Gonzales",
        "email": "mario@gonzales.com",
        "rol": "USUARIO",
        "estado": "ACTIVO",
        "emailVerified": false,
        "lastLoginAt": null,
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-11T16:39:28.815Z",
        "updatedAt": "2025-10-11T16:39:28.815Z",
        "version": 0,
        "cursos": null
    },
    {
        "id": "68ea886e191fd0807b87f8c1",
        "nombre": "Remigio Gonzales",
        "email": "remigio@gonzales.com",
        "rol": "USUARIO",
        "estado": "ACTIVO",
        "emailVerified": false,
        "lastLoginAt": null,
        "failedLoginAttempts": 0,
        "lockedUntil": null,
        "passwordUpdatedAt": null,
        "mfaEnabled": false,
        "fechaRegistro": "2025-10-11T16:40:14.584Z",
        "updatedAt": "2025-10-11T16:40:14.584Z",
        "version": 0,
        "cursos": null
    }
]
```
6. Listar un usuario en específico por ID:

GET "http://localhost:8080/api/usuarios/68ea886e191fd0807b87f8c1" Solo ADMIN.

Respuesta: 
```json
{
    "id": "68ea886e191fd0807b87f8c1",
    "nombre": "Remigio Gonzales",
    "email": "remigio@gonzales.com",
    "rol": "USUARIO",
    "estado": "ACTIVO",
    "emailVerified": false,
    "lastLoginAt": null,
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "passwordUpdatedAt": null,
    "mfaEnabled": false,
    "fechaRegistro": "2025-10-11T16:40:14.584Z",
    "updatedAt": "2025-10-11T16:40:14.584Z",
    "version": 0,
    "cursos": null
}
```
7. Listar un tipo de usuario específio por ID:

GET "http://localhost:8080/api/tipousuario/68e3b65ca29051b43d1f334d"  Solo ADMIN.

Respuesta:
```json
{
    "id": "68e3b65ca29051b43d1f334d",
    "nombre": "INSTRUCTOR",
    "descripcion": "Puede crear y gestionar cursos",
    "system": false,
    "createdAt": "2025-10-06T12:30:20.052Z",
    "updatedAt": "2025-10-06T12:30:20.052Z",
    "default": false
}
```
8. Actualizar todos los datos de un usuario por ID: 

PUT "http://localhost:8080/api/usuarios/68ea8794191fd0807b87f8be" Solo ADMIN.

Cuerpo: 
```json
{
  "nombre": "Anthonio Gonzales",
  "email": "anthonio@gonzales.com",
  "password": "Secreto123"
}
```
Respuesta:
```json
{
    "id": "68ea8794191fd0807b87f8be",
    "nombre": "Anthonio Gonzales",
    "email": "antonio@gonzales.com",
    "rol": "USUARIO",
    "estado": "ACTIVO",
    "emailVerified": false,
    "lastLoginAt": "2025-10-11T17:00:12.298Z",
    "failedLoginAttempts": 0,
    "lockedUntil": null,
    "passwordUpdatedAt": "2025-10-11T17:01:10.043223400Z",
    "mfaEnabled": false,
    "fechaRegistro": "2025-10-11T16:36:36.226Z",
    "updatedAt": "2025-10-11T17:01:10.043223400Z",
    "version": 3,
    "cursos": null
}
```
9. Actualizar datos de un tipo de usuario específico por ID:

PUT "http://localhost:8080/api/tipousuario/68e3b7eea29051b43d1f3350" Solo ADMIN.

Cuerpo:
```json
{
  "nombre": "USUARIO",
  "descripcion": "Puede navegar y consumir la mayoria de los servicios y opciones, sin embargo no tiene permisos especiales ni puede administrar."
}
```
Respuesta:
```json
{
    "id": "68e3b7eea29051b43d1f3350",
    "nombre": "USUARIO",
    "descripcion": "Puede navegar y consumir la mayoria de los servicios y opciones, sin embargo no tiene permisos especiales ni puede administrar.",
    "system": false,
    "createdAt": "2025-10-06T12:37:02.138Z",
    "updatedAt": "2025-10-11T17:03:24.857800800Z",
    "default": false
}
```
10. Actualizar estado de un usuario específico por ID: 

PATCH "http://localhost:8080/api/usuarios/68ea8828191fd0807b87f8bf/estado" Solo ADMIN.

Cuerpo:
```json
{ "estado": "INACTIVO" }
```
Respuesta:
```json
{
    "message": "Estado actualizado correctamente."
}
```
11. Actualizar contraseña de un usuario por ID: 

PATCH "http://localhost:8080/api/usuarios/68ea8794191fd0807b87f8be/password" ADMIN o Usuario a quien le pertenece la cuenta.

Cuerpo:
```json
{ "password": "Secreto12345" }
```
Respuesta:
```json
{
    "message": "Contraseña actualizada correctamente."
}
```
12. Eliminar un usuario por ID:

DELETE "http://localhost:8080/api/usuarios/68ea886e191fd0807b87f8c1" Solo ADMIN.

13. Eliminar tipo de usuario por ID:

DELETE "http://localhost:8080/api/tipousuario/68ea8975191fd0807b87f8c2" Solo ADMIN.



CURSOS

1. Crear un curso.

POST "http://localhost:8080/api/v1/cursos" Cualquier USUARIO.

Cuerpo:
```json
{
  "titulo": "Curso Java Experto.",
  "descripcion": "Curso avanzado de JAVA",
  "categoria": "Backend",
  "nivel": "avanzado",
  "idioma": "en",
  "precio": 25
}
```
Respuesta: 
```json
{
    "id": "68ea9311191fd0807b87f8c6",
    "titulo": "Curso Java Experto.",
    "slug": null,
    "descripcion": "Curso avanzado de JAVA",
    "etiquetas": null,
    "categoria": "Backend",
    "nivel": "AVANZADO",
    "idioma": "en",
    "precio": 25.0,
    "precioLista": null,
    "moneda": "USD",
    "gratuito": null,
    "estado": "BORRADOR",
    "publishedAt": null,
    "destacado": null,
    "idInstructor": "68ea8828191fd0807b87f8bf",
    "duracionTotalMinutos": 0,
    "modulosCount": 0,
    "leccionesCount": 0,
    "modulos": null,
    "imagenPortadaUrl": null,
    "promoVideoUrl": null,
    "ratingAvg": null,
    "ratingCount": null,
    "inscritosCount": 0,
    "accesoVitalicio": true,
    "accessDays": null,
    "enrollmentOpenAt": null,
    "enrollmentCloseAt": null,
    "cupoMaximo": null,
    "createdAt": "2025-10-11T17:25:37.925266500Z",
    "updatedAt": "2025-10-11T17:25:37.925266500Z",
    "version": 0
}
```
2. Publicar curso por ID:

PATCH "http://localhost:8080/api/v1/cursos/68ea92bc191fd0807b87f8c4/publicar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta: 
```json
{
    "id": "68ea92bc191fd0807b87f8c4",
    "titulo": "Curso Java Inicial.",
    "slug": null,
    "descripcion": "Curso de fundamentos de JAVA",
    "etiquetas": null,
    "categoria": "Backend",
    "nivel": "PRINCIPIANTE",
    "idioma": "en",
    "precio": 25.0,
    "precioLista": null,
    "moneda": "USD",
    "gratuito": null,
    "estado": "PUBLICADO",
    "publishedAt": "2025-10-11T17:33:34.387666Z",
    "destacado": null,
    "idInstructor": "68ea8828191fd0807b87f8bf",
    "duracionTotalMinutos": 0,
    "modulosCount": 0,
    "leccionesCount": 0,
    "modulos": null,
    "imagenPortadaUrl": null,
    "promoVideoUrl": null,
    "ratingAvg": null,
    "ratingCount": null,
    "inscritosCount": 0,
    "accesoVitalicio": true,
    "accessDays": null,
    "enrollmentOpenAt": null,
    "enrollmentCloseAt": null,
    "cupoMaximo": null,
    "createdAt": "2025-10-11T17:24:12.373Z",
    "updatedAt": "2025-10-11T17:33:34.387666Z",
    "version": 1
}
```
3. Listar Cursos (Solo se ven si están publicados): 

GET "http://localhost:8080/api/v1/cursos" Todos los usuarios.

Respuesta: 
```json
{
    "content": [
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        },
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "sort": "fechaCreacion,desc"
}
```
4. Listar cursos por categoría: 

GET "http://localhost:8080/api/v1/cursos/buscar?categoria=Backend&page=0&size=10" Todos los usuarios.

Respuesta: 
```json
{
    "content": [
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        },
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```
5. Listar cursos por descripción:

GET "http://localhost:8080/api/v1/cursos/buscar?q=fundamentos" Todos los usuarios.

Respuesta: 
```json
{
    "content": [
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```
6. Listar cursos por idioma:

GET "http://localhost:8080/api/v1/cursos/buscar?idioma=en" Todos los usuarios.

Respuesta:
```json
{
    "content": [
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        },
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```

7. Listar cursos por nivel:

GET "http://localhost:8080/api/v1/cursos/buscar?nivel=intermedio" Todos los usuarios.

Respuesta: 
```json
{
    "content": [
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```
8. Archivar un curso por ID:

PATCH "http://localhost:8080/api/v1/cursos/68ea9311191fd0807b87f8c6/archivar" Solo ADMIN o INSTRUCTOR dueño del curso.

Respuesta: 
```json
{
    "id": "68ea9311191fd0807b87f8c6",
    "titulo": "Curso Java Experto.",
    "slug": null,
    "descripcion": "Curso avanzado de JAVA",
    "etiquetas": null,
    "categoria": "Backend",
    "nivel": "AVANZADO",
    "idioma": "en",
    "precio": 25.0,
    "precioLista": null,
    "moneda": "USD",
    "gratuito": null,
    "estado": "ARCHIVADO",
    "publishedAt": null,
    "destacado": null,
    "idInstructor": "68ea8828191fd0807b87f8bf",
    "duracionTotalMinutos": 0,
    "modulosCount": 0,
    "leccionesCount": 0,
    "modulos": null,
    "imagenPortadaUrl": null,
    "promoVideoUrl": null,
    "ratingAvg": null,
    "ratingCount": null,
    "inscritosCount": 0,
    "accesoVitalicio": true,
    "accessDays": null,
    "enrollmentOpenAt": null,
    "enrollmentCloseAt": null,
    "cupoMaximo": null,
    "createdAt": "2025-10-11T17:25:37.925Z",
    "updatedAt": "2025-10-11T17:55:31.483371600Z",
    "version": 1
}
```
9. Listar curso específico por ID:

GET "http://localhost:8080/api/v1/cursos/buscar?id=68ea92bc191fd0807b87f8c4" Todos los usuarios.

Respuesta:
```json
{
    "content": [
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```
10. Listar los cursos por instructor:

GET "http://localhost:8080/api/v1/cursos/buscar?idInstructor=68ea8828191fd0807b87f8bf" Todos los usuarios.

Respuesta: 
```json
{
    "content": [
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        },
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "sort": "createdAt,desc"
}
```
11. Litar cursos por precio:

GET "http://localhost:8080/api/v1/cursos/buscar?maxPrecio=30.0&sort=precio" Todos los usuarios.

Respuesta:
```json
{
    "content": [
        {
            "id": "68ea92bc191fd0807b87f8c4",
            "titulo": "Curso Java Inicial.",
            "slug": null,
            "descripcion": "Curso de fundamentos de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "PRINCIPIANTE",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:33:34.387Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:12.373Z",
            "updatedAt": "2025-10-11T17:33:34.387Z",
            "version": 1
        },
        {
            "id": "68ea92e1191fd0807b87f8c5",
            "titulo": "Curso Java Promedio.",
            "slug": null,
            "descripcion": "Curso de avance de JAVA",
            "etiquetas": null,
            "categoria": "Backend",
            "nivel": "INTERMEDIO",
            "idioma": "en",
            "precio": 25.0,
            "precioLista": null,
            "moneda": "USD",
            "gratuito": null,
            "estado": "PUBLICADO",
            "publishedAt": "2025-10-11T17:35:29.410Z",
            "destacado": null,
            "idInstructor": "68ea8828191fd0807b87f8bf",
            "duracionTotalMinutos": 0,
            "modulosCount": 0,
            "leccionesCount": 0,
            "modulos": null,
            "imagenPortadaUrl": null,
            "promoVideoUrl": null,
            "ratingAvg": null,
            "ratingCount": null,
            "inscritosCount": 0,
            "accesoVitalicio": true,
            "accessDays": null,
            "enrollmentOpenAt": null,
            "enrollmentCloseAt": null,
            "cupoMaximo": null,
            "createdAt": "2025-10-11T17:24:49.932Z",
            "updatedAt": "2025-10-11T17:35:29.410Z",
            "version": 1
        }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 2,
    "totalPages": 1,
    "sort": "precio"
}
```
12. Listar cursos gratuitos:

GET "http://localhost:8080/api/v1/cursos/buscar?gratuito=true" Todos los usuarios.

Respuesta: 
```json
{
    "content": [],
    "page": 0,
    "size": 10,
    "totalElements": 0,
    "totalPages": 0,
    "sort": "createdAt,desc"
}
```
13. Editar curso por ID:

PUT "http://localhost:8080/api/v1/cursos/68ea92bc191fd0807b87f8c4" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "Curso inicial de JAVA2.",
  "descripcion": "Curso de fundamentos de JAVA",
  "categoria": "Backend",
  "nivel": "PRINCIPIANTE",
  "idioma": "es",
  "precio": 25
}
```
Respuesta: 
```json
{
    "id": "68ea92bc191fd0807b87f8c4",
    "titulo": "Curso inicial de JAVA2.",
    "slug": null,
    "descripcion": "Curso de fundamentos de JAVA",
    "etiquetas": null,
    "categoria": "Backend",
    "nivel": "PRINCIPIANTE",
    "idioma": "es",
    "precio": 25.0,
    "precioLista": null,
    "moneda": "USD",
    "gratuito": null,
    "estado": "ARCHIVADO",
    "publishedAt": "2025-10-11T17:33:34.387Z",
    "destacado": null,
    "idInstructor": "68ea8828191fd0807b87f8bf",
    "duracionTotalMinutos": 0,
    "modulosCount": 0,
    "leccionesCount": 0,
    "modulos": null,
    "imagenPortadaUrl": null,
    "promoVideoUrl": null,
    "ratingAvg": null,
    "ratingCount": null,
    "inscritosCount": 0,
    "accesoVitalicio": true,
    "accessDays": null,
    "enrollmentOpenAt": null,
    "enrollmentCloseAt": null,
    "cupoMaximo": null,
    "createdAt": "2025-10-11T17:24:12.373Z",
    "updatedAt": "2025-10-11T22:02:30.596287100Z",
    "version": 3
}
```
13. Cambiar estado a borrador:

PATCH "http://localhost:8080/api/v1/cursos/68ea92bc191fd0807b87f8c4/estado" Solo ADMIN e INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "estado": "BORRADOR"
}
```
Respuesta: 
```json
{
    "id": "68ea92bc191fd0807b87f8c4",
    "titulo": "Curso inicial de JAVA2.",
    "slug": null,
    "descripcion": "Curso de fundamentos de JAVA",
    "etiquetas": null,
    "categoria": "Backend",
    "nivel": "PRINCIPIANTE",
    "idioma": "es",
    "precio": 25.0,
    "precioLista": null,
    "moneda": "USD",
    "gratuito": null,
    "estado": "BORRADOR",
    "publishedAt": "2025-10-11T17:33:34.387Z",
    "destacado": null,
    "idInstructor": "68ea8828191fd0807b87f8bf",
    "duracionTotalMinutos": 0,
    "modulosCount": 0,
    "leccionesCount": 0,
    "modulos": null,
    "imagenPortadaUrl": null,
    "promoVideoUrl": null,
    "ratingAvg": null,
    "ratingCount": null,
    "inscritosCount": 0,
    "accesoVitalicio": true,
    "accessDays": null,
    "enrollmentOpenAt": null,
    "enrollmentCloseAt": null,
    "cupoMaximo": null,
    "createdAt": "2025-10-11T17:24:12.373Z",
    "updatedAt": "2025-10-11T22:03:57.672211600Z",
    "version": 4
}
```
14. Eliminar un curso por ID:

DELETE "http://localhost:8080/api/v1/cursos/68e888232fba1df2ae0fd994" ADMIN o INSTRUCTOR dueño del curso.


INSCRIPCION

1. Crear una inscripción por ID del curso.

POST "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones" Todos los usuarios.

Respuesta:
```json
{
    "id": "68ead75c3ed5753384c5780a",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idEstudiante": "68ea8794191fd0807b87f8be",
    "estado": "PENDIENTE_PAGO",
    "accessStartAt": "2025-10-11T22:17:00.851481400Z",
    "accessEndAt": null,
    "accesoVitalicio": null,
    "progresoPct": null,
    "leccionesCompletadas": null,
    "moduloActualId": null,
    "leccionActualId": null,
    "lastAccessAt": null,
    "idPago": null,
    "pagoIds": null,
    "precioLista": null,
    "descuento": null,
    "impuestos": null,
    "totalPagado": null,
    "moneda": null,
    "cupon": null,
    "origen": null,
    "certificadoId": null,
    "notaFinal": null,
    "aprobadoFinal": null,
    "createdAt": "2025-10-11T22:17:00.854479700Z",
    "updatedAt": "2025-10-11T22:17:00.854479700Z",
    "completadaAt": null,
    "canceladaAt": null,
    "idempotencyKey": null,
    "metadata": null,
    "version": 0
}
```
2. Listar las inscripciones por curso ID:

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones" Solo ADMIN e INSTRUCTOR dueño del curso.

Respuesta:
```json
[
    {
        "id": "68ead75c3ed5753384c5780a",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idEstudiante": "68ea8794191fd0807b87f8be",
        "estado": "PENDIENTE_PAGO",
        "accessStartAt": "2025-10-11T22:17:00.851Z",
        "accessEndAt": null,
        "accesoVitalicio": null,
        "progresoPct": null,
        "leccionesCompletadas": null,
        "moduloActualId": null,
        "leccionActualId": null,
        "lastAccessAt": null,
        "idPago": null,
        "pagoIds": null,
        "precioLista": null,
        "descuento": null,
        "impuestos": null,
        "totalPagado": null,
        "moneda": null,
        "cupon": null,
        "origen": null,
        "certificadoId": null,
        "notaFinal": null,
        "aprobadoFinal": null,
        "createdAt": "2025-10-11T22:17:00.854Z",
        "updatedAt": "2025-10-11T22:17:00.854Z",
        "completadaAt": null,
        "canceladaAt": null,
        "idempotencyKey": null,
        "metadata": null,
        "version": 0
    }
]
```

3. Listado de inscripciones por estado con ID de curso:

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones?estado=pendiente_pago" Solo ADMIN e INSTRUCTOR dueño del curso.

Respuesta: 
```json
[
    {
        "id": "68eae5bf3ed5753384c5780c",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idEstudiante": "68ea8840191fd0807b87f8c0",
        "estado": "PENDIENTE_PAGO",
        "accessStartAt": "2025-10-11T23:18:23.305Z",
        "accessEndAt": null,
        "accesoVitalicio": null,
        "progresoPct": null,
        "leccionesCompletadas": null,
        "moduloActualId": null,
        "leccionActualId": null,
        "lastAccessAt": null,
        "idPago": null,
        "pagoIds": null,
        "precioLista": null,
        "descuento": null,
        "impuestos": null,
        "totalPagado": null,
        "moneda": null,
        "cupon": null,
        "origen": null,
        "certificadoId": null,
        "notaFinal": null,
        "aprobadoFinal": null,
        "createdAt": "2025-10-11T23:18:23.307Z",
        "updatedAt": "2025-10-11T23:18:23.307Z",
        "completadaAt": null,
        "canceladaAt": null,
        "idempotencyKey": null,
        "metadata": null,
        "version": 0
    },
    {
        "id": "68eae5893ed5753384c5780b",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idEstudiante": "68ea8794191fd0807b87f8be",
        "estado": "PENDIENTE_PAGO",
        "accessStartAt": "2025-10-11T23:17:29.300Z",
        "accessEndAt": null,
        "accesoVitalicio": null,
        "progresoPct": null,
        "leccionesCompletadas": null,
        "moduloActualId": null,
        "leccionActualId": null,
        "lastAccessAt": null,
        "idPago": null,
        "pagoIds": null,
        "precioLista": null,
        "descuento": null,
        "impuestos": null,
        "totalPagado": null,
        "moneda": null,
        "cupon": null,
        "origen": null,
        "certificadoId": null,
        "notaFinal": null,
        "aprobadoFinal": null,
        "createdAt": "2025-10-11T23:17:29.300Z",
        "updatedAt": "2025-10-11T23:17:29.300Z",
        "completadaAt": null,
        "canceladaAt": null,
        "idempotencyKey": null,
        "metadata": null,
        "version": 0
    }
]
```
4. Listar una inscripción específica por ID del curso e ID de la inscrpción:

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones/68eae5bf3ed5753384c5780c" Solo ADMIN e INSTRUCTOR dueño del curso.

Respuesta: 
```json
{
    "id": "68eae5bf3ed5753384c5780c",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PENDIENTE_PAGO",
    "accessStartAt": "2025-10-11T23:18:23.305Z",
    "accessEndAt": null,
    "accesoVitalicio": null,
    "progresoPct": null,
    "leccionesCompletadas": null,
    "moduloActualId": null,
    "leccionActualId": null,
    "lastAccessAt": null,
    "idPago": null,
    "pagoIds": null,
    "precioLista": null,
    "descuento": null,
    "impuestos": null,
    "totalPagado": null,
    "moneda": null,
    "cupon": null,
    "origen": null,
    "certificadoId": null,
    "notaFinal": null,
    "aprobadoFinal": null,
    "createdAt": "2025-10-11T23:18:23.307Z",
    "updatedAt": "2025-10-11T23:18:23.307Z",
    "completadaAt": null,
    "canceladaAt": null,
    "idempotencyKey": null,
    "metadata": null,
    "version": 0
}
```

5. Listar el número de inscripciones por curso.

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones/contador" Todos los usuarios.

Respuesta: 
```json
{
    "inscritosActivos": 0,
    "cursoId": "68ea92e1191fd0807b87f8c5"
}
```
No se muestra nada porque las inscripciones solo cuentan cuando se realiza el pago. 

6. Listar mis inscripciones.

GET "http://localhost:8080/api/v1/mi/inscripciones" Todos los usuarios.

Respuesta:
```json
[
    {
        "id": "68eae5893ed5753384c5780b",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idEstudiante": "68ea8794191fd0807b87f8be",
        "estado": "PENDIENTE_PAGO",
        "accessStartAt": "2025-10-11T23:17:29.300Z",
        "accessEndAt": null,
        "accesoVitalicio": null,
        "progresoPct": null,
        "leccionesCompletadas": null,
        "moduloActualId": null,
        "leccionActualId": null,
        "lastAccessAt": null,
        "idPago": null,
        "pagoIds": null,
        "precioLista": null,
        "descuento": null,
        "impuestos": null,
        "totalPagado": null,
        "moneda": null,
        "cupon": null,
        "origen": null,
        "certificadoId": null,
        "notaFinal": null,
        "aprobadoFinal": null,
        "createdAt": "2025-10-11T23:17:29.300Z",
        "updatedAt": "2025-10-11T23:17:29.300Z",
        "completadaAt": null,
        "canceladaAt": null,
        "idempotencyKey": null,
        "metadata": null,
        "version": 0
    }
]
```

7. Listar inscripciones específicas mias.

GET "http://localhost:8080/api/v1/mi/inscripciones/curso/68ea92e1191fd0807b87f8c5" Todos los usuarios.

Respuesta: 
```json
{
    "id": "68eae5893ed5753384c5780b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idEstudiante": "68ea8794191fd0807b87f8be",
    "estado": "PENDIENTE_PAGO",
    "accessStartAt": "2025-10-11T23:17:29.300Z",
    "accessEndAt": null,
    "accesoVitalicio": null,
    "progresoPct": null,
    "leccionesCompletadas": null,
    "moduloActualId": null,
    "leccionActualId": null,
    "lastAccessAt": null,
    "idPago": null,
    "pagoIds": null,
    "precioLista": null,
    "descuento": null,
    "impuestos": null,
    "totalPagado": null,
    "moneda": null,
    "cupon": null,
    "origen": null,
    "certificadoId": null,
    "notaFinal": null,
    "aprobadoFinal": null,
    "createdAt": "2025-10-11T23:17:29.300Z",
    "updatedAt": "2025-10-11T23:17:29.300Z",
    "completadaAt": null,
    "canceladaAt": null,
    "idempotencyKey": null,
    "metadata": null,
    "version": 0
}
```
8. Cambiar el estado de una inscripción a completada para desbloquear opciones de certificados. (Se hizo depués de realizar el pago de la inscripción. -Ver siguiente parte)

PATCH "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones/68eae5bf3ed5753384c5780c/estado" Solo ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{"estado":"completada"}
```

Respuesta: 
```json
{
    "id": "68eae5bf3ed5753384c5780c",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "COMPLETADA",
    "accessStartAt": "2025-10-11T23:18:23.305Z",
    "accessEndAt": null,
    "accesoVitalicio": null,
    "progresoPct": null,
    "leccionesCompletadas": null,
    "moduloActualId": null,
    "leccionActualId": null,
    "lastAccessAt": null,
    "idPago": "68eaefb13ed5753384c5780d",
    "pagoIds": [
        "68eaefb13ed5753384c5780d"
    ],
    "precioLista": null,
    "descuento": null,
    "impuestos": null,
    "totalPagado": null,
    "moneda": null,
    "cupon": null,
    "origen": null,
    "certificadoId": null,
    "notaFinal": null,
    "aprobadoFinal": null,
    "createdAt": "2025-10-11T23:18:23.307Z",
    "updatedAt": "2025-10-12T00:18:36.394652700Z",
    "completadaAt": null,
    "canceladaAt": null,
    "idempotencyKey": null,
    "metadata": null,
    "version": 3
}
```

9. Eliminar inscripción de un curso.

DELETE "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/inscripciones/68eae5893ed5753384c5780b" Solo ADMIN o USUARIO que realizó la inscripción. 


PAGO
1. Generar pago por inscripción ID.

POST "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos/borrador" Solo usuario dueño de la inscripción.

Cuerpo:
```json
{
  "monto": 25.00,
  "moneda": "USD",
  "metodo": "TRANSFERENCIA",
  "referencia": "DEP-20251011-0001",
  "cupon": "DESCUENTO10",
  "gateway": "BANCO_PICHINCHA",
  "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1"
}

```
Respuesta:
```json
{
    "id": "68eaefb13ed5753384c5780d",
    "idInscripcion": "68eae5bf3ed5753384c5780c",
    "userId": "68ea8840191fd0807b87f8c0",
    "monto": 25.00,
    "subtotal": null,
    "impuestos": null,
    "comisiones": null,
    "descuento": null,
    "moneda": "USD",
    "metodo": "TRANSFERENCIA",
    "estado": "PENDIENTE",
    "referencia": "DEP-20251011-0001",
    "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
    "cupon": "DESCUENTO10",
    "gateway": "BANCO_PICHINCHA",
    "gatewayPaymentId": null,
    "authorizationCode": null,
    "reciboUrl": null,
    "metodoDetalle": null,
    "createdAt": "2025-10-12T00:00:49.498046800Z",
    "updatedAt": "2025-10-12T00:00:49.498046800Z",
    "autorizadoAt": null,
    "pagadoAt": null,
    "fallidoAt": null,
    "reembolsadoAt": null,
    "version": 0,
    "metadata": null
}
```

2. Cambiar datos del pago sin autorizar por id de la inscripcion e id del pago.

PATCH "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos/68eaefb13ed5753384c5780d" Solo dueño del pago.

Cuerpo:
```json
{
  "monto": 25.50,
  "moneda": "USD",
  "metodo": "PAYPAL",
  "referencia": "ORD-2025-0001-EDIT",
  "cupon": "NUEVO10",
  "gateway": "PAYPAL"
}

```
Respuesta:
```json
{
    "id": "68eaefb13ed5753384c5780d",
    "idInscripcion": "68eae5bf3ed5753384c5780c",
    "userId": "68ea8840191fd0807b87f8c0",
    "monto": 25.50,
    "subtotal": null,
    "impuestos": null,
    "comisiones": null,
    "descuento": null,
    "moneda": "USD",
    "metodo": "PAYPAL",
    "estado": "PENDIENTE",
    "referencia": "ORD-2025-0001-EDIT",
    "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
    "cupon": "NUEVO10",
    "gateway": "PAYPAL",
    "gatewayPaymentId": null,
    "authorizationCode": null,
    "reciboUrl": null,
    "metodoDetalle": null,
    "createdAt": "2025-10-12T00:00:49.498Z",
    "updatedAt": "2025-10-12T00:03:28.023918Z",
    "autorizadoAt": null,
    "pagadoAt": null,
    "fallidoAt": null,
    "reembolsadoAt": null,
    "version": 1,
    "metadata": null
}
```

3. Autorizar pago por id inscripcion e id pago.

POST "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos/68eaefb13ed5753384c5780d/checkout" Solo dueño del pago.

Respuesta:
```json
{
    "id": "68eaefb13ed5753384c5780d",
    "idInscripcion": "68eae5bf3ed5753384c5780c",
    "userId": "68ea8840191fd0807b87f8c0",
    "monto": 25.50,
    "subtotal": null,
    "impuestos": null,
    "comisiones": null,
    "descuento": null,
    "moneda": "USD",
    "metodo": "PAYPAL",
    "estado": "AUTORIZADO",
    "referencia": "ORD-2025-0001-EDIT",
    "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
    "cupon": "NUEVO10",
    "gateway": "PAYPAL",
    "gatewayPaymentId": null,
    "authorizationCode": null,
    "reciboUrl": null,
    "metodoDetalle": null,
    "createdAt": "2025-10-12T00:00:49.498Z",
    "updatedAt": "2025-10-12T00:08:07.053266300Z",
    "autorizadoAt": "2025-10-12T00:08:07.053266300Z",
    "pagadoAt": null,
    "fallidoAt": null,
    "reembolsadoAt": null,
    "version": 2,
    "metadata": null
}
```

4. Aprobar el pago autorizado.

POST "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos/68eaefb13ed5753384c5780d/aprobar" Solo ADMIN o INSTRUCTOR dueño del curso. 

Respuesta: 
```json
{
    "id": "68eaefb13ed5753384c5780d",
    "idInscripcion": "68eae5bf3ed5753384c5780c",
    "userId": "68ea8840191fd0807b87f8c0",
    "monto": 25.50,
    "subtotal": null,
    "impuestos": null,
    "comisiones": null,
    "descuento": null,
    "moneda": "USD",
    "metodo": "PAYPAL",
    "estado": "APROBADO",
    "referencia": "ORD-2025-0001-EDIT",
    "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
    "cupon": "NUEVO10",
    "gateway": "PAYPAL",
    "gatewayPaymentId": null,
    "authorizationCode": null,
    "reciboUrl": null,
    "metodoDetalle": null,
    "createdAt": "2025-10-12T00:00:49.498Z",
    "updatedAt": "2025-10-12T00:10:16.468402800Z",
    "autorizadoAt": "2025-10-12T00:08:07.053Z",
    "pagadoAt": "2025-10-12T00:10:16.468402800Z",
    "fallidoAt": null,
    "reembolsadoAt": null,
    "version": 3,
    "metadata": null
}
```

5. Listar pagos de inscripción por ID de la inscripcion.

GET "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos" ADMIN, INSTRUCTOR o USUARIO que realizó la inscripción.

Respuesta: 
```json
[
    {
        "id": "68eaefb13ed5753384c5780d",
        "idInscripcion": "68eae5bf3ed5753384c5780c",
        "userId": "68ea8840191fd0807b87f8c0",
        "monto": 25.50,
        "subtotal": null,
        "impuestos": null,
        "comisiones": null,
        "descuento": null,
        "moneda": "USD",
        "metodo": "PAYPAL",
        "estado": "APROBADO",
        "referencia": "ORD-2025-0001-EDIT",
        "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
        "cupon": "NUEVO10",
        "gateway": "PAYPAL",
        "gatewayPaymentId": null,
        "authorizationCode": null,
        "reciboUrl": null,
        "metodoDetalle": null,
        "createdAt": "2025-10-12T00:00:49.498Z",
        "updatedAt": "2025-10-12T00:10:16.468Z",
        "autorizadoAt": "2025-10-12T00:08:07.053Z",
        "pagadoAt": "2025-10-12T00:10:16.468Z",
        "fallidoAt": null,
        "reembolsadoAt": null,
        "version": 3,
        "metadata": null
    }
]
```
6. Listar pago específco por id de inscripcion e id de pago.

GET "http://localhost:8080/api/v1/inscripciones/68eae5bf3ed5753384c5780c/pagos/68eaefb13ed5753384c5780d" ADMIN, INSTRUCTOR y USUARIO.

Respuesta: 
```json
{
    "id": "68eaefb13ed5753384c5780d",
    "idInscripcion": "68eae5bf3ed5753384c5780c",
    "userId": "68ea8840191fd0807b87f8c0",
    "monto": 25.50,
    "subtotal": null,
    "impuestos": null,
    "comisiones": null,
    "descuento": null,
    "moneda": "USD",
    "metodo": "PAYPAL",
    "estado": "APROBADO",
    "referencia": "ORD-2025-0001-EDIT",
    "idempotencyKey": "inscripcion68eae5bf3ed5753384c5780c-intento1",
    "cupon": "NUEVO10",
    "gateway": "PAYPAL",
    "gatewayPaymentId": null,
    "authorizationCode": null,
    "reciboUrl": null,
    "metodoDetalle": null,
    "createdAt": "2025-10-12T00:00:49.498Z",
    "updatedAt": "2025-10-12T00:10:16.468Z",
    "autorizadoAt": "2025-10-12T00:08:07.053Z",
    "pagadoAt": "2025-10-12T00:10:16.468Z",
    "fallidoAt": null,
    "reembolsadoAt": null,
    "version": 3,
    "metadata": null
}
```

7. Eliminar pago pendiente.

DELETE "http://localhost:8080/api/v1/inscripciones/68e934de106e6a5df819a646/pagos/68e971f6c779b4ac4ce7c73d" USUARIO que creó el pago y ADMIN


MODULO

1. Crear una leccion.
POST "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "Introducción a funciones especializadas JAVA",
  "descripcion": "Ampliacion de conocimiento",
  "orden": 1
}
```
Respuesta:

```json
{
    "id": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Introducción a funciones especializadas JAVA",
    "slug": null,
    "descripcion": "Ampliacion de conocimiento",
    "orden": 1,
    "estado": "BORRADOR",
    "publishedAt": null,
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:09:33.655047600Z",
    "updatedAt": "2025-10-12T02:09:33.655047600Z",
    "version": 0
}
```

2. Listar todos los módulos de un curso, por curso ID.

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos" Todos los usuarios.

Respuesta:

```json
[
    {
        "id": "68eb0dddea8b8f7803e2c159",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Introducción a funciones especializadas JAVA",
        "slug": null,
        "descripcion": "Ampliacion de conocimiento",
        "orden": 1,
        "estado": "BORRADOR",
        "publishedAt": null,
        "duracionTotalMinutos": null,
        "lecciones": null,
        "preview": false,
        "createdAt": "2025-10-12T02:09:33.655Z",
        "updatedAt": "2025-10-12T02:09:33.655Z",
        "version": 0
    },
    {
        "id": "68eb0e3cea8b8f7803e2c15a",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Introducción a funciones especializadas JAVA N2",
        "slug": null,
        "descripcion": "Ampliacion de conocimiento N2",
        "orden": 2,
        "estado": "BORRADOR",
        "publishedAt": null,
        "duracionTotalMinutos": null,
        "lecciones": null,
        "preview": false,
        "createdAt": "2025-10-12T02:11:08.967Z",
        "updatedAt": "2025-10-12T02:11:08.967Z",
        "version": 0
    },
    {
        "id": "68eb0e45ea8b8f7803e2c15b",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Introducción a funciones especializadas JAVA N3",
        "slug": null,
        "descripcion": "Ampliacion de conocimiento N3",
        "orden": 3,
        "estado": "BORRADOR",
        "publishedAt": null,
        "duracionTotalMinutos": null,
        "lecciones": null,
        "preview": false,
        "createdAt": "2025-10-12T02:11:17.274Z",
        "updatedAt": "2025-10-12T02:11:17.274Z",
        "version": 0
    }
]
```

3. Listar módulos específicos por Curso ID y Módulo ID.

GET "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/68eb0e45ea8b8f7803e2c15b" Todos los usuarios.

Respuesta:

```json
{
    "id": "68eb0e45ea8b8f7803e2c15b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Introducción a funciones especializadas JAVA N3",
    "slug": null,
    "descripcion": "Ampliacion de conocimiento N3",
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:11:17.274Z",
    "updatedAt": "2025-10-12T02:11:17.274Z",
    "version": 0
}
```

4. Actualizar modulo específico.

PUT "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/68eb0e45ea8b8f7803e2c15b" Solo para ADMIN e INSTRUCTOr dueño del curso.

Cuerpo:
```json
{
  "titulo": "Fundamentos de POO",
  "descripcion": "Fundamentos MODIFICADO",
  "orden": 3
}
```
Respuesta:

```json
{
    "id": "68eb0e45ea8b8f7803e2c15b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Fundamentos de POO",
    "slug": null,
    "descripcion": "Fundamentos MODIFICADO",
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:11:17.274Z",
    "updatedAt": "2025-10-12T02:19:42.392104Z",
    "version": 1
}
```

5. Cambiar el orden de un módulo específico.

PATCH "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/68eb0e45ea8b8f7803e2c15b/orden" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "orden": 1 }
```
Respuesta:

```json
{
    "id": "68eb0e45ea8b8f7803e2c15b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Fundamentos de POO",
    "slug": null,
    "descripcion": "Fundamentos MODIFICADO",
    "orden": 1,
    "estado": "BORRADOR",
    "publishedAt": null,
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:11:17.274Z",
    "updatedAt": "2025-10-12T02:20:30.150Z",
    "version": 2
}
```

6. Actualizar orden de los cursos de manera masiva.

PATCH "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/orden" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "ids": ["68eb0e3cea8b8f7803e2c15a", "68eb0e45ea8b8f7803e2c15b"] }
```
Respuesta:

```json
[
    {
        "id": "68eb0e3cea8b8f7803e2c15a",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Introducción a funciones especializadas JAVA N2",
        "slug": null,
        "descripcion": "Ampliacion de conocimiento N2",
        "orden": 1,
        "estado": "BORRADOR",
        "publishedAt": null,
        "duracionTotalMinutos": null,
        "lecciones": null,
        "preview": false,
        "createdAt": "2025-10-12T02:11:08.967Z",
        "updatedAt": "2025-10-12T02:22:43.470119700Z",
        "version": 1
    },
    {
        "id": "68eb0e45ea8b8f7803e2c15b",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Fundamentos de POO",
        "slug": null,
        "descripcion": "Fundamentos MODIFICADO",
        "orden": 2,
        "estado": "BORRADOR",
        "publishedAt": null,
        "duracionTotalMinutos": null,
        "lecciones": null,
        "preview": false,
        "createdAt": "2025-10-12T02:11:17.274Z",
        "updatedAt": "2025-10-12T02:22:43.635180500Z",
        "version": 3
    }
]
```

7. Publicar un módulo.

PATCH "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/68eb0e45ea8b8f7803e2c15b/publicar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb0e45ea8b8f7803e2c15b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Fundamentos de POO",
    "slug": null,
    "descripcion": "Fundamentos MODIFICADO",
    "orden": 2,
    "estado": "PUBLICADO",
    "publishedAt": "2025-10-12T02:25:50.210730800Z",
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:11:17.274Z",
    "updatedAt": "2025-10-12T02:25:50.210730800Z",
    "version": 4
}
```

8. Archivar módulo.

PATCH "" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb0e45ea8b8f7803e2c15b",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Fundamentos de POO",
    "slug": null,
    "descripcion": "Fundamentos MODIFICADO",
    "orden": 2,
    "estado": "ARCHIVADO",
    "publishedAt": "2025-10-12T02:25:50.210Z",
    "duracionTotalMinutos": null,
    "lecciones": null,
    "preview": false,
    "createdAt": "2025-10-12T02:11:17.274Z",
    "updatedAt": "2025-10-12T02:26:54.425237900Z",
    "version": 5
}
```

9. Eliminar un módulo.

DELETE "http://localhost:8080/api/v1/cursos/68ea92e1191fd0807b87f8c5/modulos/68eb0e45ea8b8f7803e2c15b" ADMIN o INSTRUCTOR dueño del curso.



LECCION
1. Crear una lección.

POST "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "Leccion N2",
  "tipo": "QUIZ",          
  "urlContenido": "https://…", // Obligatorio si no es QUIZ
  "duracion": 300                        
}

```
Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "Leccion N2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 300,
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204733400Z",
    "updatedAt": "2025-10-12T02:32:27.204733400Z",
    "version": 0
}
```

2.
GET "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones" ADMIN,INSTRUCTOR dueño del curso, o inscrito al curso.

Respuesta:

```json
[
    {
        "id": "68eb132a65e470167c9b2691",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "titulo": "Leccion N1",
        "slug": null,
        "tipo": "ARTICULO",
        "urlContenido": "https://…",
        "contenidoTexto": null,
        "video": null,
        "recursos": null,
        "duracion": 300,
        "orden": 1,
        "estado": "BORRADOR",
        "publishedAt": null,
        "preview": false,
        "evaluaciones": null,
        "createdAt": "2025-10-12T02:32:10.656Z",
        "updatedAt": "2025-10-12T02:32:10.656Z",
        "version": 0
    },
    {
        "id": "68eb133365e470167c9b2692",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "titulo": "Leccion N2",
        "slug": null,
        "tipo": "VIDEO",
        "urlContenido": "https://…",
        "contenidoTexto": null,
        "video": null,
        "recursos": null,
        "duracion": 300,
        "orden": 2,
        "estado": "BORRADOR",
        "publishedAt": null,
        "preview": false,
        "evaluaciones": null,
        "createdAt": "2025-10-12T02:32:19.476Z",
        "updatedAt": "2025-10-12T02:32:19.476Z",
        "version": 0
    },
    {
        "id": "68eb133b65e470167c9b2693",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "titulo": "Leccion N2",
        "slug": null,
        "tipo": "QUIZ",
        "urlContenido": "https://…",
        "contenidoTexto": null,
        "video": null,
        "recursos": null,
        "duracion": 300,
        "orden": 3,
        "estado": "BORRADOR",
        "publishedAt": null,
        "preview": false,
        "evaluaciones": null,
        "createdAt": "2025-10-12T02:32:27.204Z",
        "updatedAt": "2025-10-12T02:32:27.204Z",
        "version": 0
    }
]
```

3.
GET "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693" ADMIN,INSTRUCTOR dueño del curso, o inscrito al curso.

Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "Leccion N2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 300,
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:32:27.204Z",
    "version": 0
}
```

4. Actualizar leccion por modulo ID y leccion ID.

PUT "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "QUIZ actualizada 2",
  "tipo": "QUIZ",             // enum: VIDEO | ARTICULO | QUIZ
  "urlContenido": "https://…",
  "duracion": 420,
  "estado": "BORRADOR",
  "orden": 3
}
```
Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:38:14.965511600Z",
    "version": 1
}
```

5. Reordenar las lecciones por modulo id y leccion id, con dirección.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693/mover" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "direccion": "up" }
```
Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 2,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:39:36.181442300Z",
    "version": 2
}
```

6. Reordenar una lección con modulo ID y leccion ID de manera directa.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693/orden" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "orden": 3 }
```
Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 3,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:40:44.095771600Z",
    "version": 3
}
```

7. Reordenamiento masivo de lecciones.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/orden" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "ids": ["68eb133b65e470167c9b2693","68eb132a65e470167c9b2691"] }
```
Respuesta:

```json
[
    {
        "id": "68eb132a65e470167c9b2691",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "titulo": "Leccion N1",
        "slug": null,
        "tipo": "ARTICULO",
        "urlContenido": "https://…",
        "contenidoTexto": null,
        "video": null,
        "recursos": null,
        "duracion": 300,
        "orden": 2,
        "estado": "BORRADOR",
        "publishedAt": null,
        "preview": false,
        "evaluaciones": null,
        "createdAt": "2025-10-12T02:32:10.656Z",
        "updatedAt": "2025-10-12T02:42:25.305152400Z",
        "version": 1
    },
    {
        "id": "68eb133b65e470167c9b2693",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "titulo": "QUIZ actualizada 2",
        "slug": null,
        "tipo": "QUIZ",
        "urlContenido": "https://…",
        "contenidoTexto": null,
        "video": null,
        "recursos": null,
        "duracion": 420,
        "orden": 1,
        "estado": "BORRADOR",
        "publishedAt": null,
        "preview": false,
        "evaluaciones": null,
        "createdAt": "2025-10-12T02:32:27.204Z",
        "updatedAt": "2025-10-12T02:42:25.453537500Z",
        "version": 4
    }
]
```

8. Editar un campo específico de lecciones.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{"estado": "BORRADOR"}
```
Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 1,
    "estado": "BORRADOR",
    "publishedAt": null,
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:43:49.843553400Z",
    "version": 7
}
```

9. Publicar una lección.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693/publicar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 1,
    "estado": "PUBLICADO",
    "publishedAt": "2025-10-12T02:45:12.395307600Z",
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:45:12.395307600Z",
    "version": 8
}
```

10. Archivar una lección.

PATCH "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693/archivar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb133b65e470167c9b2693",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "titulo": "QUIZ actualizada 2",
    "slug": null,
    "tipo": "QUIZ",
    "urlContenido": "https://…",
    "contenidoTexto": null,
    "video": null,
    "recursos": null,
    "duracion": 420,
    "orden": 1,
    "estado": "ARCHIVADO",
    "publishedAt": "2025-10-12T02:45:12.395Z",
    "preview": false,
    "evaluaciones": null,
    "createdAt": "2025-10-12T02:32:27.204Z",
    "updatedAt": "2025-10-12T02:46:14.315962700Z",
    "version": 9
}
```

11. Eliminar una lección.

DELETE "http://localhost:8080/api/v1/modulos/68eb0dddea8b8f7803e2c159/lecciones/68eb133b65e470167c9b2693" ADMIN o INSTRUCTOR dueño del curso.


EVALUACION

1. Crear una evaluación.

POST "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "Evaluacion 1 Leccion 3",
  "tipo": "quiz",    
  "puntajeMaximo": 100
}

```
Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Evaluacion 1 Leccion 3",
    "descripcion": null,
    "tipo": "QUIZ",
    "estado": "BORRADOR",
    "publishedAt": null,
    "puntajeMaximo": 100,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107660700Z",
    "updatedAt": "2025-10-12T02:50:53.107660700Z",
    "version": 0
}
```

2. Listar las evaluaciones de una lección específica.

GET "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones" ADMIN, INSTRUCTOR dueño del curso o USUARIO inscrito.

Respuesta:

```json
[
    {
        "id": "68eb177a65e470167c9b2694",
        "idLeccion": "68eb132a65e470167c9b2691",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Evaluacion 1 Leccion 1",
        "descripcion": null,
        "tipo": "QUIZ",
        "estado": "BORRADOR",
        "publishedAt": null,
        "puntajeMaximo": 100,
        "notaAprobatoria": null,
        "maxIntentos": null,
        "minSegundosEntreIntentos": null,
        "timeLimitSeconds": null,
        "disponibleDesde": null,
        "disponibleHasta": null,
        "dueAt": null,
        "permitirEntregaTardia": null,
        "penalizacionTardiaPct": null,
        "bancoPreguntasId": null,
        "totalPreguntas": null,
        "barajarPreguntas": null,
        "barajarOpciones": null,
        "politicaResultado": "SOLO_PUNTAJE",
        "autoCalificable": null,
        "requiereRevisionManual": null,
        "createdAt": "2025-10-12T02:50:34.133Z",
        "updatedAt": "2025-10-12T02:50:34.133Z",
        "version": 0
    },
    {
        "id": "68eb178865e470167c9b2695",
        "idLeccion": "68eb132a65e470167c9b2691",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Evaluacion 1 Leccion 2",
        "descripcion": null,
        "tipo": "QUIZ",
        "estado": "BORRADOR",
        "publishedAt": null,
        "puntajeMaximo": 100,
        "notaAprobatoria": null,
        "maxIntentos": null,
        "minSegundosEntreIntentos": null,
        "timeLimitSeconds": null,
        "disponibleDesde": null,
        "disponibleHasta": null,
        "dueAt": null,
        "permitirEntregaTardia": null,
        "penalizacionTardiaPct": null,
        "bancoPreguntasId": null,
        "totalPreguntas": null,
        "barajarPreguntas": null,
        "barajarOpciones": null,
        "politicaResultado": "SOLO_PUNTAJE",
        "autoCalificable": null,
        "requiereRevisionManual": null,
        "createdAt": "2025-10-12T02:50:48.494Z",
        "updatedAt": "2025-10-12T02:50:48.494Z",
        "version": 0
    },
    {
        "id": "68eb178d65e470167c9b2696",
        "idLeccion": "68eb132a65e470167c9b2691",
        "idModulo": "68eb0dddea8b8f7803e2c159",
        "idCurso": "68ea92e1191fd0807b87f8c5",
        "titulo": "Evaluacion 1 Leccion 3",
        "descripcion": null,
        "tipo": "QUIZ",
        "estado": "BORRADOR",
        "publishedAt": null,
        "puntajeMaximo": 100,
        "notaAprobatoria": null,
        "maxIntentos": null,
        "minSegundosEntreIntentos": null,
        "timeLimitSeconds": null,
        "disponibleDesde": null,
        "disponibleHasta": null,
        "dueAt": null,
        "permitirEntregaTardia": null,
        "penalizacionTardiaPct": null,
        "bancoPreguntasId": null,
        "totalPreguntas": null,
        "barajarPreguntas": null,
        "barajarOpciones": null,
        "politicaResultado": "SOLO_PUNTAJE",
        "autoCalificable": null,
        "requiereRevisionManual": null,
        "createdAt": "2025-10-12T02:50:53.107Z",
        "updatedAt": "2025-10-12T02:50:53.107Z",
        "version": 0
    }
]
```

3. Listar una evaluacion específica por leccion ID y Evaluacion ID.

GET "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696" ADMIN, INSTRUCTOR dueño del curso o USUARIO inscrito.

Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Evaluacion 1 Leccion 3",
    "descripcion": null,
    "tipo": "QUIZ",
    "estado": "BORRADOR",
    "publishedAt": null,
    "puntajeMaximo": 100,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107Z",
    "updatedAt": "2025-10-12T02:50:53.107Z",
    "version": 0
}
```

4. Actualizar evaluaciones por id leccion e id evaluacion.

PUT "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "titulo": "Quiz Leccion 3 (actualizado)",
  "tipo": "tarea",         
  "puntajeMaximo": 100
}

```
Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Quiz Leccion 3 (actualizado)",
    "descripcion": null,
    "tipo": "TAREA",
    "estado": "BORRADOR",
    "publishedAt": null,
    "puntajeMaximo": 100,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107Z",
    "updatedAt": "2025-10-12T02:56:05.655114700Z",
    "version": 1
}
```

5. Actualizar parámetros específicos de una evaluación.

PATCH "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{ "puntajeMaximo": 120 }
```
Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Quiz Leccion 3 (actualizado)",
    "descripcion": null,
    "tipo": "TAREA",
    "estado": "BORRADOR",
    "publishedAt": null,
    "puntajeMaximo": 120,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107Z",
    "updatedAt": "2025-10-12T02:57:08.475328500Z",
    "version": 2
}
```

6. Publicar una evaluación por ID lección e ID evaluación.

PATCH "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696/publicar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Quiz Leccion 3 (actualizado)",
    "descripcion": null,
    "tipo": "TAREA",
    "estado": "PUBLICADA",
    "publishedAt": "2025-10-12T02:58:00.858693800Z",
    "puntajeMaximo": 120,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107Z",
    "updatedAt": "2025-10-12T02:58:00.858693800Z",
    "version": 3
}
```

7. Archivar una evaluación.

PATCH "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696/archivar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb178d65e470167c9b2696",
    "idLeccion": "68eb132a65e470167c9b2691",
    "idModulo": "68eb0dddea8b8f7803e2c159",
    "idCurso": "68ea92e1191fd0807b87f8c5",
    "titulo": "Quiz Leccion 3 (actualizado)",
    "descripcion": null,
    "tipo": "TAREA",
    "estado": "ARCHIVADA",
    "publishedAt": "2025-10-12T02:58:00.858Z",
    "puntajeMaximo": 120,
    "notaAprobatoria": null,
    "maxIntentos": null,
    "minSegundosEntreIntentos": null,
    "timeLimitSeconds": null,
    "disponibleDesde": null,
    "disponibleHasta": null,
    "dueAt": null,
    "permitirEntregaTardia": null,
    "penalizacionTardiaPct": null,
    "bancoPreguntasId": null,
    "totalPreguntas": null,
    "barajarPreguntas": null,
    "barajarOpciones": null,
    "politicaResultado": "SOLO_PUNTAJE",
    "autoCalificable": null,
    "requiereRevisionManual": null,
    "createdAt": "2025-10-12T02:50:53.107Z",
    "updatedAt": "2025-10-12T02:58:57.188940400Z",
    "version": 4
}
```

8. Eliminar una evaluación. 

DELETE "http://localhost:8080/api/v1/lecciones/68eb132a65e470167c9b2691/evaluaciones/68eb178d65e470167c9b2696" ADMIN o INSTRUCTOR dueño del curso.


INTENTO

1. Crear un intento.

POST "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos" ADMIN o USUARIO inscrito al curso.

Cuerpo:
```json
{
  "timeLimitSeconds": 600,
  "puntajeMaximo": 10.0
}
```
Respuesta:

```json
{
    "id": "68eb1a9065e470167c9b2697",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8828191fd0807b87f8bf",
    "nroIntento": 1,
    "estado": "EN_PROGRESO",
    "createdAt": "2025-10-12T03:03:44.207571500Z",
    "enviadoEn": null,
    "calificadoAt": null,
    "updatedAt": "2025-10-12T03:03:44.207571500Z",
    "timeLimitSeconds": 600,
    "usedTimeSeconds": 0,
    "puntaje": 0,
    "puntajeMaximo": 10.0,
    "respuestas": null,
    "version": 0,
    "idCalificacion": null
}
```

2. Enviar intento.

POST "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/68eb207c65e470167c9b269b/entregar" ADMIN o USUARIO inscrito al curso.

Respuesta:

```json
{
    "id": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "nroIntento": 1,
    "estado": "ENVIADO",
    "createdAt": "2025-10-12T03:29:00.550Z",
    "enviadoEn": "2025-10-12T03:33:29.120378100Z",
    "calificadoAt": null,
    "updatedAt": "2025-10-12T03:33:29.269348800Z",
    "timeLimitSeconds": 600,
    "usedTimeSeconds": 0,
    "puntaje": 0,
    "puntajeMaximo": 10.0,
    "respuestas": [
        {
            "idPregunta": "66f1a2b3c4d5e6f701",
            "opciones": [
                "A"
            ],
            "textoLibre": null,
            "puntaje": 1.0,
            "tiempoSegundos": 35
        },
        {
            "idPregunta": "66f1a2b3c4d5e6f702",
            "opciones": [
                "B",
                "D"
            ],
            "textoLibre": null,
            "puntaje": 0.0,
            "tiempoSegundos": 50
        },
        {
            "idPregunta": "66f1a2b3c4d5e6f703",
            "opciones": [],
            "textoLibre": "París",
            "puntaje": 1.0,
            "tiempoSegundos": 20
        }
    ],
    "version": 1,
    "idCalificacion": null
}
```

3. Listar intentos en progreso.

GET "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
[
    {
        "id": "68eb1a9065e470167c9b2697",
        "idEvaluacion": "68eb177a65e470167c9b2694",
        "idEstudiante": "68ea8828191fd0807b87f8bf",
        "nroIntento": 1,
        "estado": "EN_PROGRESO",
        "createdAt": "2025-10-12T03:03:44.207Z",
        "enviadoEn": null,
        "calificadoAt": null,
        "updatedAt": "2025-10-12T03:03:44.207Z",
        "timeLimitSeconds": 600,
        "usedTimeSeconds": 0,
        "puntaje": 0,
        "puntajeMaximo": 10.0,
        "respuestas": null,
        "version": 0,
        "idCalificacion": null
    }
]
```

4. Listar todos los intentos.

GET "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/todos" ADMIN, INSTRUCTOR o USUARIO inscrito al curso.

Respuesta:

```json
[
    {
        "id": "68eb207c65e470167c9b269b",
        "idEvaluacion": "68eb177a65e470167c9b2694",
        "idEstudiante": "68ea8840191fd0807b87f8c0",
        "nroIntento": 1,
        "estado": "EN_PROGRESO",
        "createdAt": "2025-10-12T03:29:00.550Z",
        "enviadoEn": null,
        "calificadoAt": null,
        "updatedAt": "2025-10-12T03:29:00.550Z",
        "timeLimitSeconds": 600,
        "usedTimeSeconds": 0,
        "puntaje": 0,
        "puntajeMaximo": 10.0,
        "respuestas": null,
        "version": 0,
        "idCalificacion": null
    },
    {
        "id": "68eb1a9065e470167c9b2697",
        "idEvaluacion": "68eb177a65e470167c9b2694",
        "idEstudiante": "68ea8828191fd0807b87f8bf",
        "nroIntento": 1,
        "estado": "EN_PROGRESO",
        "createdAt": "2025-10-12T03:03:44.207Z",
        "enviadoEn": null,
        "calificadoAt": null,
        "updatedAt": "2025-10-12T03:03:44.207Z",
        "timeLimitSeconds": 600,
        "usedTimeSeconds": 0,
        "puntaje": 0,
        "puntajeMaximo": 10.0,
        "respuestas": null,
        "version": 0,
        "idCalificacion": null
    }
]
```

5. Listar intento específico.

GET "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/68eb1a9065e470167c9b2697" ADMIN, INSTRUCTOR o USUARIO inscrito al curso.

Respuesta:

```json
{
    "id": "68eb1a9065e470167c9b2697",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8828191fd0807b87f8bf",
    "nroIntento": 1,
    "estado": "EN_PROGRESO",
    "createdAt": "2025-10-12T03:03:44.207Z",
    "enviadoEn": null,
    "calificadoAt": null,
    "updatedAt": "2025-10-12T03:03:44.207Z",
    "timeLimitSeconds": 600,
    "usedTimeSeconds": 0,
    "puntaje": 0,
    "puntajeMaximo": 10.0,
    "respuestas": null,
    "version": 0,
    "idCalificacion": null
}
```

6. Actualizar un intento en progreso.

PUT "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/68eb1f4465e470167c9b269a" ADMIN o USUARIO inscrito al curso.

Cuerpo:
```json
{
  "respuestas": [
    {
      "idPregunta": "66f1a2b3c4d5e6f701",
      "opciones": ["A"],                // para opción única
      "textoLibre": null,               // o un string si es abierta
      "puntaje": 1.0,                   // BigDecimal
      "tiempoSegundos": 35
    },
    {
      "idPregunta": "66f1a2b3c4d5e6f702",
      "opciones": ["B","D"],            // para opción múltiple
      "textoLibre": null,
      "puntaje": 0.0,
      "tiempoSegundos": 50
    },
    {
      "idPregunta": "66f1a2b3c4d5e6f703",
      "opciones": [],                   // pregunta abierta
      "textoLibre": "París",
      "puntaje": 1.0,
      "tiempoSegundos": 20
    }
  ],
  "usedTimeSeconds": 105
}

```
Respuesta:

```json
{
    "id": "68eb1f4465e470167c9b269a",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "nroIntento": 1,
    "estado": "EN_PROGRESO",
    "createdAt": "2025-10-12T03:23:48.795Z",
    "enviadoEn": null,
    "calificadoAt": null,
    "updatedAt": "2025-10-12T03:25:23.566630400Z",
    "timeLimitSeconds": 600,
    "usedTimeSeconds": 105,
    "puntaje": 0,
    "puntajeMaximo": 10.0,
    "respuestas": [
        {
            "idPregunta": "66f1a2b3c4d5e6f701",
            "opciones": [
                "A"
            ],
            "textoLibre": null,
            "puntaje": 1.0,
            "tiempoSegundos": 35
        },
        {
            "idPregunta": "66f1a2b3c4d5e6f702",
            "opciones": [
                "B",
                "D"
            ],
            "textoLibre": null,
            "puntaje": 0.0,
            "tiempoSegundos": 50
        },
        {
            "idPregunta": "66f1a2b3c4d5e6f703",
            "opciones": [],
            "textoLibre": "París",
            "puntaje": 1.0,
            "tiempoSegundos": 20
        }
    ],
    "version": 1,
    "idCalificacion": null
}
```

7. Actualizaciónn parcial de un intento en progreso.

PATCH "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/68eb1f4465e470167c9b269a" ADMIN o USUARIO inscrito al curso.

Cuerpo:
```json
{
  "respuestas": [
    {
      "idPregunta": "66f1a2b3c4d5e6f701",
      "opciones": ["C"],
      "textoLibre": null,
      "puntaje": 0.0,
      "tiempoSegundos": 40
    }
  ]
}

```
Respuesta:

```json
{
    "id": "68eb1f4465e470167c9b269a",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "nroIntento": 1,
    "estado": "EN_PROGRESO",
    "createdAt": "2025-10-12T03:23:48.795Z",
    "enviadoEn": null,
    "calificadoAt": null,
    "updatedAt": "2025-10-12T03:26:44.056639100Z",
    "timeLimitSeconds": 600,
    "usedTimeSeconds": 105,
    "puntaje": 0,
    "puntajeMaximo": 10.0,
    "respuestas": [
        {
            "idPregunta": "66f1a2b3c4d5e6f701",
            "opciones": [
                "C"
            ],
            "textoLibre": null,
            "puntaje": 0.0,
            "tiempoSegundos": 40
        }
    ],
    "version": 2,
    "idCalificacion": null
}
```

8. Eliminar un inteno en progreso.

DELETE "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/intentos/68eb1f4465e470167c9b269a" ADMIN o INSTRUCTOR dueño del curso.


CALIFICACION 

1. Calificar un intento.

POST "http://localhost:8080/api/v1/intentos/68eb207c65e470167c9b269b/calificacion" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "puntaje": 8,
  "feedback": "Buen intento, corrige conceptos"
}
```
Respuesta:

```json
{
    "id": "68eb22aa65e470167c9b269c",
    "idIntento": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PENDIENTE",
    "calificadoAt": null,
    "puntaje": 8,
    "puntajeMaximo": 10.0,
    "porcentaje": 80.00,
    "notaCorte": null,
    "aprobado": null,
    "feedback": "Buen intento, corrige conceptos",
    "calificadoPor": "68ea8828191fd0807b87f8bf",
    "rubrica": null,
    "createdAt": "2025-10-12T03:38:18.172529700Z",
    "updatedAt": "2025-10-12T03:38:18.172529700Z",
    "version": 0
}
```

2. Listar calificaciones por ID intento.

GET "http://localhost:8080/api/v1/intentos/68eb207c65e470167c9b269b/calificacion" ADMIN, INSTRUCTOR dueño del curso o USUARIO que envió el intento.

Respuesta:

```json
{
    "id": "68eb22aa65e470167c9b269c",
    "idIntento": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PENDIENTE",
    "calificadoAt": null,
    "puntaje": 8,
    "puntajeMaximo": 10.0,
    "porcentaje": 80.00,
    "notaCorte": null,
    "aprobado": null,
    "feedback": "Buen intento, corrige conceptos",
    "calificadoPor": "68ea8828191fd0807b87f8bf",
    "rubrica": null,
    "createdAt": "2025-10-12T03:38:18.172Z",
    "updatedAt": "2025-10-12T03:38:18.172Z",
    "version": 0
}
```

3. Listar califcación por ID.

GET "http://localhost:8080/api/v1/calificaciones/68eb22aa65e470167c9b269c" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb22aa65e470167c9b269c",
    "idIntento": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PENDIENTE",
    "calificadoAt": null,
    "puntaje": 8,
    "puntajeMaximo": 10.0,
    "porcentaje": 80.00,
    "notaCorte": null,
    "aprobado": null,
    "feedback": "Buen intento, corrige conceptos",
    "calificadoPor": "68ea8828191fd0807b87f8bf",
    "rubrica": null,
    "createdAt": "2025-10-12T03:38:18.172Z",
    "updatedAt": "2025-10-12T03:38:18.172Z",
    "version": 0
}
```

4. Listar calificaciones de una evaluación.

GET "http://localhost:8080/api/v1/evaluaciones/68eb177a65e470167c9b2694/calificaciones" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
[
    {
        "id": "68eb22aa65e470167c9b269c",
        "idIntento": "68eb207c65e470167c9b269b",
        "idEvaluacion": "68eb177a65e470167c9b2694",
        "idEstudiante": "68ea8840191fd0807b87f8c0",
        "estado": "PENDIENTE",
        "calificadoAt": null,
        "puntaje": 8,
        "puntajeMaximo": 10.0,
        "porcentaje": 80.00,
        "notaCorte": null,
        "aprobado": null,
        "feedback": "Buen intento, corrige conceptos",
        "calificadoPor": "68ea8828191fd0807b87f8bf",
        "rubrica": null,
        "createdAt": "2025-10-12T03:38:18.172Z",
        "updatedAt": "2025-10-12T03:38:18.172Z",
        "version": 0
    }
]
```

5. Actualizar una calificación.

PATCH "http://localhost:8080/api/v1/calificaciones/68eb22aa65e470167c9b269c" ADMIN o INSTRUCTOR dueño del curso.

Cuerpo:
```json
{
  "puntaje": 9,
  "feedback": "Corregido tras revisión."
}

```
Respuesta:

```json
{
    "id": "68eb22aa65e470167c9b269c",
    "idIntento": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PENDIENTE",
    "calificadoAt": null,
    "puntaje": 9,
    "puntajeMaximo": 10.0,
    "porcentaje": 90.00,
    "notaCorte": null,
    "aprobado": null,
    "feedback": "Corregido tras revisión.",
    "calificadoPor": "68ea8828191fd0807b87f8bf",
    "rubrica": null,
    "createdAt": "2025-10-12T03:38:18.172Z",
    "updatedAt": "2025-10-12T03:45:39.854605400Z",
    "version": 1
}
```

6. Publicar calificación.

PATCH "http://localhost:8080/api/v1/calificaciones/68eb22aa65e470167c9b269c/publicar" ADMIN o INSTRUCTOR dueño del curso.

Respuesta:

```json
{
    "id": "68eb22aa65e470167c9b269c",
    "idIntento": "68eb207c65e470167c9b269b",
    "idEvaluacion": "68eb177a65e470167c9b2694",
    "idEstudiante": "68ea8840191fd0807b87f8c0",
    "estado": "PUBLICADA",
    "calificadoAt": "2025-10-12T03:46:56.017564Z",
    "puntaje": 9,
    "puntajeMaximo": 10.0,
    "porcentaje": 90.00,
    "notaCorte": null,
    "aprobado": null,
    "feedback": "Corregido tras revisión.",
    "calificadoPor": "68ea8828191fd0807b87f8bf",
    "rubrica": null,
    "createdAt": "2025-10-12T03:38:18.172Z",
    "updatedAt": "2025-10-12T03:46:56.017564Z",
    "version": 2
}
```

7. Eliminar una calificación.

DELETE "http://localhost:8080/api/v1/calificaciones/68eb22aa65e470167c9b269c" ADMIN o INSTRUCTOR dueño del curso.



CERTIFICADO

1.
POST

Cuerpo:
```json

```
Respuesta:

```json

```


2.
GET

Respuesta:

```json

```

3.
GET

Respuesta:

```json

```

4.
GET

Respuesta:

```json

```

5.
GET

Respuesta:

```json

```

6.
GET

Respuesta:

```json

```

7.
DELETE