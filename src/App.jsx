import { useState, useEffect, useCallback, Fragment } from "react";
import { Plus, Pencil, Trash2, X, Save, AlertCircle, Check, Eye, Copy, Wand2, Moon, Sun } from "lucide-react";

const COLS = [
  { id: "backlog", title: "Backlog" },
  { id: "planned", title: "Planned" },
  { id: "inprogress", title: "In Progress" },
  { id: "inreview", title: "In Review" },
  { id: "completed", title: "Completed" },
  { id: "deployed", title: "Deployed" },
];

const TAGS = [
  { id: "bug", label: "BUG", bg: "#FCEBEB", fg: "#A32D2D" },
  { id: "ui", label: "UI", bg: "#E6F1FB", fg: "#185FA5" },
  { id: "feature", label: "FEATURE", bg: "#EAF3DE", fg: "#3B6D11" },
  { id: "refactor", label: "REFACTOR", bg: "#FAEEDA", fg: "#854F0B" },
  { id: "tech-debt", label: "TECH DEBT", bg: "#EEEDFE", fg: "#3C3489" },
  { id: "infra", label: "INFRA", bg: "#E1F5EE", fg: "#0F6E56" },
  { id: "mejora", label: "MEJORA", bg: "#FBEAF0", fg: "#993556" },
  { id: "testing", label: "TESTING", bg: "#DEF1F6", fg: "#0E6E83" },
];

const PRIORITIES = [
  { id: "P0", label: "P0", bg: "#FCEBEB", fg: "#A32D2D", border: "#F09595" },
  { id: "P1", label: "P1", bg: "#FAEEDA", fg: "#854F0B", border: "#EF9F27" },
  { id: "P2", label: "P2", bg: "#F1EFE8", fg: "#444441", border: "#B4B2A9" },
  { id: "P3", label: "P3", bg: "#EAF3DE", fg: "#3B6D11", border: "#97C459" },
];
const PRIO_ORDER = { P0: 0, P1: 1, P2: 2, P3: 3, "": 4, null: 4, undefined: 4 };

const POINTS = [1, 2, 3, 5, 8, 13];

// Colores de tarjeta. "white" es el default; cada color tiene una variante
// para tema claro y otra para oscuro.
const CARD_COLORS = [
  { id: "white", label: "Blanco", light: "#ffffff", dark: "#404040" },
  { id: "red", label: "Rojo", light: "#FDECEC", dark: "#4a2c2c" },
  { id: "orange", label: "Naranja", light: "#FBF0DD", dark: "#4a3a23" },
  { id: "yellow", label: "Amarillo", light: "#FBF7DC", dark: "#46431f" },
  { id: "green", label: "Verde", light: "#EBF4DF", dark: "#2e3f23" },
  { id: "blue", label: "Azul", light: "#E7F1FB", dark: "#243949" },
  { id: "purple", label: "Violeta", light: "#EFEDFE", dark: "#322d4a" },
  { id: "pink", label: "Rosa", light: "#FBEAF1", dark: "#46293a" },
];
function cardColor(id) {
  return CARD_COLORS.find((c) => c.id === id) || CARD_COLORS[0];
}

const STORAGE_KEY = "kanban_cards_v2";
const NEXT_KEY = "kanban_next_v2";
const MIG_KEY = "kanban_mig_testing_v1";

const SEED = [
  // P0 — Antes de la fase 2 (testers)
  { id: 1, col: "backlog", order: 0, priority: "P0", title: "Arreglar overbooking por concurrencia", desc: "Agregar SELECT … FOR UPDATE sobre la fila de ClassInstance dentro de la transacción de reserveClass, y leer capacity adentro de la tx. Serializa las reservas de la misma clase y mata el race del cupo.", tags: ["bug"], points: 3, prompt: "" },
  { id: 2, col: "backlog", order: 1, priority: "P0", title: "Generación de pagos a prueba de concurrencia", desc: "En ensureCurrentMonthPaymentsForActiveSocios usar createMany({ skipDuplicates: true }), y en ensurePaymentRecord envolver el create atrapando P2002 (o upsert).", tags: ["bug"], points: 2, prompt: "" },
  { id: 3, col: "backlog", order: 2, priority: "P0", title: "Sacar/arreglar link \"Pagos\" del admin", desc: "El nav apunta a /admin/pagos inexistente. O creás la página, o quitás el link (los pagos ya viven en Socios).", tags: ["bug"], points: 1, prompt: "" },
  // P1 — Antes de producción real (fase 3)
  { id: 4, col: "backlog", order: 3, priority: "P1", title: "Re-validar límites por socio en la transacción", desc: "Re-chequear tope semanal y \"1 por día\" dentro de la tx de reserva (achica el race de doble-submit a casi nada). Va de la mano del fix P0.", tags: ["bug"], points: 2, prompt: "" },
  { id: 5, col: "backlog", order: 4, priority: "P1", title: "Unificar cancellationLimitHours", desc: "Hoy hay 2 (schema), 4 (getSettings create) y 4 (CLAUDE.md). Elegir un valor y alinear las tres fuentes.", tags: ["bug"], points: 1, prompt: "" },
  { id: 6, col: "backlog", order: 5, priority: "P1", title: "Tests del núcleo", desc: "Tests unitarios de getClassAvailability (pura) cubriendo cada estado, y un test de la transacción de reserva bajo concurrencia.", tags: ["tech-debt"], points: 3, prompt: "" },
  { id: 7, col: "backlog", order: 6, priority: "P1", title: "Supabase a plan Pro + backups", desc: "Salir del free (que pausa por inactividad) y activar backups diarios antes de tener datos reales de socios.", tags: ["infra"], points: 2, prompt: "" },
  { id: 8, col: "backlog", order: 7, priority: "P1", title: "Deploy a Vercel (Pro)", desc: "Primer deploy productivo; Pro por el uso comercial y para evitar el corte por límite del Hobby.", tags: ["infra"], points: 3, prompt: "" },
  { id: 9, col: "backlog", order: 8, priority: "P1", title: "Google OAuth de producción", desc: "Configurar redirect URIs del dominio real y revisar el consent screen.", tags: ["infra"], points: 2, prompt: "" },
  { id: 10, col: "backlog", order: 9, priority: "P1", title: "Monitoreo de errores", desc: "Integrar Sentry (free tier) para enterarte de fallos en prod antes que el cliente.", tags: ["infra"], points: 2, prompt: "" },
  { id: 11, col: "backlog", order: 10, priority: "P1", title: ".env.example", desc: "Documentar las 6 variables (sin secretos) para reproducir el setup. Ya tenés README.", tags: ["infra"], points: 1, prompt: "" },
  // P2 — Mejoras y deuda técnica
  { id: 12, col: "backlog", order: 11, priority: "P2", title: "getSettings deja de escribir en cada lectura", desc: "Hoy hace upsert (escritura) en cada read. Pasar a findUnique con fallback, o garantizar el singleton en el seed.", tags: ["mejora", "tech-debt"], points: 1, prompt: "" },
  { id: 13, col: "backlog", order: 12, priority: "P2", title: "Limpiar @ts-expect-error en auth.ts", desc: "Tipar bien role en el callback de sesión usando el augmentation que ya existe.", tags: ["tech-debt"], points: 1, prompt: "" },
  { id: 14, col: "backlog", order: 13, priority: "P2", title: "Pulido visual mobile", desc: "Los socios usan exclusivamente celular; repaso de la experiencia en pantallas angostas.", tags: ["mejora", "ui"], points: 3, prompt: "" },
  { id: 15, col: "backlog", order: 14, priority: "P2", title: "Estados vacíos y feedback de error", desc: "Mensajes para \"sin clases esta semana\", mejores estados de error/carga en las acciones.", tags: ["mejora", "ui"], points: 2, prompt: "" },
  // Testing — harness, concurrencia, carga y E2E
  { id: 16, col: "backlog", order: 15, priority: "P1", title: "Setup del harness de testing (Vitest + Postgres de prueba)", desc: "Configurar la base sobre la que corren todos los tests de integración/concurrencia. Vitest como runner y una Postgres real de prueba (Docker local, Testcontainers, o un branch de prueba de Supabase) que se levante limpia antes de cada corrida. Es setup de una sola vez del que dependen las tareas siguientes.\n\nCriterios de aceptación: Vitest corre con `npm test`; existe una base de prueba aislada de la de desarrollo; hay un seed/reset que deja datos conocidos antes de cada test; un test dummy de \"1+1\" pasa contra la base.\n\nBloquea: el test de concurrencia.", tags: ["testing"], points: 3, prompt: "" },
  { id: 17, col: "backlog", order: 16, priority: "P1", title: "Test de concurrencia para reservas (el invariante de cupos)", desc: "Test de integración que dispara N reservas en paralelo (Promise.all) contra un turno con cupo limitado y verifica que el invariante se cumpla. El test se escribe contra la regla de negocio, no contra la implementación: \"si el cupo es 10 y llegan 50 reservas simultáneas, entran exactamente 10 y se rechazan 40\". Es la prueba de que el SELECT ... FOR UPDATE funciona — algo que no se puede validar mirando el código.\n\nCriterios de aceptación: el test crea un turno con cupo conocido; lanza más reservas concurrentes que cupos; afirma que los éxitos == cupo y el resto se rechazan limpiamente (sin error 500, con mensaje claro); corre de forma consistente en 5 ejecuciones seguidas sin resultados distintos.\n\nDepende de: setup del harness.", tags: ["testing"], points: 3, prompt: "" },
  { id: 18, col: "backlog", order: 17, priority: "P1", title: "Revisar y corregir la config de connection pooling", desc: "No es un test, pero es el ítem más barato y el que más probablemente te salva de una caída a escala. En serverless (Vercel) cada invocación puede abrir su propia conexión a Postgres y agotar el pool. Revisar que la connection string de Prisma apunte al pooler de Supabase (puerto correcto) y no directo a la base, y documentar el límite de conexiones. Ningún test de lógica detecta este problema; es config de infra.\n\nCriterios de aceptación: la app usa el pooler de Supabase (o Prisma Accelerate) en producción; está documentado el límite de conexiones y de dónde sale; queda anotado para verificarlo con el test de carga.", tags: ["testing", "infra"], points: 2, prompt: "" },
  { id: 19, col: "backlog", order: 18, priority: "P2", title: "Test de carga con k6 contra staging", desc: "Script de k6 (o Artillery) que simula usuarios concurrentes pegándole a los endpoints críticos en staging, rampeando de 1 a 50 usuarios. Responde literalmente el miedo de \"¿aguanta 20 al mismo tiempo?\" con evidencia directa, y es lo que revela el problema de pooling si quedó algo mal.\n\nCriterios de aceptación: el script rampea a 50 usuarios concurrentes sobre los flujos de login y reserva; se registran latencia (p95/p99), tasa de errores y cantidad de conexiones a la base; corrida de referencia documentada (verde = latencia plana, 0 errores, conexiones bajo el límite).\n\nRelacionado: validar la config de pooling.", tags: ["testing"], points: 3, prompt: "" },
  { id: 20, col: "backlog", order: 19, priority: "P3", title: "Tests E2E de flujos críticos (Playwright)", desc: "Cubrir de punta a punta solo los 3-4 caminos que tocan plata o cupos: login → ver clases → reservar → confirmar → verla en el panel, y cancelar reserva. Atrapan regresiones cuando se rompe un flujo entero. Deliberadamente acotado: el E2E es caro de mantener y se rompe al tocar la UI, así que nada de cubrir pantallas secundarias.\n\nCriterios de aceptación: Playwright instalado y corriendo; máximo 4 flujos, todos sobre caminos críticos; corren en local y quedan listos para meter en CI; cada flujo verifica el estado final real (la reserva aparece en la base/panel, no solo que la UI mostró un cartel).", tags: ["testing"], points: 5, prompt: "" },
];

function tagStyle(id) {
  return TAGS.find((t) => t.id === id) || { id, label: id, bg: "#F1EFE8", fg: "#444441" };
}
function prioStyle(id) {
  return PRIORITIES.find((p) => p.id === id) || null;
}
function sortCards(arr) {
  return [...arr].sort(
    (a, b) =>
      ((PRIO_ORDER[a.priority] ?? 4) - (PRIO_ORDER[b.priority] ?? 4)) ||
      ((a.order ?? 0) - (b.order ?? 0))
  );
}
// Genera un prompt auto-suficiente para Claude Code a partir de la tarjeta
function buildPrompt(card) {
  const t = (card.title || "").trim();
  const parts = [];
  parts.push(t.endsWith(".") || t.endsWith(":") ? t : t + ".");
  const d = (card.desc || "").trim();
  if (d) parts.push(d);
  parts.push("Mostrame primero cómo está hoy y tu plan antes de editar. No inventes APIs no documentadas: si algo no existe, decímelo.");
  return parts.join("\n\n");
}

export default function KanbanBoard() {
  const [cards, setCards] = useState([]);
  const [nextId, setNextId] = useState(21);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const [tagFilter, setTagFilter] = useState("all");
  const [prioFilter, setPrioFilter] = useState("all");
  const [draggingId, setDraggingId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // { col, beforeId } beforeId: id | "__end__"
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  const toggleDark = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      try { localStorage.setItem("kanban_theme", next ? "dark" : "light"); } catch (e) { /* noop */ }
      return next;
    });
  };

  // Carga inicial desde localStorage (síncrona). Si no hay nada o el JSON
  // está corrupto, se cae al SEED.
  useEffect(() => {
    let loadedCards = SEED;
    let loadedNext = 21;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) loadedCards = parsed;
      }
    } catch (e) { /* primera vez o JSON inválido: usar SEED */ }
    try {
      const rawNext = localStorage.getItem(NEXT_KEY);
      if (rawNext) {
        const n = parseInt(rawNext, 10);
        if (!Number.isNaN(n)) loadedNext = n;
      }
    } catch (e) { /* noop */ }

    // Migración (una sola vez): agregar las tareas de TESTING a boards ya existentes
    const migDone = localStorage.getItem(MIG_KEY) === "1";
    if (!migDone) {
      const existing = new Set(loadedCards.map((c) => c.id));
      const toAdd = SEED.filter((c) => c.tags.includes("testing") && !existing.has(c.id));
      if (toAdd.length) {
        const base = loadedCards.filter((c) => c.col === "backlog").reduce((mx, c) => Math.max(mx, c.order ?? 0), -1) + 1;
        loadedCards = [...loadedCards, ...toAdd.map((t, i) => ({ ...t, order: base + i }))];
        loadedNext = Math.max(loadedNext, 21);
      }
      try { localStorage.setItem(MIG_KEY, "1"); } catch (e) { /* noop */ }
    }

    setCards(loadedCards);
    setNextId(loadedNext);
    setLoaded(true);
  }, []);

  const persist = useCallback((nextCards, nId) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCards));
      localStorage.setItem(NEXT_KEY, String(nId));
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    persist(cards, nextId);
  }, [cards, nextId, loaded, persist]);

  const visibleCards = (colId) =>
    sortCards(
      cards
        .filter((c) => c.col === colId)
        .filter((c) => tagFilter === "all" || c.tags.includes(tagFilter))
        .filter((c) => prioFilter === "all" || c.priority === prioFilter)
    );

  const countInCol = (colId) => cards.filter((c) => c.col === colId).length;

  const handleCardDragOver = (e, card, vcList, i) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingId == null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const bottomHalf = e.clientY > rect.top + rect.height / 2;
    let beforeId;
    if (!bottomHalf) {
      beforeId = card.id;
    } else {
      beforeId = "__end__";
      for (let j = i + 1; j < vcList.length; j++) {
        if (vcList[j].id !== draggingId) { beforeId = vcList[j].id; break; }
      }
    }
    setDropTarget({ col: card.col, beforeId });
  };

  const handleAreaDragOver = (e, colId) => {
    e.preventDefault();
    if (draggingId == null) return;
    setDropTarget((prev) => (prev && prev.col === colId ? prev : { col: colId, beforeId: "__end__" }));
  };

  const reorder = (colId, beforeId) => {
    if (draggingId == null) return;
    setCards((prev) => {
      const dragged = prev.find((c) => c.id === draggingId);
      if (!dragged) return prev;
      const movingToInProgress = colId === "inprogress" && dragged.col !== "inprogress";
      const colCards = sortCards(prev.filter((c) => c.col === colId && c.id !== draggingId));
      let idx;
      if (beforeId == null || beforeId === "__end__") {
        idx = colCards.length;
      } else {
        idx = colCards.findIndex((c) => c.id === beforeId);
        if (idx === -1) idx = colCards.length;
      }
      const seq = [...colCards.slice(0, idx), dragged, ...colCards.slice(idx)];
      const orderMap = new Map(seq.map((c, i) => [c.id, i]));
      return prev.map((c) => {
        if (!orderMap.has(c.id)) return c;
        const updated = { ...c, col: colId, order: orderMap.get(c.id) };
        // Auto-completar el prompt al entrar a In Progress si está vacío
        if (c.id === draggingId && movingToInProgress && !(c.prompt && c.prompt.trim())) {
          updated.prompt = buildPrompt(c);
        }
        return updated;
      });
    });
    setDraggingId(null);
    setDropTarget(null);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    const beforeId = dropTarget && dropTarget.col === colId ? dropTarget.beforeId : "__end__";
    reorder(colId, beforeId);
  };

  const openCreate = (colId) =>
    setModal({ mode: "create", col: colId, title: "", desc: "", tags: [], points: null, priority: null, prompt: "", color: "white" });

  const openEdit = (card) =>
    setModal({ mode: "edit", id: card.id, col: card.col, title: card.title, desc: card.desc || "", tags: [...card.tags], points: card.points || null, priority: card.priority || null, prompt: card.prompt || "", color: card.color || "white" });

  const saveModal = () => {
    const title = modal.title.trim();
    if (!title) return;
    if (modal.mode === "edit") {
      setCards((prev) => prev.map((c) => (c.id === modal.id ? { ...c, title, desc: modal.desc, tags: modal.tags, points: modal.points, priority: modal.priority, prompt: modal.prompt, color: modal.color } : c)));
    } else {
      const maxOrder = cards.filter((c) => c.col === modal.col).reduce((m, c) => Math.max(m, c.order ?? 0), -1);
      const newCard = { id: nextId, col: modal.col, order: maxOrder + 1, title, desc: modal.desc, tags: modal.tags, points: modal.points, priority: modal.priority, prompt: modal.prompt, color: modal.color };
      setCards((prev) => [...prev, newCard]);
      setNextId((n) => n + 1);
    }
    setModal(null);
  };

  const deleteCard = (id) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setConfirm(null);
  };

  const toggleTag = (t) =>
    setModal((m) => ({ ...m, tags: m.tags.includes(t) ? m.tags.filter((x) => x !== t) : [...m.tags, t] }));

  const openView = (c) => { setCopied(false); setViewing(c); };

  const copyPrompt = async () => {
    const text = viewing.prompt || "";
    let ok = false;
    // Intento moderno
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) { /* cae al fallback */ }
    // Fallback: textarea temporal + execCommand
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "-1000px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) { ok = false; }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const Line = () => <div className="h-0.5 bg-blue-400 rounded-full mx-1" />;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-900 dark:text-neutral-100 font-sans p-4 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap mb-1.5">
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-1">Tipo:</span>
        <button
          onClick={() => setTagFilter("all")}
          className={`text-xs font-medium px-3 py-1 rounded-full border transition ${tagFilter === "all" ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-700 dark:text-neutral-100" : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"}`}
        >
          Todas
        </button>
        {TAGS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTagFilter(t.id)}
            className="text-xs font-medium px-3 py-1 rounded-full border-2 transition"
            style={{ background: t.bg, color: t.fg, borderColor: tagFilter === t.id ? t.fg : "transparent", opacity: tagFilter === t.id ? 1 : 0.5 }}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-neutral-400 flex items-center gap-1">
          {saveState === "saved" && <><Save size={13} /> guardado</>}
          {saveState === "error" && <><AlertCircle size={13} /> error al guardar</>}
        </span>
        <button
          onClick={toggleDark}
          className="p-1.5 rounded-md border border-neutral-200 bg-neutral-50 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition"
          aria-label={dark ? "Modo claro" : "Modo oscuro"}
          title={dark ? "Modo claro" : "Modo oscuro"}
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span className="text-sm text-neutral-500 dark:text-neutral-400 mr-1">Prioridad:</span>
        <button
          onClick={() => setPrioFilter("all")}
          className={`text-xs font-medium px-3 py-1 rounded-full border transition ${prioFilter === "all" ? "border-neutral-400 bg-neutral-100 text-neutral-900 dark:border-neutral-500 dark:bg-neutral-700 dark:text-neutral-100" : "border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"}`}
        >
          Todas
        </button>
        {PRIORITIES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPrioFilter(p.id)}
            className="text-xs font-medium px-3 py-1 rounded-full border-2 transition"
            style={{ background: p.bg, color: p.fg, borderColor: prioFilter === p.id ? p.fg : "transparent", opacity: prioFilter === p.id ? 1 : 0.5 }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto items-start pb-4">
        {COLS.map((col) => {
          const vc = visibleCards(col.id);
          const isOver = dropTarget && dropTarget.col === col.id;
          return (
            <div
              key={col.id}
              className="flex-shrink-0 w-60 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col"
              style={{ maxHeight: "80vh" }}
            >
              <div className="px-3.5 py-3 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                <span className="text-sm font-medium">{col.title}</span>
                <span className="text-xs bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-full px-2 py-0.5 text-neutral-500 dark:text-neutral-300">
                  {countInCol(col.id)}
                </span>
              </div>
              <div
                onDragOver={(e) => handleAreaDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`p-2.5 flex flex-col gap-2 overflow-y-auto flex-1 transition ${isOver ? "bg-blue-50 dark:bg-blue-950/40" : ""}`}
                style={{ minHeight: 60 }}
              >
                {vc.length === 0 ? (
                  <p className="text-xs text-neutral-400 text-center py-3">Sin tareas</p>
                ) : (
                  vc.map((c, i) => {
                    const p = prioStyle(c.priority);
                    const showLine = draggingId != null && isOver && dropTarget.beforeId === c.id;
                    const hasPrompt = c.prompt && c.prompt.trim();
                    const cc = cardColor(c.color);
                    return (
                      <Fragment key={c.id}>
                        {showLine && <Line />}
                        <div
                          draggable
                          onDragStart={() => setDraggingId(c.id)}
                          onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                          onDragOver={(e) => handleCardDragOver(e, c, vc, i)}
                          className={`border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 cursor-grab hover:border-neutral-300 dark:hover:border-neutral-500 transition select-none ${draggingId === c.id ? "opacity-40" : ""}`}
                          style={{ backgroundColor: dark ? cc.dark : cc.light }}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            {p ? (
                              <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-md border" style={{ background: p.bg, color: p.fg, borderColor: p.border }}>
                                {p.label}
                              </span>
                            ) : <span />}
                            <button onClick={() => openView(c)} className="p-1 -mt-0.5 -mr-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition flex-shrink-0" aria-label="Ver detalle">
                              <Eye size={15} />
                            </button>
                          </div>
                          <div className="text-sm leading-snug mb-1.5">{c.title}</div>
                          {c.desc && (
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 leading-snug mb-2 line-clamp-2">{c.desc}</div>
                          )}
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex gap-1 flex-wrap flex-1 min-w-0 items-center">
                              {c.tags.map((t) => {
                                const s = tagStyle(t);
                                return (
                                  <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
                                    {s.label}
                                  </span>
                                );
                              })}
                              {hasPrompt && (
                                <span className="text-neutral-300" title="Tiene prompt para Claude Code"><Wand2 size={12} /></span>
                              )}
                            </div>
                            {c.points != null && (
                              <span className="text-[11px] font-medium bg-neutral-100 dark:bg-neutral-600 border border-neutral-200 dark:border-neutral-500 rounded-md px-1.5 py-0.5 text-neutral-500 dark:text-neutral-300 whitespace-nowrap flex-shrink-0">
                                {c.points} pts
                              </span>
                            )}
                            <div className="flex gap-0.5 flex-shrink-0">
                              <button onClick={() => openEdit(c)} className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition" aria-label="Editar">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setConfirm({ id: c.id })} className="p-1 rounded text-neutral-400 hover:text-red-600 transition" aria-label="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
                {draggingId != null && isOver && dropTarget.beforeId === "__end__" && vc.length > 0 && <Line />}
              </div>
              <button
                onClick={() => openCreate(col.id)}
                className="m-2.5 py-1.5 rounded-md border border-dashed border-neutral-200 dark:border-neutral-600 text-neutral-400 text-xs flex items-center justify-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-neutral-600 dark:hover:text-neutral-300 transition"
              >
                <Plus size={14} /> Agregar tarea
              </button>
            </div>
          );
        })}
      </div>

      {/* Vista de detalle */}
      {viewing && (() => {
        const p = prioStyle(viewing.priority);
        const col = COLS.find((c) => c.id === viewing.col);
        return (
          <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setViewing(null); }}>
            <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-700 p-8 w-[70vw] h-[70vh] flex flex-col gap-5 overflow-hidden">
              <div className="flex items-start justify-between gap-4 flex-shrink-0">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {p && (
                    <span className="inline-block w-fit text-xs font-medium px-2 py-0.5 rounded-md border" style={{ background: p.bg, color: p.fg, borderColor: p.border }}>
                      {p.label}
                    </span>
                  )}
                  <h3 className="text-2xl font-medium leading-snug">{viewing.title}</h3>
                </div>
                <button onClick={() => setViewing(null)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 flex-shrink-0 mt-1"><X size={22} /></button>
              </div>

              <div className="flex-1 overflow-y-auto border-t border-neutral-100 dark:border-neutral-700 pt-5">
                {viewing.desc ? (
                  <>
                    <p className="text-xs text-neutral-400 mb-2">Descripción</p>
                    <p className="text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{viewing.desc}</p>
                  </>
                ) : (
                  <p className="text-base text-neutral-400 italic">Sin descripción.</p>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-neutral-400 flex items-center gap-1.5"><Wand2 size={13} /> Prompt para Claude Code</p>
                    {viewing.prompt && viewing.prompt.trim() && (
                      <button onClick={copyPrompt} className="text-xs flex items-center gap-1 border border-neutral-200 dark:border-neutral-600 rounded-md px-2 py-1 text-neutral-500 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition">
                        {copied ? <><Check size={13} /> copiado</> : <><Copy size={13} /> copiar</>}
                      </button>
                    )}
                  </div>
                  {viewing.prompt && viewing.prompt.trim() ? (
                    <pre className="text-[13px] text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 whitespace-pre-wrap font-mono leading-relaxed">{viewing.prompt}</pre>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">Se completa solo al pasar la tarjeta a In Progress (o escribilo desde el botón de editar).</p>
                  )}
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-700 pt-4 flex flex-wrap items-center gap-x-8 gap-y-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Columna</span>
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{col?.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">Esfuerzo</span>
                  <span className="text-sm font-medium bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md px-2 py-0.5 text-neutral-600 dark:text-neutral-300">
                    {viewing.points != null ? `${viewing.points} pts` : "—"}
                  </span>
                </div>
                {viewing.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">Etiquetas</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {viewing.tags.map((t) => {
                        const s = tagStyle(t);
                        return <span key={t} className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.fg }}>{s.label}</span>;
                      })}
                    </div>
                  </div>
                )}
                <button onClick={() => { setViewing(null); openEdit(viewing); }} className="ml-auto border border-neutral-200 dark:border-neutral-600 rounded-md px-4 py-2 text-sm text-neutral-500 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-1.5">
                  <Pencil size={14} /> Editar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 w-80 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">{modal.mode === "edit" ? "Editar tarea" : "Nueva tarea"}</h3>
              <button onClick={() => setModal(null)} className="text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"><X size={18} /></button>
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Título</label>
              <input
                autoFocus
                value={modal.title}
                onChange={(e) => setModal({ ...modal, title: e.target.value })}
                placeholder="¿Qué hay que hacer?"
                className="w-full text-sm rounded-md border border-neutral-200 dark:border-neutral-600 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-400"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Descripción</label>
              <textarea
                value={modal.desc}
                onChange={(e) => setModal({ ...modal, desc: e.target.value })}
                placeholder="Detalles opcionales..."
                className="w-full text-sm rounded-md border border-neutral-200 dark:border-neutral-600 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-400 resize-y"
                style={{ minHeight: 70, lineHeight: 1.5 }}
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Prioridad</label>
              <div className="flex gap-1.5 flex-wrap">
                {PRIORITIES.map((p) => {
                  const sel = modal.priority === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setModal({ ...modal, priority: sel ? null : p.id })}
                      className="text-xs font-medium px-2.5 py-1 rounded-md border-2 transition"
                      style={{ background: p.bg, color: p.fg, borderColor: sel ? p.fg : "transparent", opacity: sel ? 1 : 0.5 }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Etiquetas</label>
              <div className="flex gap-1.5 flex-wrap">
                {TAGS.map((t) => {
                  const sel = modal.tags.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggleTag(t.id)}
                      className="text-xs font-medium px-2.5 py-1 rounded-full border-2 transition"
                      style={{ background: t.bg, color: t.fg, borderColor: sel ? t.fg : "transparent", opacity: sel ? 1 : 0.5 }}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Color</label>
              <div className="flex gap-1.5 flex-wrap">
                {CARD_COLORS.map((c) => {
                  const sel = (modal.color || "white") === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setModal({ ...modal, color: c.id })}
                      title={c.label}
                      aria-label={c.label}
                      className="w-7 h-7 rounded-full border-2 transition flex items-center justify-center"
                      style={{ background: dark ? c.dark : c.light, borderColor: sel ? "#3b82f6" : (dark ? "#525252" : "#d4d4d4") }}
                    >
                      {sel && <Check size={13} style={{ color: dark ? "#fff" : "#3b82f6" }} />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-500 dark:text-neutral-400 block mb-1">Puntos de esfuerzo</label>
              <div className="flex gap-1.5 flex-wrap">
                {POINTS.map((p) => {
                  const sel = modal.points === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setModal({ ...modal, points: sel ? null : p })}
                      className={`text-xs font-medium px-2.5 py-1 rounded-md border transition ${sel ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300" : "bg-neutral-50 border-neutral-200 text-neutral-500 dark:bg-neutral-900 dark:border-neutral-600 dark:text-neutral-400"}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs text-neutral-500 dark:text-neutral-400">Prompt para Claude Code</label>
                <button
                  onClick={() => setModal({ ...modal, prompt: buildPrompt(modal) })}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  <Wand2 size={12} /> Generar
                </button>
              </div>
              <textarea
                value={modal.prompt}
                onChange={(e) => setModal({ ...modal, prompt: e.target.value })}
                placeholder="Se completa solo al pasar la tarjeta a In Progress..."
                className="w-full text-xs rounded-md border border-neutral-200 dark:border-neutral-600 px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-400 resize-y font-mono"
                style={{ minHeight: 80, lineHeight: 1.5 }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="border border-neutral-200 dark:border-neutral-600 rounded-md px-3.5 py-1.5 text-sm text-neutral-500 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">Cancelar</button>
              <button onClick={saveModal} className="bg-blue-50 border border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300 rounded-md px-3.5 py-1.5 text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-1">
                <Check size={14} /> {modal.mode === "edit" ? "Guardar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de borrado */}
      {confirm && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className="bg-white dark:bg-neutral-800 dark:text-neutral-100 rounded-xl border border-neutral-200 dark:border-neutral-700 p-5 w-72 flex flex-col gap-3.5">
            <h3 className="text-base font-medium">Eliminar tarea</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              ¿Seguro que querés eliminar <strong>"{cards.find((c) => c.id === confirm.id)?.title}"</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirm(null)} className="border border-neutral-200 dark:border-neutral-600 rounded-md px-3.5 py-1.5 text-sm text-neutral-500 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700">Cancelar</button>
              <button onClick={() => deleteCard(confirm.id)} className="bg-red-50 border border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300 rounded-md px-3.5 py-1.5 text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
