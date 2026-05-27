const STORAGE_KEY = "consultaHabitacionalEP:v1";
const WORKSPACES_KEY = "consultaHabitacionalEP:workspaces:v1";
const DEFAULT_WORKSPACE_NAME = "Comité sin nombre";
const MAYORIA_EDAD = 18;
const HIJO_PROXIMO_18_DIAS = 90;

const COLUMN_ALIASES = {
  nombre: [
    "nombre",
    "nombrecompleto",
    "nombrepostulante",
    "nombrespostulante",
    "nombresocio",
    "nombresocia",
    "nombretitular",
    "nombrebeneficiario",
    "postulante",
    "socio",
    "titular",
    "beneficiario",
  ],
  nombres: ["nombres", "primernombre", "segundonombre", "nombrespostulante", "nombressocio"],
  apellidoPaterno: ["apellidopaterno", "apaterno", "paterno", "primerapellido"],
  apellidoMaterno: ["apellidomaterno", "amaterno", "materno", "segundoapellido"],
  apellidos: ["apellidos", "apellido", "apellidospostulante", "apellidossocio"],
  rut: [
    "rut",
    "run",
    "rutpostulante",
    "runpostulante",
    "rutsocio",
    "runsocio",
    "ruttitular",
    "runtitular",
    "rutbeneficiario",
    "runbeneficiario",
    "cedulaidentidad",
    "ci",
    "documentoidentidad",
    "nrodocumento",
    "numerodocumento",
    "numdocumento",
    "dni",
  ],
  correo: ["correo", "email", "mail", "correoelectronico", "e-mail"],
  telefono: ["fono", "telefono", "telefonocelular", "celular", "contacto", "whatsapp", "ncontacto"],
  direccion: ["direccion", "domicilio", "direccionparticular", "domicilioparticular"],
  sexo: ["sexo", "genero"],
  estadoCivil: ["estadocivil", "ecivil"],
  nacionalidad: ["nacionalidad", "macionalidad", "paisorigen"],
  etnia: [
    "etnia",
    "pueblo",
    "pueblooriginario",
    "puebloindigena",
    "pueblonativo",
    "perteneceapueblooriginario",
    "pertenenciapueblooriginario",
    "calidadindigena",
    "indigena",
    "mapuche",
    "aymara",
  ],
  fechaNacimiento: [
    "fecnac",
    "fechnac",
    "fnac",
    "fechanac",
    "fechanacimiento",
    "fnacimiento",
    "nacimiento",
    "fechadenacimiento",
  ],
  edad: ["edad", "edadpostulante"],
  discapacidad: [
    "discapacidad",
    "discapacitado",
    "discapacitada",
    "credencialdiscapacidad",
    "registrodiscapacidad",
    "movilidadreducida",
  ],
  neurodivergencia: ["neurodivergencia", "neurodivergente", "tea", "trastornoespectroautista"],
  tipoVivienda: [
    "tipovivienda",
    "tipodevivienda",
    "tipologiavivienda",
    "tipologiadevivienda",
    "clasificacionvivienda",
    "clasificaciondevivienda",
    "viviendaasignada",
    "viviendapostulacion",
    "viviendapostulante",
    "tipoviviendapostulante",
    "tipoviviendaasignada",
    "vivienda",
  ],
  numeroCuenta: ["ncuenta", "numerocuenta", "cuenta", "libreta", "nlibreta", "nrolibreta"],
  banco: ["banco", "institucionfinanciera", "entidadfinanciera"],
  rsh: [
    "rsh",
    "registrosocial",
    "registrosocialhogares",
    "registrosocialdehogares",
    "tramorhs",
    "tramo",
    "tramorsh",
    "porcentajersh",
    "calificacionsocioeconomica",
    "cse",
  ],
  minvuConecta: ["minvuconecta", "minvu", "foliominvu", "codigominvu"],
  comuna: ["comuna", "comunapostulacion", "comunaproyecto", "comunadomicilio"],
  parentesco: ["parentesco", "parentezco"],
  tipoFamilia: ["tipofamilia", "familia", "tipologiadefamilia", "tipologiafamilia"],
  grupoFamiliar: ["grupofamiliar", "grupfam", "grupofam", "grupohogar", "nucleofamiliar"],
  integrantes: [
    "integrantes",
    "nintegrantes",
    "nrointegrantes",
    "numerointegrantes",
    "cantidadintegrantes",
    "totalintegrantes",
    "integrantesgrupofamiliar",
  ],
  ahorro: ["ahorro", "saldoahorro", "montoahorro", "ahorrodia", "ahorroal", "saldoctaahorro"],
  cedulaVencimiento: [
    "vencimientocedula",
    "cedulavence",
    "fechavencimientocedula",
    "vencimientoci",
    "civence",
    "fechavencimientoci",
    "fechavencimiento",
    "vencimientodocumento",
    "fechacaducidad",
    "caducidadci",
    "vigenciaci",
    "fechavigencia",
    "fechaexpiracionci",
    "venci",
  ],
};

const MAIN_PERSON_EXCLUDES = [
  "conyuge",
  "pareja",
  "hijo",
  "hija",
  "carga",
  "dependiente",
  "menor",
  "integrante",
  "familiar",
];

const COLUMN_EXCLUDES = {
  nombre: [...MAIN_PERSON_EXCLUDES, "rut", "run", "cedula", "documento", "telefono", "fono", "correo", "mail", "fecha", "edad"],
  nombres: [...MAIN_PERSON_EXCLUDES, "rut", "run", "cedula", "documento", "telefono", "fono", "correo", "mail", "fecha", "edad"],
  apellidoPaterno: [...MAIN_PERSON_EXCLUDES],
  apellidoMaterno: [...MAIN_PERSON_EXCLUDES],
  apellidos: [...MAIN_PERSON_EXCLUDES],
  rut: [...MAIN_PERSON_EXCLUDES, "vencimiento", "vence", "vigencia", "caducidad", "expiracion", "fecha", "nombre", "apellido"],
  fechaNacimiento: [...MAIN_PERSON_EXCLUDES, "vencimiento", "vence", "vigencia", "caducidad", "expiracion", "cedula", "ci"],
  nacionalidad: [...MAIN_PERSON_EXCLUDES],
  cedulaVencimiento: ["hijo", "hija", "carga", "dependiente", "conyuge", "pareja"],
  tipoVivienda: ["numero", "numeroviviendas", "nroviviendas", "nviviendas", "cantidad", "total", "uf", "ahorro", "rsh"],
};

const HOUSING_CATEGORIES = [
  { key: "base", label: "Vivienda base" },
  { key: "grupo_familiar", label: "Grupo familiar" },
  { key: "neurodivergencia", label: "Neurodivergencia" },
  { key: "discapacidad", label: "Discapacidad" },
  { key: "combinada", label: "Combinada" },
  { key: "otra", label: "Otra" },
];

let workspaceStore = loadWorkspaceStore();
let state = getWorkspaceState(getActiveWorkspace());
let currentView = "personas";
let pendingManualImport = null;
saveWorkspaceStore({ updateUi: false });

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalEvents();
  navigate("personas");
});

function bindGlobalEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.view));
  });

  document.getElementById("exportJsonBtn").addEventListener("click", exportJson);
  document.getElementById("importJsonInput").addEventListener("change", importJson);
  document.getElementById("clearDataBtn").addEventListener("click", clearData);
  document.getElementById("workspaceSelect").addEventListener("change", (event) => {
    setActiveWorkspace(event.target.value);
  });
  document.getElementById("newWorkspaceBtn").addEventListener("click", createWorkspaceFromPrompt);
  updateWorkspaceControls();
}

function navigate(view, params = {}) {
  currentView = view;
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const routes = {
    dashboard: renderDashboard,
    personas: () => renderPersonas(params),
    importar: renderImportar,
    alertas: renderAlertas,
    gestion: renderGestion,
    reportes: renderReportes,
    ficha: () => renderFicha(params.rut),
  };
  routes[view]();
  updateStorageSummary();
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { personas: [], importaciones: [] };
    const parsed = JSON.parse(raw);
    return {
      personas: Array.isArray(parsed.personas) ? parsed.personas : [],
      importaciones: Array.isArray(parsed.importaciones) ? parsed.importaciones : [],
      gestiones: normalizeGestionStore(parsed.gestiones),
    };
  } catch {
    return { personas: [], importaciones: [], gestiones: {} };
  }
}

function loadWorkspaceStore() {
  try {
    const raw = localStorage.getItem(WORKSPACES_KEY);
    if (raw) {
      return normalizeWorkspaceStore(JSON.parse(raw));
    }
  } catch {
    // Fall back to legacy data below.
  }
  return migrateLegacyStateToWorkspaces(loadState());
}

function normalizeWorkspaceStore(data) {
  const workspaces = (Array.isArray(data?.workspaces) ? data.workspaces : [])
    .map(normalizeWorkspace)
    .filter(Boolean);
  const seenIds = new Set();
  workspaces.forEach((workspace) => {
    if (seenIds.has(workspace.id)) {
      workspace.id = cryptoId();
    }
    seenIds.add(workspace.id);
  });
  if (!workspaces.length) {
    workspaces.push(createWorkspace({ nombre: DEFAULT_WORKSPACE_NAME }));
  }
  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === data?.activeWorkspaceId)
    ? data.activeWorkspaceId
    : workspaces[0].id;
  return { activeWorkspaceId, workspaces };
}

function migrateLegacyStateToWorkspaces(legacyState) {
  const legacy = normalizeLoadedState(legacyState);
  if (!legacy.personas.length) {
    const workspace = createWorkspace({ nombre: DEFAULT_WORKSPACE_NAME });
    return { activeWorkspaceId: workspace.id, workspaces: [workspace] };
  }

  const grouped = new Map();
  legacy.personas.forEach((persona) => {
    const nombre = cleanString(persona.comite?.nombre) || DEFAULT_WORKSPACE_NAME;
    const comuna = cleanString(persona.comite?.comuna);
    const key = `${normalize(nombre)}|${normalize(comuna)}`;
    if (!grouped.has(key)) {
      grouped.set(key, createWorkspace({ nombre, comuna }));
    }
    grouped.get(key).personas.push(persona);
  });

  const workspaces = [...grouped.values()];
  if (workspaces.length === 1) {
    workspaces[0].importaciones = legacy.importaciones;
    workspaces[0].gestiones = legacy.gestiones;
  }
  return { activeWorkspaceId: workspaces[0].id, workspaces };
}

function normalizeWorkspace(workspace) {
  if (!workspace) return null;
  const normalized = normalizeLoadedState({
    personas: Array.isArray(workspace.personas) ? workspace.personas : [],
    importaciones: Array.isArray(workspace.importaciones) ? workspace.importaciones : [],
    gestiones: workspace.gestiones,
    viviendas: workspace.viviendas,
    viviendaFuente: workspace.viviendaFuente,
  });
  return {
    id: cleanString(workspace.id) || cryptoId(),
    nombre: cleanString(workspace.nombre) || DEFAULT_WORKSPACE_NAME,
    comuna: cleanString(workspace.comuna),
    personas: normalized.personas,
    importaciones: normalized.importaciones,
    gestiones: normalized.gestiones,
    viviendas: normalized.viviendas,
    viviendaFuente: normalized.viviendaFuente,
    actualizadoEn: cleanString(workspace.actualizadoEn) || new Date().toISOString(),
  };
}

function createWorkspace({ nombre, comuna = "" }) {
  return {
    id: cryptoId(),
    nombre: cleanString(nombre) || DEFAULT_WORKSPACE_NAME,
    comuna: cleanString(comuna),
    personas: [],
    importaciones: [],
    gestiones: {},
    viviendas: [],
    viviendaFuente: null,
    actualizadoEn: new Date().toISOString(),
  };
}

function isDefaultWorkspaceName(nombre) {
  return normalize(nombre) === normalize(DEFAULT_WORKSPACE_NAME);
}

function workspaceDisplayName(workspace) {
  const nombre = cleanString(workspace?.nombre);
  return !nombre || isDefaultWorkspaceName(nombre) ? DEFAULT_WORKSPACE_NAME : nombre;
}

function getActiveWorkspace() {
  let workspace = workspaceStore.workspaces.find((item) => item.id === workspaceStore.activeWorkspaceId);
  if (!workspace) {
    workspace = workspaceStore.workspaces[0] || createWorkspace({ nombre: DEFAULT_WORKSPACE_NAME });
    if (!workspaceStore.workspaces.length) workspaceStore.workspaces.push(workspace);
    workspaceStore.activeWorkspaceId = workspace.id;
  }
  return workspace;
}

function getWorkspaceState(workspace) {
  return normalizeLoadedState({
    personas: workspace?.personas || [],
    importaciones: workspace?.importaciones || [],
    gestiones: workspace?.gestiones || {},
    viviendas: workspace?.viviendas || [],
    viviendaFuente: workspace?.viviendaFuente || null,
  });
}

function syncStateToActiveWorkspace() {
  const workspace = getActiveWorkspace();
  workspace.personas = state.personas || [];
  workspace.importaciones = state.importaciones || [];
  workspace.gestiones = normalizeGestionStore(state.gestiones);
  workspace.viviendas = normalizeHousingRows(state.viviendas || []);
  workspace.viviendaFuente = normalizeHousingSource(state.viviendaFuente);
  workspace.actualizadoEn = new Date().toISOString();
}

function saveWorkspaceStore({ updateUi = true } = {}) {
  syncStateToActiveWorkspace();
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaceStore));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (updateUi && document.body) {
    updateWorkspaceControls();
    updateStorageSummary();
  }
}

function updateWorkspaceControls() {
  const select = document.getElementById("workspaceSelect");
  if (!select) return;
  const active = getActiveWorkspace();
  select.innerHTML = workspaceStore.workspaces
    .map((workspace) => `<option value="${escapeAttr(workspace.id)}">${escapeHtml(workspaceDisplayName(workspace))}</option>`)
    .join("");
  select.value = active.id;
}

function setActiveWorkspace(workspaceId) {
  syncStateToActiveWorkspace();
  workspaceStore.activeWorkspaceId = workspaceId;
  state = getWorkspaceState(getActiveWorkspace());
  saveWorkspaceStore();
  navigate(safeWorkspaceView(currentView));
}

function ensureWorkspace(nombre, comuna = "", switchTo = true) {
  const workspaceName = cleanString(nombre) || DEFAULT_WORKSPACE_NAME;
  const workspaceComuna = cleanString(comuna);
  syncStateToActiveWorkspace();

  let workspace = workspaceStore.workspaces.find(
    (item) =>
      normalize(item.nombre) === normalize(workspaceName) &&
      (normalize(item.comuna) === normalize(workspaceComuna) || !normalize(item.comuna) || !normalize(workspaceComuna))
  );
  if (workspace && workspaceComuna && !cleanString(workspace.comuna)) {
    workspace.comuna = workspaceComuna;
  }

  const active = getActiveWorkspace();
  const activeIsEmptyDefault =
    isDefaultWorkspaceName(active.nombre) &&
    !active.personas.length &&
    !active.importaciones.length &&
    !workspace;
  if (activeIsEmptyDefault) {
    active.nombre = workspaceName;
    active.comuna = workspaceComuna;
    workspace = active;
  }

  if (!workspace) {
    workspace = createWorkspace({ nombre: workspaceName, comuna: workspaceComuna });
    workspaceStore.workspaces.push(workspace);
  }

  if (switchTo) {
    workspaceStore.activeWorkspaceId = workspace.id;
    state = getWorkspaceState(workspace);
  }
  saveWorkspaceStore();
  return workspace;
}

function createWorkspaceFromPrompt() {
  const nombre = prompt("Nombre del comité");
  if (!cleanString(nombre)) return;
  ensureWorkspace(nombre, "", true);
  navigate(safeWorkspaceView(currentView));
}

function safeWorkspaceView(view) {
  return view === "ficha" ? "personas" : view;
}

function normalizeLoadedState(data) {
  const personas = (data.personas || []).map((persona) => {
    const caracterizacion = { ...(persona.caracterizacion || {}) };
    caracterizacion.hijos = normalizeHijos(
      caracterizacion.hijos || extractHijosFromEntries(Object.entries(persona.original || {}))
    );
    const documentos = (persona.documentos || []).map(normalizeDocument);
    const cedula = documentos.find((doc) => doc.tipo === "cedula");
    const cedulaVencimiento = parseDateValue(cedula?.fechaVencimiento);
    const alertasBase = (persona.alertas || [])
      .filter((alerta) => !isRshAlert(alerta))
      .filter((alerta) => !isAhorroAlert(alerta))
      .filter((alerta) => !isRuleManagedAlert(alerta))
      .map(normalizeAlert);
    if (
      !cleanString(caracterizacion.grupoFamiliar) &&
      caracterizacion.integrantes !== null &&
      caracterizacion.integrantes !== undefined
    ) {
      caracterizacion.grupoFamiliar = cleanString(caracterizacion.integrantes);
    }
    const postulacion = {
      ...(persona.postulacion || {}),
      tipoVivienda: cleanString(
        persona.postulacion?.tipoVivienda ||
          persona.caracterizacion?.tipoVivienda ||
          persona.tipoVivienda ||
          inferPersonOriginalValue(persona.original, "tipoVivienda")
      ),
    };
    const normalizedPersona = {
      ...persona,
      caracterizacion,
      postulacion,
      documentos,
    };
    const alertas = [...buildAlerts(normalizedPersona, cedulaVencimiento), ...alertasBase];
    return {
      ...normalizedPersona,
      alertas,
      estadoGeneral: getGeneralStatus(alertas),
    };
  });
  return {
    ...data,
    personas,
    gestiones: normalizeGestionStore(data.gestiones),
    viviendas: normalizeHousingRows(data.viviendas || data.tiposVivienda || []),
    viviendaFuente: normalizeHousingSource(data.viviendaFuente),
  };
}

function normalizeGestionStore(gestiones) {
  if (!gestiones || typeof gestiones !== "object" || Array.isArray(gestiones)) return {};
  return Object.fromEntries(
    Object.entries(gestiones)
      .filter(([key]) => cleanString(key))
      .map(([key, value]) => [
        key,
        {
          estado: ["pendiente", "en_revision", "resuelto"].includes(value?.estado) ? value.estado : "pendiente",
          responsable: cleanString(value?.responsable),
          comentario: cleanString(value?.comentario),
          actualizadoEn: cleanString(value?.actualizadoEn),
        },
      ])
  );
}

function normalizeHousingRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row, index) => normalizeHousingRow(row, index))
    .filter(Boolean);
}

function normalizeHousingRow(row, index) {
  if (!row || typeof row !== "object") return null;
  const tipo = canonicalHousingType(row.tipo || row.tipoVivienda);
  const viviendas = parseInteger(row.viviendas ?? row.numeroViviendas ?? row.total);
  if (!tipo || viviendas === null) return null;
  const category = housingCategoryForText(
    [
      tipo,
      row.clasificacion,
      row.grupoFamiliar,
      row.discapacidad20,
      row.neurodivergencia,
      row.movilidadReducida,
    ].join(" ")
  );
  return {
    id: cleanString(row.id) || `vivienda-${index + 1}-${normalize(tipo)}`,
    tipo,
    clasificacion: cleanString(row.clasificacion) || category.label,
    clasificacionKey: cleanString(row.clasificacionKey) || category.key,
    rsh: formatHousingRshValue(row.rsh),
    ahorro: formatHousingAhorroValue(row.ahorro),
    grupoFamiliar: cleanString(row.grupoFamiliar),
    discapacidad20: cleanString(row.discapacidad20),
    neurodivergencia: cleanString(row.neurodivergencia),
    movilidadReducida: cleanString(row.movilidadReducida),
    viviendas,
  };
}

function normalizeHousingSource(source) {
  if (!source || typeof source !== "object") return null;
  return {
    archivo: cleanString(source.archivo),
    hoja: cleanString(source.hoja),
    titulo: cleanString(source.titulo),
    total: parseInteger(source.total),
    actualizadoEn: cleanString(source.actualizadoEn),
  };
}

function normalizeDocument(doc) {
  const fechaVencimiento = parseDateValue(doc.fechaVencimiento);
  if (doc.tipo !== "cedula" || !fechaVencimiento) return doc;
  return {
    ...doc,
    estado: documentStatusByDate(fechaVencimiento),
    fechaVencimiento: fechaVencimiento.toISOString().slice(0, 10),
  };
}

function normalizeAlert(alerta) {
  if (Object.prototype.hasOwnProperty.call(alerta, "impactaEstado")) {
    return alerta;
  }
  return {
    ...alerta,
    impactaEstado: inferStateImpact(alerta),
  };
}

function isRshAlert(alerta) {
  const text = `${normalize(alerta.tipo)}${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("rsh") || text.includes("tramorshinformado");
}

function isAhorroAlert(alerta) {
  const text = `${normalize(alerta.tipo)}${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("ahorro") || text.includes("financiera");
}

function isCedulaAlert(alerta) {
  const text = `${normalize(alerta.tipo)}${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("cedula");
}

function isDisabilitySupportAlert(alerta) {
  const text = `${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("respaldodiscapacidad") || (text.includes("certificado") && text.includes("discapacidad"));
}

function isIndigenousCertificateAlert(alerta) {
  const text = `${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("acreditacionindigena") || text.includes("certificadoindigena");
}

function isUnipersonalExceptionAlert(alerta) {
  const text = `${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("criteriodeexcepcionunipersonal") || text.includes("excepcionunipersonal");
}

function isChildAgeAlert(alerta) {
  const text = `${normalize(alerta.titulo)}${normalize(alerta.detalle)}`;
  return text.includes("hijo") && text.includes("18");
}

function isRuleManagedAlert(alerta) {
  return (
    isCedulaAlert(alerta) ||
    isDisabilitySupportAlert(alerta) ||
    isIndigenousCertificateAlert(alerta) ||
    isUnipersonalExceptionAlert(alerta) ||
    isChildAgeAlert(alerta)
  );
}

function saveState() {
  saveWorkspaceStore();
}

function updateStorageSummary() {
  const count = state.personas.length;
  const workspace = getActiveWorkspace();
  document.getElementById("storageSummary").textContent =
    `${formatNumber(count)} ${count === 1 ? "persona" : "personas"} en ${workspaceDisplayName(workspace)}`;
}

function renderDashboard() {
  const resumen = getResumen();
  const workspace = getActiveWorkspace();
  const housingRows = getHousingRows();

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Panel operativo</div>
        <h2>Dashboard</h2>
        <p class="muted">${escapeHtml(workspaceDisplayName(workspace))}</p>
      </div>
    </div>
    <section class="grid stats">
      ${stat("Total personas", resumen.totalPersonas, "", "total")}
      ${stat("Cédulas vencidas o por vencer", resumen.cedulasRevision, "rose", "cedulas_revision")}
      ${stat("Adultos mayores", resumen.personasMayores, "cyan", "adultos_mayores")}
      ${stat("Discapacidad", resumen.discapacidad, "indigo", "discapacidad")}
      ${stat("Etnia / pueblo originario", resumen.etnia, "emerald", "etnia")}
      ${stat("Postulación unipersonal", resumen.unipersonales, "amber", "unipersonal")}
    </section>
    ${renderHousingDashboardSection(housingRows)}
  `);

  document.querySelectorAll(".stat-action").forEach((card) => {
    card.addEventListener("click", () => navigate("personas", { filtro: card.dataset.filter || "total" }));
  });
  bindHousingDashboardTabs();
}

function renderHousingDashboardSection(rows) {
  const source = state.viviendaFuente;
  if (!rows.length) {
    return `
      <section class="panel dashboard-housing-panel" style="margin-top: 18px;">
        <div class="report-export-head">
          <div>
            <h3>Tipos de vivienda</h3>
            <p class="muted">Sin tipos de vivienda cargados para este comité.</p>
          </div>
        </div>
        <div class="empty">Carga una base que incluya una columna TIPO VIVIENDA por postulante. La hoja Financiamiento se usará como detalle complementario cuando exista.</div>
      </section>
    `;
  }

  const totalViviendas = rows.reduce((sum, row) => sum + Number(row.viviendas || 0), 0);
  const totalPersonas = rows.reduce((sum, row) => sum + Number(row.personas || 0), 0);
  const categoryRows = housingCategorySummary(rows);
  const tabs = [
    { key: "todas", label: "Todas" },
    ...HOUSING_CATEGORIES.filter((category) => rows.some((row) => row.clasificacionKey === category.key)),
  ];
  const sourceText = totalViviendas
    ? `; ${formatNumber(totalViviendas)} viviendas informadas${source?.hoja ? ` desde hoja ${escapeHtml(source.hoja)}` : ""}`
    : "";

  return `
    <section class="panel dashboard-housing-panel" style="margin-top: 18px;">
      <div class="report-export-head">
        <div>
          <h3>Tipos de vivienda</h3>
          <p class="muted">${formatNumber(totalPersonas)} personas clasificadas por tipo de vivienda${sourceText}.</p>
        </div>
      </div>
      <div class="housing-summary-grid">
        ${categoryRows
          .map(
            (row) => `
              <div class="housing-summary-card">
                <span>${escapeHtml(row.label)}</span>
                <strong>${formatNumber(row.personas)}</strong>
                <small>${row.viviendas ? `${formatNumber(row.viviendas)} vivienda${row.viviendas === 1 ? "" : "s"} en financiamiento` : "Sin detalle de financiamiento"}</small>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="housing-tabs" role="tablist" aria-label="Tipos de vivienda">
        ${tabs
          .map(
            (tab, index) =>
              `<button class="housing-tab ${index === 0 ? "active" : ""}" type="button" data-housing-filter="${escapeAttr(tab.key)}">${escapeHtml(tab.label)}</button>`
          )
          .join("")}
      </div>
      <div id="housingTypeResult" class="housing-type-result"></div>
    </section>
  `;
}

function bindHousingDashboardTabs() {
  if (!document.getElementById("housingTypeResult")) return;
  document.querySelectorAll(".housing-tab").forEach((button) => {
    button.addEventListener("click", () => renderHousingTypeRows(button.dataset.housingFilter || "todas"));
  });
  renderHousingTypeRows("todas");
}

function renderHousingTypeRows(filter = "todas") {
  const container = document.getElementById("housingTypeResult");
  if (!container) return;
  document.querySelectorAll(".housing-tab").forEach((button) => {
    button.classList.toggle("active", (button.dataset.housingFilter || "todas") === filter);
  });
  const rows = getHousingRows().filter((row) => filter === "todas" || row.clasificacionKey === filter);
  if (!rows.length) {
    container.innerHTML = emptyHtml("Sin viviendas para esta clasificación");
    return;
  }
  container.innerHTML = housingTypeRowsTable(rows);
  document.querySelectorAll(".housing-people-btn").forEach((button) => {
    button.addEventListener("click", () => renderHousingPeopleList(button.dataset.housingRow || ""));
  });
  renderHousingPeopleList(rows[0]?.id || "");
}

function housingTypeRowsTable(rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Clasificación</th>
            <th>Tipo vivienda</th>
            <th>Personas</th>
            <th>Viviendas financ.</th>
            <th>RSH</th>
            <th>Ahorro</th>
            <th>Grupo familiar</th>
            <th>Neuro</th>
            <th>Disc. 20 UF</th>
            <th>Mov. 80 UF</th>
            <th>Lista</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.clasificacion)}</td>
                  <td>${escapeHtml(row.tipo)}</td>
                  <td>${formatNumber(row.personas || 0)}</td>
                  <td>${escapeHtml(row.viviendas === null || row.viviendas === undefined ? "Sin dato" : row.viviendas)}</td>
                  <td>${escapeHtml(row.rsh || "Sin dato")}</td>
                  <td>${escapeHtml(row.ahorro || "Sin dato")}</td>
                  <td>${escapeHtml(row.grupoFamiliar || "")}</td>
                  <td>${escapeHtml(row.neurodivergencia || "")}</td>
                  <td>${escapeHtml(row.discapacidad20 || "")}</td>
                  <td>${escapeHtml(row.movilidadReducida || "")}</td>
                  <td>
                    <button class="button secondary subtle housing-people-btn" type="button" data-housing-row="${escapeAttr(row.id)}">Ver lista</button>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div id="housingPeopleResult" class="housing-people-result"></div>
  `;
}

function renderHousingPeopleList(rowId) {
  const container = document.getElementById("housingPeopleResult");
  if (!container) return;
  const row = getHousingRows().find((item) => item.id === rowId);
  document.querySelectorAll(".housing-people-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.housingRow === rowId);
  });
  if (!row || !Array.isArray(row.personasDetalle) || !row.personasDetalle.length) {
    container.innerHTML = emptyHtml("Sin personas asociadas a esta fila");
    return;
  }

  const title = [row.tipo, row.rsh, row.ahorro].filter(Boolean).join(" - ");
  container.innerHTML = `
    <div class="housing-people-head">
      <div>
        <h4>${escapeHtml(title)}</h4>
        <p class="muted">${formatNumber(row.personasDetalle.length)} persona${row.personasDetalle.length === 1 ? "" : "s"} en esta clasificación.</p>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Persona</th>
            <th>RUT</th>
            <th>RSH</th>
            <th>Tipo en base</th>
            <th>Grupo familiar</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${row.personasDetalle
            .map(
              (persona) => `
                <tr>
                  <td><button class="person-link housing-person-link" type="button" data-rut="${escapeAttr(persona.rut)}">${escapeHtml(persona.nombre)}</button></td>
                  <td>${escapeHtml(persona.rut)}</td>
                  <td>${escapeHtml(persona.rsh)}</td>
                  <td>${escapeHtml(persona.tipoOriginal || "Sin dato")}</td>
                  <td>${escapeHtml(persona.grupoFamiliar || "Sin dato")}</td>
                  <td>${badge(persona.estadoGeneral)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  container.querySelectorAll(".housing-person-link").forEach((button) => {
    button.addEventListener("click", () => navigate("ficha", { rut: button.dataset.rut }));
  });
}

function renderPersonas(params = {}) {
  const initialFilter = params.filtro || "";
  const workspace = getActiveWorkspace();
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Consulta rápida</div>
        <h2>Buscar persona</h2>
        <p class="muted">${escapeHtml(workspaceDisplayName(workspace))}</p>
      </div>
    </div>
    <section class="card">
      <div class="field-row" style="grid-template-columns: minmax(260px, 1fr) 220px 260px;">
        <label class="field">
          <span>RUT o nombre</span>
          <input id="searchInput" class="input" placeholder="RUT o nombre" autocomplete="off" />
        </label>
        <label class="field">
          <span>Estado</span>
          <select id="statusFilter" class="select">
            <option value="">Todos</option>
            <option value="apta">Aptas</option>
            <option value="observada">Observadas</option>
            <option value="bloqueada">Bloqueadas</option>
          </select>
        </label>
        <label class="field">
          <span>Filtro rápido</span>
          <select id="quickFilter" class="select">
            <option value="">Todos</option>
            <option value="cedulas_revision">Cédulas vencidas o por vencer</option>
            <option value="adultos_mayores">Adultos mayores</option>
            <option value="discapacidad">Discapacidad</option>
            <option value="etnia">Etnia / pueblo originario</option>
            <option value="unipersonal">Postulación unipersonal</option>
          </select>
        </label>
      </div>
      <div class="toolbar-row">
        <button id="exportPersonasBtn" class="button secondary subtle" type="button">Exportar nómina filtrada</button>
      </div>
    </section>
    <section id="personasResult" style="margin-top: 18px;"></section>
  `);

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const quickFilter = document.getElementById("quickFilter");
  quickFilter.value = initialFilter === "total" ? "" : initialFilter;
  const update = () => renderPersonasTable(searchInput.value, statusFilter.value, quickFilter.value);
  searchInput.addEventListener("input", update);
  statusFilter.addEventListener("change", update);
  quickFilter.addEventListener("change", update);
  document.getElementById("exportPersonasBtn").addEventListener("click", () => {
    exportPersonasExcel(searchInput.value, statusFilter.value, quickFilter.value);
  });
  if (window.matchMedia("(min-width: 700px)").matches) {
    searchInput.focus();
  }
  update();
}

function filteredPersonasRows(query = "", estado = "", filtroRapido = "") {
  const q = normalize(query);
  return state.personas
    .filter((persona) => {
      const matchQuery =
        !q ||
        normalize(persona.rut).includes(q) ||
        normalize(persona.nombre).includes(q) ||
        normalize(persona.telefono).includes(q) ||
        normalize(persona.comite.nombre).includes(q);
      const matchEstado = !estado || persona.estadoGeneral === estado;
      const matchFiltro = personMatchesQuickFilter(persona, filtroRapido);
      return matchQuery && matchEstado && matchFiltro;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

function renderPersonasTable(query = "", estado = "", filtroRapido = "") {
  const rows = filteredPersonasRows(query, estado, filtroRapido);

  const container = document.getElementById("personasResult");
  if (!rows.length) {
    container.innerHTML = emptyHtml(`No hay personas para mostrar${filtroRapido ? ` en ${personFilterLabel(filtroRapido)}` : ""}`);
    return;
  }

  container.innerHTML = `
    ${filtroRapido ? `<p class="muted small" style="margin: 0 0 10px;">Filtro: ${escapeHtml(personFilterLabel(filtroRapido))} - ${formatNumber(rows.length)} resultado${rows.length === 1 ? "" : "s"}</p>` : ""}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Persona</th>
            <th>Comité</th>
            <th>Estado</th>
            <th>Tipo vivienda</th>
            <th>Motivos</th>
            <th>RSH</th>
            <th>Alertas</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (persona) => `
                <tr>
                  <td>
                    <button class="person-link" data-rut="${escapeAttr(persona.rut)}">${escapeHtml(persona.nombre)}</button>
                    <div class="muted small">${escapeHtml(persona.rut)} - ${escapeHtml(persona.telefono || "Sin teléfono")}</div>
                    ${personFlags(persona)}
                  </td>
                  <td>
                    ${escapeHtml(persona.comite.nombre || "Sin comité")}
                    <div class="muted small">${escapeHtml(persona.comite.comuna || "Sin comuna")}</div>
                  </td>
                  <td>${badge(persona.estadoGeneral)}</td>
                  <td>${escapeHtml(personHousingType(persona) || "Sin dato")}</td>
                  <td>${reasonDetails(persona)}</td>
                  <td>${formatPercent(persona.rsh.porcentaje)}</td>
                  <td>${persona.alertas.filter((alerta) => alerta.activa).length}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll(".person-link").forEach((button) => {
    button.addEventListener("click", () => navigate("ficha", { rut: button.dataset.rut }));
  });
}

function renderImportar() {
  const workspace = getActiveWorkspace();
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Carga de datos</div>
        <h2>Cargar base</h2>
        <p id="importWorkspaceName" class="muted">Espacio activo: ${escapeHtml(workspaceDisplayName(workspace))}</p>
      </div>
    </div>
    <section class="card">
      <form id="excelForm" class="grid">
        <div class="field-row">
          <label class="field">
            <span>Comité destino</span>
            <input id="comiteNombre" class="input" placeholder="Nombre del comité destino" />
          </label>
          <label class="field">
            <span>Comuna destino</span>
            <input id="comuna" class="input" placeholder="Comuna del comité" />
          </label>
          <label class="field">
            <span>Archivo</span>
            <input id="excelFile" class="input" type="file" accept=".xlsx,.xls" />
          </label>
        </div>
        <div id="importMessage"></div>
        <div>
          <button class="button primary" type="submit">Cargar base Excel</button>
        </div>
      </form>
    </section>
    <section id="manualImportPanel" class="panel manual-mapping hidden" style="margin-top: 18px;"></section>
    <section class="panel" style="margin-top: 18px;">
      <h3>Cargar observaciones y correcciones</h3>
      <form id="observationsForm" class="grid">
        <div class="field-row" style="grid-template-columns: minmax(260px, 1fr) 220px;">
          <label class="field">
            <span>Archivo Excel</span>
            <input id="observationsFile" class="input" type="file" accept=".xlsx,.xls" />
          </label>
          <label class="field">
            <span>Comité</span>
            <input id="observationsComite" class="input" placeholder="Opcional" />
          </label>
        </div>
        <div id="observationsMessage"></div>
        <div>
          <button class="button secondary" type="submit">Cargar observaciones</button>
        </div>
      </form>
    </section>
    <section class="panel" style="margin-top: 18px;">
      <h3>Últimas importaciones</h3>
      <div id="importHistory"></div>
    </section>
  `);

  document.getElementById("excelForm").addEventListener("submit", handleExcelImport);
  document.getElementById("observationsForm").addEventListener("submit", handleObservationsImport);
  renderImportHistory();
}

async function handleExcelImport(event) {
  event.preventDefault();
  const message = document.getElementById("importMessage");
  const file = document.getElementById("excelFile").files[0];
  const comiteNombre = document.getElementById("comiteNombre").value.trim();
  const comuna = document.getElementById("comuna").value.trim();
  const ahorroMinimo = 0;

  if (!window.XLSX) {
    message.innerHTML = notice("No se pudo cargar el lector Excel. Revisa tu conexión a internet.", "error");
    return;
  }
  if (!file) {
    message.innerHTML = notice("Selecciona un archivo Excel.", "error");
    return;
  }

  message.innerHTML = notice("Procesando archivo...");

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const workspaceName = comiteNombre || inferCommitteeName(file.name, sheetNameSafe(file.name));
    const workspace = ensureWorkspace(workspaceName, comuna, true);
    updateImportWorkspaceHeader();
    const options = {
      fileName: file.name,
      comiteNombre: workspace.nombre,
      comuna: workspace.comuna || comuna,
      ahorroMinimo,
    };
    const prepared = prepareWorkbookImport(workbook, options);
    if (!prepared.ready) {
      pendingManualImport = { workbook, options };
      message.innerHTML = notice(
        "No pude reconocer todas las columnas automáticamente. Ajusta el mapeo de columnas abajo y vuelve a cargar.",
        "error"
      );
      renderManualImportPanel(prepared);
      return;
    }

    const result = commitPreparedImport(prepared);
    completeImport(result, message);
  } catch (error) {
    message.innerHTML = notice(error.message || "No fue posible importar el archivo.", "error");
  }
}

async function handleObservationsImport(event) {
  event.preventDefault();
  const message = document.getElementById("observationsMessage");
  const file = document.getElementById("observationsFile").files[0];
  const comiteNombre = document.getElementById("observationsComite").value.trim();

  if (!window.XLSX) {
    message.innerHTML = notice("No se pudo cargar el lector Excel. Revisa tu conexión a internet.", "error");
    return;
  }
  if (!state.personas.length) {
    message.innerHTML = notice("Primero carga la base principal del comité.", "error");
    return;
  }
  if (!file) {
    message.innerHTML = notice("Selecciona un archivo Excel con observaciones o correcciones.", "error");
    return;
  }

  message.innerHTML = notice("Procesando observaciones...");

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const result = importObservationsWorkbook(workbook, {
      fileName: file.name,
      comiteNombre,
    });
    saveState();
    message.innerHTML = notice(
      `Observaciones cargadas: ${formatNumber(result.actualizados)} personas actualizadas, ${formatNumber(result.observaciones)} observaciones, ${formatNumber(result.correcciones)} correcciones, ${formatNumber(result.omitidos)} omitidos.`,
      "success"
    );
    renderImportHistory();
  } catch (error) {
    message.innerHTML = notice(error.message || "No fue posible cargar las observaciones.", "error");
  }
}

function importWorkbook(workbook, options) {
  const prepared = prepareWorkbookImport(workbook, options);
  if (!prepared.ready) {
    throw new Error(prepared.error || "No fue posible reconocer las columnas de la base.");
  }
  return commitPreparedImport(prepared);
}

function prepareWorkbookImport(workbook, options) {
  const sheetName = options.sheetName || selectBaseSheet(workbook.SheetNames);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = Number.isInteger(options.headerIndex) ? options.headerIndex : detectHeaderRow(rows);
  if (headerIndex < 0) {
    return {
      workbook,
      options,
      sheetName,
      rows,
      headerIndex,
      headers: [],
      columnMap: {},
      ready: false,
      error: "No se encontró una fila de encabezados compatible.",
    };
  }

  const headers = uniqueHeaders(rows[headerIndex]);
  const automaticMap = buildColumnMap(headers);
  const inferredMap = inferColumnMapFromData(rows, headerIndex, headers, automaticMap);
  const columnMap = cleanColumnMap({ ...inferredMap, ...(options.columnMap || {}) });
  const ready = hasRequiredIdentityColumns(columnMap);
  return {
    workbook,
    options,
    sheetName,
    rows,
    headerIndex,
    headers,
    columnMap,
    ready,
    error: ready ? "" : missingColumnsMessage(columnMap, headers),
  };
}

function commitPreparedImport(prepared) {
  const { rows, headers, columnMap, options, sheetName, headerIndex } = prepared;
  const stats = { creados: 0, actualizados: 0, omitidos: 0, errores: [], tiposViviendaPersonas: 0 };
  const existing = new Map(state.personas.map((persona) => [persona.rut, persona]));

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    if (!row.some((value) => cleanString(value))) {
      stats.omitidos += 1;
      continue;
    }

    try {
      const persona = rowToPersona(row, headers, columnMap, options);
      if (!persona) {
        stats.omitidos += 1;
        continue;
      }
      if (existing.has(persona.rut)) {
        mergeImportedPersona(existing.get(persona.rut), persona);
        stats.actualizados += 1;
      } else {
        state.personas.push(persona);
        existing.set(persona.rut, persona);
        stats.creados += 1;
      }
    } catch (error) {
      stats.omitidos += 1;
      stats.errores.push({ fila: i + 1, error: error.message });
    }
  }

  const housing = importHousingBreakdownFromWorkbook(prepared.workbook, options);
  if (housing.rows.length) {
    state.viviendas = housing.rows;
    state.viviendaFuente = housing.source;
    stats.viviendas = housing.rows.length;
  } else {
    stats.viviendas = 0;
  }
  stats.tiposViviendaPersonas = getHousingRows().length;

  state.importaciones.unshift({
    id: cryptoId(),
    archivo: options.fileName,
    hoja: sheetName,
    fecha: new Date().toISOString(),
    filas: Math.max(rows.length - headerIndex - 1, 0),
    modo: options.columnMap ? "mapeo_manual" : "automatico",
    ...stats,
  });
  state.importaciones = state.importaciones.slice(0, 20);
  return stats;
}

function completeImport(result, message) {
  saveState();
  const workspaceName = workspaceDisplayName(getActiveWorkspace());
  const housingMessage = result.tiposViviendaPersonas
    ? `, ${formatNumber(result.tiposViviendaPersonas)} tipos de vivienda por postulante`
    : result.viviendas
      ? `, ${formatNumber(result.viviendas)} filas de financiamiento detectadas`
      : "";
  message.innerHTML = notice(
    `Base cargada en ${workspaceName}: ${formatNumber(result.creados)} creados, ${formatNumber(result.actualizados)} actualizados, ${formatNumber(result.omitidos)} omitidos${housingMessage}.`,
    "success"
  );
  updateImportWorkspaceHeader();
  clearImportDestinationFields();
  const panel = document.getElementById("manualImportPanel");
  if (panel) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
  pendingManualImport = null;
  renderImportHistory();
}

function updateImportWorkspaceHeader() {
  const heading = document.getElementById("importWorkspaceName");
  if (heading) {
    heading.textContent = `Espacio activo: ${workspaceDisplayName(getActiveWorkspace())}`;
  }
}

function clearImportDestinationFields() {
  const comiteInput = document.getElementById("comiteNombre");
  const comunaInput = document.getElementById("comuna");
  if (comiteInput) comiteInput.value = "";
  if (comunaInput) comunaInput.value = "";
}

function importHousingBreakdownFromWorkbook(workbook, options = {}) {
  const sheetName = selectHousingSheet(workbook.SheetNames || []);
  if (!sheetName) return { rows: [], source: null };
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const parsed = parseHousingBreakdownRows(rows);
  if (!parsed.rows.length) return { rows: [], source: null };
  return {
    rows: parsed.rows,
    source: {
      archivo: options.fileName || "",
      hoja: sheetName,
      titulo: parsed.title,
      total: parsed.total,
      actualizadoEn: new Date().toISOString(),
    },
  };
}

function selectHousingSheet(sheetNames) {
  const scored = (sheetNames || [])
    .map((name) => ({ name, text: normalize(name) }))
    .map((item) => ({
      ...item,
      score:
        (item.text.includes("financiamiento") ? 8 : 0) +
        (item.text.includes("financ") ? 4 : 0) +
        (item.text.includes("desglose") ? 4 : 0) +
        (item.text.includes("vivienda") ? 3 : 0),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.name || "";
}

function parseHousingBreakdownRows(rows) {
  const title = housingTitle(rows);
  const headerIndex = detectHousingHeaderRow(rows);
  if (headerIndex < 0) return { rows: [], title, total: null };
  const headers = uniqueHeaders(rows[headerIndex]);
  const map = buildHousingColumnMap(headers);
  if (map.tipo < 0 || map.viviendas < 0) return { rows: [], title, total: null };

  const parsedRows = [];
  let total = null;
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    if (!row.some((value) => cleanString(value))) continue;
    const rowText = normalize(row.map(cleanString).join(" "));
    const rowTotal = parseInteger(row[map.viviendas]);
    if (rowText.includes("total")) {
      total = rowTotal;
      break;
    }
    const tipo = cleanString(row[map.tipo]);
    const viviendas = rowTotal;
    if (!tipo || viviendas === null) continue;
    const values = {
      rsh: formatHousingRshValue(row[map.rsh]),
      ahorro: formatHousingAhorroValue(row[map.ahorro]),
      grupoFamiliar: cleanString(row[map.grupoFamiliar]),
      discapacidad20: cleanString(row[map.discapacidad20]),
      neurodivergencia: cleanString(row[map.neurodivergencia]),
      movilidadReducida: cleanString(row[map.movilidadReducida]),
    };
    const category = housingCategoryForText([tipo, ...Object.values(values)].join(" "));
    parsedRows.push({
      id: `vivienda-${parsedRows.length + 1}-${normalize(tipo)}`,
      tipo,
      clasificacion: category.label,
      clasificacionKey: category.key,
      ...values,
      viviendas,
    });
  }
  return {
    rows: normalizeHousingRows(parsedRows),
    title,
    total: total ?? parsedRows.reduce((sum, row) => sum + Number(row.viviendas || 0), 0),
  };
}

function housingTitle(rows) {
  const titleRow = (rows || []).find((row) =>
    (row || []).some((cell) => {
      const text = normalize(cell);
      return text.includes("desglose") && text.includes("vivienda");
    })
  );
  return cleanString((titleRow || []).find((cell) => cleanString(cell))) || "";
}

function formatHousingRshValue(value) {
  const text = cleanString(value);
  const number = parseDecimal(value);
  if (number !== null && number > 0 && number <= 1) return `${formatNumber(Math.round(number * 100))}%`;
  return text;
}

function formatHousingAhorroValue(value) {
  const text = cleanString(value);
  const normalized = normalize(text);
  if (normalized.includes("uf")) return text;
  if (normalized === "10") return "30 UF";
  if (normalized === "15") return "35 UF";
  return text;
}

function detectHousingHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  (rows || []).slice(0, 45).forEach((row, index) => {
    const headers = uniqueHeaders(row || []);
    const map = buildHousingColumnMap(headers);
    let score = 0;
    if (map.tipo >= 0) score += 5;
    if (map.viviendas >= 0) score += 5;
    if (map.rsh >= 0) score += 1;
    if (map.ahorro >= 0) score += 1;
    if (map.neurodivergencia >= 0) score += 1;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 10 ? best.index : -1;
}

function buildHousingColumnMap(headers) {
  const normalized = headers.map(normalize);
  const indexes = normalized.map((text, index) => ({ text, index }));
  const isTipo = (text) => text.includes("tipovivienda") || (text.includes("tipo") && text.includes("vivienda"));
  const predicates = {
    rsh: (text) => text === "rsh" || text.includes("tramorhs") || text.includes("tramorsh"),
    ahorro: (text) => text.includes("ahorr"),
    grupoFamiliar: (text) => text.includes("grupofamiliar") || (text.includes("grupo") && text.includes("famili")),
    discapacidad20: (text) => (text.includes("discap") || text.includes("disc")) && text.includes("20"),
    neurodivergencia: (text) => text.includes("neuro"),
    movilidadReducida: (text) =>
      ((text.includes("discap") || text.includes("movilidad") || text.includes("reduc")) && text.includes("80")) ||
      text.includes("movilidad") ||
      text.includes("reducida"),
    viviendas: (text) =>
      text.includes("nviviendas") ||
      text.includes("numeroviviendas") ||
      ((text.includes("vivienda") || text.includes("viv")) && !text.includes("tipo")),
  };
  const nearestAfter = (start, predicate) => {
    const after = indexes.filter(({ text, index }) => index > start && predicate(text));
    if (after.length) return after.sort((a, b) => a.index - b.index)[0].index;
    return indexes.find(({ text }) => predicate(text))?.index ?? -1;
  };
  const buildForTipo = (tipo) => {
    const map = { tipo };
    Object.entries(predicates).forEach(([field, predicate]) => {
      map[field] = nearestAfter(tipo, predicate);
    });
    return map;
  };
  const score = (map) => {
    let value = 0;
    ["rsh", "ahorro", "viviendas"].forEach((field) => {
      if (map[field] > map.tipo) value += 12;
      if (map[field] >= 0 && map[field] - map.tipo <= 10) value += 6;
      if (map[field] >= 0) value += 2;
    });
    ["grupoFamiliar", "discapacidad20", "neurodivergencia", "movilidadReducida"].forEach((field) => {
      if (map[field] > map.tipo && map[field] - map.tipo <= 10) value += 2;
    });
    return value;
  };

  const candidates = indexes
    .filter(({ text }) => isTipo(text))
    .map(({ index }) => buildForTipo(index))
    .sort((a, b) => score(b) - score(a));
  return candidates[0] || {
    tipo: -1,
    rsh: -1,
    ahorro: -1,
    grupoFamiliar: -1,
    discapacidad20: -1,
    neurodivergencia: -1,
    movilidadReducida: -1,
    viviendas: -1,
  };
}

function importObservationsWorkbook(workbook, options) {
  const sheetName = selectBaseSheet(workbook.SheetNames);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = detectObservationHeaderRow(rows);
  if (headerIndex < 0) {
    throw new Error("No se encontró una fila de encabezados con RUT/RUN para asociar observaciones.");
  }

  const headers = uniqueHeaders(rows[headerIndex]);
  const map = buildObservationColumnMap(rows, headerIndex, headers);
  if (!map.rut) {
    throw new Error("El archivo de observaciones debe incluir una columna RUT/RUN o equivalente.");
  }

  const personasPorRut = new Map(state.personas.map((persona) => [persona.rut, persona]));
  const stats = { actualizados: 0, observaciones: 0, correcciones: 0, omitidos: 0, errores: [] };

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || [];
    if (!row.some((value) => cleanString(value))) {
      stats.omitidos += 1;
      continue;
    }

    const rut = normalizeRut(row[headers.indexOf(map.rut)]);
    const persona = personasPorRut.get(rut);
    if (!rut || !persona) {
      stats.omitidos += 1;
      stats.errores.push({ fila: i + 1, error: rut ? `RUT ${rut} no existe en la base cargada.` : "Fila sin RUT/RUN." });
      continue;
    }
    if (options.comiteNombre && normalize(persona.comite?.nombre) !== normalize(options.comiteNombre)) {
      stats.omitidos += 1;
      stats.errores.push({ fila: i + 1, error: `RUT ${rut} pertenece a otro comité.` });
      continue;
    }

    const beforeObservations = (persona.observaciones || []).length;
    const correctionCount = applyObservationCorrections(persona, row, headers, map.corrections);
    const observationCount = addRowObservations(persona, row, headers, map.observationColumns, options.fileName);
    if (correctionCount || observationCount) {
      recalculatePersonaAfterChanges(persona);
      stats.actualizados += 1;
      stats.correcciones += correctionCount;
      stats.observaciones += (persona.observaciones || []).length - beforeObservations;
    } else {
      stats.omitidos += 1;
    }
  }

  state.importaciones.unshift({
    id: cryptoId(),
    archivo: options.fileName,
    hoja: sheetName,
    fecha: new Date().toISOString(),
    filas: Math.max(rows.length - headerIndex - 1, 0),
    modo: "observaciones_correcciones",
    creados: 0,
    actualizados: stats.actualizados,
    omitidos: stats.omitidos,
    errores: stats.errores.slice(0, 30),
  });
  state.importaciones = state.importaciones.slice(0, 20);
  return stats;
}

function detectObservationHeaderRow(rows) {
  let best = { index: -1, score: 0 };
  rows.slice(0, 35).forEach((row, index) => {
    const headers = uniqueHeaders(row || []);
    const map = buildObservationColumnMap(rows, index, headers);
    let score = 0;
    if (map.rut) {
      score = 5;
      score += Math.min(map.observationColumns.length, 4) * 2;
      score += Object.keys(map.corrections).length;
    }
    if (score > best.score) best = { index, score };
  });
  return best.score >= 5 ? best.index : -1;
}

function buildObservationColumnMap(rows, headerIndex, headers) {
  const baseMap = buildColumnMap(headers);
  const inferred = inferColumnMapFromData(rows, headerIndex, headers, baseMap);
  const rut = inferred.rut || findColumn(headers, COLUMN_ALIASES.rut, COLUMN_EXCLUDES.rut || []);
  const correctionFields = [
    "correo",
    "telefono",
    "direccion",
    "sexo",
    "estadoCivil",
    "nacionalidad",
    "etnia",
    "fechaNacimiento",
    "edad",
    "discapacidad",
    "neurodivergencia",
    "comuna",
    "parentesco",
    "tipoFamilia",
    "grupoFamiliar",
    "integrantes",
    "tipoVivienda",
    "rsh",
    "minvuConecta",
    "cedulaVencimiento",
  ];
  const corrections = {};
  correctionFields.forEach((field) => {
    if (inferred[field] && isUsableCorrectionColumn(inferred[field], field)) {
      corrections[field] = inferred[field];
    }
  });

  const reserved = new Set([rut, ...Object.values(corrections)].filter(Boolean));
  let observationColumns = headers.filter((header) => isObservationColumn(header) && !reserved.has(header));
  if (!observationColumns.length) {
    observationColumns = headers.filter(
      (header) =>
        cleanString(header) &&
        !reserved.has(header) &&
        !normalize(header).startsWith("sinnombre") &&
        !isReservedObservationHeader(header)
    );
  }
  return { rut, corrections, observationColumns };
}

function isUsableCorrectionColumn(header, field) {
  const text = normalize(header);
  if (!text) return false;
  const correctionTokens = ["correccion", "correg", "nuevo", "actualizado", "actualizada", "rectific", "reemplazo", "final"];
  const hasCorrectionToken = correctionTokens.some((token) => text.includes(token));
  if (isObservationColumn(header) && !hasCorrectionToken) return false;
  if (["rsh", "minvuConecta"].includes(field)) return true;
  return true;
}

function isObservationColumn(header) {
  const text = normalize(header);
  return [
    "observacion",
    "obs",
    "comentario",
    "correccion",
    "corregir",
    "revision",
    "revisar",
    "nota",
    "motivo",
    "detalle",
    "situacion",
    "estado",
    "respuesta",
  ].some((token) => text.includes(token));
}

function isReservedObservationHeader(header) {
  const text = normalize(header);
  return [
    "nombre",
    "nombres",
    "apellido",
    "apellidos",
    "rut",
    "run",
    "comite",
    "comuna",
    "nro",
    "numero",
    "orden",
    "id",
    "fecha",
    "base",
  ].some((token) => text === token || text.startsWith(token));
}

function applyObservationCorrections(persona, row, headers, corrections) {
  let total = 0;
  Object.entries(corrections).forEach(([field, header]) => {
    const value = row[headers.indexOf(header)];
    if (!cleanString(value)) return;
    const applied = applyCorrection(persona, field, value);
    if (applied) total += 1;
  });
  return total;
}

function addRowObservations(persona, row, headers, observationColumns, fileName) {
  let total = 0;
  observationColumns.forEach((header) => {
    const value = cleanString(row[headers.indexOf(header)]);
    if (!value) return;
    const label = cleanString(header);
    const text = isGenericObservationHeader(label) ? value : `${label}: ${value}`;
    if (addObservation(persona, text, "Importación observaciones", fileName)) total += 1;
  });
  return total;
}

function isGenericObservationHeader(header) {
  const text = normalize(header);
  return ["observacion", "observaciones", "obs", "comentario", "comentarios", "nota", "notas"].includes(text);
}

function addObservation(persona, texto, autor = "Sistema", origen = "") {
  const cleanText = cleanString(texto);
  if (!cleanText) return false;
  persona.observaciones = Array.isArray(persona.observaciones) ? persona.observaciones : [];
  const exists = persona.observaciones.some((item) => normalize(item.texto) === normalize(cleanText));
  if (exists) return false;
  persona.observaciones.push({
    id: cryptoId(),
    texto: cleanText,
    autor,
    origen,
    creadoEn: new Date().toISOString(),
  });
  return true;
}

function mergeImportedPersona(target, imported) {
  const observaciones = Array.isArray(target.observaciones) ? target.observaciones : [];
  Object.assign(target, imported);
  target.observaciones = mergeObservaciones(observaciones, imported.observaciones || []);
  recalculatePersonaAfterChanges(target);
}

function mergeObservaciones(current, incoming) {
  const merged = [...current];
  incoming.forEach((item) => {
    if (!merged.some((existing) => normalize(existing.texto) === normalize(item.texto))) {
      merged.push(item);
    }
  });
  return merged;
}

function applyCorrection(persona, field, rawValue) {
  const value = cleanString(rawValue);
  if (!value) return false;

  const setValue = (container, key, next, label) => {
    const current = cleanString(container[key]);
    const nextText = cleanString(next);
    if (!nextText || normalize(current) === normalize(nextText)) return false;
    container[key] = next;
    addObservation(persona, `Corrección aplicada - ${label}: ${current || "Sin dato"} -> ${nextText}`, "Importación observaciones");
    return true;
  };

  if (["correo", "telefono", "direccion", "sexo", "estadoCivil", "nacionalidad", "etnia"].includes(field)) {
    return setValue(persona, field, value, correctionLabel(field));
  }
  if (field === "fechaNacimiento") {
    const dateValue = parseDateValue(rawValue);
    if (!dateValue) return false;
    const next = dateValue.toISOString().slice(0, 10);
    const applied = setValue(persona, "fechaNacimiento", next, correctionLabel(field));
    if (applied) {
      persona.edad = calculateAge(dateValue);
      persona.personaMayor = persona.edad >= 60;
    }
    return applied;
  }
  if (field === "edad") {
    const next = parseInteger(rawValue);
    if (next === null || persona.edad === next) return false;
    addObservation(persona, `Corrección aplicada - Edad: ${persona.edad ?? "Sin dato"} -> ${next}`, "Importación observaciones");
    persona.edad = next;
    persona.personaMayor = next >= 60;
    return true;
  }
  if (["discapacidad", "neurodivergencia"].includes(field)) {
    const next = parseBoolean(rawValue);
    if (persona[field] === next) return false;
    addObservation(persona, `Corrección aplicada - ${correctionLabel(field)}: ${persona[field] ? "Sí" : "No"} -> ${next ? "Sí" : "No"}`, "Importación observaciones");
    persona[field] = next;
    return true;
  }
  if (["comuna", "parentesco", "tipoFamilia", "grupoFamiliar"].includes(field)) {
    persona.caracterizacion = persona.caracterizacion || {};
    return setValue(persona.caracterizacion, field, value, correctionLabel(field));
  }
  if (field === "tipoVivienda") {
    persona.postulacion = persona.postulacion || {};
    return setValue(persona.postulacion, field, value, correctionLabel(field));
  }
  if (field === "integrantes") {
    persona.caracterizacion = persona.caracterizacion || {};
    const next = parseInteger(rawValue);
    if (next === null || persona.caracterizacion.integrantes === next) return false;
    addObservation(persona, `Corrección aplicada - Integrantes: ${persona.caracterizacion.integrantes ?? "Sin dato"} -> ${next}`, "Importación observaciones");
    persona.caracterizacion.integrantes = next;
    return true;
  }
  if (field === "rsh") {
    const next = parseDecimal(rawValue);
    if (next === null || Number(persona.rsh?.porcentaje) === Number(next)) return false;
    addObservation(persona, `Corrección aplicada - RSH: ${formatPercent(persona.rsh?.porcentaje)} -> ${formatPercent(next)}`, "Importación observaciones");
    persona.rsh = {
      ...(persona.rsh || {}),
      porcentaje: next,
      tramo: value,
      preferente: next <= 40,
    };
    return true;
  }
  if (field === "minvuConecta") {
    const next = parseDecimal(rawValue);
    if (next === null || Number(persona.postulacion?.minvuConecta) === Number(next)) return false;
    addObservation(persona, `Corrección aplicada - MINVU Conecta: ${formatPercent(persona.postulacion?.minvuConecta)} -> ${formatPercent(next)}`, "Importación observaciones");
    persona.postulacion = { ...(persona.postulacion || {}), minvuConecta: next };
    return true;
  }
  if (field === "cedulaVencimiento") {
    const dateValue = parseDateValue(rawValue);
    if (!dateValue) return false;
    const next = dateValue.toISOString().slice(0, 10);
    const documentos = Array.isArray(persona.documentos) ? persona.documentos : [];
    let cedula = documentos.find((doc) => doc.tipo === "cedula");
    if (!cedula) {
      cedula = { id: cryptoId(), tipo: "cedula" };
      documentos.push(cedula);
    }
    if (cedula.fechaVencimiento === next) return false;
    addObservation(persona, `Corrección aplicada - Vencimiento cédula: ${cedula.fechaVencimiento || "Sin dato"} -> ${next}`, "Importación observaciones");
    cedula.fechaVencimiento = next;
    cedula.estado = documentStatusByDate(dateValue);
    cedula.observaciones = "Actualizado desde archivo de observaciones.";
    persona.documentos = documentos;
    return true;
  }
  return false;
}

function correctionLabel(field) {
  const labels = {
    correo: "Correo",
    telefono: "Teléfono",
    direccion: "Dirección",
    sexo: "Sexo",
    estadoCivil: "Estado civil",
    nacionalidad: "Nacionalidad",
    etnia: "Etnia / pueblo originario",
    fechaNacimiento: "Fecha de nacimiento",
    discapacidad: "Discapacidad",
    neurodivergencia: "Neurodivergencia",
    comuna: "Comuna",
    parentesco: "Parentesco",
    tipoFamilia: "Tipo familia",
    grupoFamiliar: "Grupo familiar",
    tipoVivienda: "Tipo de vivienda",
  };
  return labels[field] || field;
}

function recalculatePersonaAfterChanges(persona) {
  const cedula = (persona.documentos || []).find((doc) => doc.tipo === "cedula");
  const cedulaVencimiento = parseDateValue(cedula?.fechaVencimiento);
  if (cedula && cedulaVencimiento) {
    cedula.estado = documentStatusByDate(cedulaVencimiento);
    cedula.fechaVencimiento = cedulaVencimiento.toISOString().slice(0, 10);
  }
  persona.caracterizacion = persona.caracterizacion || {};
  persona.caracterizacion.hijos = normalizeHijos(persona.caracterizacion.hijos || []);
  const alertasBase = (persona.alertas || [])
    .filter((alerta) => !isRshAlert(alerta))
    .filter((alerta) => !isAhorroAlert(alerta))
    .filter((alerta) => !isRuleManagedAlert(alerta))
    .map(normalizeAlert);
  persona.alertas = [...buildAlerts(persona, cedulaVencimiento), ...alertasBase];
  persona.estadoGeneral = getGeneralStatus(persona.alertas);
  persona.actualizadoEn = new Date().toISOString();
}

function renderManualImportPanel(prepared) {
  const panel = document.getElementById("manualImportPanel");
  if (!panel || !pendingManualImport) return;

  const normalizedPrepared = ensureManualPrepared(prepared);
  const headerOptions = candidateHeaderRows(normalizedPrepared.rows, normalizedPrepared.headerIndex);
  const fieldDefs = manualMappingFields();
  const preview = renderMappingPreview(normalizedPrepared.rows, normalizedPrepared.headerIndex, normalizedPrepared.headers);

  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="manual-head">
      <div>
        <h3>Mapeo manual de columnas</h3>
        <p>Selecciona que columna corresponde a cada dato. Con RUT/RUN y nombre ya se puede cargar la base.</p>
      </div>
      <button id="cancelManualImport" class="button secondary" type="button">Cancelar</button>
    </div>
    <div class="field-row manual-source">
      <label class="field">
        <span>Hoja</span>
        <select id="manualSheetSelect" class="select">
          ${pendingManualImport.workbook.SheetNames.map(
            (sheet) => `<option value="${escapeHtml(sheet)}" ${sheet === normalizedPrepared.sheetName ? "selected" : ""}>${escapeHtml(sheet)}</option>`
          ).join("")}
        </select>
      </label>
      <label class="field">
        <span>Fila de encabezados</span>
        <select id="manualHeaderSelect" class="select">
          ${headerOptions
            .map(
              (option) =>
                `<option value="${option.index}" ${option.index === normalizedPrepared.headerIndex ? "selected" : ""}>${escapeHtml(option.label)}</option>`
            )
            .join("")}
        </select>
      </label>
    </div>
    <div class="mapping-grid">
      ${fieldDefs
        .map((field) => manualSelectHtml(field, normalizedPrepared.headers, normalizedPrepared.columnMap[field.key]))
        .join("")}
    </div>
    <div class="manual-actions">
      <button id="runManualImport" class="button primary" type="button">Cargar con este mapeo</button>
    </div>
    ${preview}
  `;

  document.getElementById("cancelManualImport").addEventListener("click", () => {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    pendingManualImport = null;
  });
  document.getElementById("manualSheetSelect").addEventListener("change", (event) => {
    const nextPrepared = prepareWorkbookImport(pendingManualImport.workbook, {
      ...pendingManualImport.options,
      sheetName: event.target.value,
    });
    renderManualImportPanel(nextPrepared);
  });
  document.getElementById("manualHeaderSelect").addEventListener("change", (event) => {
    const nextPrepared = prepareWorkbookImport(pendingManualImport.workbook, {
      ...pendingManualImport.options,
      sheetName: normalizedPrepared.sheetName,
      headerIndex: Number(event.target.value),
    });
    renderManualImportPanel(nextPrepared);
  });
  document.getElementById("runManualImport").addEventListener("click", runManualImport);
}

function ensureManualPrepared(prepared) {
  if (prepared.headerIndex >= 0 && prepared.headers.length) return prepared;
  const candidates = candidateHeaderRows(prepared.rows, prepared.headerIndex);
  const headerIndex = candidates[0]?.index ?? 0;
  return prepareWorkbookImport(prepared.workbook, {
    ...prepared.options,
    sheetName: prepared.sheetName,
    headerIndex,
  });
}

function manualMappingFields() {
  return [
    { key: "rut", label: "RUT/RUN", required: true },
    { key: "nombre", label: "Nombre completo" },
    { key: "nombres", label: "Nombres" },
    { key: "apellidoPaterno", label: "Apellido paterno" },
    { key: "apellidoMaterno", label: "Apellido materno" },
    { key: "apellidos", label: "Apellidos" },
    { key: "fechaNacimiento", label: "Fecha nacimiento" },
    { key: "edad", label: "Edad" },
    { key: "telefono", label: "Teléfono" },
    { key: "correo", label: "Correo" },
    { key: "direccion", label: "Dirección" },
    { key: "comuna", label: "Comuna" },
    { key: "etnia", label: "Etnia / pueblo originario" },
    { key: "rsh", label: "RSH" },
    { key: "tipoVivienda", label: "Tipo de vivienda" },
    { key: "cedulaVencimiento", label: "Vencimiento cédula" },
    { key: "discapacidad", label: "Discapacidad" },
    { key: "neurodivergencia", label: "Neurodivergencia" },
    { key: "grupoFamiliar", label: "Grupo familiar" },
    { key: "integrantes", label: "Integrantes" },
    { key: "parentesco", label: "Parentesco" },
    { key: "tipoFamilia", label: "Tipo familia" },
    { key: "minvuConecta", label: "Minvu Conecta" },
  ];
}

function manualSelectHtml(field, headers, selected) {
  return `
    <label class="field">
      <span>${escapeHtml(field.label)}${field.required ? " *" : ""}</span>
      <select class="select manual-map-select" data-field="${field.key}">
        <option value="">No usar</option>
        ${headers
          .map(
            (header) =>
              `<option value="${escapeHtml(header)}" ${header === selected ? "selected" : ""}>${escapeHtml(header)}</option>`
          )
          .join("")}
      </select>
    </label>
  `;
}

function runManualImport() {
  const message = document.getElementById("importMessage");
  if (!pendingManualImport) {
    message.innerHTML = notice("No hay una base pendiente para cargar.", "error");
    return;
  }

  const sheetName = document.getElementById("manualSheetSelect").value;
  const headerIndex = Number(document.getElementById("manualHeaderSelect").value);
  const columnMap = {};
  document.querySelectorAll(".manual-map-select").forEach((select) => {
    if (select.value) columnMap[select.dataset.field] = select.value;
  });

  try {
    const prepared = prepareWorkbookImport(pendingManualImport.workbook, {
      ...pendingManualImport.options,
      sheetName,
      headerIndex,
      columnMap,
    });
    if (!prepared.ready) {
      message.innerHTML = notice(prepared.error || "Falta mapear RUT/RUN y nombre.", "error");
      renderManualImportPanel(prepared);
      return;
    }
    const result = commitPreparedImport(prepared);
    completeImport(result, message);
  } catch (error) {
    message.innerHTML = notice(error.message || "No fue posible importar con el mapeo seleccionado.", "error");
  }
}

function candidateHeaderRows(rows, preferredIndex) {
  const candidates = [];
  const addCandidate = (index) => {
    if (index < 0 || index >= rows.length || candidates.some((item) => item.index === index)) return;
    const row = rows[index] || [];
    const values = row.map(cleanString).filter(Boolean);
    if (!values.length) return;
    candidates.push({
      index,
      label: `Fila ${index + 1}: ${values.slice(0, 6).join(" | ")}`,
    });
  };

  if (preferredIndex >= 0) addCandidate(preferredIndex);
  rows.slice(0, 35).forEach((row, index) => {
    const values = (row || []).map(cleanString).filter(Boolean);
    if (values.length >= 2 && !values.some(looksLikeRut)) addCandidate(index);
  });
  if (!candidates.length) addCandidate(0);
  return candidates.slice(0, 18);
}

function renderMappingPreview(rows, headerIndex, headers) {
  if (headerIndex < 0 || !headers.length) return "";
  const previewRows = rows
    .slice(headerIndex + 1)
    .filter((row) => (row || []).some((value) => cleanString(value)))
    .slice(0, 5);
  if (!previewRows.length) return "";

  const visibleHeaders = headers.slice(0, 8);
  return `
    <div class="mapping-preview">
      <h4>Vista previa</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${visibleHeaders.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${previewRows
              .map(
                (row) =>
                  `<tr>${visibleHeaders
                    .map((_, index) => `<td>${escapeHtml(row[index] instanceof Date ? row[index].toISOString().slice(0, 10) : cleanString(row[index]))}</td>`)
                    .join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function rowToPersona(row, headers, columnMap, options) {
  const displacement = detectDisplacement(row, headers, columnMap);
  const value = (field) => {
    const column = columnMap[field];
    if (!column) return "";
    const index = headers.indexOf(column) + displacement;
    return index >= 0 ? row[index] : "";
  };

  const nombre = composePersonName(value, columnMap);
  const rut = normalizeRut(value("rut"));
  if (!nombre || !rut || normalize(nombre) === "nombre") return null;

  const fechaNacimiento = parseDateValue(value("fechaNacimiento"));
  const edad = fechaNacimiento ? calculateAge(fechaNacimiento) : parseInteger(value("edad"));
  const rshValue = parseDecimal(value("rsh"));
  const ahorroValue = parseDecimal(value("ahorro"));
  const cedulaVencimiento = parseDateValue(value("cedulaVencimiento"));
  const discapacidad = parseBoolean(value("discapacidad"));
  const neurodivergencia = parseBoolean(value("neurodivergencia"));
  const hijos = extractHijosFromEntries(headers.map((header, index) => [header, row[index]]));

  const persona = {
    id: rut,
    rut,
    nombre,
    correo: cleanString(value("correo")),
    telefono: cleanString(value("telefono")),
    direccion: cleanString(value("direccion")),
    sexo: cleanString(value("sexo")),
    estadoCivil: cleanString(value("estadoCivil")),
    nacionalidad: cleanString(value("nacionalidad")),
    etnia: cleanString(value("etnia")),
    fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString().slice(0, 10) : "",
    edad,
    personaMayor: edad !== null && edad >= 60,
    discapacidad,
    neurodivergencia,
    comite: {
      nombre: options.comiteNombre || inferCommitteeName(options.fileName, sheetNameSafe(options.fileName)),
      comuna: options.comuna || cleanString(value("comuna")),
    },
    caracterizacion: {
      comuna: cleanString(value("comuna")),
      parentesco: cleanString(value("parentesco")),
      tipoFamilia: cleanString(value("tipoFamilia")),
      grupoFamiliar: cleanString(value("grupoFamiliar")),
      integrantes: parseInteger(value("integrantes")),
      hijos,
    },
    rsh: {
      porcentaje: rshValue,
      tramo: cleanString(value("rsh")),
      preferente: rshValue !== null && rshValue <= 40,
    },
    ahorro: {
      numeroCuenta: cleanString(value("numeroCuenta")),
      banco: cleanString(value("banco")),
      montoActual: ahorroValue,
      minimo: options.ahorroMinimo,
      insuficiente: ahorroValue !== null && ahorroValue < options.ahorroMinimo,
    },
    postulacion: {
      minvuConecta: parseDecimal(value("minvuConecta")),
      estado: "",
      programa: "",
      tipoVivienda: cleanString(value("tipoVivienda")),
    },
    documentos: [],
    observaciones: [],
    alertas: [],
    original: rowObject(row, headers),
    actualizadoEn: new Date().toISOString(),
  };

  if (cedulaVencimiento) {
    persona.documentos.push({
      id: cryptoId(),
      tipo: "cedula",
      estado: documentStatusByDate(cedulaVencimiento),
      fechaVencimiento: cedulaVencimiento.toISOString().slice(0, 10),
      observaciones: "Detectado desde importacion Excel.",
    });
  }

  persona.alertas = buildAlerts(persona, cedulaVencimiento);
  persona.estadoGeneral = getGeneralStatus(persona.alertas);
  return persona;
}

function buildAlerts(persona, cedulaVencimiento) {
  const alerts = [];
  alerts.push(...createCedulaAlerts(cedulaVencimiento));

  if (persona.discapacidad) {
    alerts.push(createAlert("documental", "preventiva", "Revisar respaldo discapacidad", "La persona registra discapacidad; validar certificado o antecedente.", false));
  }
  if (hasEtnia(persona)) {
    alerts.push(createAlert(
      "documental",
      "preventiva",
      "Revisar certificado de acreditación indígena",
      "La persona registra etnia o pueblo originario; revisar y confirmar certificado de acreditación indígena para el proceso documental interno.",
      false
    ));
  }
  if (isUnipersonal(persona) && exceptionCriteria(persona).length) {
    alerts.push(createAlert(
      "social",
      "preventiva",
      "Criterio de excepción unipersonal",
      `Postulación unipersonal con criterio de excepción: ${exceptionCriteriaLabel(persona)}.`,
      false
    ));
  }

  return ensureChildAgeAlerts(alerts, persona.caracterizacion.hijos);
}

function createCedulaAlerts(cedulaVencimiento) {
  if (!cedulaVencimiento) return [];
  const today = atStartOfDay(new Date());
  const days = Math.round((atStartOfDay(cedulaVencimiento) - today) / 86400000);
  if (days < 0) {
    return [createAlert("documental", "critica", "Cédula vencida", `Cédula vencida el ${formatDate(cedulaVencimiento)}.`)];
  }
  if (days <= 30) {
    return [createAlert("documental", "preventiva", "Cédula por vencer", `Cédula vence el ${formatDate(cedulaVencimiento)}.`)];
  }
  return [];
}

function createAlert(tipo, severidad, titulo, detalle, impactaEstado = true) {
  return {
    id: cryptoId(),
    tipo,
    severidad,
    titulo,
    detalle,
    activa: true,
    impactaEstado,
    fecha: new Date().toISOString(),
  };
}

function renderFicha(rut) {
  const persona = state.personas.find((item) => item.rut === rut);
  if (!persona) {
    setApp(emptyHtml("Persona no encontrada"));
    return;
  }

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Ficha persona</div>
        <h2>${escapeHtml(persona.nombre)}</h2>
        <p class="muted">${escapeHtml(persona.rut)} - ${escapeHtml(persona.comite.nombre || "Sin comité")}</p>
      </div>
      <button class="button secondary" id="backToPeople">Volver</button>
    </div>

    <section class="card">
      <div class="list-item-head">
        <div class="kv" style="flex: 1;">
          ${kv("Estado", badge(persona.estadoGeneral), true)}
          ${kv("Edad", persona.edad !== null ? `${persona.edad} años` : "Sin dato")}
          ${kv("RSH", formatPercent(persona.rsh.porcentaje))}
          ${kv("Ahorro", formatUf(persona.ahorro.montoActual))}
          ${kv("Cédula", cedulaSummary(persona))}
          ${kv("Hijos rev. 18", childReviewSummary(persona))}
          ${kv("Persona mayor", persona.personaMayor ? "Sí" : "No")}
          ${kv("Discapacidad", persona.discapacidad ? "Sí" : "No")}
          ${kv("Etnia / pueblo originario", hasEtnia(persona) ? persona.etnia : "Sin dato")}
          ${kv("Tipo de vivienda", personHousingType(persona) || "Sin dato")}
          ${kv("Postulación", isUnipersonal(persona) ? "Unipersonal" : "Grupo familiar")}
          ${kv("Criterios excepción", exceptionCriteriaLabel(persona))}
        </div>
      </div>
    </section>

    <section class="grid two" style="margin-top: 18px;">
      <div class="panel">
        <h3>Identificación</h3>
        <div class="kv">
          ${kv("Teléfono", persona.telefono || "Sin dato")}
          ${kv("Correo", persona.correo || "Sin dato")}
          ${kv("Dirección", persona.direccion || "Sin dato")}
          ${kv("Sexo", persona.sexo || "Sin dato")}
          ${kv("Estado civil", persona.estadoCivil || "Sin dato")}
          ${kv("Nacionalidad", persona.nacionalidad || "Sin dato")}
          ${kv("Etnia / pueblo originario", hasEtnia(persona) ? persona.etnia : "Sin dato")}
          ${kv("Fecha nac.", formatStoredDate(persona.fechaNacimiento))}
          ${kv("Neurodivergencia", persona.neurodivergencia ? "Sí" : "No")}
        </div>
      </div>
      <div class="panel">
        <h3>Comité y caracterización social</h3>
        <div class="kv">
          ${kv("Comité", persona.comite.nombre || "Sin dato")}
          ${kv("Comuna", persona.comite.comuna || persona.caracterizacion.comuna || "Sin dato")}
          ${kv("Parentesco", persona.caracterizacion.parentesco || "Sin dato")}
          ${kv("Tipo familia", persona.caracterizacion.tipoFamilia || "Sin dato")}
          ${kv("Tipo de vivienda", personHousingType(persona) || "Sin dato")}
          ${kv("Postulación", isUnipersonal(persona) ? "Unipersonal" : "Grupo familiar")}
          ${kv("Criterios excepción", exceptionCriteriaLabel(persona))}
          ${kv("MINVU Conecta", formatPercent(persona.postulacion.minvuConecta))}
        </div>
      </div>
    </section>

    <section class="panel" style="margin-top: 18px;">
      <h3>Grupo familiar</h3>
      <div class="kv">
        ${kv("Grupo familiar", persona.caracterizacion.grupoFamiliar || persona.caracterizacion.integrantes || "Sin dato")}
        ${kv("Tipo familia", persona.caracterizacion.tipoFamilia || "Sin dato")}
        ${kv("Parentesco", persona.caracterizacion.parentesco || "Sin dato")}
        ${kv("Integrantes", persona.caracterizacion.integrantes ?? "Sin dato")}
      </div>
      ${renderHijosMayoriaEdad(persona.caracterizacion.hijos)}
    </section>

    <section class="grid two" style="margin-top: 18px;">
      <div class="panel">
        <h3>Documentos</h3>
        ${renderDocuments(persona.documentos)}
      </div>
      <div class="panel">
        <h3>Alertas</h3>
        ${renderAlertList(persona.alertas)}
      </div>
    </section>
  `);

  document.getElementById("backToPeople").addEventListener("click", () => navigate("personas"));
}

function renderAlertas() {
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Seguimiento</div>
        <h2>Alertas</h2>
      </div>
    </div>
    <section class="card">
      <div class="field-row" style="grid-template-columns: 1fr 220px;">
        <label class="field">
          <span>Buscar</span>
          <input id="alertSearch" class="input" placeholder="Alerta, persona, RUT o comité" />
        </label>
        <label class="field">
          <span>Severidad</span>
          <select id="alertSeverity" class="select">
            <option value="">Todas</option>
            <option value="critica">Críticas</option>
            <option value="preventiva">Preventivas</option>
          </select>
        </label>
      </div>
    </section>
    <section id="alertResult" style="margin-top: 18px;"></section>
  `);

  const search = document.getElementById("alertSearch");
  const severity = document.getElementById("alertSeverity");
  const update = () => renderAlertasResult(search.value, severity.value);
  search.addEventListener("input", update);
  severity.addEventListener("change", update);
  update();
}

function renderAlertasResult(query = "", severity = "") {
  const q = normalize(query);
  const alerts = state.personas.flatMap((persona) =>
    persona.alertas.map((alerta) => ({ ...alerta, persona }))
  );
  const filtered = alerts.filter((alerta) => {
    const text = [
      alerta.titulo,
      alerta.detalle,
      alerta.tipo,
      alerta.persona.nombre,
      alerta.persona.rut,
      alerta.persona.comite.nombre,
    ].join(" ");
    return (!q || normalize(text).includes(q)) && (!severity || alerta.severidad === severity);
  });

  const container = document.getElementById("alertResult");
  if (!filtered.length) {
    container.innerHTML = emptyHtml("No hay alertas activas");
    return;
  }

  container.innerHTML = `
    <div class="list">
      ${filtered
        .map(
          (alerta) => `
            <article class="list-item">
              <div class="list-item-head">
                <div>
                  ${badge(alerta.severidad)}
                  ${alertAffectsStatus(alerta) ? "" : '<span class="badge interna">Interna</span>'}
                  <span class="muted small">${escapeHtml(alerta.tipo)}</span>
                  <h3 style="margin: 10px 0 4px;">${escapeHtml(alerta.titulo)}</h3>
                  <p class="muted" style="margin: 0;">${escapeHtml(alerta.detalle)}</p>
                  <p class="small muted">${escapeHtml(alerta.persona.nombre)} - ${escapeHtml(alerta.persona.rut)} - ${escapeHtml(alerta.persona.comite.nombre || "Sin comité")}</p>
                </div>
                <button class="button secondary person-alert-link" data-rut="${escapeAttr(alerta.persona.rut)}">Ver ficha</button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;

  container.querySelectorAll(".person-alert-link").forEach((button) => {
    button.addEventListener("click", () => navigate("ficha", { rut: button.dataset.rut }));
  });
}

function renderGestion() {
  const tasks = managementTasks();
  const summary = managementSummary(tasks);
  const workspace = getActiveWorkspace();

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Seguimiento operativo</div>
        <h2>Gestión</h2>
        <p class="muted">${escapeHtml(workspaceDisplayName(workspace))}</p>
      </div>
    </div>
    <section class="grid stats">
      ${stat("Pendientes", summary.pendiente, "amber")}
      ${stat("En revisión", summary.en_revision, "cyan")}
      ${stat("Resueltos", summary.resuelto, "emerald")}
      ${stat("Total casos", summary.total, "indigo")}
    </section>
    <section class="card" style="margin-top: 18px;">
      <div class="field-row" style="grid-template-columns: minmax(260px, 1fr) 220px 220px;">
        <label class="field">
          <span>Buscar</span>
          <input id="gestionSearch" class="input" placeholder="Persona, RUT o motivo" autocomplete="off" />
        </label>
        <label class="field">
          <span>Estado gestión</span>
          <select id="gestionStatusFilter" class="select">
            <option value="abiertos">Abiertos</option>
            <option value="">Todos</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_revision">En revisión</option>
            <option value="resuelto">Resueltos</option>
          </select>
        </label>
        <label class="field">
          <span>Prioridad</span>
          <select id="gestionPriorityFilter" class="select">
            <option value="">Todas</option>
            <option value="critica">Crítica</option>
            <option value="preventiva">Preventiva</option>
            <option value="interna">Interna</option>
          </select>
        </label>
      </div>
      <div class="toolbar-row">
        <button id="exportGestionOpenBtn" class="button primary" type="button">Exportar pendientes abiertos</button>
        <button id="exportGestionViewBtn" class="button secondary" type="button">Exportar selección actual</button>
      </div>
    </section>
    <section id="gestionResult" style="margin-top: 18px;"></section>
  `);

  const search = document.getElementById("gestionSearch");
  const status = document.getElementById("gestionStatusFilter");
  const priority = document.getElementById("gestionPriorityFilter");
  const update = () => renderGestionTable(search.value, status.value, priority.value);
  search.addEventListener("input", update);
  status.addEventListener("change", update);
  priority.addEventListener("change", update);
  document.getElementById("exportGestionViewBtn").addEventListener("click", () => {
    exportGestionExcel(filteredManagementTasks(search.value, status.value, priority.value), "gestion-vista");
  });
  document.getElementById("exportGestionOpenBtn").addEventListener("click", () => {
    exportGestionExcel(filteredManagementTasks("", "abiertos", ""), "gestion-abiertos");
  });
  update();
}

function renderGestionTable(query = "", estado = "abiertos", prioridad = "") {
  const rows = filteredManagementTasks(query, estado, prioridad);
  const container = document.getElementById("gestionResult");
  if (!rows.length) {
    container.innerHTML = emptyHtml("Sin pendientes para la selección actual");
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table class="gestion-table">
        <thead>
          <tr>
            <th>Socio</th>
            <th>Prioridad</th>
            <th>Qué falta / revisar</th>
            <th>Gestión</th>
            <th>Responsable</th>
            <th>Comentario</th>
            <th>Ficha</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (task) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(task.nombre)}</strong>
                    <div class="muted small">${escapeHtml(task.rut)}</div>
                  </td>
                  <td>${badge(task.prioridad)}</td>
                  <td>
                    <strong>${escapeHtml(task.motivo)}</strong>
                    <div class="muted small">${escapeHtml(task.falta)}</div>
                  </td>
                  <td>
                    <select class="select gestion-status" data-key="${escapeAttr(task.key)}">
                      <option value="pendiente" ${task.estadoGestion === "pendiente" ? "selected" : ""}>Pendiente</option>
                      <option value="en_revision" ${task.estadoGestion === "en_revision" ? "selected" : ""}>En revisión</option>
                      <option value="resuelto" ${task.estadoGestion === "resuelto" ? "selected" : ""}>Resuelto</option>
                    </select>
                  </td>
                  <td>
                    <input class="input gestion-responsable" data-key="${escapeAttr(task.key)}" value="${escapeHtml(task.responsable)}" placeholder="Responsable" />
                  </td>
                  <td>
                    <textarea class="input gestion-comentario" data-key="${escapeAttr(task.key)}" rows="2" placeholder="Comentario">${escapeHtml(task.comentario)}</textarea>
                  </td>
                  <td>
                    <button class="button secondary gestion-person-link" data-rut="${escapeAttr(task.rut)}" type="button">Ver</button>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll(".gestion-status").forEach((select) => {
    select.addEventListener("change", () => {
      updateGestionRecord(select.dataset.key, { estado: select.value });
      if (estado === "abiertos" && select.value === "resuelto") renderGestionTable(query, estado, prioridad);
    });
  });
  container.querySelectorAll(".gestion-responsable").forEach((input) => {
    input.addEventListener("blur", () => updateGestionRecord(input.dataset.key, { responsable: input.value }));
  });
  container.querySelectorAll(".gestion-comentario").forEach((input) => {
    input.addEventListener("blur", () => updateGestionRecord(input.dataset.key, { comentario: input.value }));
  });
  container.querySelectorAll(".gestion-person-link").forEach((button) => {
    button.addEventListener("click", () => navigate("ficha", { rut: button.dataset.rut }));
  });
}

function renderReportes() {
  const resumen = getResumen();
  const docs = countDocuments();
  const alertas = countAlerts();
  const comites = topBy(state.personas, (persona) => persona.comite.nombre || "Sin comité");
  const workspace = getActiveWorkspace();
  const criticalRows = criticalObservationRows();

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Resumen</div>
        <h2>Reportes</h2>
        <p class="muted">${escapeHtml(workspaceDisplayName(workspace))}</p>
      </div>
    </div>
    <section class="panel">
      <div class="report-export-head">
        <div>
          <h3>Documentos del comité</h3>
          <p class="muted">Exporta análisis del comité activo en PDF para revisión interna.</p>
        </div>
        <div class="report-actions">
          <button id="executivePdfBtn" class="button primary" type="button">Resumen ejecutivo PDF</button>
          <button id="criticalPdfBtn" class="button danger" type="button">Observaciones críticas PDF</button>
          <button id="criticalExcelBtn" class="button secondary" type="button">Exportar críticos Excel</button>
        </div>
      </div>
      <p class="small muted">El PDF de observaciones críticas incluye nombre, RUT, estado y qué falta o debe revisarse.</p>
    </section>
    <section class="grid stats">
      ${stat("Personas", resumen.totalPersonas)}
      ${stat("Alertas críticas", resumen.alertasCriticas, "rose")}
      ${stat("Cédulas vencidas", resumen.cedulasVencidas, "rose")}
      ${stat("Hijos rev. 18", resumen.hijosRevision18, "amber")}
      ${stat("Etnia / pueblo originario", resumen.etnia, "emerald")}
      ${stat("Postulación unipersonal", resumen.unipersonales, "amber")}
    </section>
    <section class="grid two" style="margin-top: 18px;">
      <div class="panel">
        <h3>Alertas por tipo</h3>
        ${simpleTable(["Tipo", "Severidad", "Total"], alertas)}
      </div>
      <div class="panel">
        <h3>Documentos</h3>
        ${simpleTable(["Tipo", "Estado", "Total"], docs)}
      </div>
    </section>
    <section class="panel" style="margin-top: 18px;">
      <h3>Vista previa observaciones críticas</h3>
      ${criticalRows.length
        ? simpleTable(
            ["Nombre", "RUT", "Estado", "Qué falta / revisar"],
            criticalRows.slice(0, 8).map((row) => [row.nombre, row.rut, row.estado, row.falta])
          )
        : emptyHtml("Sin observaciones críticas para el comité activo")}
      ${criticalRows.length > 8 ? `<p class="small muted" style="margin-bottom: 0;">Se muestran 8 de ${formatNumber(criticalRows.length)} registros. El PDF incluye el listado completo.</p>` : ""}
    </section>
    <section class="panel" style="margin-top: 18px;">
      <h3>Comités</h3>
      ${simpleTable(["Comité", "Personas"], comites.map((item) => [item.label, item.total]))}
    </section>
  `);

  document.getElementById("executivePdfBtn").addEventListener("click", exportExecutiveSummaryPdf);
  document.getElementById("criticalPdfBtn").addEventListener("click", exportCriticalObservationsPdf);
  document.getElementById("criticalExcelBtn").addEventListener("click", exportCriticalRowsExcel);
}

function renderImportHistory() {
  const container = document.getElementById("importHistory");
  if (!container) return;
  if (!state.importaciones.length) {
    container.innerHTML = emptyHtml("Sin importaciones registradas");
    return;
  }
  container.innerHTML = simpleTable(
    ["Archivo", "Tipo", "Hoja", "Fecha", "Creados", "Actualizados", "Omitidos"],
    state.importaciones.map((item) => [
      item.archivo,
      importModeLabel(item.modo),
      item.hoja,
      formatDateTime(item.fecha),
      item.creados,
      item.actualizados,
      item.omitidos,
    ])
  );
}

function importModeLabel(mode) {
  const labels = {
    automatico: "Base automática",
    mapeo_manual: "Base con mapeo",
    observaciones_correcciones: "Observaciones",
  };
  return labels[mode] || "Base";
}

function exportPersonasExcel(query = "", estado = "", filtroRapido = "") {
  const rows = filteredPersonasRows(query, estado, filtroRapido);
  if (!rows.length) {
    alert("No hay personas para exportar con la selección actual.");
    return;
  }
  exportRowsToExcel(
    `nomina-${personFilterLabel(filtroRapido)}`,
    [
      "Nombre",
      "RUT",
      "Teléfono",
      "Comité",
      "Tipo de vivienda",
      "Estado",
      "Motivo principal",
    ],
    rows.map((persona) => [
      persona.nombre,
      persona.rut,
      persona.telefono,
      persona.comite.nombre,
      personHousingType(persona) || "Sin dato",
      statusLabel(persona.estadoGeneral),
      primaryOperationalReason(persona),
    ])
  );
}

function primaryOperationalReason(persona) {
  const alert = activeAlerts(persona).find(alertAffectsStatus) || activeAlerts(persona)[0];
  if (alert) return `${alert.titulo}: ${alert.detalle || alert.tipo}`;
  const observation = (persona.observaciones || []).find((item) => isActionableObservationText(item.texto));
  return observation ? observation.texto : "Sin motivo activo";
}

function exportGestionExcel(rows, prefix = "gestion") {
  if (!rows.length) {
    alert("No hay casos de gestión para exportar.");
    return;
  }
  exportRowsToExcel(
    prefix,
    ["Prioridad", "Nombre", "RUT", "Estado persona", "Motivo", "Qué falta / revisar", "Estado gestión", "Responsable", "Comentario"],
    rows.map((task) => [
      statusLabel(task.prioridad),
      task.nombre,
      task.rut,
      statusLabel(task.estadoPersona),
      task.motivo,
      task.falta,
      gestionStatusLabel(task.estadoGestion),
      task.responsable,
      task.comentario,
    ])
  );
}

function exportCriticalRowsExcel() {
  const rows = criticalObservationRows();
  if (!rows.length) {
    alert("No hay observaciones críticas para exportar.");
    return;
  }
  exportRowsToExcel(
    "observaciones-criticas",
    ["Prioridad", "Nombre", "RUT", "Estado", "Qué falta / revisar"],
    rows.map((row) => [row.prioridad, row.nombre, row.rut, row.estado, row.falta])
  );
}

function exportRowsToExcel(prefix, headers, rows) {
  if (!window.XLSX) {
    alert("No se pudo cargar el generador Excel. Revisa la conexión a internet y vuelve a intentar.");
    return;
  }
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.min(Math.max(cleanString(header).length + 8, 14), 42) }));
  XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");
  XLSX.writeFile(workbook, `${excelFileName(prefix)}.xlsx`);
}

function exportExecutiveSummaryPdf() {
  const doc = createPdfDocument();
  if (!doc) {
    openExecutiveSummaryPrint();
    return;
  }

  const resumen = getResumen();
  const workspace = getActiveWorkspace();
  const criticalRows = criticalObservationRows();
  const importacion = state.importaciones[0];
  const title = "Resumen ejecutivo del comité";
  const subtitle = workspaceDisplayName(workspace);
  let y = addPdfHeader(doc, title, subtitle);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha de emisión: ${formatDate(new Date())}`, 40, y);
  y += 18;
  doc.text(`Comuna: ${workspace.comuna || "Sin dato"}`, 40, y);
  y += 18;
  doc.text(`Última importación: ${importacion ? `${importacion.archivo} (${formatDateTime(importacion.fecha)})` : "Sin registro"}`, 40, y);
  y += 16;

  addPdfTable(doc, {
    startY: y,
    head: [["Indicador", "Total"]],
    body: [
      ["Total personas", formatNumber(resumen.totalPersonas)],
      ["Aptas", formatNumber(resumen.personasAptas)],
      ["Observadas", formatNumber(resumen.observadas)],
      ["Bloqueadas", formatNumber(resumen.bloqueadas)],
      ["Cédulas vencidas", formatNumber(resumen.cedulasVencidas)],
      ["Cédulas vencidas o por vencer", formatNumber(resumen.cedulasRevision)],
      ["Adultos mayores", formatNumber(resumen.personasMayores)],
      ["Personas con discapacidad", formatNumber(resumen.discapacidad)],
      ["Hijos / cargas revisión 18 años", formatNumber(resumen.hijosRevision18)],
      ["Etnia / pueblo originario", formatNumber(resumen.etnia)],
      ["Postulación unipersonal", formatNumber(resumen.unipersonales)],
    ],
  });

  y = doc.lastAutoTable.finalY + 22;
  addPdfTable(doc, {
    startY: y,
    head: [["Foco operativo", "Lectura"]],
    body: [
      ["Observaciones críticas", criticalRows.length ? `${formatNumber(criticalRows.length)} socios requieren revisión prioritaria.` : "Sin observaciones críticas activas."],
      ["Documentación", resumen.cedulasRevision ? "Priorizar cédulas vencidas o próximas a vencer." : "Sin cédulas vencidas o próximas a vencer registradas."],
      ["Revisión familiar", resumen.hijosRevision18 ? "Revisar cargas o hijos que cumplen 18 años o ya cumplieron." : "Sin casos de mayoría de edad detectados."],
    ],
    columnStyles: { 0: { cellWidth: 145 }, 1: { cellWidth: 365 } },
  });

  doc.save(pdfFileName("resumen-ejecutivo"));
}

function exportCriticalObservationsPdf() {
  const doc = createPdfDocument("landscape");
  if (!doc) {
    openCriticalObservationsPrint();
    return;
  }

  const rows = criticalObservationRows();
  const workspace = getActiveWorkspace();
  let y = addPdfHeader(doc, "Observaciones críticas del comité", workspaceDisplayName(workspace));

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Fecha de emisión: ${formatDate(new Date())}`, 40, y);
  y += 16;
  doc.text(`Total registros críticos: ${formatNumber(rows.length)}`, 40, y);
  y += 14;

  if (!rows.length) {
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Sin observaciones críticas activas para el comité seleccionado.", 40, y + 20);
    doc.save(pdfFileName("observaciones-criticas"));
    return;
  }

  addPdfTable(doc, {
    startY: y,
    head: [["Prioridad", "Nombre", "RUT", "Estado", "Qué falta / revisar"]],
    body: rows.map((row) => [row.prioridad, row.nombre, row.rut, row.estado, row.falta]),
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 170 },
      2: { cellWidth: 80 },
      3: { cellWidth: 70 },
      4: { cellWidth: 360 },
    },
  });

  doc.save(pdfFileName("observaciones-criticas"));
}

function createPdfDocument(orientation = "portrait") {
  const PdfCtor = window.jspdf?.jsPDF;
  if (!PdfCtor) return null;
  const doc = new PdfCtor({ orientation, unit: "pt", format: "letter" });
  if (typeof doc.autoTable !== "function") return null;
  doc.setProperties({
    title: "Consulta Habitacional EP",
    subject: workspaceDisplayName(getActiveWorkspace()),
    creator: "Consulta Habitacional EP",
  });
  return doc;
}

function openExecutiveSummaryPrint() {
  const resumen = getResumen();
  const workspace = getActiveWorkspace();
  const criticalRows = criticalObservationRows();
  const importacion = state.importaciones[0];
  const indicators = [
    ["Total personas", formatNumber(resumen.totalPersonas)],
    ["Aptas", formatNumber(resumen.personasAptas)],
    ["Observadas", formatNumber(resumen.observadas)],
    ["Bloqueadas", formatNumber(resumen.bloqueadas)],
    ["Cédulas vencidas", formatNumber(resumen.cedulasVencidas)],
    ["Cédulas vencidas o por vencer", formatNumber(resumen.cedulasRevision)],
    ["Adultos mayores", formatNumber(resumen.personasMayores)],
    ["Personas con discapacidad", formatNumber(resumen.discapacidad)],
    ["Hijos / cargas revisión 18 años", formatNumber(resumen.hijosRevision18)],
    ["Etnia / pueblo originario", formatNumber(resumen.etnia)],
    ["Postulación unipersonal", formatNumber(resumen.unipersonales)],
  ];
  const focusRows = [
    ["Comuna", workspace.comuna || "Sin dato"],
    ["Última importación", importacion ? `${importacion.archivo} (${formatDateTime(importacion.fecha)})` : "Sin registro"],
    ["Observaciones críticas", criticalRows.length ? `${formatNumber(criticalRows.length)} socios requieren revisión prioritaria.` : "Sin observaciones críticas activas."],
  ];
  openPrintDocument(
    "Resumen ejecutivo del comité",
    workspaceDisplayName(workspace),
    `${printTableHtml(["Indicador", "Total"], indicators)}${printTableHtml(["Foco operativo", "Lectura"], focusRows)}`
  );
}

function openCriticalObservationsPrint() {
  const rows = criticalObservationRows();
  const workspace = getActiveWorkspace();
  const content = rows.length
    ? printTableHtml(
        ["Prioridad", "Nombre", "RUT", "Estado", "Qué falta / revisar"],
        rows.map((row) => [row.prioridad, row.nombre, row.rut, row.estado, row.falta])
      )
    : `<p class="empty-print">Sin observaciones críticas activas para el comité seleccionado.</p>`;
  openPrintDocument(
    "Observaciones críticas del comité",
    workspaceDisplayName(workspace),
    `<p class="meta-print">Total registros críticos: ${formatNumber(rows.length)}</p>${content}`
  );
}

function openPrintDocument(title, subtitle, content) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para generar el PDF.");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          body { color: #0f172a; font-family: Arial, sans-serif; margin: 32px; }
          h1 { margin: 0 0 6px; font-size: 22px; }
          h2 { margin: 0 0 18px; color: #0e7490; font-size: 15px; font-weight: 700; }
          .meta-print { color: #475569; margin: 0 0 14px; }
          table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 12px; }
          th { background: #0e7490; color: #fff; text-align: left; }
          th, td { border: 1px solid #cbd5e1; padding: 7px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .empty-print { border: 1px dashed #cbd5e1; color: #64748b; padding: 18px; text-align: center; }
          .date-print { color: #64748b; font-size: 12px; margin-bottom: 18px; }
          @page { margin: 16mm; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <h2>${escapeHtml(subtitle || DEFAULT_WORKSPACE_NAME)}</h2>
        <p class="date-print">Fecha de emisión: ${formatDate(new Date())}</p>
        ${content}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function printTableHtml(headers, rows) {
  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
}

function addPdfHeader(doc, title, subtitle) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(title, 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(14, 116, 144);
  doc.text(subtitle || "Comité sin nombre", 40, 61);
  doc.setDrawColor(216, 222, 232);
  doc.line(40, 74, doc.internal.pageSize.getWidth() - 40, 74);
  return 94;
}

function addPdfTable(doc, options) {
  doc.autoTable({
    ...options,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 5,
      overflow: "linebreak",
      valign: "top",
    },
    headStyles: {
      fillColor: [14, 116, 144],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 40, right: 40 },
    didDrawPage: (data) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Página ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, pageHeight - 20);
    },
  });
}

function criticalObservationRows() {
  return state.personas
    .map((persona) => {
      const criticalAlerts = activeAlerts(persona)
        .filter((alerta) => alerta.severidad === "critica" && alertAffectsStatus(alerta))
        .filter((alerta) => {
          const text = `${alerta.titulo}: ${alerta.detalle || alerta.tipo}`;
          return !isTaskResolved(managementTaskKey(persona, "alerta", text));
        });
      const criticalNotes = (persona.observaciones || []).filter(
        (item) => isCriticalObservationText(item.texto) && !isTaskResolved(managementTaskKey(persona, "observacion", item.texto))
      );
      if (!criticalAlerts.length && !criticalNotes.length) return null;
      const faltas = uniqueTexts([
        ...criticalAlerts.map((alerta) => `${alerta.titulo}: ${alerta.detalle || alerta.tipo}`),
        ...criticalNotes.map((item) => item.texto),
      ]);
      return {
        prioridad: criticalAlerts.length ? "Crítica" : "Revisión",
        nombre: persona.nombre || "Sin nombre",
        rut: persona.rut || "Sin RUT",
        estado: statusLabel(persona.estadoGeneral),
        falta: faltas.join(" | "),
        orden: criticalAlerts.length ? 0 : 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
}

function isCriticalObservationText(text) {
  const value = normalize(text);
  if (!value) return false;
  return [
    "falta",
    "faltante",
    "pendiente",
    "vencid",
    "rechaz",
    "bloque",
    "critica",
    "critico",
    "subsanar",
    "incomplet",
    "noacredita",
    "sincedula",
    "sindocumento",
  ].some((token) => value.includes(token));
}

function uniqueTexts(values) {
  const seen = new Set();
  return values
    .map(cleanString)
    .filter(Boolean)
    .filter((value) => {
      const key = normalize(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function statusLabel(value) {
  return cleanString(value).replaceAll("_", " ") || "Sin estado";
}

function gestionStatusLabel(value) {
  const labels = {
    pendiente: "Pendiente",
    en_revision: "En revisión",
    resuelto: "Resuelto",
  };
  return labels[value] || statusLabel(value);
}

function pdfFileName(prefix) {
  const workspace = normalize(workspaceDisplayName(getActiveWorkspace())) || "comite";
  return `${prefix}-${workspace}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

function excelFileName(prefix) {
  const workspace = normalize(workspaceDisplayName(getActiveWorkspace())) || "comite";
  const cleanPrefix = normalize(prefix) || "exportacion";
  return `${cleanPrefix}-${workspace}-${new Date().toISOString().slice(0, 10)}`;
}

function getResumen() {
  const alertas = state.personas.flatMap((persona) => persona.alertas || []);
  return {
    totalPersonas: state.personas.length,
    personasAptas: state.personas.filter((p) => p.estadoGeneral === "apta").length,
    observadas: state.personas.filter((p) => p.estadoGeneral === "observada").length,
    bloqueadas: state.personas.filter((p) => p.estadoGeneral === "bloqueada").length,
    personasMayores: state.personas.filter((p) => p.personaMayor).length,
    discapacidad: state.personas.filter((p) => p.discapacidad).length,
    etnia: state.personas.filter(hasEtnia).length,
    unipersonales: state.personas.filter(isUnipersonal).length,
    hijosRevision18: state.personas.filter((p) => hijosConRevision(p).length).length,
    rshSobre40: state.personas.filter((p) => Number(p.rsh.porcentaje) > 40).length,
    ahorroInsuficiente: state.personas.filter((p) => p.ahorro.insuficiente).length,
    cedulasRevision: state.personas.filter(hasCedulaRevision).length,
    cedulasVencidas: state.personas.filter((p) =>
      p.documentos.some((doc) => doc.tipo === "cedula" && doc.estado === "vencido")
    ).length,
    alertasCriticas: alertas.filter((alerta) => alerta.severidad === "critica").length,
    alertasPreventivas: alertas.filter((alerta) => alerta.severidad === "preventiva").length,
  };
}

function getHousingRows() {
  const personRows = personHousingRows();
  if (personRows.length) return personRows;
  return normalizeHousingRows(state.viviendas || []).map((row) => ({
    ...row,
    personas: 0,
    hasFinancing: true,
  }));
}

function personHousingRows() {
  const financingRows = normalizeHousingRows(state.viviendas || []);
  const grouped = new Map();

  state.personas.forEach((persona) => {
    const tipo = personHousingType(persona);
    if (!tipo) return;
    const finance = findHousingFinancingRow(tipo, financingRows, persona);
    const displayType = finance?.tipo || tipo;
    const key = [normalize(displayType), financeVariantKey(finance)].filter(Boolean).join("-");
    const categoryFromText = housingCategoryForText([displayType, finance?.clasificacion].join(" "));
    const fallbackCategory = housingCategoryForPerson(persona);
    const category = categoryFromText.key === "otra" ? fallbackCategory : categoryFromText;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `persona-vivienda-${key}`,
        tipo: displayType,
        clasificacion: category.label,
        clasificacionKey: category.key,
        rsh: finance?.rsh || "",
        ahorro: finance?.ahorro || "",
        grupoFamiliar: finance?.grupoFamiliar || "",
        discapacidad20: finance?.discapacidad20 || "",
        neurodivergencia: finance?.neurodivergencia || "",
        movilidadReducida: finance?.movilidadReducida || "",
        viviendas: finance?.viviendas ?? null,
        personas: 0,
        personasDetalle: [],
        hasFinancing: Boolean(finance),
      });
    }
    const group = grouped.get(key);
    group.personas += 1;
    group.personasDetalle.push(housingPersonSummary(persona));
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    personasDetalle: row.personasDetalle.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  })).sort(
    (a, b) =>
      HOUSING_CATEGORIES.findIndex((category) => category.key === a.clasificacionKey) -
        HOUSING_CATEGORIES.findIndex((category) => category.key === b.clasificacionKey) ||
      a.tipo.localeCompare(b.tipo, "es")
  );
}

function housingPersonSummary(persona) {
  return {
    rut: persona.rut,
    nombre: persona.nombre,
    rsh: formatPercent(persona.rsh?.porcentaje),
    tipoOriginal: personHousingRawType(persona),
    grupoFamiliar: persona.caracterizacion?.grupoFamiliar || persona.caracterizacion?.integrantes || "",
    estadoGeneral: persona.estadoGeneral,
  };
}

function findHousingFinancingRow(tipo, rows, persona) {
  const typeKey = normalize(tipo);
  if (!typeKey) return null;
  const exact = rows.filter((row) => normalize(row.tipo) === typeKey);
  const contained = rows.filter((row) => {
    const rowKey = normalize(row.tipo);
    return (
      rowKey.length > 4 &&
      typeKey.length > 4 &&
      normalize(row.tipo) !== typeKey &&
      (rowKey.includes(typeKey) || typeKey.includes(rowKey))
    );
  });
  const directMatches = uniqueHousingRows([...exact, ...contained]);
  if (directMatches.length) return selectHousingFinancingVariant(directMatches, persona);

  const tokens = housingMatchTokens(tipo);
  const scored = rows
    .map((row) => {
      const rowTokens = housingMatchTokens([row.tipo, row.rsh, row.ahorro, row.grupoFamiliar, row.discapacidad20, row.neurodivergencia, row.movilidadReducida].join(" "));
      const score = tokens.filter((token) => rowTokens.includes(token)).length;
      return { row, score };
    })
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score);
  return scored.length ? selectHousingFinancingVariant(scored.filter((item) => item.score === scored[0].score).map((item) => item.row), persona) : null;
}

function selectHousingFinancingVariant(rows, persona) {
  if (!rows.length) return null;

  const rsh = parseDecimal(persona?.rsh?.porcentaje ?? persona?.rsh?.tramo);
  if (rsh !== null) {
    if (rsh > 40) {
      const over40 = rows.filter(isHousing35UfVariant);
      if (over40.length === 1) return over40[0];
      if (over40.length > 1) return mergeHousingFinancingRows(over40);
      return forceHousing35UfVariant(rows[0]);
    }

    const byRsh = rows.filter((row) => housingFinancingMatchesRsh(row, rsh));
    if (byRsh.length === 1) return byRsh[0];
    if (byRsh.length > 1) return mergeHousingFinancingRows(byRsh);
  }

  if (rows.length === 1) return rows[0];
  return mergeHousingFinancingRows(rows);
}

function uniqueHousingRows(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = cleanString(row.id) || [row.tipo, row.rsh, row.ahorro, row.viviendas].map(cleanString).join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isHousing35UfVariant(row) {
  const ahorro = normalize(row?.ahorro);
  if (ahorro.includes("35")) return true;
  const band = housingRshBand(row?.rsh);
  if (band && band.min > 40) return true;
  return normalize(row?.tipo).includes("ahorro35uf");
}

function forceHousing35UfVariant(row) {
  if (!row) return null;
  return {
    ...row,
    id: `${cleanString(row.id) || normalize(row.tipo)}-sobre40-35uf`,
    rsh: "Sobre 40%",
    ahorro: "35 UF",
    viviendas: null,
  };
}

function housingFinancingMatchesRsh(row, rsh) {
  const band = housingRshBand(row?.rsh);
  if (band) return rsh >= band.min && rsh <= band.max;

  const ahorro = normalize(row?.ahorro);
  if (ahorro.includes("35")) return rsh > 40;
  if (ahorro.includes("30")) return rsh <= 40;
  return false;
}

function housingRshBand(value) {
  const text = cleanString(value);
  if (!text) return null;
  const normalized = normalize(text);
  if (normalized.includes("sobre40") || normalized.includes("masde40") || normalized.includes("mayor40")) {
    return { min: 40.01, max: 100 };
  }
  const numbers = text
    .replace(",", ".")
    .match(/\d+(\.\d+)?/g)
    ?.map(Number)
    .filter((number) => Number.isFinite(number)) || [];
  if (!numbers.length) return null;
  if (numbers.length >= 2) {
    const min = Math.min(numbers[0], numbers[1]);
    const max = Math.max(numbers[0], numbers[1]);
    return min > 40 ? { min: 40.01, max } : { min, max };
  }
  const number = numbers[0];
  return number <= 40 ? { min: 0, max: 40 } : { min: 40.01, max: 100 };
}

function mergeHousingFinancingRows(rows) {
  if (!rows.length) return null;
  const join = (field) => uniqueTexts(rows.map((row) => row[field])).join(", ");
  return {
    ...rows[0],
    rsh: join("rsh"),
    ahorro: join("ahorro"),
    grupoFamiliar: join("grupoFamiliar"),
    discapacidad20: join("discapacidad20"),
    neurodivergencia: join("neurodivergencia"),
    movilidadReducida: join("movilidadReducida"),
    viviendas: rows.reduce((sum, row) => sum + Number(row.viviendas || 0), 0),
  };
}

function financeVariantKey(finance) {
  if (!finance) return "";
  return normalize(
    [
      finance.id,
      finance.rsh,
      finance.ahorro,
      finance.grupoFamiliar,
      finance.discapacidad20,
      finance.neurodivergencia,
      finance.movilidadReducida,
    ].join(" ")
  );
}

function housingMatchTokens(value) {
  const text = normalize(value);
  const tokens = [];
  if (text.includes("base")) tokens.push("base");
  if (text.includes("grupo") && text.includes("famili")) tokens.push("grupo_familiar");
  if (text.includes("neuro")) tokens.push("neuro");
  if (text.includes("disc") || text.includes("discap")) tokens.push("discapacidad");
  if (text.includes("movilidad") || text.includes("reducida")) tokens.push("movilidad_reducida");
  if (text.includes("dormitorio")) tokens.push("dormitorio");
  if (text.includes("principal")) tokens.push("principal");
  if (text.includes("2dormitorio") || text.includes("segundodormitorio")) tokens.push("segundo_dormitorio");
  ["20", "35", "50", "70", "80", "90"].forEach((number) => {
    if (text.includes(number)) tokens.push(number);
  });
  return tokens;
}

function personHousingType(persona) {
  return canonicalHousingType(personHousingRawType(persona));
}

function personHousingRawType(persona) {
  return cleanString(
    persona?.postulacion?.tipoVivienda ||
      persona?.caracterizacion?.tipoVivienda ||
      persona?.tipoVivienda ||
      inferPersonOriginalValue(persona?.original, "tipoVivienda")
  );
}

function canonicalHousingType(value) {
  const text = cleanString(value);
  const key = normalize(text);
  if (!key) return "";

  if (key === "tipo" || key === "tipoahorro35uf" || key === "viviendabaseahorro35uf") {
    return "VIVIENDA BASE";
  }
  if (key.includes("movilidadreducidapostulante")) {
    return "DISC 80 UF (DORMITORIO PRINCIPAL)";
  }
  if (key.includes("neurodivergenciahijo")) {
    return "NEURODIVERGENCIA (2º DORMITORIO)";
  }
  if (key.includes("movilidadreducidahijo") && key.includes("neuro")) {
    return key.includes("ahorro35uf")
      ? "DISC 80 UF (2º DORMITORIO)/ NEURODIVERGENTE + AHORRO 35 UF"
      : "DISC 80 UF (2º DORMITORIO)/ NEURODIVERGENTE";
  }
  return text;
}

function housingCategorySummary(rows) {
  return HOUSING_CATEGORIES
    .map((category) => {
      const categoryRows = rows.filter((row) => row.clasificacionKey === category.key);
      const viviendas = categoryRows.reduce((sum, row) => sum + Number(row.viviendas || 0), 0);
      const personas = categoryRows.reduce((sum, row) => sum + Number(row.personas || 0), 0);
      return {
        key: category.key,
        label: category.label,
        viviendas,
        personas,
      };
    })
    .filter((row) => row.viviendas || row.personas);
}

function peopleHousingCategoryCounts() {
  return state.personas.reduce((counts, persona) => {
    if (!personHousingType(persona)) return counts;
    const category = housingCategoryForPerson(persona);
    counts[category.key] = (counts[category.key] || 0) + 1;
    return counts;
  }, {});
}

function housingCategoryForPerson(persona) {
  const tipo = personHousingType(persona);
  if (tipo) {
    const category = housingCategoryForText(tipo);
    if (category.key !== "otra") return category;
  }
  const hasNeuro = Boolean(persona?.neurodivergencia);
  const hasDiscapacidad = Boolean(persona?.discapacidad);
  if (hasNeuro && hasDiscapacidad) return housingCategoryByKey("combinada");
  if (hasDiscapacidad) return housingCategoryByKey("discapacidad");
  if (hasNeuro) return housingCategoryByKey("neurodivergencia");
  if (!isUnipersonal(persona)) return housingCategoryByKey("grupo_familiar");
  return housingCategoryByKey("base");
}

function housingCategoryForText(value) {
  const text = normalize(value);
  const hasNeuro = text.includes("neuro");
  const hasDiscapacidad =
    text.includes("disc") ||
    text.includes("discap") ||
    text.includes("movilidad") ||
    text.includes("reducida") ||
    text.includes("80uf");
  const hasGrupo = text.includes("grupofamiliar") || (text.includes("grupo") && text.includes("famili"));
  if (hasNeuro && hasDiscapacidad) return housingCategoryByKey("combinada");
  if (hasDiscapacidad) return housingCategoryByKey("discapacidad");
  if (hasNeuro) return housingCategoryByKey("neurodivergencia");
  if (hasGrupo) return housingCategoryByKey("grupo_familiar");
  if (text.includes("viviendabase") || text.includes("base")) return housingCategoryByKey("base");
  return housingCategoryByKey("otra");
}

function looksLikeHousingType(value) {
  const text = normalize(value);
  if (!text || text.length < 3) return false;
  return (
    housingCategoryForText(text).key !== "otra" ||
    ["vivienda", "dormitorio", "habitacional", "subsidio", "tipologia", "uf"].some((token) => text.includes(token))
  );
}

function housingCategoryByKey(key) {
  return HOUSING_CATEGORIES.find((category) => category.key === key) || HOUSING_CATEGORIES.at(-1);
}

function selectBaseSheet(sheetNames) {
  const exact = sheetNames.find((name) => normalize(name) === "base");
  if (exact) return exact;
  const starts = sheetNames.find((name) => normalize(name).startsWith("base"));
  if (starts) return starts;
  const includes = sheetNames.find((name) => normalize(name).includes("base"));
  return includes || sheetNames[0];
}

function detectHeaderRow(rows) {
  let bestIndex = -1;
  let bestScore = 0;
  rows.slice(0, 30).forEach((row, index) => {
    const headers = uniqueHeaders(row);
    const columnMap = buildColumnMap(headers);
    const score = scoreHeaderCandidate(headers, columnMap);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  if (bestScore >= 8) return bestIndex;
  return detectHeaderRowByData(rows);
}

function detectHeaderRowByData(rows) {
  let best = { index: -1, score: 0 };
  rows.slice(0, 35).forEach((row, index) => {
    const values = (row || []).map(cleanString).filter(Boolean);
    if (values.length < 2 || values.some(looksLikeRut)) return;
    const headers = uniqueHeaders(row);
    const inferred = inferColumnMapFromData(rows, index, headers, buildColumnMap(headers));
    let score = 0;
    if (inferred.rut) score += 5;
    if (inferred.nombre || hasSplitNameColumns(inferred)) score += 4;
    if (inferred.fechaNacimiento) score += 1;
    if (inferred.cedulaVencimiento) score += 1;
    if (score > best.score) best = { index, score };
  });
  return best.score >= 7 ? best.index : -1;
}

function uniqueHeaders(row) {
  const seen = new Map();
  return row.map((value, index) => {
    const base = cleanString(value) || `sin_nombre_${index + 1}`;
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    return count ? `${base}_${count}` : base;
  });
}

function buildColumnMap(headers) {
  const map = {};
  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    const exclude = COLUMN_EXCLUDES[field] || [];
    const column = findColumn(headers, aliases, exclude);
    if (column) map[field] = column;
  });
  return map;
}

function cleanColumnMap(map) {
  return Object.fromEntries(
    Object.entries(map || {}).filter(([, value]) => cleanString(value))
  );
}

function inferColumnMapFromData(rows, headerIndex, headers, baseMap = {}) {
  const map = { ...baseMap };
  if (headerIndex < 0 || !headers.length) return cleanColumnMap(map);

  const samples = rows
    .slice(headerIndex + 1, headerIndex + 36)
    .filter((row) => (row || []).some((value) => cleanString(value)));
  if (!samples.length) return cleanColumnMap(map);

  const analysis = headers.map((header, index) => analyzeColumnForImport(header, index, samples));

  if (!map.rut) {
    const rutCandidate = bestColumnCandidate(
      analysis.filter((item) => !hasAnyToken(item.normalized, COLUMN_EXCLUDES.rut || [])),
      (item) => item.rutCount * 5 + tokenBonus(item.normalized, ["rut", "run", "cedula", "documento", "dni"])
    );
    if (rutCandidate && rutCandidate.rutCount > 0) map.rut = rutCandidate.header;
  }

  if (!map.fechaNacimiento) {
    const birthCandidate = bestColumnCandidate(
      analysis.filter((item) => item.dateCount > 0 && !hasAnyToken(item.normalized, COLUMN_EXCLUDES.fechaNacimiento || [])),
      (item) => item.dateCount * 3 + tokenBonus(item.normalized, ["nac", "nacimiento", "fnac"])
    );
    if (birthCandidate && (birthCandidate.dateCount >= 2 || tokenBonus(birthCandidate.normalized, ["nac", "nacimiento", "fnac"]))) {
      map.fechaNacimiento = birthCandidate.header;
    }
  }

  if (!map.cedulaVencimiento) {
    const expiryCandidate = bestColumnCandidate(
      analysis.filter((item) => item.dateCount > 0 && !hasAnyToken(item.normalized, COLUMN_EXCLUDES.cedulaVencimiento || [])),
      (item) => item.dateCount * 3 + tokenBonus(item.normalized, ["venc", "vence", "vigencia", "caducidad", "expiracion", "cedula", "ci"])
    );
    if (expiryCandidate && tokenBonus(expiryCandidate.normalized, ["venc", "vence", "vigencia", "caducidad", "expiracion"])) {
      map.cedulaVencimiento = expiryCandidate.header;
    }
  }

  if (!map.tipoVivienda) {
    const housingCandidate = bestColumnCandidate(
      analysis.filter(
        (item) =>
          item.values.length > 0 &&
          item.emailCount === 0 &&
          item.rutCount === 0 &&
          item.dateCount === 0 &&
          item.numericCount <= Math.max(1, Math.ceil(item.values.length * 0.25)) &&
          !hasAnyToken(item.normalized, COLUMN_EXCLUDES.tipoVivienda || [])
      ),
      (item) =>
        tokenBonus(item.normalized, ["vivienda", "tipologia", "clasificacion", "dormitorio", "subsidio"]) +
        item.values.filter(looksLikeHousingType).length * 4
    );
    if (
      housingCandidate &&
      (tokenBonus(housingCandidate.normalized, ["vivienda", "tipologia", "clasificacion", "dormitorio", "subsidio"]) ||
        housingCandidate.values.filter(looksLikeHousingType).length >= 2)
    ) {
      map.tipoVivienda = housingCandidate.header;
    }
  }

  inferNameColumns(analysis, map);
  return cleanColumnMap(map);
}

function analyzeColumnForImport(header, index, rows) {
  const values = rows.map((row) => row[index]).filter((value) => cleanString(value));
  return {
    header,
    index,
    normalized: normalize(header),
    values,
    rutCount: values.filter(looksLikeRut).length,
    dateCount: values.filter((value) => parseDateValue(value)).length,
    numericCount: values.filter((value) => parseDecimal(value) !== null).length,
    booleanCount: values.filter((value) => ["si", "no", "s", "n", "true", "false", "0", "1"].includes(normalize(value))).length,
    emailCount: values.filter((value) => cleanString(value).includes("@")).length,
    textCount: values.filter((value) => isNameLikeValue(value)).length,
  };
}

function inferNameColumns(analysis, map) {
  if (map.nombre || hasSplitNameColumns(map)) return;
  const usable = analysis.filter(
    (item) =>
      item.textCount > 0 &&
      item.rutCount === 0 &&
      item.emailCount === 0 &&
      item.dateCount <= 1 &&
      item.booleanCount <= 1 &&
      !hasAnyToken(item.normalized, COLUMN_EXCLUDES.nombre || []) &&
      !hasAnyToken(item.normalized, ["direccion", "domicilio", "comuna", "region", "correo", "email", "mail", "telefono", "fono", "banco"])
  );

  usable.forEach((item) => {
    if (!map.apellidoPaterno && hasAnyToken(item.normalized, ["paterno", "primerapellido"])) map.apellidoPaterno = item.header;
    else if (!map.apellidoMaterno && hasAnyToken(item.normalized, ["materno", "segundoapellido"])) map.apellidoMaterno = item.header;
    else if (!map.apellidos && hasAnyToken(item.normalized, ["apellidos", "apellido"])) map.apellidos = item.header;
    else if (!map.nombres && hasAnyToken(item.normalized, ["nombres", "primernombre", "segundonombre"])) map.nombres = item.header;
  });

  if (hasSplitNameColumns(map)) return;

  const rutIndex = analysis.find((item) => item.header === map.rut)?.index ?? -1;
  const candidate = bestColumnCandidate(usable, (item) => {
    const headerBonus = tokenBonus(item.normalized, ["nombre", "postulante", "socio", "titular", "beneficiario"]);
    const distanceBonus = rutIndex >= 0 ? Math.max(0, 4 - Math.abs(item.index - rutIndex)) : 0;
    return item.textCount * 3 + headerBonus + distanceBonus;
  });
  if (candidate) map.nombre = candidate.header;
}

function bestColumnCandidate(items, scoreFn) {
  return items
    .map((item) => ({ item, score: scoreFn(item) }))
    .sort((a, b) => b.score - a.score)[0]?.item || null;
}

function hasAnyToken(text, tokens) {
  return (tokens || []).some((token) => text.includes(normalize(token)));
}

function tokenBonus(text, tokens) {
  return (tokens || []).reduce((score, token) => score + (text.includes(normalize(token)) ? 2 : 0), 0);
}

function isNameLikeValue(value) {
  const text = cleanString(value);
  if (!text || text.includes("@") || looksLikeRut(text)) return false;
  if (parseDateValue(value)) return false;
  const normalized = normalize(text);
  if (!/[a-z]/i.test(text) || ["si", "no", "s", "n", "true", "false"].includes(normalized)) return false;
  return text.length >= 3;
}

function scoreHeaderCandidate(headers, columnMap) {
  const filledHeaders = headers.filter((header) => normalize(header) && !normalize(header).startsWith("sinnombre"));
  if (filledHeaders.length < 2) return 0;

  let score = 0;
  if (columnMap.rut) score += 4;
  if (columnMap.nombre) score += 4;
  else if (hasSplitNameColumns(columnMap)) score += 4;

  [
    "fechaNacimiento",
    "telefono",
    "correo",
    "rsh",
    "cedulaVencimiento",
    "discapacidad",
    "tipoVivienda",
    "grupoFamiliar",
    "integrantes",
    "comuna",
  ].forEach((field) => {
    if (columnMap[field]) score += 1;
  });

  return score;
}

function hasRequiredIdentityColumns(columnMap) {
  return Boolean(columnMap.rut && (columnMap.nombre || hasSplitNameColumns(columnMap)));
}

function hasSplitNameColumns(columnMap) {
  return Boolean(columnMap.nombres || columnMap.apellidos || columnMap.apellidoPaterno || columnMap.apellidoMaterno);
}

function missingColumnsMessage(columnMap, headers) {
  const missing = [];
  if (!columnMap.rut) missing.push("RUT/RUN");
  if (!columnMap.nombre && !hasSplitNameColumns(columnMap)) missing.push("NOMBRE o NOMBRES/APELLIDOS");
  const preview = headers
    .filter((header) => cleanString(header))
    .slice(0, 12)
    .join(", ");
  return `Faltan columnas obligatorias: ${missing.join(" y ")}.${preview ? ` Columnas detectadas: ${preview}.` : ""}`;
}

function findColumn(headers, aliases, exclude = []) {
  const aliasNorm = aliases.map(normalize);
  const excludeNorm = exclude.map(normalize);
  const candidates = headers
    .map((header) => ({ header, normalized: normalize(header) }))
    .filter((item) => !excludeNorm.some((bad) => item.normalized.includes(bad)));

  return (
    candidates.find((item) => aliasNorm.includes(item.normalized))?.header ||
    candidates.find((item) => aliasNorm.some((alias) => alias.length > 3 && item.normalized.startsWith(alias)))
      ?.header ||
    candidates.find((item) => aliasNorm.some((alias) => alias.length > 3 && item.normalized.includes(alias)))
      ?.header ||
    ""
  );
}

function detectDisplacement(row, headers, columnMap) {
  const nombreIndex = headers.indexOf(identityNameColumn(columnMap));
  const rutIndex = headers.indexOf(columnMap.rut);
  if (nombreIndex < 0 || rutIndex < 0) return 0;
  const nombreValue = row[nombreIndex];
  const rutValue = row[rutIndex];
  const nextRutValue = row[rutIndex + 1];
  if (isOrderNumber(nombreValue) && !looksLikeRut(rutValue) && looksLikeRut(nextRutValue)) {
    return 1;
  }
  return 0;
}

function identityNameColumn(columnMap) {
  return columnMap.nombre || columnMap.nombres || columnMap.apellidos || columnMap.apellidoPaterno || columnMap.apellidoMaterno || "";
}

function composePersonName(value, columnMap) {
  const base = cleanString(value("nombre"));
  const nombres = cleanString(value("nombres"));
  const apellidoPaterno = cleanString(value("apellidoPaterno"));
  const apellidoMaterno = cleanString(value("apellidoMaterno"));
  const apellidos = cleanString(value("apellidos"));

  if (nombres || apellidoPaterno || apellidoMaterno || apellidos) {
    const firstNames = nombres || (isNamesOnlyHeader(columnMap.nombre) ? base : "");
    const parts = [firstNames || base, apellidoPaterno, apellidoMaterno || (!apellidoPaterno ? apellidos : "")].filter(Boolean);
    const name = parts.join(" ").replace(/\s+/g, " ").trim();
    if (name) return name;
  }

  return base.replace(/\s+/g, " ").trim();
}

function isNamesOnlyHeader(header) {
  const text = normalize(header);
  if (!text) return false;
  if (["nombre", "nombres", "primernombre", "segundonombre"].includes(text)) return true;
  if (text.includes("nombre") && !text.includes("completo") && !text.includes("apellido")) return true;
  return false;
}

function getGeneralStatus(alerts) {
  const statusAlerts = alerts.filter((alerta) => alerta.activa && alertAffectsStatus(alerta));
  if (statusAlerts.some((alerta) => alerta.severidad === "critica")) return "bloqueada";
  if (statusAlerts.some((alerta) => alerta.severidad === "preventiva")) return "observada";
  return "apta";
}

function alertAffectsStatus(alerta) {
  return normalizeAlert(alerta).impactaEstado !== false;
}

function inferStateImpact(alerta) {
  const title = normalize(alerta.titulo);
  const detail = normalize(alerta.detalle);
  const text = `${title}${detail}`;
  if (text.includes("rshsobre40")) return false;
  if (title === "rsh" || text.includes("tramorshinformado")) return false;
  if (text.includes("respaldodiscapacidad")) return false;
  if (text.includes("certificado") && text.includes("discapacidad")) return false;
  if (text.includes("ahorronoinformado")) return false;
  if (text.includes("ahorroinsuficiente")) return false;
  if (text.includes("documentacionsecundaria")) return false;
  return true;
}

function documentStatusByDate(dateValue) {
  const today = atStartOfDay(new Date());
  const date = atStartOfDay(dateValue);
  const days = Math.round((date - today) / 86400000);
  if (days < 0) return "vencido";
  if (days <= 30) return "por_vencer";
  return "vigente";
}

function rowObject(row, headers) {
  const object = {};
  headers.forEach((header, index) => {
    const value = row[index];
    object[header] = value instanceof Date ? value.toISOString() : cleanString(value);
  });
  return object;
}

function inferPersonOriginalValue(original, field) {
  if (!original || typeof original !== "object") return "";
  const headers = Object.keys(original);
  const header = findColumn(headers, COLUMN_ALIASES[field] || [], COLUMN_EXCLUDES[field] || []);
  return header ? cleanString(original[header]) : "";
}

function inferCommitteeName(fileName) {
  return cleanString(fileName)
    .replace(/\.[^.]+$/, "")
    .replace(/\b(BASE|NOMINA|POSTULANTES|COMITE|SOCIOS)\b/gi, " ")
    .replace(/\b\d{1,2}[-_.]\d{1,2}[-_.]\d{2,4}\b/g, " ")
    .replace(/\b\d{4}\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase() || "COMITE SIN NOMBRE";
}

function sheetNameSafe(name) {
  return name || "";
}

function normalizeRut(value) {
  const text = cleanString(value).toUpperCase();
  if (!text) return "";
  const hadDash = text.includes("-");
  const cleaned = text.replace(/[^0-9K]/g, "");
  if (!cleaned) return "";
  let body = cleaned;
  let dv = "";
  if ((hadDash || cleaned.length > 8) && cleaned.length >= 2) {
    body = cleaned.slice(0, -1);
    dv = cleaned.slice(-1);
  } else {
    dv = calculateDv(body);
  }
  if (!/^\d+$/.test(body) || !dv) return "";
  return `${Number(body)}-${dv}`;
}

function calculateDv(body) {
  let sum = 0;
  let factor = 2;
  String(body)
    .split("")
    .reverse()
    .forEach((digit) => {
      sum += Number(digit) * factor;
      factor = factor === 7 ? 2 : factor + 1;
    });
  const rest = 11 - (sum % 11);
  if (rest === 11) return "0";
  if (rest === 10) return "K";
  return String(rest);
}

function looksLikeRut(value) {
  const cleaned = cleanString(value).toUpperCase().replace(/[^0-9K]/g, "");
  return /^\d{7,9}K?$/.test(cleaned);
}

function isOrderNumber(value) {
  const number = parseDecimal(value);
  return number !== null && number > 0 && number < 10000;
}

function parseBoolean(value) {
  const text = normalize(value);
  if (!text || ["no", "n", "false", "0", "ninguna", "ninguno"].includes(text)) return false;
  return ["si", "s", "true", "1", "postulante", "acreditado", "acreditada"].includes(text) || text.startsWith("si");
}

function parseDecimal(value) {
  if (typeof value === "number" && Number.isFinite(value)) return Number(value.toFixed(2));
  const text = cleanString(value).replace("%", "").replace(",", ".");
  const match = text.match(/-?\d+(\.\d+)?/);
  return match ? Number(Number(match[0]).toFixed(2)) : null;
}

function parseInteger(value) {
  const number = parseDecimal(value);
  return number === null ? null : Math.trunc(number);
}

function parseDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number" && value > 20000 && window.XLSX?.SSF) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const text = cleanString(value);
  if (!text) return null;
  const ymd = text.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    return validDate(new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])));
  }
  const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    const year = Number(dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]);
    return validDate(new Date(year, Number(dmy[2]) - 1, Number(dmy[1])));
  }
  const date = new Date(text);
  return validDate(date);
}

function validDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
}

function calculateAge(birthDate) {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!hadBirthday) age -= 1;
  return Math.max(age, 0);
}

function atStartOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function countDocuments() {
  const counts = new Map();
  state.personas.forEach((persona) => {
    persona.documentos.forEach((doc) => {
      const key = `${doc.tipo}|${doc.estado}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()].map(([key, total]) => [...key.split("|"), total]);
}

function countAlerts() {
  const counts = new Map();
  state.personas.forEach((persona) => {
    persona.alertas.forEach((alerta) => {
      const key = `${alerta.tipo}|${alerta.severidad}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()].map(([key, total]) => [...key.split("|"), total]);
}

function topBy(items, selector) {
  const counts = new Map();
  items.forEach((item) => {
    const label = selector(item);
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);
}

function personMatchesQuickFilter(persona, filter) {
  if (!filter || filter === "total") return true;
  if (filter === "cedulas_revision") return hasCedulaRevision(persona);
  if (filter === "adultos_mayores") return Boolean(persona.personaMayor);
  if (filter === "discapacidad") return Boolean(persona.discapacidad);
  if (filter === "etnia") return hasEtnia(persona);
  if (filter === "unipersonal") return isUnipersonal(persona);
  return true;
}

function personFilterLabel(filter) {
  const labels = {
    cedulas_revision: "cédulas vencidas o por vencer",
    adultos_mayores: "adultos mayores",
    discapacidad: "personas con discapacidad",
    etnia: "personas con etnia o pueblo originario",
    unipersonal: "postulaciones unipersonales",
  };
  return labels[filter] || "todas las personas";
}

function hasEtnia(persona) {
  const text = normalize(persona?.etnia);
  if (!text) return false;
  return ![
    "no",
    "n",
    "ninguna",
    "ninguno",
    "sin",
    "sindato",
    "noaplica",
    "noaplicable",
    "nodeclara",
    "noinforma",
    "noinformado",
    "noinformada",
    "none",
    "0",
  ].includes(text);
}

function isUnipersonal(persona) {
  const caracterizacion = persona?.caracterizacion || {};
  const integrantes = parseInteger(caracterizacion.integrantes);
  if (integrantes === 1) return true;
  const text = normalize(
    [
      caracterizacion.grupoFamiliar,
      caracterizacion.tipoFamilia,
      caracterizacion.parentesco,
      persona?.original?.["Grupo familiar"],
      persona?.original?.["Tipo familia"],
    ].filter(Boolean).join(" ")
  );
  return (
    text.includes("unipersonal") ||
    text.includes("personasola") ||
    text.includes("solopostulante") ||
    text.includes("sola") ||
    text.includes("solo")
  );
}

function exceptionCriteria(persona) {
  const criterios = [];
  if (persona?.personaMayor) criterios.push("Adulto mayor");
  if (hasEtnia(persona)) criterios.push("Etnia / pueblo originario");
  return criterios;
}

function exceptionCriteriaLabel(persona) {
  const criterios = exceptionCriteria(persona);
  return criterios.length ? criterios.join(", ") : "Sin criterio informado";
}

function hasCedulaRevision(persona) {
  return (persona.documentos || []).some(
    (doc) => doc.tipo === "cedula" && ["vencido", "por_vencer"].includes(doc.estado)
  );
}

function extractHijosFromEntries(entries) {
  const hijosPorIndice = new Map();
  entries.forEach(([header, rawValue]) => {
    const headerText = cleanString(header);
    const valueText = cleanString(rawValue);
    if (!headerText || !valueText) return;

    const normalized = normalize(headerText);
    if (!isChildColumn(normalized)) return;

    const field = childColumnField(normalized);
    if (!field) return;

    const index = childColumnIndex(normalized);
    const current = hijosPorIndice.get(index) || {};
    current[field] = valueText;
    hijosPorIndice.set(index, current);
  });

  return normalizeHijos([...hijosPorIndice.values()]);
}

function normalizeHijos(hijos) {
  return (Array.isArray(hijos) ? hijos : [])
    .map((hijo, index) => normalizeHijo(hijo, index))
    .filter(Boolean);
}

function normalizeHijo(hijo, index) {
  const nombre = cleanString(hijo.nombre);
  const rut = normalizeRut(hijo.rut) || cleanString(hijo.rut);
  const descripcion = cleanString(hijo.descripcion);
  const fechaNacimiento = parseDateValue(hijo.fechaNacimiento || hijo.fechaNacimientoRaw);
  const edad = fechaNacimiento ? calculateAge(fechaNacimiento) : parseInteger(hijo.edad);
  const fechaCumple18 = fechaNacimiento ? addYears(fechaNacimiento, MAYORIA_EDAD) : null;
  const diasPara18 = fechaCumple18
    ? Math.round((atStartOfDay(fechaCumple18) - atStartOfDay(new Date())) / 86400000)
    : null;
  const estadoMayoriaEdad = childAdultStatus({ edad, diasPara18, fechaCumple18 });

  if (
    !nombre &&
    !rut &&
    (!descripcion || isGenericChildDescription(descripcion)) &&
    edad === null &&
    !fechaNacimiento
  ) {
    return null;
  }

  return {
    id: cleanString(hijo.id) || `hijo-${index + 1}`,
    nombre,
    rut,
    descripcion,
    fechaNacimiento: fechaNacimiento ? fechaNacimiento.toISOString().slice(0, 10) : "",
    edad,
    fechaCumple18: fechaCumple18 ? fechaCumple18.toISOString().slice(0, 10) : "",
    diasPara18,
    estadoMayoriaEdad,
    requiereRevisionDocumental: childNeedsDocumentReview(estadoMayoriaEdad),
  };
}

function isChildColumn(normalized) {
  return ["hijo", "hija", "carga", "dependiente"].some((term) => normalized.includes(term));
}

function childColumnField(normalized) {
  if (normalized.includes("rut") || normalized.includes("run")) return "rut";
  if (normalized.includes("nombre")) return "nombre";
  if (
    normalized.includes("fecnac") ||
    normalized.includes("fechnac") ||
    normalized.includes("fechanacimiento") ||
    normalized.includes("nacimiento") ||
    (normalized.includes("fecha") && normalized.includes("nac"))
  ) {
    return "fechaNacimiento";
  }
  if (normalized.includes("edad")) return "edad";
  if (normalized === "hijo" || normalized === "hija" || normalized === "hijos" || normalized === "hijas") {
    return "descripcion";
  }
  return null;
}

function childColumnIndex(normalized) {
  const number = normalized.match(/\d+/);
  return number ? number[0] : "1";
}

function isGenericChildDescription(value) {
  const text = normalize(value);
  return ["si", "no", "s", "n", "true", "false"].includes(text) || parseDecimal(value) !== null;
}

function childAdultStatus({ edad, diasPara18, fechaCumple18 }) {
  if (fechaCumple18 && diasPara18 !== null) {
    if (diasPara18 < 0) return "cumplio_18";
    if (diasPara18 === 0) return "cumple_hoy";
    if (diasPara18 <= HIJO_PROXIMO_18_DIAS) return "proximo_18";
    return "sin_revision";
  }
  if (edad !== null && edad >= MAYORIA_EDAD) return "cumplio_18";
  if (edad === MAYORIA_EDAD - 1) return "proximo_sin_fecha";
  return "sin_revision";
}

function childNeedsDocumentReview(status) {
  return ["cumplio_18", "cumple_hoy", "proximo_18", "proximo_sin_fecha"].includes(status);
}

function addYears(dateValue, years) {
  const date = new Date(dateValue);
  const result = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
  if (date.getMonth() === 1 && date.getDate() === 29 && result.getMonth() !== 1) {
    return new Date(date.getFullYear() + years, 1, 28);
  }
  return result;
}

function hijosConRevision(persona) {
  return (persona.caracterizacion?.hijos || []).filter((hijo) => hijo.requiereRevisionDocumental);
}

function ensureChildAgeAlerts(alerts, hijos = []) {
  const existing = alerts.some((alerta) => normalize(alerta.titulo).includes("hij") && normalize(alerta.detalle).includes("18"));
  if (existing) return alerts;

  const childAlerts = (hijos || [])
    .filter((hijo) => hijo.requiereRevisionDocumental)
    .map((hijo) => ({
      id: cryptoId(),
      tipo: "documental",
      severidad: "preventiva",
      titulo: "Revisar hijo/a por mayoría de edad",
      detalle: childReviewDetail(hijo),
      activa: true,
      impactaEstado: false,
      fecha: new Date().toISOString(),
    }));

  return [...alerts, ...childAlerts];
}

function childReviewDetail(hijo) {
  const nombre = hijo.nombre || hijo.descripcion || "Hijo/a o carga familiar";
  if (hijo.estadoMayoriaEdad === "cumple_hoy") {
    return `${nombre} cumple 18 años hoy; revisar actualización documental de la postulación.`;
  }
  if (hijo.estadoMayoriaEdad === "proximo_18") {
    return `${nombre} cumple 18 años el ${formatStoredDate(hijo.fechaCumple18)}; revisar documentación antes del cambio.`;
  }
  if (hijo.estadoMayoriaEdad === "proximo_sin_fecha") {
    return `${nombre} registra 17 años sin fecha exacta; revisar fecha de nacimiento y documentación.`;
  }
  return `${nombre} ya registra 18 años o más; revisar actualización documental de la postulación.`;
}

function childStatusLabel(hijo) {
  if (hijo.estadoMayoriaEdad === "cumple_hoy") return "Cumple 18 hoy";
  if (hijo.estadoMayoriaEdad === "proximo_18") return `Cumple 18 en ${hijo.diasPara18} dias`;
  if (hijo.estadoMayoriaEdad === "proximo_sin_fecha") return "17 años, revisar fecha";
  if (hijo.estadoMayoriaEdad === "cumplio_18") return "18 años o más";
  return "Sin revisión";
}

function childReviewSummary(persona) {
  const total = hijosConRevision(persona).length;
  if (!total) return "Sin revisión";
  return total === 1 ? "1 caso" : `${total} casos`;
}

function cedulaSummary(persona) {
  const cedula = (persona.documentos || []).find((doc) => doc.tipo === "cedula");
  if (!cedula) return "Sin dato";
  const estado = cleanString(cedula.estado).replace("_", " ");
  return `${estado}${cedula.fechaVencimiento ? ` - ${formatStoredDate(cedula.fechaVencimiento)}` : ""}`;
}

function renderHijosMayoriaEdad(hijos = []) {
  if (!hijos.length) {
    return `<div style="margin-top: 14px;">${emptyHtml("Sin hijos o cargas familiares informadas")}</div>`;
  }

  return `
    <div style="margin-top: 16px;">
      <h3>Hijos y mayoría de edad</h3>
      <div class="list">
        ${hijos
          .map(
            (hijo) => `
              <div class="list-item">
                <div class="list-item-head">
                  <strong>${escapeHtml(hijo.nombre || hijo.descripcion || "Hijo/a o carga familiar")}</strong>
                  ${hijo.requiereRevisionDocumental ? '<span class="badge preventiva">Revisión doc.</span>' : '<span class="badge vigente">Sin revisión</span>'}
                </div>
                <p class="muted small">
                  ${escapeHtml([
                    hijo.rut ? `RUT ${hijo.rut}` : "",
                    hijo.edad !== null ? `${hijo.edad} años` : "",
                    hijo.fechaNacimiento ? `nac. ${formatStoredDate(hijo.fechaNacimiento)}` : "",
                    hijo.fechaCumple18 ? `18 años: ${formatStoredDate(hijo.fechaCumple18)}` : "",
                    childStatusLabel(hijo),
                  ].filter(Boolean).join(" - "))}
                </p>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderDocuments(documents) {
  if (!documents.length) return emptyHtml("Sin documentos registrados");
  return `
    <div class="list">
      ${documents
        .map(
          (doc) => `
            <div class="list-item">
              <div class="list-item-head">
                <strong>${escapeHtml(doc.tipo)}</strong>
                ${badge(doc.estado)}
              </div>
              <p class="muted small">${escapeHtml(formatStoredDate(doc.fechaVencimiento, "Sin vencimiento"))}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function managementTasks() {
  return state.personas
    .flatMap((persona) => {
      const alertTasks = activeAlerts(persona).map((alerta) => {
        const text = `${alerta.titulo}: ${alerta.detalle || alerta.tipo}`;
        const key = managementTaskKey(persona, "alerta", text);
        const record = gestionRecord(key);
        return {
          key,
          rut: persona.rut,
          nombre: persona.nombre,
          estadoPersona: persona.estadoGeneral,
          prioridad: alertPriority(alerta),
          motivo: alerta.titulo || alerta.tipo,
          falta: alerta.detalle || alerta.tipo,
          origen: "Alerta",
          estadoGestion: record.estado,
          responsable: record.responsable,
          comentario: record.comentario,
          actualizadoEn: record.actualizadoEn,
          orden: alertPriorityOrder(alertPriority(alerta)),
        };
      });
      const observationTasks = (persona.observaciones || [])
        .filter((item) => isActionableObservationText(item.texto))
        .map((item) => {
          const key = managementTaskKey(persona, "observacion", item.texto);
          const record = gestionRecord(key);
          return {
            key,
            rut: persona.rut,
            nombre: persona.nombre,
            estadoPersona: persona.estadoGeneral,
            prioridad: isCriticalObservationText(item.texto) ? "critica" : "interna",
            motivo: "Observación pendiente",
            falta: item.texto,
            origen: "Observación",
            estadoGestion: record.estado,
            responsable: record.responsable,
            comentario: record.comentario,
            actualizadoEn: record.actualizadoEn || item.creadoEn || "",
            orden: isCriticalObservationText(item.texto) ? 0 : 2,
          };
        });
      return [...alertTasks, ...observationTasks];
    })
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es") || a.falta.localeCompare(b.falta, "es"));
}

function filteredManagementTasks(query = "", estado = "abiertos", prioridad = "") {
  const q = normalize(query);
  return managementTasks().filter((task) => {
    const text = [task.nombre, task.rut, task.motivo, task.falta, task.responsable, task.comentario].join(" ");
    const matchQuery = !q || normalize(text).includes(q);
    const matchEstado =
      !estado ||
      (estado === "abiertos" ? task.estadoGestion !== "resuelto" : task.estadoGestion === estado);
    const matchPriority = !prioridad || task.prioridad === prioridad;
    return matchQuery && matchEstado && matchPriority;
  });
}

function managementSummary(tasks = managementTasks()) {
  return {
    total: tasks.length,
    pendiente: tasks.filter((task) => task.estadoGestion === "pendiente").length,
    en_revision: tasks.filter((task) => task.estadoGestion === "en_revision").length,
    resuelto: tasks.filter((task) => task.estadoGestion === "resuelto").length,
  };
}

function alertPriority(alerta) {
  if (!alertAffectsStatus(alerta)) return "interna";
  return alerta.severidad === "critica" ? "critica" : "preventiva";
}

function alertPriorityOrder(priority) {
  if (priority === "critica") return 0;
  if (priority === "preventiva") return 1;
  return 2;
}

function managementTaskKey(persona, source, text) {
  return `${normalize(persona.rut)}|${source}|${normalize(text).slice(0, 120)}`;
}

function gestionRecord(key) {
  state.gestiones = normalizeGestionStore(state.gestiones);
  return state.gestiones[key] || { estado: "pendiente", responsable: "", comentario: "", actualizadoEn: "" };
}

function updateGestionRecord(key, updates) {
  const current = gestionRecord(key);
  state.gestiones[key] = {
    ...current,
    ...updates,
    estado: ["pendiente", "en_revision", "resuelto"].includes(updates.estado || current.estado)
      ? updates.estado || current.estado
      : "pendiente",
    responsable: cleanString(updates.responsable ?? current.responsable),
    comentario: cleanString(updates.comentario ?? current.comentario),
    actualizadoEn: new Date().toISOString(),
  };
  saveState();
}

function isTaskResolved(key) {
  return gestionRecord(key).estado === "resuelto";
}

function isActionableObservationText(text) {
  const value = normalize(text);
  if (!value) return false;
  return (
    isCriticalObservationText(text) ||
    ["revisar", "revision", "actualizar", "corregir", "correccion", "documento", "certificado", "pendiente", "gestionar"].some((token) =>
      value.includes(token)
    )
  );
}

function personFlags(persona) {
  const flags = [];
  if (persona.personaMayor) {
    flags.push('<span class="person-flag elder" title="Persona adulta mayor">60+</span>');
  }
  if (persona.discapacidad) {
    flags.push('<span class="person-flag disability" title="Persona con discapacidad">DIS</span>');
  }
  if (hasEtnia(persona)) {
    flags.push(`<span class="person-flag ethnicity" title="Etnia o pueblo originario: ${escapeAttr(persona.etnia)}">ETN</span>`);
  }
  if (isUnipersonal(persona)) {
    flags.push('<span class="person-flag single" title="Postulación unipersonal">UNI</span>');
  }
  if (!flags.length) return "";
  return `<div class="person-flags">${flags.join("")}</div>`;
}

function reasonDetails(persona) {
  const statusAlerts = statusImpactAlerts(persona);
  const internal = internalAlerts(persona);
  if (!statusAlerts.length && !internal.length) {
    return '<span class="muted small">Sin motivos activos</span>';
  }

  if (!statusAlerts.length) {
    return `
      <details class="reason-details internal">
        <summary>Solo obs. internas</summary>
        ${reasonList(internal)}
      </details>
    `;
  }

  const label = statusAlerts.length === 1 ? "1 motivo" : `${statusAlerts.length} motivos`;
  return `
    <details class="reason-details">
      <summary>${escapeHtml(label)}</summary>
      ${reasonList(statusAlerts)}
      ${internal.length ? `<p class="internal-note">${internal.length} obs. interna${internal.length === 1 ? "" : "s"} adicional${internal.length === 1 ? "" : "es"}</p>` : ""}
    </details>
  `;
}

function activeAlerts(persona) {
  return (persona.alertas || []).filter((alerta) => alerta.activa);
}

function statusImpactAlerts(persona) {
  return activeAlerts(persona).filter(alertAffectsStatus);
}

function internalAlerts(persona) {
  return activeAlerts(persona).filter((alerta) => !alertAffectsStatus(alerta));
}

function reasonList(alerts) {
  return `
    <ul>
      ${alerts
        .map(
          (alerta) => `
            <li>
              <strong>${escapeHtml(alerta.titulo)}</strong>
              <span>${escapeHtml(alerta.detalle || alerta.tipo)}</span>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderAlertList(alerts) {
  if (!alerts.length) return emptyHtml("Sin alertas activas");
  return `
    <div class="list">
      ${alerts
        .map(
          (alerta) => `
            <div class="list-item">
              <div class="list-item-head">
                <strong>${escapeHtml(alerta.titulo)}</strong>
                ${alertAffectsStatus(alerta) ? badge(alerta.severidad) : '<span class="badge interna">Interna</span>'}
              </div>
              <p class="muted small">${escapeHtml(alerta.detalle)}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function simpleTable(columns, rows) {
  if (!rows.length) return emptyHtml();
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function stat(label, value, tone = "", filter = "") {
  const content = `
    <p class="label">${escapeHtml(label)}</p>
    <p class="value">${formatNumber(value)}</p>
    <p class="stat-hint">Ver lista</p>
  `;
  if (filter) {
    return `
      <button class="stat stat-action ${tone}" type="button" data-filter="${escapeAttr(filter)}">
        ${content}
      </button>
    `;
  }
  return `
    <article class="stat ${tone}">
      ${content}
    </article>
  `;
}

function bar(label, value, max) {
  const width = Math.max((value / max) * 100, 4);
  return `
    <div class="bar">
      <div class="bar-head">
        <strong>${escapeHtml(label)}</strong>
        <span>${formatNumber(value)}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
    </div>
  `;
}

function kv(label, value, raw = false) {
  return `
    <div class="kv-item">
      <p class="meta-label">${escapeHtml(label)}</p>
      <p>${raw ? value : escapeHtml(value)}</p>
    </div>
  `;
}

function badge(value) {
  const safe = cleanString(value) || "sin_estado";
  return `<span class="badge ${escapeAttr(safe)}">${escapeHtml(safe.replaceAll("_", " "))}</span>`;
}

function emptyHtml(text = "Sin datos para mostrar") {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function notice(text, type = "") {
  return `<div class="notice ${escapeAttr(type)}">${escapeHtml(text)}</div>`;
}

function setApp(html) {
  document.getElementById("app").innerHTML = html;
}

function exportJson() {
  syncStateToActiveWorkspace();
  const payload = {
    tipo: "consulta-habitacional-ep-workspaces",
    version: 2,
    exportadoEn: new Date().toISOString(),
    activeWorkspaceId: workspaceStore.activeWorkspaceId,
    workspaces: workspaceStore.workspaces,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `consulta-habitacional-comites-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    if (Array.isArray(parsed.workspaces)) {
      importWorkspaceBackup(parsed);
      alert("Espacios de trabajo importados.");
    } else {
      importLegacyBackup(parsed, file.name);
      alert("Base JSON importada en el comité activo.");
    }
    navigate(safeWorkspaceView(currentView));
  } catch {
    alert("El archivo JSON no tiene un formato válido.");
  } finally {
    event.target.value = "";
  }
}

function importWorkspaceBackup(parsed) {
  const incomingStore = normalizeWorkspaceStore(parsed);
  syncStateToActiveWorkspace();
  incomingStore.workspaces.forEach((incoming) => {
    const sameIdIndex = workspaceStore.workspaces.findIndex((workspace) => workspace.id === incoming.id);
    const sameCommitteeIndex = workspaceStore.workspaces.findIndex(
      (workspace) => normalize(workspace.nombre) === normalize(incoming.nombre) && normalize(workspace.comuna) === normalize(incoming.comuna)
    );
    const index = sameIdIndex >= 0 ? sameIdIndex : sameCommitteeIndex;
    if (index >= 0) {
      workspaceStore.workspaces[index] = incoming;
    } else {
      workspaceStore.workspaces.push(incoming);
    }
  });
  if (workspaceStore.workspaces.some((workspace) => workspace.id === incomingStore.activeWorkspaceId)) {
    workspaceStore.activeWorkspaceId = incomingStore.activeWorkspaceId;
  }
  state = getWorkspaceState(getActiveWorkspace());
  saveWorkspaceStore();
}

function importLegacyBackup(parsed, fileName) {
  const imported = normalizeLoadedState({
    personas: Array.isArray(parsed.personas) ? parsed.personas : [],
    importaciones: Array.isArray(parsed.importaciones) ? parsed.importaciones : [],
    gestiones: parsed.gestiones,
    viviendas: parsed.viviendas || parsed.tiposVivienda,
    viviendaFuente: parsed.viviendaFuente,
  });
  const firstPersona = imported.personas[0];
  const workspaceName =
    cleanString(parsed.nombre) ||
    cleanString(parsed.comite?.nombre) ||
    cleanString(firstPersona?.comite?.nombre) ||
    inferCommitteeName(fileName, "Comité importado");
  const comuna = cleanString(parsed.comuna) || cleanString(parsed.comite?.comuna) || cleanString(firstPersona?.comite?.comuna);
  const workspace = ensureWorkspace(workspaceName, comuna, true);
  workspace.personas = imported.personas;
  workspace.importaciones = imported.importaciones;
  workspace.gestiones = imported.gestiones;
  workspace.viviendas = imported.viviendas;
  workspace.viviendaFuente = imported.viviendaFuente;
  state = getWorkspaceState(workspace);
  saveWorkspaceStore();
}

function clearData() {
  const workspace = getActiveWorkspace();
  if (!confirm(`Quieres eliminar los datos del comité "${workspaceDisplayName(workspace)}" en este navegador?`)) return;
  state = { personas: [], importaciones: [], gestiones: {}, viviendas: [], viviendaFuente: null };
  saveState();
  navigate("dashboard");
}

function cleanString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  if (typeof value === "number") return String(value).replace(/\.0$/, "");
  return String(value).trim().replace(/\.0$/, "");
}

function normalize(value) {
  return cleanString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("es-CL");
}

function formatPercent(value) {
  return value === null || value === undefined || value === "" ? "Sin dato" : `${formatNumber(value)}%`;
}

function formatUf(value) {
  return value === null || value === undefined || value === "" ? "Sin dato" : `${formatNumber(value)} UF`;
}

function formatDate(date) {
  const valid = validDate(date);
  if (!valid) return "";
  return `${pad2(valid.getDate())}-${pad2(valid.getMonth() + 1)}-${valid.getFullYear()}`;
}

function formatStoredDate(value, fallback = "Sin dato") {
  const parsed = parseDateValue(value);
  return parsed ? formatDate(parsed) : fallback;
}

function formatDateTime(value) {
  const direct = value instanceof Date ? value : new Date(cleanString(value));
  const parsed = validDate(direct) || parseDateValue(value);
  if (!parsed) return "Sin dato";
  return `${formatDate(parsed)} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}`;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function cryptoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return cleanString(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll(" ", "_");
}
