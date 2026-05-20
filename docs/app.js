const STORAGE_KEY = "consultaHabitacionalEP:v1";
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
};

let state = normalizeLoadedState(loadState());
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
let currentView = "dashboard";
let pendingManualImport = null;

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
    };
  } catch {
    return { personas: [], importaciones: [] };
  }
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
      .filter((alerta) => !isCedulaAlert(alerta))
      .map(normalizeAlert);
    const alertas = ensureChildAgeAlerts([...createCedulaAlerts(cedulaVencimiento), ...alertasBase], caracterizacion.hijos);
    if (
      !cleanString(caracterizacion.grupoFamiliar) &&
      caracterizacion.integrantes !== null &&
      caracterizacion.integrantes !== undefined
    ) {
      caracterizacion.grupoFamiliar = cleanString(caracterizacion.integrantes);
    }
    return {
      ...persona,
      caracterizacion,
      documentos,
      alertas,
      estadoGeneral: getGeneralStatus(alertas),
    };
  });
  return { ...data, personas };
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

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateStorageSummary();
}

function updateStorageSummary() {
  const count = state.personas.length;
  document.getElementById("storageSummary").textContent =
    `${formatNumber(count)} ${count === 1 ? "persona guardada" : "personas guardadas"}`;
}

function renderDashboard() {
  const resumen = getResumen();

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Panel operativo</div>
        <h2>Dashboard</h2>
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
  `);

  document.querySelectorAll(".stat-action").forEach((card) => {
    card.addEventListener("click", () => navigate("personas", { filtro: card.dataset.filter || "total" }));
  });
}

function renderPersonas(params = {}) {
  const initialFilter = params.filtro || "";
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Consulta rápida</div>
        <h2>Buscar persona</h2>
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
  if (window.matchMedia("(min-width: 700px)").matches) {
    searchInput.focus();
  }
  update();
}

function renderPersonasTable(query = "", estado = "", filtroRapido = "") {
  const q = normalize(query);
  const rows = state.personas
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
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Carga de datos</div>
        <h2>Cargar base</h2>
      </div>
    </div>
    <section class="card">
      <form id="excelForm" class="grid">
        <div class="field-row">
          <label class="field">
            <span>Comité</span>
            <input id="comiteNombre" class="input" placeholder="Nombre del comité" />
          </label>
          <label class="field">
            <span>Comuna</span>
            <input id="comuna" class="input" placeholder="Comuna" />
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
      <h3>Últimas importaciones</h3>
      <div id="importHistory"></div>
    </section>
  `);

  document.getElementById("excelForm").addEventListener("submit", handleExcelImport);
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
    const options = {
      fileName: file.name,
      comiteNombre,
      comuna,
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
  const stats = { creados: 0, actualizados: 0, omitidos: 0, errores: [] };
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
        Object.assign(existing.get(persona.rut), persona);
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
  message.innerHTML = notice(
    `Base cargada: ${formatNumber(result.creados)} creados, ${formatNumber(result.actualizados)} actualizados, ${formatNumber(result.omitidos)} omitidos.`,
    "success"
  );
  const panel = document.getElementById("manualImportPanel");
  if (panel) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
  pendingManualImport = null;
  renderImportHistory();
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
          ${kv("Postulación", isUnipersonal(persona) ? "Unipersonal" : "Grupo familiar")}
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
          ${kv("Fecha nac.", persona.fechaNacimiento || "Sin dato")}
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
          ${kv("Postulación", isUnipersonal(persona) ? "Unipersonal" : "Grupo familiar")}
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

function renderReportes() {
  const resumen = getResumen();
  const docs = countDocuments();
  const alertas = countAlerts();
  const comites = topBy(state.personas, (persona) => persona.comite.nombre || "Sin comité");

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Resumen</div>
        <h2>Reportes</h2>
      </div>
    </div>
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
      <h3>Comités</h3>
      ${simpleTable(["Comité", "Personas"], comites.map((item) => [item.label, item.total]))}
    </section>
  `);
}

function renderImportHistory() {
  const container = document.getElementById("importHistory");
  if (!container) return;
  if (!state.importaciones.length) {
    container.innerHTML = emptyHtml("Sin importaciones registradas");
    return;
  }
  container.innerHTML = simpleTable(
    ["Archivo", "Hoja", "Fecha", "Creados", "Actualizados", "Omitidos"],
    state.importaciones.map((item) => [
      item.archivo,
      item.hoja,
      new Date(item.fecha).toLocaleString("es-CL"),
      item.creados,
      item.actualizados,
      item.omitidos,
    ])
  );
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
    return `${nombre} cumple 18 años el ${hijo.fechaCumple18}; revisar documentación antes del cambio.`;
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
  return `${estado}${cedula.fechaVencimiento ? ` - ${cedula.fechaVencimiento}` : ""}`;
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
                    hijo.fechaNacimiento ? `nac. ${hijo.fechaNacimiento}` : "",
                    hijo.fechaCumple18 ? `18 años: ${hijo.fechaCumple18}` : "",
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
              <p class="muted small">${escapeHtml(doc.fechaVencimiento || "Sin vencimiento")}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
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
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `consulta-habitacional-${new Date().toISOString().slice(0, 10)}.json`;
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
    state = {
      personas: Array.isArray(parsed.personas) ? parsed.personas : [],
      importaciones: Array.isArray(parsed.importaciones) ? parsed.importaciones : [],
    };
    saveState();
    navigate(currentView);
  } catch {
    alert("El archivo JSON no tiene un formato válido.");
  } finally {
    event.target.value = "";
  }
}

function clearData() {
  if (!confirm("Quieres eliminar los datos guardados en este navegador?")) return;
  state = { personas: [], importaciones: [] };
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
  return date.toISOString().slice(0, 10);
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
