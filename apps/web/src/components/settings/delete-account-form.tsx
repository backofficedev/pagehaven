import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/form-field";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { authClient } from "@/lib/auth-client";

export default function DeleteAccountForm() {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      password: "",
      confirmation: false,
      deletePhrase: "",
    },
    validators: {
      onSubmit: z.object({
        password: z.string().min(1, "Password is required"),
        confirmation: z.boolean().refine((val) => val === true, {
          message: "You must confirm the account deletion",
        }),
        deletePhrase: z.string().refine((val) => val === "DELETE MY ACCOUNT", {
          message: "You must type the exact phrase",
        }),
      }),
    },
    onSubmit: async () => {
      setIsDeleting(true);
      try {
        await authClient.deleteUser(
          {},
          {
            onSuccess: () => {
              toast.success("Account deleted successfully");
              navigate({ to: "/" });
            },
            onError: (error) => {
              toast.error(error.error.message || "Failed to delete account");
            },
          }
        );
      } finally {
        setIsDeleting(false);
      }
    },
  });

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive">Delete Account</CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-lg bg-destructive/10 p-4">
            <h4 className="mb-2 font-semibold text-destructive">Warning:</h4>
            <ul className="space-y-1 text-destructive text-sm">
              <li>• All your personal data will be permanently deleted</li>
              <li>• Your sites and associated data will be removed</li>
              <li>• You will lose access to all account features</li>
              <li>• This action cannot be reversed</li>
            </ul>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field name="password">
              {(field) => (
                <FormField
                  errors={field.state.meta.errors}
                  label="Enter your password to confirm"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  type="password"
                  value={field.state.value}
                />
              )}
            </form.Field>

            <div className="space-y-2">
              <form.Field name="deletePhrase">
                {(field) => (
                  <FormField
                    errors={field.state.meta.errors}
                    label="Type 'DELETE MY ACCOUNT' to confirm"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    type="text"
                    value={field.state.value}
                  />
                )}
              </form.Field>
            </div>

            <form.Field name="confirmation">
              {(field) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={field.state.value}
                    id="confirmation"
                    onCheckedChange={(checked) =>
                      field.handleChange(checked as boolean)
                    }
                  />
                  <label
                    className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    htmlFor="confirmation"
                  >
                    I understand that this action is permanent and cannot be
                    undone
                  </label>
                </div>
              )}
            </form.Field>

            <form.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={
                    !state.canSubmit || state.isSubmitting || isDeleting
                  }
                  type="submit"
                  variant="destructive"
                >
                  {isDeleting || state.isSubmitting ? (
                    <Loader />
                  ) : (
                    "Delete My Account"
                  )}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
