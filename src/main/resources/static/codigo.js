/* =========================================================
   DEMO DOM + API de Cursos + Navbar dinámico (frontend only)
   ADAPTADO a tu backend real:
   - GET /api/v1/cursos devuelve PageResponse {content, totalElements, totalPages, ...}
   - No-admin: listar solo PUBLICADO (según tu controlador)
   - PUT/PATCH/DELETE protegidos (dueño o admin)
   - Formulario de contacto con validación básica (HTML5 + JS)
   - Parche de menú: garantiza que "Formulario" aparezca sin tocar backend
   - (Opcional) Registro de usuario: si existe paginas/registro.html
   ========================================================= */

/* ==========================
   CONFIG (mismo origen)
   ========================== */
const MENU_API   = "api/menu";
const CURSOS_API = "api/v1/cursos";

// Publicar automáticamente tras crear para que aparezca en la lista de no-admin
const AUTO_PUBLICAR_TRAS_CREAR = true;

// Endpoint para el formulario de contacto (puedes cambiar por enviar.php si quieres)
const FORM_API = "api/formulario";

// Endpoint real de tu API para registrar (AuthControlador)
const AUTH_REGISTER = "api/auth/register";

// JWT opcional (si tu API lo exige para POST/PUT/PATCH/DELETE)
// localStorage.setItem('jwt','TU_TOKEN_JWT');
function getJwt() { return localStorage.getItem("jwt") || null; }
function authHeaders(extra = {}) {
  const t = getJwt();
  const base = { Accept: "application/json", "Content-Type": "application/json" };
  return t ? { ...base, Authorization: `Bearer ${t}`, ...extra } : { ...base, ...extra };
}

/* ==========================
   HELPERS FRONTEND
   ========================== */
const DEFAULT_INSTRUCTOR_ID = "instructor01";
function parseJwt(token) {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch { return null; }
}
function currentInstructorId() {
  const t = getJwt();
  if (!t) return DEFAULT_INSTRUCTOR_ID;
  const p = parseJwt(t) || {};
  return p.userId || p.uid || p.id || p.sub || p.username || p.name || DEFAULT_INSTRUCTOR_ID;
}

/* =========================================================
   MENÚ: FUSIÓN CON API + GARANTÍA DE "FORMULARIO" SIN BACKEND
   ========================================================= */
const FALLBACK_MENU = [
  { nombre: "Inicio",          url: "paginas/inicio.html",        orden: 1 },
  { nombre: "Misión & Visión", url: "paginas/mision-vision.html", orden: 2 },
  { nombre: "Contacto",        url: "paginas/contacto.html",      orden: 3 },
  { nombre: "Formulario",      url: "paginas/formulario.html",    orden: 4 },
  { nombre: "Registro",        url: "paginas/registro.html",      orden: 5 } // ← nuevo
];


// Asegura "Formulario" siempre y "Registro" solo si el archivo existe.
async function ensureMenuCompleto(apiItems = []) {
  // Normaliza items del backend
  const list = apiItems.map((it, i) => ({
    nombre: it?.nombre ?? `Item ${i + 1}`,
    url:    it?.url    ?? "#",
    orden:  Number.isFinite(it?.orden) ? it.orden : (i + 1)
  }));

  // 1) Garantizar "Formulario"
  const FORM_URL = "paginas/formulario.html";
  const tieneFormulario = list.some(x => (x.url || "").toLowerCase() === FORM_URL);
  if (!tieneFormulario) {
    const maxOrden = list.reduce((m, x) => Math.max(m, Number(x.orden) || 0), 0);
    list.push({ nombre: "Formulario", url: FORM_URL, orden: (maxOrden || 0) + 1 });
  }

  // 2) Añadir "Registro" si el archivo existe
  const REG_URL = "paginas/registro.html";
  let tieneRegistro = list.some(x => (x.url || "").toLowerCase() === REG_URL);
  if (!tieneRegistro) {
    try {
      const u = new URL(REG_URL, document.baseURI);
      // HEAD no siempre está habilitado; si falla, hacemos GET ligero
      let r = await fetch(u, { method: "HEAD", cache: "no-cache" });
      if (!r.ok) r = await fetch(u, { cache: "no-cache" });
      if (r.ok) {
        const maxOrden = list.reduce((m, x) => Math.max(m, Number(x.orden) || 0), 0);
        list.push({ nombre: "Registro", url: REG_URL, orden: (maxOrden || 0) + 1 });
      }
    } catch { /* ignorar: si no existe el archivo, no se agrega */ }
  }

  // Ordenar por 'orden' si todos lo traen; si no, por nombre
  const hasOrden = list.every(x => Number.isFinite(x.orden));
  list.sort((a, b) => hasOrden ? (a.orden - b.orden)
                               : a.nombre.localeCompare(b.nombre, "es"));

  // Quitar duplicados por URL
  const seen = new Set(); const dedup = [];
  for (const it of list) {
    const key = (it.url || "").toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); dedup.push(it); }
  }
  return dedup;
}


/* ==========================
   NAVEGACIÓN + MENÚ DINÁMICO
   ========================== */
const $menu = document.getElementById("menu_principal");
const $btnMenuRefresh = document.getElementById("btn-menu-refresh");
const $chkMenuAuto = document.getElementById("chk-menu-autorefresh");

async function cargarPagina(pagina, pushState = true) {
  try {
    if (!/\.html(\?.*)?$/i.test(pagina)) throw new Error(`Solo .html (recibí: ${pagina})`);
    const resolved = new URL(pagina, document.baseURI).href;
    const resp = await fetch(resolved, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} al pedir ${resolved}`);
    const html = await resp.text();
    document.getElementById("pagina").innerHTML = html;

    // Hooks: inicializar lógicas si la página cargada las tiene
    if (typeof initFormularioSiExiste === "function")      initFormularioSiExiste();
    if (typeof initRegistroFormSiExiste === "function")    initRegistroFormSiExiste();

    setActiveMenu(pagina);
    if (pushState) history.pushState({ url: pagina }, "", `#${pagina}`);
  } catch (e) {
    document.getElementById("pagina").innerHTML =
`<pre style="white-space:pre-wrap;color:#b00020;background:#fff3f3;border-radius:8px;padding:12px">
Error: no se pudo cargar la página.
Detalles: ${e.message}
BaseURI: ${document.baseURI}
Ruta solicitada: ${pagina}
</pre>`;
    console.error("[cargarPagina] fallo:", e);
  }
}

function renderMenu(items) {
  $menu.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.nombre;
    a.href = `#${item.url}`;
    a.dataset.url = item.url;
    li.appendChild(a);
    $menu.appendChild(li);
  });
}

async function cargarMenu() {
  try {
    const res = await fetch(MENU_API, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const apiItems = await res.json();
    const items = await ensureMenuCompleto(apiItems);   // ← aquí
    renderMenu(items);
  } catch (err) {
    console.warn("Menu API no disponible, usando fallback.", err);
    renderMenu(FALLBACK_MENU); // El fallback ya incluye "Registro"
  }
}


$menu.addEventListener("click", (ev) => {
  const liOrA = ev.target.closest("li, a[data-url]");
  if (!liOrA) return;
  const a = liOrA.matches("a[data-url]") ? liOrA : liOrA.querySelector("a[data-url]");
  if (!a) return;
  ev.preventDefault();
  cargarPagina(a.dataset.url);
});

function setActiveMenu(url) {
  $menu.querySelectorAll("a[data-url]").forEach(a => {
    a.classList.toggle("active", a.dataset.url === url);
  });
}

function initMenuToggle() {
  const btn = document.getElementById("menuToggle");
  if (!btn) return;
  btn.addEventListener("click", () => $menu.classList.toggle("show"));
}

$btnMenuRefresh.addEventListener("click", cargarMenu);
setInterval(() => { if ($chkMenuAuto.checked) cargarMenu(); }, 10000);

window.addEventListener("popstate", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});
window.addEventListener("hashchange", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});

/* ==========================
   DOM + API CURSOS (ADAPTADO)
   ========================== */
// Selección (rubro de la rúbrica)
const titulo       = document.getElementById("titulo-pagina");
const descripcion  = document.querySelector(".descripcion");
const listaCursos  = document.getElementById("lista-cursos");
const nombreInput  = document.getElementById("curso-nombre");
const descInput    = document.getElementById("curso-desc");
const btnCrear     = document.getElementById("btn-crear");
const btnEliminarU = document.getElementById("btn-eliminar-ultimo");
const btnColor     = document.getElementById("btn-cambiar-color");
const btnActualizar= document.getElementById("btn-actualizar");
const btnToggleVis = document.getElementById("btn-toggle-visibility");
const chkAuto      = document.getElementById("chk-autorefresh");

// Demostración de selección por tag/class
const todosLosBotones = document.getElementsByTagName("button");
const descripciones   = document.getElementsByClassName("descripcion");

// Estilos dinámicos del título (mouseover/out)
titulo.addEventListener("mouseover", () => { titulo.style.color = "yellow"; });
titulo.addEventListener("mouseout",  () => { titulo.style.color = "white";  });
if (descripcion) descripcion.style.fontSize = "16px";

// Estado simple de paginación (coincide con tu PageResponse)
const paging = {
  page: 0,
  size: 5,
  totalPages: 0,
  totalElements: 0
};

// Controles de paginación (creados dinámicamente)
let $paginacion = null;
function ensurePaginacionUI() {
  if ($paginacion) return;
  $paginacion = document.createElement("div");
  $paginacion.style.marginTop = "10px";
  $paginacion.style.display = "flex";
  $paginacion.style.alignItems = "center";
  $paginacion.style.gap = "8px";

  const btnPrev = document.createElement("button");
  btnPrev.textContent = "« Anterior";
  btnPrev.addEventListener("click", async () => {
    if (paging.page > 0) { paging.page--; await listarCursosAPI(); }
  });

  const btnNext = document.createElement("button");
  btnNext.textContent = "Siguiente »";
  btnNext.addEventListener("click", async () => {
    if (paging.page < paging.totalPages - 1) { paging.page++; await listarCursosAPI(); }
  });

  const info = document.createElement("span");
  info.id = "page-info";

  $paginacion.appendChild(btnPrev);
  $paginacion.appendChild(info);
  $paginacion.appendChild(btnNext);
  listaCursos.parentElement.appendChild($paginacion);
}
function renderInfoPaginacion() {
  const info = document.getElementById("page-info");
  if (!info) return;
  info.textContent = `Página ${paging.page + 1} de ${Math.max(paging.totalPages, 1)} — ${paging.totalElements} curso(s)`;
}

// Título dinámico con total
function actualizarTitulo() {
  titulo.textContent = `Página de prueba (DOM + API de Cursos) — ${paging.totalElements} curso(s)`;
}

/** Renderiza cursos (con botones: Editar, Publicar, Archivar, Eliminar) */
function renderCursos(cursos = []) {
  listaCursos.innerHTML = "";
  (cursos || []).forEach(c => {
    const li = document.createElement("li");
    li.classList.add("curso");

    const texto = document.createElement("span");
    const title = c.titulo ?? c.nombre ?? "(sin título)";
    const desc  = c.descripcion ? ` — ${c.descripcion}` : "";
    texto.innerText = `${title}${desc}`;

    const badge = document.createElement("span");
    badge.classList.add("badge-id");
    badge.innerText = c.id ? `id: ${c.id}` : "";

    const acciones = document.createElement("div");
    acciones.classList.add("acciones");

    // EDITAR (PUT)
    const btnEdit = document.createElement("button");
    btnEdit.innerText = "Editar (API)";
    btnEdit.addEventListener("click", async () => {
      await editarCursoUI(c);
    });

    // PUBLICAR (PATCH /{id}/publicar)
    const btnPub = document.createElement("button");
    btnPub.innerText = "Publicar (API)";
    btnPub.addEventListener("click", async () => {
      await publicarCursoAPI(c.id);
      await listarCursosAPI();
    });

    // ARCHIVAR (PATCH /{id}/archivar)
    const btnArc = document.createElement("button");
    btnArc.innerText = "Archivar (API)";
    btnArc.addEventListener("click", async () => {
      await archivarCursoAPI(c.id);
      await listarCursosAPI();
    });

    // ELIMINAR (DELETE)
    const btnDel = document.createElement("button");
    btnDel.innerText = "Eliminar (API)";
    btnDel.addEventListener("click", async () => {
      if (!c.id) return alert("No hay id para eliminar en la API.");
      if (!confirm(`¿Eliminar curso "${title}"?`)) return;
      await eliminarCursoAPI(c.id);
      await listarCursosAPI();
    });

    acciones.appendChild(btnEdit);
    acciones.appendChild(btnPub);
    acciones.appendChild(btnArc);
    acciones.appendChild(btnDel);
    li.appendChild(texto);
    li.appendChild(badge);
    li.appendChild(acciones);
    listaCursos.appendChild(li);
  });

  // Un pequeño estilo en los ítems
  const lis = listaCursos.getElementsByTagName("li");
  for (let i = 0; i < lis.length; i++) lis[i].style.borderColor = "#ccc";
}

/** GET cursos → PageResponse */
async function listarCursosAPI() {
  try {
    ensurePaginacionUI();
    const qs = new URLSearchParams({ page: String(paging.page), size: String(paging.size) });
    const res = await fetch(`${CURSOS_API}?${qs.toString()}`, { headers: authHeaders() });
    if (res.status === 204) {
      paging.totalElements = 0; paging.totalPages = 1;
      renderCursos([]); actualizarTitulo(); renderInfoPaginacion(); return;
    }
    if (!res.ok) throw new Error(`GET cursos: ${res.status}`);
    const data = await res.json();

    const arr = Array.isArray(data?.content) ? data.content : [];
    paging.page = Number.isFinite(data?.page) ? data.page : paging.page;
    paging.size = Number.isFinite(data?.size) ? data.size : paging.size;
    paging.totalElements = Number.isFinite(data?.totalElements) ? data.totalElements : arr.length;
    paging.totalPages = Number.isFinite(data?.totalPages) ? data.totalPages : 1;

    actualizarTitulo();
    renderCursos(arr);
    renderInfoPaginacion();
  } catch (e) {
    console.error(e);
    renderCursos([]);
  }
}

/** POST curso (usa tu DTO CrearCursoRequest) */
async function crearCursoAPI(nombre, descripcion) {
  try {
    if (!nombre || nombre.trim().length < 3) {
      alert("El título debe tener al menos 3 caracteres."); return null;
    }
    const payload = {
      titulo: nombre.trim(),
      descripcion: (descripcion || "").trim() || null,
      categoria: "GENERAL",
      nivel: "PRINCIPIANTE",
      idioma: "es-EC",
      precio: 0
    };

    const res = await fetch(CURSOS_API, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`POST curso: ${res.status} ${txt}`);
    }
    const creado = await res.json();

    if (AUTO_PUBLICAR_TRAS_CREAR && creado?.id) {
      try { await publicarCursoAPI(creado.id); } catch (e) { console.warn("No se pudo publicar automáticamente:", e?.message || e); }
    }
    return creado;
  } catch (e) {
    console.error(e);
    alert("No se pudo crear el curso. Revisa JWT/seguridad y el payload.");
    return null;
  }
}

/** PUT curso (Actualiza con tu DTO ActualizarCursoRequest) */
async function actualizarCursoAPI(id, { titulo, descripcion, categoria, nivel, idioma, precio }) {
  const payload = { titulo, descripcion, categoria, nivel, idioma, precio };
  const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PUT curso: ${res.status} ${txt}`);
  }
  return await res.json();
}

/** PATCH estado (genérico) -> /{id}/estado con {estado} */
async function patchEstadoCursoAPI(id, estado) {
  const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ estado })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PATCH estado: ${res.status} ${txt}`);
  }
  return await res.json();
}

/** PATCH publicar (sin body) -> /{id}/publicar */
async function publicarCursoAPI(id) {
  const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}/publicar`, {
    method: "PATCH",
    headers: authHeaders()
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PATCH publicar: ${res.status} ${txt}`);
  }
  return await res.json();
}

/** PATCH archivar (sin body) -> /{id}/archivar */
async function archivarCursoAPI(id) {
  const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}/archivar`, {
    method: "PATCH",
    headers: authHeaders()
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PATCH archivar: ${res.status} ${txt}`);
  }
  return await res.json();
}

/** DELETE */
async function eliminarCursoAPI(id) {
  const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!res.ok && res.status !== 204 && res.status !== 200) {
    const txt = await res.text().catch(() => "");
    throw new Error(`DELETE curso: ${res.status} ${txt}`);
  }
}

/* ===== UI para EDITAR (prompt rápido sin tocar HTML) ===== */
async function editarCursoUI(curso) {
  try {
    const titulo = prompt("Título:", curso.titulo ?? "");
    if (titulo == null) return;
    const descripcion = prompt("Descripción:", curso.descripcion ?? "");
    if (descripcion == null) return;
    const categoria = prompt("Categoria:", curso.categoria ?? "GENERAL");
    if (categoria == null) return;
    const nivel = prompt("Nivel (PRINCIPIANTE/INTERMEDIO/AVANZADO):", curso.nivel ?? "PRINCIPIANTE");
    if (nivel == null) return;
    const idioma = prompt("Idioma (es o es-EC):", curso.idioma ?? "es-EC");
    if (idioma == null) return;
    const precio = Number(prompt("Precio (>=0):", String(curso.precio ?? 0)));
    if (Number.isNaN(precio) || precio < 0) { alert("Precio inválido"); return; }

    await actualizarCursoAPI(curso.id, { titulo, descripcion, categoria, nivel, idioma, precio });
    await listarCursosAPI();
  } catch (e) {
    console.error(e);
    alert("No se pudo actualizar. Verifica permisos/JWT y datos.");
  }
}

/* ===== Eventos UI ===== */
btnCrear.addEventListener("click", async () => {
  const nombre = (nombreInput.value || "").trim();
  const desc   = (descInput.value || "").trim();
  if (!getJwt()) {
    console.warn("No hay JWT en localStorage. Si tu API exige token, añade uno con localStorage.setItem('jwt','TU_TOKEN_JWT').");
  }
  const creado = await crearCursoAPI(nombre, desc);
  if (creado) {
    paging.page = 0;
    await listarCursosAPI();
    nombreInput.value = ""; descInput.value = "";
  }
});

nombreInput.addEventListener("keydown", (e) => { if (e.key === "Enter") btnCrear.click(); });

btnEliminarU.addEventListener("click", () => {
  if (listaCursos.lastElementChild) listaCursos.removeChild(listaCursos.lastElementChild);
});

btnColor.addEventListener("click", () => { descripcion.classList.toggle("resaltado"); });

btnToggleVis.addEventListener("click", () => { listaCursos.classList.toggle("oculto"); });

btnActualizar.addEventListener("click", async () => {
  paging.page = 0;
  await listarCursosAPI();
});

setInterval(() => { if (chkAuto.checked) listarCursosAPI(); }, 10000);

/* ==========================
   FORM CONTACTO: validación básica + envío
   ========================== */
/**
 * Inicializa validación del formulario de contacto si existe en la página.
 * Valida: nombre (>=3), email (formato), asunto (>=5), mensaje (>=10), aceptar términos.
 * Envío: POST JSON a FORM_API. Muestra estado en #form-estado.
 */
function initFormularioSiExiste() {
  const $form = document.querySelector("#form-demo");
  if (!$form) return; // La página actual no es el formulario

  const $estado   = $form.querySelector("#form-estado");
  const $nombre   = $form.querySelector("#f-nombre");
  const $email    = $form.querySelector("#f-email");
  const $asunto   = $form.querySelector("#f-asunto");
  const $mensaje  = $form.querySelector("#f-mensaje");
  const $acepto   = $form.querySelector("#f-acepto");

  function setError($input, msg, errId) {
    const $err = $form.querySelector(`#${errId}`);
    if ($err) $err.textContent = msg || "";
    if ($input) {
      $input.classList.toggle("is-invalid", !!msg);
      $input.classList.toggle("is-valid", !msg && ($input.value || "").trim() !== "");
    }
  }

  function validarNombre() {
    const v = ($nombre.value || "").trim();
    if (!v) return setError($nombre, "El nombre es obligatorio.", "err-nombre");
    if (v.length < 3) return setError($nombre, "Mínimo 3 caracteres.", "err-nombre");
    return setError($nombre, "", "err-nombre");
  }
  function validarEmail() {
    const v = ($email.value || "").trim();
    if (!v) return setError($email, "El email es obligatorio.", "err-email");
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!re.test(v)) return setError($email, "Formato de email inválido.", "err-email");
    return setError($email, "", "err-email");
  }
  function validarAsunto() {
    const v = ($asunto.value || "").trim();
    if (!v) return setError($asunto, "El asunto es obligatorio.", "err-asunto");
    if (v.length < 5) return setError($asunto, "Mínimo 5 caracteres.", "err-asunto");
    return setError($asunto, "", "err-asunto");
  }
  function validarMensaje() {
    const v = ($mensaje.value || "").trim();
    if (!v) return setError($mensaje, "El mensaje es obligatorio.", "err-mensaje");
    if (v.length < 10) return setError($mensaje, "Mínimo 10 caracteres.", "err-mensaje");
    return setError($mensaje, "", "err-mensaje");
  }
  function validarAcepto() {
    const ok = $acepto.checked;
    const $err = $form.querySelector("#err-acepto");
    if ($err) $err.textContent = ok ? "" : "Debes aceptar los términos.";
    return ok;
  }

  $nombre.addEventListener("input", validarNombre);
  $email.addEventListener("input", validarEmail);
  $asunto.addEventListener("input", validarAsunto);
  $mensaje.addEventListener("input", validarMensaje);
  $acepto.addEventListener("change", validarAcepto);

  $form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    validarNombre(); validarEmail(); validarAsunto(); validarMensaje();
    const ok =
      !$nombre.classList.contains("is-invalid") &&
      !$email.classList.contains("is-invalid") &&
      !$asunto.classList.contains("is-invalid") &&
      !$mensaje.classList.contains("is-invalid") &&
      validarAcepto();

    if (!ok) {
      $estado.textContent = "Corrige los campos marcados en rojo.";
      return;
    }

    const payload = {
      nombre:  $nombre.value.trim(),
      email:   $email.value.trim(),
      asunto:  $asunto.value.trim(),
      mensaje: $mensaje.value.trim(),
      fechaIso: new Date().toISOString()
    };

    try {
      const res = await fetch(FORM_API, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${txt}`);
      }
      $estado.textContent = "¡Gracias! Recibimos tu mensaje.";
      $form.reset();
      [$nombre,$email,$asunto,$mensaje].forEach($i => $i.classList.remove("is-valid","is-invalid"));
    } catch (e) {
      console.error(e);
      $estado.textContent = "No se pudo enviar. Intenta más tarde.";
    }
  });
}

/* ==========================
   REGISTRO: validación + submit a /api/auth/register
   ===========================

   ✔ Validaciones: nombre>=3, email formato, password>=8, confirmación igual, aceptar términos.
   ✔ Captura: input/blur para feedback + submit antes de enviar.
*/
function initRegistroFormSiExiste() {
  const $form = document.querySelector("#form-register");
  if (!$form) return; // La página actual no tiene el formulario de registro

  const $estado = $form.querySelector("#register-estado");
  const $btn    = $form.querySelector("#btn-register");
  const $nombre = $form.querySelector("#fr-nombre");
  const $email  = $form.querySelector("#fr-email");
  const $pass1  = $form.querySelector("#fr-password");
  const $pass2  = $form.querySelector("#fr-password2");
  const $acepto = $form.querySelector("#fr-acepto");

  function setError($input, msg, errId) {
    const $err = $form.querySelector(`#${errId}`);
    if ($err) $err.textContent = msg || "";
    if ($input) {
      $input.classList.toggle("is-invalid", !!msg);
      $input.classList.toggle("is-valid", !msg && ($input.value || "").trim() !== "");
    }
  }

  function validarNombre() {
    const v = ($nombre.value || "").trim();
    if (!v) return setError($nombre, "El nombre es obligatorio.", "errr-nombre");
    if (v.length < 3) return setError($nombre, "Mínimo 3 caracteres.", "errr-nombre");
    return setError($nombre, "", "errr-nombre");
  }
  function validarEmail() {
    const v = ($email.value || "").trim();
    if (!v) return setError($email, "El email es obligatorio.", "errr-email");
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!re.test(v)) return setError($email, "Formato de email inválido.", "errr-email");
    return setError($email, "", "errr-email");
  }
  function validarPassword() {
    const v = ($pass1.value || "");
    if (!v) return setError($pass1, "La contraseña es obligatoria.", "errr-password");
    if (v.length < 8) return setError($pass1, "Debe tener al menos 8 caracteres.", "errr-password");
    return setError($pass1, "", "errr-password");
  }
  function validarPassword2() {
    const v1 = ($pass1.value || "");
    const v2 = ($pass2.value || "");
    if (!v2) return setError($pass2, "Repite la contraseña.", "errr-password2");
    if (v2.length < 8) return setError($pass2, "Debe tener al menos 8 caracteres.", "errr-password2");
    if (v1 !== v2) return setError($pass2, "Las contraseñas no coinciden.", "errr-password2");
    return setError($pass2, "", "errr-password2");
  }
  function validarAcepto() {
    const ok = $acepto.checked;
    const $err = $form.querySelector("#errr-acepto");
    if ($err) $err.textContent = ok ? "" : "Debes aceptar los términos.";
    return ok;
  }

  // Feedback en tiempo real
  $nombre.addEventListener("input", validarNombre);
  $email .addEventListener("input", validarEmail);
  $pass1 .addEventListener("input", () => { validarPassword(); validarPassword2(); });
  $pass2 .addEventListener("input", validarPassword2);
  $acepto.addEventListener("change", validarAcepto);

  $nombre.addEventListener("blur", validarNombre);
  $email .addEventListener("blur", validarEmail);
  $pass1 .addEventListener("blur", validarPassword);
  $pass2 .addEventListener("blur", validarPassword2);

  // Envío
  $form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    validarNombre(); validarEmail(); validarPassword(); validarPassword2();
    const ok =
      !$nombre.classList.contains("is-invalid") &&
      !$email .classList.contains("is-invalid") &&
      !$pass1 .classList.contains("is-invalid") &&
      !$pass2 .classList.contains("is-invalid") &&
      validarAcepto();

    if (!ok) {
      $estado.textContent = "Corrige los campos marcados en rojo.";
      return;
    }

    const payload = {
      nombre:  $nombre.value.trim(),
      email:   $email.value.trim(),
      password:$pass1.value
    };

    try {
      $btn.disabled = true;
      const originalText = $btn.textContent;
      $btn.textContent = "Creando cuenta…";

      const res = await fetch(AUTH_REGISTER, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.status === 409) {
        const err = await res.json().catch(() => ({}));
        $estado.textContent = err?.message || "El email ya está en uso.";
        setError($email, "El email ya está en uso.", "errr-email");
      } else if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const token = data.token || data.accessToken || data.jwt || null;
        if (token) localStorage.setItem("jwt", token);
        $estado.textContent = "¡Registro exitoso! Ya puedes usar la app.";
        $form.reset();
        [$nombre,$email,$pass1,$pass2].forEach($i => $i.classList.remove("is-valid","is-invalid"));
      } else {
        const txt = await res.text().catch(() => "");
        $estado.textContent = txt || "No se pudo registrar. Intenta más tarde.";
      }

      $btn.textContent = originalText;
      $btn.disabled = false;
    } catch (e) {
      console.error(e);
      $estado.textContent = "Error de red. Revisa la consola.";
      $btn.disabled = false;
      $btn.textContent = "Crear cuenta";
    }
  });
}

/* ==========================
   INICIALIZACIÓN
   ========================== */
document.addEventListener("DOMContentLoaded", async () => {
  initMenuToggle();
  await cargarMenu();

  const initial = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  await cargarPagina(initial, false);

  await listarCursosAPI();
});

/* ===== Debug util (opcional) ===== */
window.debugRutas = async function () {
  const rutas = [
    "paginas/inicio.html",
    "paginas/mision-vision.html",
    "paginas/contacto.html",
    "paginas/formulario.html"
    // ,"paginas/registro.html" // descomenta si creaste esa página
  ];
  for (const ruta of rutas) {
    try {
      const u = new URL(ruta, document.baseURI);
      const r = await fetch(u, { cache: "no-cache" });
      console.log(r.status, u.href);
    } catch (err) { console.error("Fallo", ruta, err); }
  }
};
