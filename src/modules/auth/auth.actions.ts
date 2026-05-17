'use server'

import { supabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'

export async function ensureUserExists(email: string, name: string) {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (!existingUser) {
      await prisma.user.create({
        data: {
          email,
          name,
          role: 'EMPLOYEE' as UserRole,
        },
      })
    }

    return { success: true }
  } catch (error: any) {
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
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    })

    if (!dbUser) {
      return null
    }

    return dbUser
  } catch (error) {
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

export async function requireAdmin() {
  const user = await requireAuth()

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return user
}

export async function getUsers() {
  await requireAdmin()
  return await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin()
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/admin')
  return {
    success: 'Rol actualizado exitosamente',
  }
}

export async function deleteUser(userId: string) {
  await requireAdmin()
  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath('/admin')
  return {
    success: 'Usuario eliminado exitosamente',
  }
}

export async function createUserByAdmin(formData: FormData) {
  await requireAdmin()

  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as UserRole

  if (!email || !name || !role) {
    return { error: 'Todos los campos son requeridos' }
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return { error: 'El usuario ya existe' }
    }

    // Crear registro en DB primero
    await prisma.user.create({
      data: { email, name, role },
    })

    // Luego crear auth user en Supabase
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const { error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    })

    if (authError) {
      await prisma.user.delete({ where: { email } }).catch(() => {})
      return { error: authError.message }
    }

    revalidatePath('/admin')
    return {
      success: 'Usuario creado exitosamente. La contraseña temporal se ha generado y debe ser comunicada de forma segura.',
    }
  } catch (error) {
    console.error('createUserByAdmin error:', error)
    return { error: 'Error al crear usuario' }
  }
}
