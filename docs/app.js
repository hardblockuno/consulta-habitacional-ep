const STORAGE_KEY = "consultaHabitacionalEP:v1";

const COLUMN_ALIASES = {
  nombre: ["nombre", "nombrecompleto", "postulante", "socio"],
  rut: ["rut", "run"],
  correo: ["correo", "email", "mail"],
  telefono: ["fono", "telefono", "celular", "contacto"],
  direccion: ["direccion", "domicilio"],
  sexo: ["sexo", "genero"],
  estadoCivil: ["estadocivil"],
  nacionalidad: ["nacionalidad", "macionalidad"],
  etnia: ["etnia", "pueblooriginario"],
  fechaNacimiento: ["fecnac", "fechnac", "fechanacimiento", "nacimiento"],
  edad: ["edad"],
  discapacidad: ["discapacidad"],
  neurodivergencia: ["neurodivergencia", "neurodivergente"],
  numeroCuenta: ["ncuenta", "numerocuenta", "cuenta", "libreta"],
  banco: ["banco"],
  rsh: ["rsh", "registrosocial", "tramorhs", "tramo"],
  minvuConecta: ["minvuconecta", "minvu"],
  comuna: ["comuna"],
  parentesco: ["parentesco", "parentezco"],
  tipoFamilia: ["tipofamilia", "familia"],
  integrantes: ["integrantes", "nintegrantes", "grupofamiliar"],
  ahorro: ["ahorro", "saldoahorro", "montoahorro", "ahorrodia", "ahorroal"],
  cedulaVencimiento: [
    "vencimientocedula",
    "cedulavence",
    "fechavencimientocedula",
    "vencimientoci",
    "civence",
  ],
};

let state = loadState();
let currentView = "dashboard";

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalEvents();
  navigate("dashboard");
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
    personas: renderPersonas,
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
  const topComites = topBy(state.personas, (persona) => persona.comite.nombre || "Sin comite");
  const estadoRows = topBy(state.personas, (persona) => persona.estadoGeneral || "apta");
  const maxComite = Math.max(...topComites.map((item) => item.total), 1);
  const maxEstado = Math.max(...estadoRows.map((item) => item.total), 1);

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Panel operativo</div>
        <h2>Dashboard</h2>
      </div>
    </div>
    <section class="grid stats">
      ${stat("Total personas", resumen.totalPersonas)}
      ${stat("Aptas", resumen.personasAptas, "emerald")}
      ${stat("Observadas", resumen.observadas, "amber")}
      ${stat("Bloqueadas", resumen.bloqueadas, "rose")}
      ${stat("Personas mayores", resumen.personasMayores, "cyan")}
      ${stat("Discapacidad", resumen.discapacidad, "indigo")}
      ${stat("RSH sobre 40%", resumen.rshSobre40, "amber")}
      ${stat("Ahorro insuficiente", resumen.ahorroInsuficiente, "rose")}
    </section>
    <section class="grid two" style="margin-top: 18px;">
      <div class="panel">
        <h3>Personas por estado</h3>
        ${estadoRows.length ? estadoRows.map((item) => bar(item.label, item.total, maxEstado)).join("") : emptyHtml()}
      </div>
      <div class="panel">
        <h3>Comites con mas personas</h3>
        ${topComites.length ? topComites.slice(0, 10).map((item) => bar(item.label, item.total, maxComite)).join("") : emptyHtml()}
      </div>
    </section>
  `);
}

function renderPersonas() {
  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Consulta</div>
        <h2>Personas</h2>
      </div>
    </div>
    <section class="card">
      <div class="field-row" style="grid-template-columns: 1fr 220px;">
        <label class="field">
          <span>Buscar</span>
          <input id="searchInput" class="input" placeholder="RUT, nombre, comite o telefono" />
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
      </div>
    </section>
    <section id="personasResult" style="margin-top: 18px;"></section>
  `);

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const update = () => renderPersonasTable(searchInput.value, statusFilter.value);
  searchInput.addEventListener("input", update);
  statusFilter.addEventListener("change", update);
  update();
}

function renderPersonasTable(query = "", estado = "") {
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
      return matchQuery && matchEstado;
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const container = document.getElementById("personasResult");
  if (!rows.length) {
    container.innerHTML = emptyHtml("No hay personas para mostrar");
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Persona</th>
            <th>Comite</th>
            <th>Estado</th>
            <th>RSH</th>
            <th>Ahorro</th>
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
                    <div class="muted small">${escapeHtml(persona.rut)} · ${escapeHtml(persona.telefono || "Sin telefono")}</div>
                  </td>
                  <td>
                    ${escapeHtml(persona.comite.nombre || "Sin comite")}
                    <div class="muted small">${escapeHtml(persona.comite.comuna || "Sin comuna")}</div>
                  </td>
                  <td>${badge(persona.estadoGeneral)}</td>
                  <td>${formatPercent(persona.rsh.porcentaje)}</td>
                  <td>${formatUf(persona.ahorro.montoActual)}</td>
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
        <h2>Importar Excel</h2>
      </div>
    </div>
    <section class="card">
      <form id="excelForm" class="grid">
        <div class="field-row">
          <label class="field">
            <span>Comite</span>
            <input id="comiteNombre" class="input" placeholder="Nombre del comite" />
          </label>
          <label class="field">
            <span>Comuna</span>
            <input id="comuna" class="input" placeholder="Comuna" />
          </label>
          <label class="field">
            <span>Ahorro minimo UF</span>
            <input id="ahorroMinimo" class="input" type="number" value="10" min="0" step="0.01" />
          </label>
          <label class="field">
            <span>Archivo</span>
            <input id="excelFile" class="input" type="file" accept=".xlsx,.xls" />
          </label>
        </div>
        <div id="importMessage"></div>
        <div>
          <button class="button primary" type="submit">Importar Excel</button>
        </div>
      </form>
    </section>
    <section class="panel" style="margin-top: 18px;">
      <h3>Ultimas importaciones</h3>
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
  const ahorroMinimo = Number(document.getElementById("ahorroMinimo").value || 10);

  if (!window.XLSX) {
    message.innerHTML = notice("No se pudo cargar el lector Excel. Revisa tu conexion a internet.", "error");
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
    const result = importWorkbook(workbook, {
      fileName: file.name,
      comiteNombre,
      comuna,
      ahorroMinimo,
    });
    saveState();
    message.innerHTML = notice(
      `Importacion completada: ${formatNumber(result.creados)} creados, ${formatNumber(result.actualizados)} actualizados, ${formatNumber(result.omitidos)} omitidos.`,
      "success"
    );
    renderImportHistory();
  } catch (error) {
    message.innerHTML = notice(error.message || "No fue posible importar el archivo.", "error");
  }
}

function importWorkbook(workbook, options) {
  const sheetName = selectBaseSheet(workbook.SheetNames);
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: true });
  const headerIndex = detectHeaderRow(rows);
  if (headerIndex < 0) {
    throw new Error("No se encontro una fila de encabezados con NOMBRE y RUT.");
  }

  const headers = uniqueHeaders(rows[headerIndex]);
  const columnMap = buildColumnMap(headers);
  if (!columnMap.nombre || !columnMap.rut) {
    throw new Error("Faltan columnas obligatorias: NOMBRE y RUT.");
  }

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
    filas: rows.length - headerIndex - 1,
    ...stats,
  });
  state.importaciones = state.importaciones.slice(0, 20);
  return stats;
}

function rowToPersona(row, headers, columnMap, options) {
  const displacement = detectDisplacement(row, headers, columnMap);
  const value = (field) => {
    const column = columnMap[field];
    if (!column) return "";
    const index = headers.indexOf(column) + displacement;
    return index >= 0 ? row[index] : "";
  };

  const nombre = cleanString(value("nombre"));
  const rut = normalizeRut(value("rut"));
  if (!nombre || !rut || normalize(nombre) === "nombre") return null;

  const fechaNacimiento = parseDateValue(value("fechaNacimiento"));
  const edad = fechaNacimiento ? calculateAge(fechaNacimiento) : parseInteger(value("edad"));
  const rshValue = parseDecimal(value("rsh"));
  const ahorroValue = parseDecimal(value("ahorro"));
  const cedulaVencimiento = parseDateValue(value("cedulaVencimiento"));
  const discapacidad = parseBoolean(value("discapacidad"));
  const neurodivergencia = parseBoolean(value("neurodivergencia"));

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
      integrantes: parseInteger(value("integrantes")),
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
  const add = (tipo, severidad, titulo, detalle) => {
    alerts.push({
      id: cryptoId(),
      tipo,
      severidad,
      titulo,
      detalle,
      activa: true,
      fecha: new Date().toISOString(),
    });
  };

  if (persona.rsh.porcentaje !== null && persona.rsh.porcentaje > 40) {
    add("rsh", "preventiva", "RSH sobre 40%", `Tramo RSH informado: ${persona.rsh.porcentaje}.`);
  }

  if (persona.ahorro.montoActual === null) {
    add("financiera", "preventiva", "Ahorro no informado", "No se encontro monto de ahorro en la fila importada.");
  } else if (persona.ahorro.insuficiente) {
    add(
      "financiera",
      "preventiva",
      "Ahorro insuficiente",
      `Ahorro informado ${persona.ahorro.montoActual}; minimo requerido ${persona.ahorro.minimo}.`
    );
  }

  if (cedulaVencimiento) {
    const today = atStartOfDay(new Date());
    const days = Math.round((atStartOfDay(cedulaVencimiento) - today) / 86400000);
    if (days < 0) {
      add("documental", "critica", "Cedula vencida", `Cedula vencida el ${formatDate(cedulaVencimiento)}.`);
    } else if (days <= 30) {
      add("documental", "preventiva", "Cedula por vencer", `Cedula vence el ${formatDate(cedulaVencimiento)}.`);
    }
  }

  if (persona.discapacidad) {
    add(
      "documental",
      "preventiva",
      "Revisar respaldo discapacidad",
      "La persona registra discapacidad; validar certificado o antecedente."
    );
  }

  return alerts;
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
        <p class="muted">${escapeHtml(persona.rut)} · ${escapeHtml(persona.comite.nombre || "Sin comite")}</p>
      </div>
      <button class="button secondary" id="backToPeople">Volver</button>
    </div>

    <section class="card">
      <div class="list-item-head">
        <div class="kv" style="flex: 1;">
          ${kv("Estado", badge(persona.estadoGeneral), true)}
          ${kv("Edad", persona.edad !== null ? `${persona.edad} anos` : "Sin dato")}
          ${kv("RSH", formatPercent(persona.rsh.porcentaje))}
          ${kv("Ahorro", formatUf(persona.ahorro.montoActual))}
          ${kv("Persona mayor", persona.personaMayor ? "Si" : "No")}
          ${kv("Discapacidad", persona.discapacidad ? "Si" : "No")}
        </div>
      </div>
    </section>

    <section class="grid two" style="margin-top: 18px;">
      <div class="panel">
        <h3>Identificacion</h3>
        <div class="kv">
          ${kv("Telefono", persona.telefono || "Sin dato")}
          ${kv("Correo", persona.correo || "Sin dato")}
          ${kv("Direccion", persona.direccion || "Sin dato")}
          ${kv("Sexo", persona.sexo || "Sin dato")}
          ${kv("Estado civil", persona.estadoCivil || "Sin dato")}
          ${kv("Nacionalidad", persona.nacionalidad || "Sin dato")}
          ${kv("Etnia", persona.etnia || "Sin dato")}
          ${kv("Fecha nac.", persona.fechaNacimiento || "Sin dato")}
          ${kv("Neurodivergencia", persona.neurodivergencia ? "Si" : "No")}
        </div>
      </div>
      <div class="panel">
        <h3>Comite y social</h3>
        <div class="kv">
          ${kv("Comite", persona.comite.nombre || "Sin dato")}
          ${kv("Comuna", persona.comite.comuna || persona.caracterizacion.comuna || "Sin dato")}
          ${kv("Parentesco", persona.caracterizacion.parentesco || "Sin dato")}
          ${kv("Tipo familia", persona.caracterizacion.tipoFamilia || "Sin dato")}
          ${kv("Integrantes", persona.caracterizacion.integrantes ?? "Sin dato")}
          ${kv("MINVU Conecta", formatPercent(persona.postulacion.minvuConecta))}
        </div>
      </div>
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
          <input id="alertSearch" class="input" placeholder="Alerta, persona, RUT o comite" />
        </label>
        <label class="field">
          <span>Severidad</span>
          <select id="alertSeverity" class="select">
            <option value="">Todas</option>
            <option value="critica">Criticas</option>
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
                  <span class="muted small">${escapeHtml(alerta.tipo)}</span>
                  <h3 style="margin: 10px 0 4px;">${escapeHtml(alerta.titulo)}</h3>
                  <p class="muted" style="margin: 0;">${escapeHtml(alerta.detalle)}</p>
                  <p class="small muted">${escapeHtml(alerta.persona.nombre)} · ${escapeHtml(alerta.persona.rut)} · ${escapeHtml(alerta.persona.comite.nombre || "Sin comite")}</p>
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
  const comites = topBy(state.personas, (persona) => persona.comite.nombre || "Sin comite");

  setApp(`
    <div class="page-head">
      <div>
        <div class="eyebrow">Resumen</div>
        <h2>Reportes</h2>
      </div>
    </div>
    <section class="grid stats">
      ${stat("Personas", resumen.totalPersonas)}
      ${stat("Alertas criticas", resumen.alertasCriticas, "rose")}
      ${stat("Cedulas vencidas", resumen.cedulasVencidas, "rose")}
      ${stat("Ahorro insuficiente", resumen.ahorroInsuficiente, "amber")}
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
      <h3>Comites</h3>
      ${simpleTable(["Comite", "Personas"], comites.map((item) => [item.label, item.total]))}
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
    rshSobre40: state.personas.filter((p) => Number(p.rsh.porcentaje) > 40).length,
    ahorroInsuficiente: state.personas.filter((p) => p.ahorro.insuficiente).length,
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
  rows.slice(0, 12).forEach((row, index) => {
    const values = row.map(normalize);
    let score = 0;
    if (values.some((value) => value === "nombre" || value === "nombrecompleto")) score += 3;
    if (values.some((value) => value === "rut" || value === "run")) score += 3;
    if (values.some((value) => ["fono", "telefono", "celular"].includes(value))) score += 1;
    if (values.some((value) => value === "rsh" || value === "registrosocial")) score += 1;
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestScore >= 6 ? bestIndex : -1;
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
    const exclude = ["rut", "fechaNacimiento", "nacionalidad"].includes(field) ? ["conyuge"] : [];
    const column = findColumn(headers, aliases, exclude);
    if (column) map[field] = column;
  });
  return map;
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
  const nombreIndex = headers.indexOf(columnMap.nombre);
  const rutIndex = headers.indexOf(columnMap.rut);
  const nombreValue = row[nombreIndex];
  const rutValue = row[rutIndex];
  const nextRutValue = row[rutIndex + 1];
  if (isOrderNumber(nombreValue) && !looksLikeRut(rutValue) && looksLikeRut(nextRutValue)) {
    return 1;
  }
  return 0;
}

function getGeneralStatus(alerts) {
  if (alerts.some((alerta) => alerta.activa && alerta.severidad === "critica")) return "bloqueada";
  if (alerts.some((alerta) => alerta.activa && alerta.severidad === "preventiva")) return "observada";
  return "apta";
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
                ${badge(alerta.severidad)}
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

function stat(label, value, tone = "") {
  return `
    <article class="stat ${tone}">
      <p class="label">${escapeHtml(label)}</p>
      <p class="value">${formatNumber(value)}</p>
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
    alert("El archivo JSON no tiene un formato valido.");
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
