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


Verifica que la base (cursosonline en el ejemplo) exista o que Spring la cree al arrancar.

Precisión de decimales: Este proyecto mapea importes y puntajes como Decimal128 en Mongo (@Field(targetType = FieldType.DECIMAL128)) y BigDecimal en Java. En JSON puedes enviar números decimales normales (o strings si prefieres), y Spring los deserializa a BigDecimal con precisión.

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

11) Matriz de permisos (resumen)
Recurso/Acción	Dueño (estudiante)	Instructor del curso	ADMIN
Ver pagos de una inscripción	✔️ (suya)	✔️	✔️
Crear/editar/eliminar borrador de pago	✔️	❌	✔️ (vía admin si procede)
Aceptar pago (checkout)	✔️	❌	✔️
Aprobar/Capturar pago	❌	✔️	✔️
Ver/emitir/revocar certificado	Dueño: ver	✔️ (emitir/revocar/ver)	✔️
Crear/editar curso	N/A	✔️ (si curso no PUBLICADO)	✔️
Publicar/archivar módulo/lección/evaluación	❌	✔️	✔️
Intentos (crear/editar en progreso, entregar)	✔️ (si inscrito y visible)	❌	✔️ (operaciones administrativas)
Calificar intento	❌	✔️ (bloquea si cadena archivada)	✔️
Usuarios (listar/editar/estado/eliminar)	❌	❌	✔️
Cambiar propia contraseña	✔️ (@seguridadUtil.esMismoUsuario)	✔️ (si aplica)	✔️

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
