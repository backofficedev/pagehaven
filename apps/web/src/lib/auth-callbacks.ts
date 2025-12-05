import { toast } from "sonner";

type AuthError = {
  error: {
    message?: string;
    statusText?: string;
  };
};

type AuthCallbackOptions = {
  successMessage: string;
  onSuccess: () => void;
  errorFallback?: string;
};

export function createAuthCallbacks(options: AuthCallbackOptions) {
  return {
    onSuccess: () => {
      options.onSuccess();
      toast.success(options.successMessage);
    },
    onError: (error: AuthError) => {
      toast.error(
        error.error.message ||
          error.error.statusText ||
          options.errorFallback ||
          "An error occurred"
      );
    },
  };
}
