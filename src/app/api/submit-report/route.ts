import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    db: {
      schema: 'calmwork'
    }
  }
);

export async function POST(request: Request) {
  try {
    const { module_title, answers } = await request.json();

    if (!module_title || !answers) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // 1. Buscar o crear el módulo
    let { data: modules } = await supabaseAdmin
      .from('modules')
      .select('id')
      .eq('title', module_title);

    let moduleId;
    if (!modules || modules.length === 0) {
      // Create new module
      const { data: newModule, error: moduleError } = await supabaseAdmin
        .from('modules')
        .insert([{ title: module_title, icon_name: 'AlertTriangle', color_hex: '#e2e8f0' }])
        .select('id')
        .single();
      
      if (moduleError) throw new Error('Error al crear módulo: ' + moduleError.message);
      moduleId = newModule.id;
    } else {
      moduleId = modules[0].id;
    }

    // 2. Crear el reporte anónimo
    const { data: newReport, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert([{ module_id: moduleId, status: 'new' }])
      .select('id')
      .single();

    if (reportError) throw new Error('Error al crear reporte: ' + reportError.message);

    // 3. Buscar o crear una pregunta base para el módulo (ya que question_id es obligatorio en report_answers)
    let { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id')
      .eq('module_id', moduleId)
      .eq('question_type', 'text')
      .limit(1);

    let questionId;
    if (!questions || questions.length === 0) {
      const { data: newQuestion, error: qError } = await supabaseAdmin
        .from('questions')
        .insert([{ 
          module_id: moduleId, 
          question_text: 'Respuestas Consolidadas del Formulario',
          question_type: 'text'
        }])
        .select('id')
        .single();
      if (qError) throw new Error('Error al crear pregunta base: ' + qError.message);
      questionId = newQuestion.id;
    } else {
      questionId = questions[0].id;
    }

    // 4. Guardar las respuestas
    const { error: answerError } = await supabaseAdmin
      .from('report_answers')
      .insert([{
        report_id: newReport.id,
        question_id: questionId,
        selected_options: answers
      }]);

    if (answerError) throw new Error('Error al guardar respuestas: ' + answerError.message);

    return NextResponse.json({ success: true, report_id: newReport.id });

  } catch (err: any) {
    console.error('Error in submit-report:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
