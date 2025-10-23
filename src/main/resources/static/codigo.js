/* =========================================================
   DEMO DOM + API de Cursos + Navbar dinámico (frontend only)
   **Versión adaptada + mejoras**
   - Mantiene index + parciales + codigo.js (sin login SPA)
   - AbortController para evitar "flashbacks" al navegar rápido  // [CHANGE]
   - Cache de parciales con TTL para navegación más fluida       // [CHANGE]
   - Catálogo: spinner + pager accesible + rango "Mostrando"     // [CHANGE]
   - Categorías autocompletadas desde datos (opcional endpoint)  // [CHANGE]
   - Imágenes con placeholder si fallan                          // [CHANGE]
   - Un solo lugar para autopublicar al crear curso              // [CHANGE]
   - Gate del Área de instructor si no hay JWT (con flag)        // [CHANGE]
   - Compatibilidad PageResponse {number,size} vs {page,size}    // [CHANGE]
   ========================================================= */

/* ==========================
   CONFIG (mismo origen)
   ========================== */
const MENU_API   = "api/menu";
const CURSOS_API = "api/v1/cursos";
const CURSOS_BUSCAR_API = "api/v1/cursos/buscar";
const CATEGORIAS_API = "api/v1/categorias"; // opcional, si existe          // [CHANGE]

// Controla si se permite operar "Área de instructor" sin JWT.
const ALLOW_INSTRUCTOR_WITHOUT_JWT = false;                                  // [CHANGE]

// Endpoints opcionales (si usas esos parciales)
const FORM_API = "api/formulario";
const AUTH_REGISTER = "api/auth/register";

// JWT opcional (si tu API lo exige para POST/PUT/PATCH/DELETE)
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
function escapeHtml(s=""){ return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function truncate(s="", n=110){ return s.length>n ? s.slice(0,n-1)+"…" : s; }
function courseImageUrl(c){
  return c.portadaUrl || c.imagenUrl || c.thumbnail || c.coverUrl || c.cover || 
         (c.id ? `https://picsum.photos/seed/${encodeURIComponent(c.id)}/600/338` 
               : `https://picsum.photos/seed/${encodeURIComponent(c.titulo||"curso")}/600/338`);
}
// Placeholder SVG en caso de error de imagen                                      // [CHANGE]
function placeholderImg(label="Curso"){
  const txt = encodeURIComponent((label||"Curso").slice(0,24));
  return `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='338'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='24' fill='%236b7280'>${txt}</text></svg>`;
}
function attachImageErrorHandlers(root){                                         // [CHANGE]
  root.querySelectorAll("img").forEach(img=>{
    img.addEventListener("error", ()=>{ img.src = placeholderImg(img.alt || "Curso"); }, { once:true });
  });
}

/* =========================================================
   MENÚ: FUSIÓN CON API + GARANTÍAS + LIMPIEZAS
   ========================================================= */
const FALLBACK_MENU = [
  { nombre: "Inicio",             url: "paginas/inicio.html",     orden: 1 },
  { nombre: "Catálogo",           url: "paginas/catalogo.html",   orden: 2 },
  { nombre: "Área de instructor", url: "paginas/instructor.html", orden: 3 },
  { nombre: "Formulario",         url: "paginas/formulario.html", orden: 4 },
  { nombre: "Registro",           url: "paginas/registro.html",   orden: 5 },
  { nombre: "Documentación",      url: "paginas/documentacion.html", orden: 6 }
];

// Normaliza + asegura items pedidos + elimina “Contacto”
async function ensureMenuCompleto(apiItems = []) {
  // Normaliza
  let list = apiItems.map((it, i) => ({
    nombre: it?.nombre ?? `Item ${i+1}`,
    url:    it?.url    ?? "#",
    orden:  Number.isFinite(it?.orden) ? it.orden : (i+1)
  }));

  // Filtra Contacto (por nombre/url)
  list = list.filter(x => {
    const n = (x.nombre||"").toLowerCase();
    const u = (x.url||"").toLowerCase();
    return !(n.includes("contacto") || u.includes("contacto.html"));
  });

  // Asegurar obligatorio: Inicio, Catálogo, Formulario, Instructor
  const must = [
    { nombre:"Inicio", url:"paginas/inicio.html" },
    { nombre:"Catálogo", url:"paginas/catalogo.html" },
    { nombre:"Formulario", url:"paginas/formulario.html" },
    { nombre:"Área de instructor", url:"paginas/instructor.html" }
  ];
  for (const m of must) {
    if (!list.some(x => (x.url||"").toLowerCase() === m.url)) {
      const maxOrden = list.reduce((acc,x)=>Math.max(acc, Number(x.orden)||0), 0);
      list.push({ ...m, orden: maxOrden+1 });
    }
  }

  // Añadir "Registro" si existe el archivo
  const REG_URL = "paginas/registro.html";
  let tieneRegistro = list.some(x => (x.url || "").toLowerCase() === REG_URL);
  if (!tieneRegistro) {
    try {
      const u = new URL(REG_URL, document.baseURI);
      let r = await fetch(u, { method: "HEAD", cache: "no-cache" });
      if (!r.ok) r = await fetch(u, { cache: "no-cache" });
      if (r.ok) {
        const maxOrden = list.reduce((acc,x)=>Math.max(acc, Number(x.orden)||0), 0);
        list.push({ nombre: "Registro", url: REG_URL, orden: maxOrden+1 });
      }
    } catch {}
  }

  // Orden + dedup por URL
  const hasOrden = list.every(x => Number.isFinite(x.orden));
  list.sort((a,b)=> hasOrden ? (a.orden - b.orden) : a.nombre.localeCompare(b.nombre,"es"));
  const seen = new Set(), dedup = [];
  for (const it of list) {
    const key = (it.url||"").toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); dedup.push(it); }
  }
  return dedup;
}

/* ==========================
   NAVEGACIÓN + MENU
   ========================== */
const $menu = document.getElementById("menu_principal");
const $btnMenuRefresh = document.getElementById("btn-menu-refresh");
const $chkMenuAuto = document.getElementById("chk-menu-autorefresh");

// AbortControllers + cache de parciales                                            // [CHANGE]
let menuFetchCtrl = null;
let pageFetchCtrl = null;
const partialCache = new Map(); // url -> { html, ts }
const PARTIAL_TTL_MS = 60_000;

// Mini spinner
function spinnerHTML(txt="Cargando…"){
  return `<div role="status" aria-live="polite" style="padding:12px;display:flex;gap:10px;align-items:center">
    <span class="spinner" style="width:16px;height:16px;border:2px solid #ddd;border-top-color:#111;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite"></span>
    <span>${escapeHtml(txt)}</span>
  </div>`;
}
// inyecta keyframes del spinner una sola vez                                       // [CHANGE]
(function ensureSpinnerKeyframes(){
  if (document.getElementById("spin-style")) return;
  const st = document.createElement("style");
  st.id = "spin-style";
  st.textContent = `@keyframes spin{to{transform:rotate(360deg)}}`;
  document.head.appendChild(st);
})();

async function cargarPagina(pagina, pushState = true) {
  try {
    if (!/\.html(\?.*)?$/i.test(pagina)) throw new Error(`Solo .html (recibí: ${pagina})`);
    const $root = document.getElementById("pagina");
    $root.innerHTML = spinnerHTML("Cargando sección…");                           // [CHANGE]

    // Cache TTL
    const resolved = new URL(pagina, document.baseURI).href;
    const cached = partialCache.get(resolved);
    const now = Date.now();
    if (cached && (now - cached.ts) < PARTIAL_TTL_MS) {
      $root.innerHTML = cached.html;
      postLoadHooks(pagina);
      setActiveMenu(pagina);
      if (pushState) history.pushState({ url: pagina }, "", `#${pagina}`);
      return;
    }

    if (pageFetchCtrl) pageFetchCtrl.abort();                                     // [CHANGE]
    pageFetchCtrl = new AbortController();

    const resp = await fetch(resolved, { cache: "no-cache", signal: pageFetchCtrl.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} al pedir ${resolved}`);
    const html = await resp.text();
    partialCache.set(resolved, { html, ts: now });                                 // [CHANGE]
    $root.innerHTML = html;

    postLoadHooks(pagina);                                                         // [CHANGE]
    setActiveMenu(pagina);
    if (pushState) history.pushState({ url: pagina }, "", `#${pagina}`);
  } catch (e) {
    if (e.name === "AbortError") return;                                          // [CHANGE]
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

// Hooks por página centralizados                                                   // [CHANGE]
function postLoadHooks(pagina){
  if (/catalogo\.html$/i.test(pagina)) initCatalogoSiExiste();
  if (/instructor\.html$/i.test(pagina)) initInstructorSiExiste();
  if (/formulario\.html$/i.test(pagina)) initFormularioSiExiste();
  if (/registro\.html$/i.test(pagina)) initRegistroFormSiExiste();
  if (/inicio\.html$/i.test(pagina)) initInicioDemo();
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
    if (menuFetchCtrl) menuFetchCtrl.abort();                                     // [CHANGE]
    menuFetchCtrl = new AbortController();
    const res = await fetch(MENU_API, { headers: authHeaders(), signal: menuFetchCtrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const apiItems = await res.json();
    const items = await ensureMenuCompleto(apiItems);
    renderMenu(items);
  } catch (err) {
    if (err?.name === "AbortError") return;                                       // [CHANGE]
    console.warn("Menu API no disponible, usando fallback.", err);
    renderMenu(FALLBACK_MENU);
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

$btnMenuRefresh?.addEventListener("click", cargarMenu);
setInterval(() => { if ($chkMenuAuto?.checked) cargarMenu(); }, 10000);

window.addEventListener("popstate", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});
window.addEventListener("hashchange", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});

/* ==========================
   LISTADO GENERAL DE CURSOS (Catálogo)
   ========================== */
const catalogPaging = { page: 0, size: 4, totalPages: 0, totalElements: 0 };
let lastCatalogFilters = { q:"", categoria:"", nivel:"" };
let catalogFetchCtrl = null;                                                      // [CHANGE]
let categoriasCargadas = false;                                                   // [CHANGE]

async function listarCursosAPI({ page=0, size=4, categoria="", nivel="", q="" } = {}) {
  try {
    if (catalogFetchCtrl) catalogFetchCtrl.abort();                               // [CHANGE]
    catalogFetchCtrl = new AbortController();

    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("size", String(size));
    if (categoria) qs.set("categoria", categoria);
    if (nivel) qs.set("nivel", nivel);
    if (q) qs.set("q", q);
    const res = await fetch(`${CURSOS_API}?${qs.toString()}`, { headers: authHeaders(), signal: catalogFetchCtrl.signal });
    if (res.status === 204) {
      return { content: [], page, size, totalElements: 0, totalPages: 1 };
    }
    if (!res.ok) throw new Error(`GET cursos: ${res.status}`);
    const data = await res.json();

    // Compat mapping number/size/totalPages/totalElements                             // [CHANGE]
    const content = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
    const pageNum   = Number.isFinite(data?.page) ? data.page : (Number.isFinite(data?.number) ? data.number : page);
    const pageSize  = Number.isFinite(data?.size) ? data.size : (Number.isFinite(data?.pageSize) ? data.pageSize : size);
    const totalEl   = Number.isFinite(data?.totalElements) ? data.totalElements : (Number.isFinite(data?.total) ? data.total : content.length);
    let totalPg     = Number.isFinite(data?.totalPages) ? data.totalPages : 1;
    if (!Number.isFinite(totalPg) || totalPg <= 0) totalPg = Math.max(1, Math.ceil((totalEl||0) / Math.max(1,pageSize)));

    return { content, page: pageNum, size: pageSize, totalElements: totalEl, totalPages: totalPg };
  } catch (e) {
    if (e?.name !== "AbortError") console.error(e);
    return { content: [], page, size, totalElements: 0, totalPages: 1 };
  }
}

function ensureCatalogoScaffold() {
  // Si el parcial no trae contenedores, los creamos
  const $root = document.getElementById("pagina");
  if (!document.getElementById("catalogo-wrap")) {
    const html = `
      <section id="catalogo-wrap">
        <header style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 12px">
          <h2 style="margin:0">Catálogo</h2>
          <form id="catalogo-filtros" style="display:flex;gap:8px;flex-wrap:wrap">
            <input type="search" id="f-q" placeholder="Buscar..." />
            <select id="f-categoria">
              <option value="">Todas las categorías</option>
            </select>
            <select id="f-nivel">
              <option value="">Todos los niveles</option>
              <option value="PRINCIPIANTE">Principiante</option>
              <option value="INTERMEDIO">Intermedio</option>
              <option value="AVANZADO">Avanzado</option>
            </select>
            <button id="f-apply">Filtrar</button>
            <button id="f-clear" type="button">Limpiar</button>
          </form>
        </header>
        <div id="catalogo-status" class="muted" role="status" aria-live="polite"></div>  <!-- [CHANGE] -->
        <div id="catalogo-grid" class="grid4"></div>
        <nav id="catalogo-pager" class="pager"></nav>
      </section>`;
    $root.innerHTML = html;
  }
}

function setCatalogoStatus(txt){                                                  // [CHANGE]
  const el = document.getElementById("catalogo-status");
  if (el) el.innerHTML = txt ? escapeHtml(txt) : "";
}

function renderCatalogoGrid(cursos=[]) {
  const $grid = document.getElementById("catalogo-grid");
  const $pager = document.getElementById("catalogo-pager");
  if (!$grid) return;

  $grid.innerHTML = "";
  (cursos||[]).forEach(c => {
    const card = document.createElement("article");
    card.className = "curso-card";
    const title = c.titulo ?? c.nombre ?? "(sin título)";
    card.innerHTML = `
      <div class="curso-thumb"><img alt="${escapeHtml(title)}" src="${escapeHtml(courseImageUrl(c))}"></div>
      <div class="curso-body">
        <div class="title">${escapeHtml(title)}</div>
        <div class="muted">${escapeHtml(truncate(c.descripcion || "", 120))}</div>
        <div class="curso-meta">
          <span class="badge">${escapeHtml(c.categoria || "GENERAL")}</span>
          <span class="badge">${escapeHtml(c.nivel || "PRINCIPIANTE")}</span>
          <span class="badge price">${(c.precio ?? 0) > 0 ? "$"+Number(c.precio).toFixed(2) : "Gratis"}</span>
        </div>
        <details class="curso-detalle">
          <summary>Ver más</summary>
          <div class="muted" style="margin-top:6px">
            <div><strong>Idioma:</strong> ${escapeHtml(c.idioma || "es-EC")}</div>
            ${c.idInstructor ? `<div><strong>Instructor:</strong> ${escapeHtml(c.idInstructor)}</div>` : ""}
            ${c.estado ? `<div><strong>Estado:</strong> ${escapeHtml(String(c.estado))}</div>` : ""}
            ${c.tags ? `<div><strong>Tags:</strong> ${escapeHtml(Array.isArray(c.tags)?c.tags.join(", "):String(c.tags))}</div>` : ""}
            ${c.createdAt ? `<div><strong>Creado:</strong> ${escapeHtml(String(c.createdAt))}</div>` : ""}
            ${c.updatedAt ? `<div><strong>Actualizado:</strong> ${escapeHtml(String(c.updatedAt))}</div>` : ""}
          </div>
        </details>
      </div>
    `;
    $grid.appendChild(card);
  });
  attachImageErrorHandlers($grid);                                                // [CHANGE]

  // Paginador accesible + rango mostrador                                           // [CHANGE]
  if ($pager) {
    const p = catalogPaging.page, tp = Math.max(catalogPaging.totalPages, 1);
    const size = catalogPaging.size, total = catalogPaging.totalElements;
    const from = total ? (p*size + 1) : 0;
    const to = Math.min(total, (p+1)*size);

    $pager.innerHTML = "";
    const mkBtn = (txt, page, disabled=false, on=false, label="") => {
      const b = document.createElement("button");
      b.textContent = txt;
      b.setAttribute("aria-label", label || txt);
      if (on) b.classList.add("on");
      if (!disabled) {
        b.addEventListener("click", async () => {
          catalogPaging.page = page;
          await loadCatalogo();
        });
      } else {
        b.disabled = true;
      }
      return b;
    };
    $pager.appendChild(mkBtn("«", 0, p===0, false, "Primera página"));
    $pager.appendChild(mkBtn("‹", Math.max(0,p-1), p===0, false, "Página anterior"));

    const info = document.createElement("span");
    info.style.margin = "0 8px";
    info.textContent = `Mostrando ${from}–${to} de ${total || 0} (Página ${p+1} de ${tp})`;
    $pager.appendChild(info);

    $pager.appendChild(mkBtn("›", Math.min(tp-1,p+1), p>=tp-1, false, "Página siguiente"));
    $pager.appendChild(mkBtn("»", tp-1, p>=tp-1, false, "Última página"));
  }
}

async function loadCatalogo() {
  setCatalogoStatus("Cargando cursos…");                                          // [CHANGE]
  const { q, categoria, nivel } = lastCatalogFilters;
  const data = await listarCursosAPI({
    page: catalogPaging.page,
    size: catalogPaging.size,
    q, categoria, nivel
  });
  catalogPaging.page = data.page;
  catalogPaging.size = data.size;
  catalogPaging.totalElements = data.totalElements;
  catalogPaging.totalPages = data.totalPages;

  // Llenado dinámico de categorías (una sola vez por sesión)                        // [CHANGE]
  if (!categoriasCargadas) {
    await tryPopulateCategorias(data.content);
    categoriasCargadas = true;
  }

  renderCatalogoGrid(data.content);
  setCatalogoStatus(data.totalElements ? "" : "No hay cursos para los filtros aplicados."); // [CHANGE]
}

// Intenta cargar categorías desde endpoint; si no, infiere del contenido            // [CHANGE]
async function tryPopulateCategorias(content){
  const $c = document.getElementById("f-categoria");
  if (!$c) return;
  // Evita duplicar si ya hay más de 1 opción
  if ($c.options.length > 1) return;

  let cats = new Set();
  try {
    const r = await fetch(CATEGORIAS_API, { headers: authHeaders() });
    if (r.ok) {
      const arr = await r.json();
      (arr||[]).forEach(x => cats.add(String(x.nombre || x).trim()));
    }
  } catch {}
  if (cats.size === 0) {
    (content||[]).forEach(c => { if (c?.categoria) cats.add(String(c.categoria)); });
  }
  for (const cat of Array.from(cats).sort((a,b)=>a.localeCompare(b,"es"))) {
    if (!cat) continue;
    const opt = document.createElement("option");
    opt.value = cat; opt.textContent = cat;
    $c.appendChild(opt);
  }
}

function initCatalogoSiExiste() {
  ensureCatalogoScaffold();

  const $f = document.getElementById("catalogo-filtros");
  const $q = document.getElementById("f-q");
  const $c = document.getElementById("f-categoria");
  const $n = document.getElementById("f-nivel");
  const $apply = document.getElementById("f-apply");
  const $clear = document.getElementById("f-clear");

  if ($apply) {
    $apply.addEventListener("click", (ev) => {
      ev.preventDefault();
      lastCatalogFilters = {
        q: ($q?.value||"").trim(),
        categoria: $c?.value || "",
        nivel: $n?.value || ""
      };
      catalogPaging.page = 0;
      loadCatalogo();
    });
  }
  $clear?.addEventListener("click", () => {
    if ($q) $q.value = "";
    if ($c) $c.value = "";
    if ($n) $n.value = "";
    lastCatalogFilters = { q:"", categoria:"", nivel:"" };
    catalogPaging.page = 0;
    loadCatalogo();
  });

  // Primera carga
  loadCatalogo();
}

/* ==========================
   CRUD CURSOS (Instructor)
   ========================== */
async function crearCursoAPI(nombre, descripcion, categoria, nivel, idioma, precio, opts={autopublicar:false}) { // [CHANGE]
  try {
    if (!nombre || nombre.trim().length < 3) {
      alert("El título debe tener al menos 3 caracteres."); return null;
    }
    const payload = {
      titulo: nombre.trim(),
      descripcion: (descripcion || "").trim() || null,
      categoria: categoria?.trim() || "GENERAL",
      nivel: nivel?.trim() || "PRINCIPIANTE",
      idioma: idioma?.trim() || "es-EC",
      precio: Number(precio) || 0
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
    if (opts?.autopublicar && creado?.id) {                                     // [CHANGE]
      try { await publicarCursoAPI(creado.id); } catch (e) { console.warn("No se pudo publicar automáticamente:", e?.message||e); }
    }
    return creado;
  } catch (e) {
    console.error(e);
    alert("No se pudo crear el curso. Revisa JWT/seguridad y el payload.");
    return null;
  }
}
async function actualizarCursoAPI(id, { titulo, descripcion, categoria, nivel, idioma, precio }) {
  // Validación básica adicional                                                       // [CHANGE]
  if (precio != null) {
    const p = Number(precio);
    if (!Number.isFinite(p) || p < 0) throw new Error("Precio inválido");
  }
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

async function listarCursosPorInstructor({ page=0, size=6 } = {}) {
  // Usa /buscar con idInstructor para tus propios cursos
  const idInstructor = currentInstructorId();
  const qs = new URLSearchParams({ page:String(page), size:String(size), idInstructor });
  const url = `${CURSOS_BUSCAR_API}?${qs.toString()}`;
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error(`GET buscar cursos por instructor: ${res.status}`);
    const data = await res.json(); // PageResponse o similar
    const content = Array.isArray(data?.content) ? data.content : (Array.isArray(data) ? data : []);
    const pageNum   = Number.isFinite(data?.page) ? data.page : (Number.isFinite(data?.number) ? data.number : page); // [CHANGE]
    const pageSize  = Number.isFinite(data?.size) ? data.size : (Number.isFinite(data?.pageSize) ? data.pageSize : size);
    const totalEl   = Number.isFinite(data?.totalElements) ? data.totalElements : (Number.isFinite(data?.total) ? data.total : content.length);
    let totalPg     = Number.isFinite(data?.totalPages) ? data.totalPages : Math.max(1, Math.ceil((totalEl||0)/Math.max(1,pageSize)));
    return { content, page: pageNum, size: pageSize, totalElements: totalEl, totalPages: totalPg };
  } catch (e) {
    console.error(e);
    return { content:[], page, size, totalElements:0, totalPages:1 };
  }
}

function ensureInstructorScaffold() {
  const root = document.getElementById("pagina");
  if (!document.getElementById("inst-wrap")) {
    root.innerHTML = `
      <section id="inst-wrap">
        <header class="view-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <h2 style="margin:0">Área de instructor</h2>
          <p class="muted">Crea cursos y gestiona su publicación.</p>
        </header>

        <article class="card form" style="margin:10px 0 16px">
          <h3>Crear nuevo curso</h3>
          <form id="form-curso" class="two-col" autocomplete="off">
            <label>Título
              <input type="text" id="i-titulo" required minlength="3" placeholder="p.ej. Java desde Cero" />
            </label>
            <label>Descripción
              <input type="text" id="i-desc" placeholder="Resumen breve" />
            </label>
            <label>Categoría
              <input type="text" id="i-cat" required placeholder="GENERAL / Programación..." />
            </label>
            <label>Nivel
              <select id="i-nivel">
                <option value="PRINCIPIANTE">PRINCIPIANTE</option>
                <option value="INTERMEDIO">INTERMEDIO</option>
                <option value="AVANZADO">AVANZADO</option>
              </select>
            </label>
            <label>Idioma
              <input type="text" id="i-idioma" value="es-EC" />
            </label>
            <label>Precio
              <input type="number" id="i-precio" min="0" step="0.01" value="0" />
            </label>
            <div class="col-span">
              <label class="switch">
                <input type="checkbox" id="i-autopub" checked />
                <span>Publicar automáticamente tras crear</span>
              </label>
            </div>
            <div class="actions">
              <button class="btn primary" id="i-crear">Crear</button>
            </div>
            <p id="i-estado" class="form-state" role="status" aria-live="polite"></p>
          </form>
        </article>

        <section>
          <header class="view-header">
            <h3>Mis cursos</h3>
          </header>
          <div id="inst-grid" class="grid4"></div>
        </section>
      </section>`;
  }
}

function renderInstructorCursos(list=[]) {
  const grid = document.getElementById("inst-grid");
  if (!grid) return;
  grid.innerHTML = "";
  (list||[]).forEach(c => {
    const card = document.createElement("article");
    card.className = "curso-card";
    card.innerHTML = `
      <div class="curso-thumb"><img alt="${escapeHtml(c.titulo ?? "(sin título)")}" src="${escapeHtml(courseImageUrl(c))}"></div>
      <div class="curso-body">
        <div class="title">${escapeHtml(c.titulo ?? "(sin título)")}</div>
        <div class="muted">${escapeHtml(truncate(c.descripcion||"", 110))}</div>
        <div class="curso-meta">
          <span class="badge">${escapeHtml(c.categoria||"GENERAL")}</span>
          <span class="badge">${escapeHtml(c.nivel||"PRINCIPIANTE")}</span>
          <span class="badge price">${(c.precio ?? 0) > 0 ? "$"+Number(c.precio).toFixed(2) : "Gratis"}</span>
        </div>
        <div class="actions" style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
          <button class="btn btn-primary" data-act="editar">Editar</button>
          <button class="btn ghost" data-act="publicar">Publicar</button>
          <button class="btn ghost" data-act="archivar">Archivar</button>
          <button class="btn ghost" data-act="eliminar">Eliminar</button>
        </div>
      </div>
    `;
    attachImageErrorHandlers(card);                                              // [CHANGE]
    card.querySelector('[data-act="editar"]').addEventListener("click", async () => editarCursoUI(c));
    card.querySelector('[data-act="publicar"]').addEventListener("click", async () => { await publicarCursoAPI(c.id); await loadInstructorCursos(); });
    card.querySelector('[data-act="archivar"]').addEventListener("click", async () => { await archivarCursoAPI(c.id); await loadInstructorCursos(); });
    card.querySelector('[data-act="eliminar"]').addEventListener("click", async () => {
      if (!confirm(`¿Eliminar curso "${c.titulo}"?`)) return;
      await eliminarCursoAPI(c.id);
      await loadInstructorCursos();
    });
    grid.appendChild(card);
  });
}

async function loadInstructorCursos() {
  const data = await listarCursosPorInstructor({ page:0, size:12 });
  renderInstructorCursos(data.content);
}

function initInstructorSiExiste() {
  ensureInstructorScaffold();

  // Gate si no hay JWT (evita filtrar con instructor ficticio en producción)        // [CHANGE]
  if (!getJwt() && !ALLOW_INSTRUCTOR_WITHOUT_JWT) {
    const form = document.getElementById("form-curso");
    const grid = document.getElementById("inst-grid");
    if (form) {
      form.querySelectorAll("input,select,button").forEach(el=>el.disabled = true);
      const msg = document.getElementById("i-estado");
      if (msg) msg.textContent = "Inicia sesión para crear y gestionar tus cursos.";
    }
    if (grid) grid.innerHTML = `<div class="muted">No disponible sin autenticación.</div>`;
    return;
  }

  const $tit = document.getElementById("i-titulo");
  const $des = document.getElementById("i-desc");
  const $cat = document.getElementById("i-cat");
  const $niv = document.getElementById("i-nivel");
  const $idi = document.getElementById("i-idioma");
  const $pre = document.getElementById("i-precio");
  const $aut = document.getElementById("i-autopub");
  const $btn = document.getElementById("i-crear");
  const $msg = document.getElementById("i-estado");

  if ($btn) {
    $btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const creado = await crearCursoAPI(
        $tit.value, $des.value, $cat.value, $niv.value, $idi.value, $pre.value,
        { autopublicar: !!$aut?.checked }                                       // [CHANGE] (un solo lugar)
      );
      if (creado) {
        $msg.textContent = "¡Curso creado!";
        $tit.value = ""; $des.value = ""; $cat.value = ""; $pre.value = "0";
        loadInstructorCursos();
      }
    });
  }
  loadInstructorCursos();
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
    const precioStr = prompt("Precio (>=0):", String(curso.precio ?? 0));
    if (precioStr == null) return;
    const precio = Number(precioStr);
    if (Number.isNaN(precio) || precio < 0) { alert("Precio inválido"); return; }

    await actualizarCursoAPI(curso.id, { titulo, descripcion, categoria, nivel, idioma, precio });
    await loadInstructorCursos();
  } catch (e) {
    console.error(e);
    alert("No se pudo actualizar. Verifica permisos/JWT y datos.");
  }
}

/* ==========================
   FORM CONTACTO: validación + envío
   (se activa solo si existe el parcial)
   ========================== */
function initFormularioSiExiste() {
  const $form = document.querySelector("#form-demo");
  if (!$form) return;

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
   REGISTRO (opcional)
   ========================== */
function initRegistroFormSiExiste() {
  const $form = document.querySelector("#form-register");
  if (!$form) return;

  const $estado = $form.querySelector("#register-estado");
  const $btn    = $form.querySelector("#btn-register");
  const $clear  = $form.querySelector("#btn-register-clear");
  const $nombre = $form.querySelector("#fr-nombre");
  const $email  = $form.querySelector("#fr-email");
  const $pass1  = $form.querySelector("#fr-password");
  const $pass2  = $form.querySelector("#fr-password2");
  const $acepto = $form.querySelector("#fr-acepto");
  const $t1     = $form.querySelector("#toggle-pass1");
  const $t2     = $form.querySelector("#toggle-pass2");
  const $meter  = $form.querySelector("#pass-meter");

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

  // ===== UX extra: medidor de fuerza + toggles =====
  function strengthScore(s){
    let sc = 0;
    if (s.length >= 8) sc++;
    if (/[A-Z]/.test(s)) sc++;
    if (/[a-z]/.test(s)) sc++;
    if (/\d/.test(s)) sc++;
    if (/[^A-Za-z0-9]/.test(s)) sc++;
    return Math.min(sc, 5); // 0..5
  }
  function renderMeter(){
    if (!$meter) return;
    const s = strengthScore($pass1.value || "");
    const pct = s * 20; // 0..100%
    $meter.style.width = pct + "%";
  }
  $t1?.addEventListener("click", ()=>{
    if (!$pass1) return;
    const show = $pass1.type === "password";
    $pass1.type = show ? "text" : "password";
    $t1.textContent = show ? "Ocultar" : "Mostrar";
  });
  $t2?.addEventListener("click", ()=>{
    if (!$pass2) return;
    const show = $pass2.type === "password";
    $pass2.type = show ? "text" : "password";
    $t2.textContent = show ? "Ocultar" : "Mostrar";
  });

  $nombre.addEventListener("input", validarNombre);
  $email .addEventListener("input", validarEmail);
  $pass1 .addEventListener("input", () => { validarPassword(); validarPassword2(); renderMeter(); });
  $pass2 .addEventListener("input", validarPassword2);
  $acepto.addEventListener("change", validarAcepto);
  renderMeter();

  $clear?.addEventListener("click", () => {
    // reset visual y medidor
    $estado.textContent = "";
    [$nombre,$email,$pass1,$pass2].forEach($i => $i.classList.remove("is-valid","is-invalid"));
    renderMeter();
  });

  $form.addEventListener("submit", async (ev) => {
    ev.preventDefault();

    validarNombre(); validarEmail(); validarPassword(); validarPassword2();
    const ok =
      !$nombre.classList.contains("is-invalid") &&
      !$email .classList.contains("is-invalid") &&
      !$pass1 .classList.contains("is-invalid") &&
      !$pass2 .classList.contains("is-invalid") &&
      validarAcepto();

    if (!ok) { $estado.textContent = "Corrige los campos marcados en rojo."; return; }

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
        renderMeter();
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
  // Mantiene tu header/título con hover (si existe)
  const titulo = document.getElementById("titulo-pagina");
  titulo?.addEventListener("mouseover", () => { titulo.style.color = "yellow"; });
  titulo?.addEventListener("mouseout",  () => { titulo.style.color = "white";  });

  initMenuToggle();
  await cargarMenu();

  const initial = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  await cargarPagina(initial, false);
});

/* ===== Debug util (opcional) ===== */
window.debugRutas = async function () {
  const rutas = [
    "paginas/inicio.html",
    "paginas/catalogo.html",
    "paginas/instructor.html",
    "paginas/formulario.html",
    "paginas/registro.html"
  ];
  for (const ruta of rutas) {
    try {
      const u = new URL(ruta, document.baseURI);
      const r = await fetch(u, { cache: "no-cache" });
      console.log(r.status, u.href);
    } catch (err) { console.error("Fallo", ruta, err); }
  }
};    
/* ==========================
   DEMO INICIO: DOM + EVENTOS + ESTILOS
   ========================== */
function initInicioDemo(){
  // Selecciones por id
  const h1 = document.getElementById("home-title");
  const input = document.getElementById("demo-input");
  const form = document.getElementById("demo-form");
  const list = document.getElementById("demo-list");
  const count = document.getElementById("demo-count");

  // Selecciones por class y tag (para la rúbrica)
  const cards = document.getElementsByClassName("card");
  const figures = document.getElementsByTagName("figure");

  // querySelector (id + class combinados)
  const btnAdd = document.querySelector("#btn-add");
  const btnClear = document.querySelector("#btn-clear");
  const btnColor = document.querySelector("#btn-color");
  const btnSize = document.querySelector("#btn-size");
  const btnToggle = document.querySelector("#btn-toggle");

  // Documentación inline (innerHTML)
  if (cards?.length) {
    const note = document.createElement("p");
    note.className = "muted";
    note.innerHTML = "Tip: esta tarjeta (<code>.card</code>) fue localizada con <code>getElementsByClassName</code>.";
    cards[0].appendChild(note);
  }
  if (figures?.length) {
    figures[0].title = "Figura localizada con getElementsByTagName";
  }

  function updateCount(){
    const n = list.querySelectorAll("li").length; // querySelectorAll por tag
    count.innerText = `${n} ${n === 1 ? "ítem" : "ítems"}`;
  }

  function addItem(text){
    const t = String(text||"").trim();
    if (!t) return;

    const li = document.createElement("li");
    li.innerHTML = `<span>${escapeHtml(t)}</span>`;
    // Botón eliminar
    const del = document.createElement("button");
    del.type = "button";
    del.className = "demo-remove";
    del.innerText = "Eliminar";
    del.addEventListener("click", () => {
      li.remove();
      updateCount();
    });

    li.appendChild(del);
    list.appendChild(li);
    updateCount();
  }

  function toggleList(){
    // Cambia visibilidad dinámicamente
    list.classList.toggle("is-hidden");
  }

  // Eventos
  h1?.addEventListener("mouseover", () => { h1.style.color = "yellow"; });
  h1?.addEventListener("mouseout",  () => { h1.style.color = ""; });

  form?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    addItem(input?.value);
    if (input) input.value = "";
    input?.focus();
  });

  input?.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      addItem(input.value);
      input.value = "";
    }
  });

  btnAdd?.addEventListener("click", (ev)=>{ ev.preventDefault(); addItem(input?.value); input && (input.value=""); });
  btnClear?.addEventListener("click", ()=>{ list.innerHTML = ""; updateCount(); });
  btnColor?.addEventListener("click", ()=>{ h1?.classList.toggle("title-colored"); });
  btnSize?.addEventListener("click", ()=>{ h1?.classList.toggle("title-big"); });
  btnToggle?.addEventListener("click", toggleList);

  // Estado inicial
  updateCount();
}

