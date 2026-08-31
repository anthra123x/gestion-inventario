'use server'

import { supabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { parseError } from '@/lib/errors'

export async function ensureUserExists(email: string, name: string) {
  try {
    await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
      },
    })

    return { success: true }
  } catch (error) {
    return { error: 'Error al verificar usuario' }
  }
}

export async function logout() {
  await supabase.auth.signOut()
  revalidatePath('/login')
  redirect('/login')
}

export async function getCurrentUser() {
  try {
    const { cookies } = await import('next/headers')
    const { createServerClient } = await import('@supabase/ssr')

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: _error,
    } = await supabase.auth.getUser()

    if (_error || !user) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    if (!dbUser) {
      return null
    }

    return dbUser
  } catch (_error) {
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function updatePassword(newPassword: string) {
  await requireAuth()

  try {
    const { cookies } = await import('next/headers')
    const { createServerClient } = await import('@supabase/ssr')

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      return { error: 'No se pudo actualizar la contraseña. Intenta iniciar sesión nuevamente.' }
    }

    return { success: true }
  } catch (_error) {
    return { error: 'Error inesperado al actualizar la contraseña' }
  }
}

export async function getUsers() {
  await requireAuth()
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function deleteUser(userId: string) {
  await requireAuth()
  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath('/admin')
    return {
      success: 'Usuario eliminado exitosamente',
    }
  } catch (error) {
    if (parseError(error).code === 'P2025') {
      return { error: 'Usuario no encontrado' }
    }
    return { error: 'Error al eliminar usuario' }
  }
}

export async function createUserByAdmin(formData: FormData) {
  await requireAuth()

  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const password = formData.get('password') as string | null

  if (!email || !name) {
    return { error: 'Todos los campos son requeridos' }
  }

  if (password && password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  try {
    try {
      await prisma.user.create({
        data: { email, name },
      })
    } catch (error) {
      if (parseError(error).code === 'P2002') {
        return { error: 'El usuario ya existe' }
      }
      throw error
    }

    const finalPassword = password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const { error: authError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError) {
      await prisma.user.delete({ where: { email } }).catch(() => {})
      return { error: authError.message }
    }

    revalidatePath('/admin')

    if (password) {
      return {
        success: 'Usuario creado exitosamente. La contraseña fue asignada.',
      }
    }

    return {
      success: `Usuario creado exitosamente. Contraseña temporal: ${finalPassword}. Comunícala de forma segura.`,
    }
  } catch (error) {
    console.error('createUserByAdmin error:', error)
    return { error: 'Error al crear usuario' }
  }
}
