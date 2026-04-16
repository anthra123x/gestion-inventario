'use server'

import { supabase } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { LoginSchema, RegisterSchema } from '@/lib/validations'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'

export async function login(formData: FormData) {
  // This server action is no longer used for main login
  // Auth is now handled client-side to properly set cookies
  // This is kept for backward compatibility

  const validatedFields = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Campos inválidos',
    }
  }

  const { email } = validatedFields.data

  try {
    // Check if user exists in our database
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return {
        error: 'Usuario no encontrado. Por favor regístrate.',
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      error: 'Error al iniciar sesión',
    }
  }
}

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
      console.log('User created in DB:', email)
    }

    return { success: true }
  } catch (error) {
    console.error('Error ensuring user exists:', error)
    return { error: 'Error al verificar usuario' }
  }
}

export async function register(formData: FormData) {
  // This server action is no longer used for main register
  // Auth is now handled client-side to properly set cookies
  // This is kept for backward compatibility

  const validatedFields = RegisterSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    name: formData.get('name'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Campos inválidos',
    }
  }

  const { email, name } = validatedFields.data

  try {
    // Check if user already exists in our database
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        error: 'El usuario ya existe',
      }
    }

    // Create user in our database
    await prisma.user.create({
      data: {
        email,
        name,
        role: 'EMPLOYEE' as UserRole,
      },
    })

    revalidatePath('/login')
    return {
      success: 'Usuario creado exitosamente. Por favor inicia sesión.',
    }
  } catch (error) {
    console.error('Register error:', error)
    return {
      error: 'Error al registrar usuario',
    }
  }
}

export async function logout() {
  await supabase.auth.signOut()
  revalidatePath('/login')
  redirect('/login')
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Get user from our database to get role
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
    console.error('Error getting current user:', error)
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
  await prisma.user.delete({
    where: { id: userId },
  })

  revalidatePath('/admin')
  return {
    success: 'Usuario eliminado exitosamente',
  }
}

export async function createUserByAdmin(formData: FormData) {
  const email = formData.get('email') as string
  const name = formData.get('name') as string
  const role = formData.get('role') as UserRole

  if (!email || !name || !role) {
    return {
      error: 'Todos los campos son requeridos',
    }
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return {
        error: 'El usuario ya existe',
      }
    }

    // Create user in Supabase Auth with a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          name,
        },
      },
    })

    if (authError) {
      return {
        error: authError.message,
      }
    }

    // Create user in our database with the specified role
    await prisma.user.create({
      data: {
        email,
        name,
        role,
      },
    })

    revalidatePath('/admin')
    return {
      success: `Usuario creado exitosamente. Contraseña temporal: ${tempPassword}`,
    }
  } catch (error) {
    console.error('Create user error:', error)
    return {
      error: 'Error al crear usuario',
    }
  }
}
