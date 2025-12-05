import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { z } from "zod";
import { ConnectedFormField } from "@/components/connected-form-field";
import { FormWrapper } from "@/components/form-wrapper";
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

export default function ChangePasswordForm() {
  const form = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    },
    validators: {
      onSubmit: z
        .object({
          currentPassword: z.string().min(1, "Current password is required"),
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
          confirmPassword: z
            .string()
            .min(1, "Please confirm your new password"),
          revokeOtherSessions: z.boolean(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        }),
    },
    onSubmit: async ({ value }) => {
      await authClient.changePassword(
        {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: value.revokeOtherSessions,
        },
        {
          onSuccess: () => {
            toast.success("Password changed successfully");
            form.reset();
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to change password");
          },
        }
      );
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormWrapper onSubmit={form.handleSubmit}>
          <ConnectedFormField
            form={form}
            label="Current Password"
            name="currentPassword"
            type="password"
          />
          <ConnectedFormField
            form={form}
            label="New Password"
            name="newPassword"
            type="password"
          />
          <ConnectedFormField
            form={form}
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
          />

          <form.Field name="revokeOtherSessions">
            {(field) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={field.state.value}
                  id="revokeOtherSessions"
                  onCheckedChange={(checked) =>
                    field.handleChange(checked as boolean)
                  }
                />
                <label
                  className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="revokeOtherSessions"
                >
                  Sign out from all other devices
                </label>
              </div>
            )}
          </form.Field>

          <form.Subscribe>
            {(state) => (
              <Button
                className="w-full"
                disabled={!state.canSubmit || state.isSubmitting}
                type="submit"
              >
                {state.isSubmitting ? <Loader /> : "Change Password"}
              </Button>
            )}
          </form.Subscribe>
        </FormWrapper>
      </CardContent>
    </Card>
  );
}
