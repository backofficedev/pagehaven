import { createFileRoute, redirect } from '@tanstack/react-router'
import { signOut } from '../authkit/serverFunctions'

export const Route = createFileRoute('/logout')({
  beforeLoad: async () => {
    const logoutUrl = await signOut()
    throw redirect({ to: logoutUrl as '/' })
  },
})
