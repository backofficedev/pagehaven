import { createServerFn } from '@tanstack/react-start'
import { withAuth, getAuthorizationUrl, terminateSession } from './ssr/session'
import { upsertUserByWorkOsId } from '../db/queries'
import type { User } from '@workos-inc/node'

/**
 * Gets the sign-in URL for authentication
 */
export const getSignInUrl = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { returnPathname?: string } }) => {
    return getAuthorizationUrl({
      returnPathname: data?.returnPathname,
      screenHint: 'sign-in',
    })
  }
)

/**
 * Gets the sign-up URL for registration
 */
export const getSignUpUrl = createServerFn({ method: 'GET' }).handler(
  async ({ data }: { data?: { returnPathname?: string } }) => {
    return getAuthorizationUrl({
      returnPathname: data?.returnPathname,
      screenHint: 'sign-up',
    })
  }
)

/**
 * Signs out the current user
 */
export const signOut = createServerFn({ method: 'POST' }).handler(
  async ({ data }: { data?: { returnPathname?: string } }) => {
    const logoutUrl = await terminateSession()
    return logoutUrl
  }
)

/**
 * Gets the current authenticated user with their database record
 */
export const getAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const authResult = await withAuth()

  if (!authResult) {
    return { user: null }
  }

  // Get or create the user in our database
  const dbUser = await upsertUserByWorkOsId({
    workosUserId: authResult.user.id,
    email: authResult.user.email,
    name: `${authResult.user.firstName ?? ''} ${authResult.user.lastName ?? ''}`.trim() || null,
  })

  return {
    user: {
      id: dbUser.id,
      workosUserId: dbUser.workosUserId,
      email: dbUser.email,
      name: dbUser.name,
      createdAt: dbUser.createdAt,
      workosUser: authResult.user,
    },
  }
})

export type AuthUser = Awaited<ReturnType<typeof getAuth>>['user']
