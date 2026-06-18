import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { alertContext } = await req.json();

    // Simulamos un tiempo de procesamiento de la Inteligencia Artificial (2.5 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Generamos un plan de acción dinámico (mock) basado en el contexto recibido
    let plan = [];

    if (alertContext?.title?.toLowerCase().includes("estrés") || alertContext?.title?.toLowerCase().includes("exigencias")) {
      plan = [
        {
          step: 1,
          action: "Reunión de Intervención Rápida",
          description: "Programar una sesión de escucha activa con el equipo de " + (alertContext.department || "trabajo") + " para entender las fuentes exactas del estrés."
        },
        {
          step: 2,
          action: "Ajuste Temporal de Cargas",
          description: "Redistribuir las tareas operativas más pesadas durante los próximos 15 días y posponer entregas no críticas."
        },
        {
          step: 3,
          action: "Pausas Activas Obligatorias",
          description: "Implementar un programa de pausas de 10 minutos cada 2 horas y ofrecer acceso a recursos de salud mental (psicólogo laboral)."
        }
      ];
    } else if (alertContext?.title?.toLowerCase().includes("acoso") || alertContext?.title?.toLowerCase().includes("incidencia")) {
      plan = [
        {
          step: 1,
          action: "Activación de Protocolo de Prevención",
          description: "Notificar inmediatamente al Comité de Convivencia y aislar temporalmente a los involucrados si es necesario."
        },
        {
          step: 2,
          action: "Investigación Confidencial",
          description: "Iniciar entrevistas individuales garantizando el anonimato y documentar todas las versiones de los hechos."
        },
        {
          step: 3,
          action: "Capacitación Cero Tolerancia",
          description: "Lanzar un taller obligatorio para toda el área sobre políticas de respeto y canales de denuncia seguros."
        }
      ];
    } else {
      // Plan genérico para otras alertas
      plan = [
        {
          step: 1,
          action: "Diagnóstico de Profundidad",
          description: "Realizar un grupo focal (focus group) para indagar más sobre la métrica anómala detectada en el sistema."
        },
        {
          step: 2,
          action: "Diseño de Solución Participativa",
          description: "Involucrar a los líderes del área para cocrear una estrategia de mejora a corto plazo."
        },
        {
          step: 3,
          action: "Evaluación de Impacto",
          description: "Medir nuevamente el indicador afectado después de 30 días de la intervención."
        }
      ];
    }

    return NextResponse.json({
      success: true,
      message: "Plan generado por IA exitosamente.",
      plan: plan
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error al generar plan con IA" }, { status: 500 });
  }
}
