/* =========================================================
   DEMO DOM + API de Cursos + Navbar dinámico (frontend only)
   ADAPTADO a tu backend real:
   - GET /api/v1/cursos devuelve PageResponse {content, totalElements, totalPages, ...}
   - No-admin: listar solo PUBLICADO (según tu controlador)
   - PUT/PATCH/DELETE protegidos (dueño o admin)
   ========================================================= */

/* ==========================
   CONFIG (mismo origen)
   ========================== */
const MENU_API   = "api/menu";
const CURSOS_API = "api/v1/cursos";

// (Opcional) publicar automáticamente tras crear para que aparezca en la lista de no-admin
const AUTO_PUBLICAR_TRAS_CREAR = true;

// JWT opcional (si tu API lo exige para POST/PUT/PATCH/DELETE)
// localStorage.setItem('jwt','TU_TOKEN_JWT');
function getJwt() { return localStorage.getItem("jwt") || null; }
function authHeaders(extra = {}) {
  const t = getJwt();
  const base = { "Accept": "application/json", "Content-Type": "application/json" };
  return t ? { ...base, "Authorization": `Bearer ${t}`, ...extra } : { ...base, ...extra };
}

/* ==========================
   HELPERS FRONTEND
   ========================== */
const DEFAULT_INSTRUCTOR_ID = "instructor01"; // si tu backend lo usa desde JWT, esto no se usará
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
    if (!res.ok) throw new Error("Fallo al obtener menú");
    renderMenu(await res.json());
  } catch (err) {
    console.warn("Menu API no disponible, usando menú estático.", err);
    renderMenu([
      { nombre: "Inicio",          url: "paginas/inicio.html" },
      { nombre: "Misión & Visión", url: "paginas/mision-vision.html" },
      { nombre: "Contacto",        url: "paginas/contacto.html" }
    ]);
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

    // Tu backend devuelve PageResponse
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
    // Tu CrearCursoRequest exige: titulo, descripcion, categoria, nivel, idioma, precio
    const payload = {
      titulo: nombre.trim(),
      descripcion: (descripcion || "").trim() || null,
      categoria: "GENERAL",
      nivel: "PRINCIPIANTE",
      idioma: "es-EC",
      precio: 0 // @Min(0) — si quieres, agrega un input en la UI y léelo
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

    // Si no eres admin, la lista no mostrará BORRADOR.
    // Para que aparezca, publicamos de una (si se permite).
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
    // tras crear (y quizá publicar), refrescamos la página 1 (0) para verlo
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
  const rutas = ["paginas/inicio.html","paginas/mision-vision.html","paginas/contacto.html"];
  for (const ruta of rutas) {
    try {
      const u = new URL(ruta, document.baseURI);
      const r = await fetch(u, { cache: "no-cache" });
      console.log(r.status, u.href);
    } catch (err) { console.error("Fallo", ruta, err); }
  }
};
