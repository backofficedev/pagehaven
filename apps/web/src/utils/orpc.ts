import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createClient, createLink } from "@pagehaven/client";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const link = createLink({
  baseUrl: import.meta.env.VITE_SERVER_URL,
  credentials: "include",
});

export const client = createClient({
  baseUrl: import.meta.env.VITE_SERVER_URL,
  credentials: "include",
});

export const orpc = createTanstackQueryUtils(client);
