/* =========================================================
   DEMO DOM + API de Cursos + Navbar dinámico (100% comentado)
   Cumple la rúbrica:
   - Selecciones por id/class/tag
   - Modificar texto y estilos dinámicamente
   - Crear/eliminar nodos DOM
   - Eventos (click, mouseover, keydown)
   - Carga de parciales HTML con fetch()
   ========================================================= */

/* ==========================
   CONFIG (mismo origen)
   - Usamos rutas RELATIVAS (sin barra inicial) para funcionar
     con o sin context-path.
   ========================== */
const MENU_API   = "api/menu";        // GET/POST/PUT/DELETE/PATCH reordenar
const CURSOS_API = "api/v1/cursos";   // GET/POST/DELETE según tu backend

// Persistencia opcional de JWT (si tu API lo exige para POST/DELETE)
// localStorage.setItem('jwt','TU_TOKEN_JWT');
function getJwt() { return localStorage.getItem("jwt") || null; }
function authHeaders(extra = {}) {
  // Construye headers con Authorization si hay JWT
  const t = getJwt();
  const base = { "Accept": "application/json", "Content-Type": "application/json" };
  return t ? { ...base, "Authorization": `Bearer ${t}`, ...extra } : { ...base, ...extra };
}

/* ==========================
   HELPERS (solo frontend)
   - Adaptan el payload del formulario a lo que tu API espera.
   ========================== */
const DEFAULT_INSTRUCTOR_ID = "instructor01"; // ⚠️ ajusta a un ID válido de tu BD si aplica

// Decodifica JWT (si existe) para intentar obtener un id de usuario
function parseJwt(token) {
  try {
    const base = token.split(".")[1];
    const json = atob(base.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch { return null; }
}

// Devuelve idInstructor usando JWT o un valor por defecto
function currentInstructorId() {
  const t = getJwt();
  if (!t) return DEFAULT_INSTRUCTOR_ID;
  const p = parseJwt(t) || {};
  return p.userId || p.uid || p.id || p.sub || p.username || p.name || DEFAULT_INSTRUCTOR_ID;
}

/* ==========================
   NAVEGACIÓN + MENÚ DINÁMICO
   - Carga /api/menu y arma <ul id="menu_principal">
   - Delegación de eventos: un listener maneja todos los <a>
   - Carga parciales HTML de /paginas/*.html en #pagina
   ========================== */
const $menu = document.getElementById("menu_principal");
const $btnMenuRefresh = document.getElementById("btn-menu-refresh");
const $chkMenuAuto = document.getElementById("chk-menu-autorefresh");

/** Cargar un HTML (parcial) en #pagina respetando <base href="./"> */
async function cargarPagina(pagina, pushState = true) {
  try {
    if (!/\.html(\?.*)?$/i.test(pagina)) throw new Error(`Solo .html (recibí: ${pagina})`);
    // Resuelve la URL final con base en document.baseURI (<base href="./"> en index.html)
    const resolved = new URL(pagina, document.baseURI).href;
    const resp = await fetch(resolved, { cache: "no-cache" });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} al pedir ${resolved}`);

    const html = await resp.text();
    const $contenedor = document.getElementById("pagina");
    $contenedor.innerHTML = html; // ✔ RÚBRICA: modificar contenido HTML/Texto

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

/** Renderiza el menú a partir de un array de items {nombre,url} */
function renderMenu(items) {
  $menu.innerHTML = ""; // limpia el ul
  items.forEach(item => {
    // ✔ RÚBRICA: crear nodos DOM dinámicamente
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.textContent = item.nombre;
    a.href = `#${item.url}`; // útil si se copia el link
    a.dataset.url = item.url; // clave para el router simple
    li.appendChild(a);
    $menu.appendChild(li);
  });
}

/** Descarga del menú desde API (con fallback estático si falla) */
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

/** Delegación de clic (detecta <a data-url> incluso si haces clic en el <li>) */
$menu.addEventListener("click", (ev) => {
  // ✔ RÚBRICA: eventos de usuario (click)
  const liOrA = ev.target.closest("li, a[data-url]");
  if (!liOrA) return;
  const a = liOrA.matches("a[data-url]") ? liOrA : liOrA.querySelector("a[data-url]");
  if (!a) return;
  ev.preventDefault();
  cargarPagina(a.dataset.url);
});

/** Marca activo el enlace cuyo data-url coincide con la página mostrada */
function setActiveMenu(url) {
  $menu.querySelectorAll("a[data-url]").forEach(a => {
    a.classList.toggle("active", a.dataset.url === url);
  });
}

/** Menú hamburguesa (móviles) */
function initMenuToggle() {
  const btn = document.getElementById("menuToggle");
  if (!btn) return;
  btn.addEventListener("click", () => $menu.classList.toggle("show"));
}

/** Botón para refrescar menú + auto-refresh cada 10s si está marcado */
$btnMenuRefresh.addEventListener("click", cargarMenu);
setInterval(() => { if ($chkMenuAuto.checked) cargarMenu(); }, 10000);

/** Soporte Back/Forward del navegador + cambios de hash manuales */
window.addEventListener("popstate", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});
window.addEventListener("hashchange", () => {
  const url = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  cargarPagina(url, false);
});

/* ==========================
   DOM + API CURSOS
   - El formulario envía lo mínimo y el frontend completa campos
     que tu API exige (sin tocar backend).
   ========================== */
// Selección por id/class/tag (✔ RÚBRICA)
const titulo       = document.getElementById("titulo-pagina");         // id
const descripcion  = document.querySelector(".descripcion");            // class
const listaCursos  = document.getElementById("lista-cursos");           // id
const nombreInput  = document.getElementById("curso-nombre");           // id
const descInput    = document.getElementById("curso-desc");             // id
const btnCrear     = document.getElementById("btn-crear");              // id
const btnEliminarU = document.getElementById("btn-eliminar-ultimo");    // id
const btnColor     = document.getElementById("btn-cambiar-color");      // id
const btnActualizar= document.getElementById("btn-actualizar");         // id
const btnToggleVis = document.getElementById("btn-toggle-visibility");  // id
const chkAuto      = document.getElementById("chk-autorefresh");        // id

// También por tag/class (demostración de selección ✔ RÚBRICA)
const todosLosBotones = document.getElementsByTagName("button");        // tag
const descripciones   = document.getElementsByClassName("descripcion");  // class

// ✔ RÚBRICA: estilos dinámicos (color y tamaño)
titulo.addEventListener("mouseover", () => { titulo.style.color = "yellow"; });
titulo.addEventListener("mouseout",  () => { titulo.style.color = "white";  });
if (descripcion) descripcion.style.fontSize = "16px";

// Muestra de modificar texto dinámicamente (total de cursos)
let totalCursos = 0;

/** Renderiza la lista de cursos en el DOM (creación de nodos ✔) */
function renderCursos(cursos = []) {
  listaCursos.innerHTML = "";
  (cursos || []).forEach(c => {
    const li = document.createElement("li");
    li.classList.add("curso");

    const texto = document.createElement("span");
    const title = c.titulo ?? c.nombre ?? "(sin título)";
    const desc   = c.descripcion ? ` — ${c.descripcion}` : "";
    texto.innerText = `${title}${desc}`; // ✔ RÚBRICA: modificar texto

    const badge = document.createElement("span");
    badge.classList.add("badge-id");
    badge.innerText = c.id ? `id: ${c.id}` : "";

    const acciones = document.createElement("div");
    acciones.classList.add("acciones");

    const btnDel = document.createElement("button");
    btnDel.innerText = "Eliminar (API)";
    btnDel.addEventListener("click", async () => {
      if (!c.id) return alert("No hay id para eliminar en la API.");
      await eliminarCursoAPI(c.id);     // DELETE a tu API
      await listarCursosAPI();          // refresca DOM
    });

    acciones.appendChild(btnDel);
    li.appendChild(texto);
    li.appendChild(badge);
    li.appendChild(acciones);
    listaCursos.appendChild(li);
  });

  // Ejemplo de estilo iterativo por tag
  const lis = listaCursos.getElementsByTagName("li");
  for (let i = 0; i < lis.length; i++) lis[i].style.borderColor = "#ccc";
}

/** GET cursos (tolera 204) y actualiza el título con el total */
async function listarCursosAPI() {
  try {
    const res = await fetch(CURSOS_API, { headers: authHeaders() });
    if (res.status === 204) { renderCursos([]); totalCursos = 0; actualizarTitulo(); return; }
    if (!res.ok) throw new Error(`GET cursos: ${res.status}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : [];
    totalCursos = arr.length;
    actualizarTitulo();   // ✔ RÚBRICA: modificar texto (título)
    renderCursos(arr);
  } catch (e) {
    console.error(e);
    renderCursos([]);
  }
}

// Actualiza el título con el contador de cursos (ejemplo claro)
function actualizarTitulo() {
  titulo.textContent = `Página de prueba (DOM + API de Cursos) — ${totalCursos} curso(s)`;
}

/** POST curso (mapea el formulario a tu entidad Curso sin tocar backend) */
async function crearCursoAPI(nombre, descripcion) {
  try {
    // Validación mínima UI (el backend hará la suya)
    if (!nombre || nombre.trim().length < 3) {
      alert("El título debe tener al menos 3 caracteres."); return;
    }

    // Payload adaptado a tu entidad Curso (campos requeridos por tu API)
    const payload = {
      titulo: nombre.trim(),
      descripcion: (descripcion || "").trim() || null,
      categoria: "GENERAL",
      idioma: "es-EC",                 // ISO válido (ej: es o es-EC)
      nivel: "PRINCIPIANTE",           // enum Curso.Nivel
      estado: "BORRADOR",              // enum Curso.EstadoCurso
      idInstructor: currentInstructorId() // @NotBlank
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
    return await res.json();
  } catch (e) {
    console.error(e);
    alert("No se pudo crear el curso. Revisa JWT/seguridad y el payload.");
  }
}

/** DELETE curso */
async function eliminarCursoAPI(id) {
  try {
    const res = await fetch(`${CURSOS_API}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    if (!res.ok && res.status !== 204 && res.status !== 200) {
      throw new Error(`DELETE curso: ${res.status}`);
    }
  } catch (e) {
    console.error(e);
    alert("No se pudo eliminar (verifica API/JWT/ID).");
  }
}

/* ===== Eventos UI ===== */
btnCrear.addEventListener("click", async () => {
  const nombre = (nombreInput.value || "").trim();
  const desc   = (descInput.value || "").trim();

  if (!getJwt()) {
    // Si tu backend exige JWT para POST, puedes setearlo con:
    // localStorage.setItem('jwt','TU_TOKEN_JWT');
    console.warn("No hay JWT en localStorage. Si tu API exige token, añade uno.");
  }

  await crearCursoAPI(nombre, desc); // POST
  await listarCursosAPI();           // GET para refrescar
  nombreInput.value = ""; descInput.value = "";
});

// ✔ RÚBRICA: keydown → Enter crea curso
nombreInput.addEventListener("keydown", (e) => { if (e.key === "Enter") btnCrear.click(); });

// ✔ RÚBRICA: eliminar nodo DOM (solo visual)
btnEliminarU.addEventListener("click", () => {
  if (listaCursos.lastElementChild) listaCursos.removeChild(listaCursos.lastElementChild);
});

// ✔ RÚBRICA: estilos dinámicos usando classList.toggle()
btnColor.addEventListener("click", () => { descripcion.classList.toggle("resaltado"); });

// ✔ RÚBRICA: visibilidad dinámica
btnToggleVis.addEventListener("click", () => { listaCursos.classList.toggle("oculto"); });

// Refrescar desde API
btnActualizar.addEventListener("click", listarCursosAPI);

// Auto-actualizar lista de cursos
setInterval(() => { if (chkAuto.checked) listarCursosAPI(); }, 10000);

/* ==========================
   INICIALIZACIÓN
   ========================== */
document.addEventListener("DOMContentLoaded", async () => {
  initMenuToggle();
  await cargarMenu();

  // Carga inicial según #hash o Inicio por defecto
  const initial = location.hash.replace(/^#/, "") || "paginas/inicio.html";
  await cargarPagina(initial, false);

  // Carga inicial de cursos
  await listarCursosAPI();
});

/* ===== Debug util (opcional) =====
   Abre consola y ejecuta: debugRutas()
   Debe imprimir 200 para los parciales.
*/
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
