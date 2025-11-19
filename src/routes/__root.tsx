import { Outlet, createRootRoute } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <Toaster />
            <TanStackRouterDevtools />
        </>
    ),
});
