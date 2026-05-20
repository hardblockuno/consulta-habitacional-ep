import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, money, percent } from "../api/client.js";
import Section from "../components/Section.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";

export default function PersonaDetail() {
  const { id } = useParams();
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/personas/${id}/`)
      .then((response) => setPersona(response.data))
      .catch(() => setError("No fue posible cargar la ficha."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState label="Cargando ficha" />;
  if (error) return <ErrorState message={error} />;
  if (!persona) return <EmptyState label="Persona no encontrada" />;

  return (
    <div className="space-y-5">
      <Link to="/personas" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-800 hover:text-cyan-950">
        <ArrowLeft size={18} />
        Volver
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-700">Ficha persona</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-950">{persona.nombre}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{persona.rut}</span>
              <span>{persona.comite?.nombre}</span>
              <span>{persona.comite?.comuna || "Sin comuna"}</span>
            </div>
          </div>
          <StatusBadge value={persona.estado_general} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Edad" value={persona.edad ? `${persona.edad} años` : "Sin dato"} />
          <Info label="RSH" value={percent(persona.rsh?.porcentaje)} />
          <Info label="Ahorro" value={money(persona.ahorro?.monto_actual)} />
          <Info label="Alertas" value={(persona.alertas || []).filter((item) => item.activa).length} />
          <Info label="Criterios excepción" value={exceptionCriteriaLabel(persona)} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Identificación">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Teléfono" value={persona.telefono || "Sin dato"} icon={Phone} />
            <Info label="Correo" value={persona.correo || "Sin dato"} icon={Mail} />
            <Info label="Dirección" value={persona.direccion || "Sin dato"} />
            <Info label="Sexo" value={persona.sexo || "Sin dato"} />
            <Info label="Estado civil" value={persona.estado_civil || "Sin dato"} />
            <Info label="Nacionalidad" value={persona.nacionalidad || "Sin dato"} />
            <Info label="Etnia / pueblo originario" value={hasEtnia(persona) ? persona.etnia : "Sin dato"} />
            <Info label="Fecha nacimiento" value={persona.fecha_nacimiento || "Sin dato"} />
          </div>
        </Section>

        <Section title="Caracterización social">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Info label="Persona mayor" value={persona.persona_mayor ? "Sí" : "No"} />
            <Info label="Discapacidad" value={persona.discapacidad ? "Sí" : "No"} />
            <Info label="Neurodivergencia" value={persona.neurodivergencia ? "Sí" : "No"} />
            <Info label="Postulación" value={persona.postulacion_unipersonal ? "Unipersonal" : "Grupo familiar"} />
            <Info label="Criterios excepción" value={exceptionCriteriaLabel(persona)} />
            <Info label="Comuna" value={persona.caracterizacion_social?.comuna || "Sin dato"} />
            <Info label="Parentesco" value={persona.caracterizacion_social?.parentesco || "Sin dato"} />
            <Info label="Tipo familia" value={persona.caracterizacion_social?.tipo_familia || "Sin dato"} />
            <Info
              label="Grupo familiar"
              value={
                persona.caracterizacion_social?.grupo_familiar ||
                persona.caracterizacion_social?.integrantes ||
                "Sin dato"
              }
            />
            <Info label="Integrantes" value={persona.caracterizacion_social?.integrantes ?? "Sin dato"} />
          </div>
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Section title="RSH">
          <div className="space-y-3 text-sm">
            <Info label="Porcentaje" value={percent(persona.rsh?.porcentaje)} />
          <Info label="Preferente" value={persona.rsh?.es_preferente ? "Sí" : "No"} />
            <Info label="Fuente" value={persona.rsh?.fuente || "Sin dato"} />
          </div>
        </Section>
        <Section title="Ahorro">
          <div className="space-y-3 text-sm">
            <Info label="Monto" value={money(persona.ahorro?.monto_actual)} />
            <Info label="Referencia" value={money(persona.ahorro?.ahorro_minimo)} />
            <Info label="Banco" value={persona.ahorro?.banco || "Sin dato"} />
            <Info label="Cuenta" value={persona.ahorro?.numero_cuenta || "Sin dato"} />
          </div>
        </Section>
        <Section title="Postulación">
          <div className="space-y-3 text-sm">
            <Info label="Programa" value={persona.postulacion?.programa || "Sin dato"} />
            <Info label="Estado" value={persona.postulacion?.estado || "Sin dato"} />
            <Info label="MINVU Conecta" value={percent(persona.postulacion?.minvu_conecta)} />
          </div>
        </Section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Documentos">
          {persona.documentos?.length ? (
            <div className="space-y-3">
              {persona.documentos.map((doc) => (
                <Row key={doc.id} title={doc.tipo_display} aside={<StatusBadge value={doc.estado} />}>
                  {doc.fecha_vencimiento || "Sin vencimiento"}
                </Row>
              ))}
            </div>
          ) : (
            <EmptyState label="Sin documentos registrados" />
          )}
        </Section>

        <Section title="Alertas">
          {persona.alertas?.length ? (
            <div className="space-y-3">
              {persona.alertas.map((alerta) => (
                <Row key={alerta.id} title={alerta.titulo} aside={<StatusBadge value={alerta.severidad} />}>
                  {alerta.detalle}
                </Row>
              ))}
            </div>
          ) : (
            <EmptyState label="Sin alertas activas" />
          )}
        </Section>
      </div>

      <Section title="Hijos y mayoría de edad">
        {persona.caracterizacion_social?.hijos?.length ? (
          <div className="space-y-3">
            {persona.caracterizacion_social.hijos.map((hijo) => (
              <Row
                key={hijo.id}
                title={hijo.nombre || hijo.descripcion || "Hijo/a o carga familiar"}
                aside={
                  <StatusBadge
                    value={hijo.requiere_revision_documental ? "preventiva" : "vigente"}
                  />
                }
              >
                {[
                  hijo.rut ? `RUT ${hijo.rut}` : "",
                  hijo.edad !== null && hijo.edad !== undefined ? `${hijo.edad} años` : "",
                  hijo.fecha_nacimiento ? `nac. ${hijo.fecha_nacimiento}` : "",
                  hijo.fecha_cumple_18 ? `18 años: ${hijo.fecha_cumple_18}` : "",
                  childStatusLabel(hijo),
                ].filter(Boolean).join(" - ")}
              </Row>
            ))}
          </div>
        ) : (
          <EmptyState label="Sin hijos o cargas familiares informadas" />
        )}
      </Section>

      <Section title="Observaciones">
        {persona.observaciones?.length ? (
          <div className="space-y-3">
            {persona.observaciones.map((observacion) => (
              <Row key={observacion.id} title={observacion.autor || "Observación"}>
                {observacion.texto}
              </Row>
            ))}
          </div>
        ) : (
          <EmptyState label="Sin observaciones registradas" />
        )}
      </Section>
    </div>
  );
}

function childStatusLabel(hijo) {
  if (hijo.estado_mayoria_edad === "cumple_hoy") return "Cumple 18 hoy";
  if (hijo.estado_mayoria_edad === "proximo_18") return `Cumple 18 en ${hijo.dias_para_18} días`;
  if (hijo.estado_mayoria_edad === "proximo_sin_fecha") return "17 años, revisar fecha";
  if (hijo.estado_mayoria_edad === "cumplio_18") return "18 años o más";
  return "Sin revisión";
}

function hasEtnia(persona) {
  const text = String(persona.etnia || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return Boolean(
    text &&
      ![
        "no",
        "n",
        "ninguna",
        "ninguno",
        "sin dato",
        "sindato",
        "no aplica",
        "noaplica",
        "no informado",
        "noinformado",
        "no informada",
        "noinformada",
      ].includes(text)
  );
}

function exceptionCriteriaLabel(persona) {
  const criterios = [];
  if (persona.persona_mayor) criterios.push("Adulto mayor");
  if (hasEtnia(persona)) criterios.push("Etnia / pueblo originario");
  return criterios.length ? criterios.join(", ") : "Sin criterio informado";
}

function Info({ label, value, icon: Icon }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500">
        {Icon ? <Icon size={14} /> : null}
        {label}
      </p>
      <p className="mt-1 break-words font-medium text-slate-950">{value}</p>
    </div>
  );
}

function Row({ title, aside, children }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-950">{title}</p>
        {aside}
      </div>
      <p className="mt-1 text-sm text-slate-600">{children}</p>
    </div>
  );
}
