import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { getAuth, getSignInUrl } from '../authkit/serverFunctions'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    const { user } = await getAuth()

    if (!user) {
      const signInUrl = await getSignInUrl({ returnPathname: location.pathname })
      throw redirect({ to: signInUrl as '/' })
    }

    return { user }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}
