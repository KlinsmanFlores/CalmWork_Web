import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializamos el cliente de Supabase pero con la clave de administrador (Service Role Key)
// Esto permite saltarse las reglas de seguridad y crear usuarios sin cerrar la sesión del admin.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'calmwork'
    }
  }
);

export async function POST(request: Request) {
  try {
    const { email, password, department, first_name, last_name } = await request.json();

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: 'Correo, contraseña, nombres y apellidos son obligatorios' }, { status: 400 });
    }

    // 1. Crear el usuario en auth.users (Autenticación de Supabase)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Lo confirmamos automáticamente para que pueda loguearse de inmediato
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (authData.user) {
      // 2. Registrar al usuario en nuestra tabla calmwork.employees
      const { error: dbError } = await supabaseAdmin
        .from('employees')
        .insert([
          { 
            id: authData.user.id, 
            first_name: first_name,
            last_name: last_name,
            email: email,
            department: department || null 
          }
        ]);

      if (dbError) {
        // Si falla al insertar en employees, idealmente deberíamos borrar el usuario en auth
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Error al registrar en la base de datos: ' + dbError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, user: authData.user });
    }

    return NextResponse.json({ error: 'Error desconocido' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
