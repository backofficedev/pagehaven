import { useForm } from "@tanstack/react-form";
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
import { authClient } from "@/lib/auth-client";
import type { SessionData } from "@/lib/auth-types";

type ProfileFormProps = {
  session: SessionData;
};

export default function ProfileForm({ session }: Readonly<ProfileFormProps>) {
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const profileForm = useForm({
    defaultValues: {
      name: session.user.name || "",
      image: session.user.image || "",
    },
    onSubmit: async ({ value }) => {
      await authClient.updateUser(
        {
          name: value.name,
          image: value.image || undefined,
        },
        {
          onSuccess: () => {
            toast.success("Profile updated successfully");
          },
          onError: (error) => {
            toast.error(error.error.message || "Failed to update profile");
          },
        }
      );
    },
  });

  const emailForm = useForm({
    defaultValues: {
      newEmail: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        newEmail: z.email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    },
    onSubmit: async ({ value }) => {
      setIsChangingEmail(true);
      try {
        await authClient.changeEmail(
          {
            newEmail: value.newEmail,
            callbackURL: "/settings",
          },
          {
            onSuccess: () => {
              toast.success(
                "Email change confirmation sent to your current email"
              );
              emailForm.reset();
            },
            onError: (error) => {
              toast.error(
                error.error.message || "Failed to initiate email change"
              );
            },
          }
        );
      } finally {
        setIsChangingEmail(false);
      }
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              profileForm.handleSubmit();
            }}
          >
            <profileForm.Field name="name">
              {(field) => (
                <FormField
                  errors={field.state.meta.errors}
                  label="Name"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  type="text"
                  value={field.state.value}
                />
              )}
            </profileForm.Field>

            <profileForm.Field name="image">
              {(field) => (
                <FormField
                  errors={field.state.meta.errors}
                  label="Profile Image URL"
                  name={field.name}
                  onBlur={field.handleBlur}
                  onChange={field.handleChange}
                  type="text"
                  value={field.state.value}
                />
              )}
            </profileForm.Field>

            <profileForm.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                  type="submit"
                >
                  {state.isSubmitting ? <Loader /> : "Update Profile"}
                </Button>
              )}
            </profileForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>
            Update your email address. A confirmation will be sent to your
            current email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="font-medium text-sm">Current Email</div>
              <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                {session.user?.email}
              </div>
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                emailForm.handleSubmit();
              }}
            >
              <emailForm.Field name="newEmail">
                {(field) => (
                  <FormField
                    errors={field.state.meta.errors}
                    label="New Email Address"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    type="email"
                    value={field.state.value}
                  />
                )}
              </emailForm.Field>

              <emailForm.Field name="password">
                {(field) => (
                  <FormField
                    errors={field.state.meta.errors}
                    label="Confirm Password"
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={field.handleChange}
                    type="password"
                    value={field.state.value}
                  />
                )}
              </emailForm.Field>

              <emailForm.Subscribe>
                {(state) => (
                  <Button
                    className="w-full"
                    disabled={
                      !state.canSubmit || state.isSubmitting || isChangingEmail
                    }
                    type="submit"
                  >
                    {isChangingEmail || state.isSubmitting ? (
                      <Loader />
                    ) : (
                      "Change Email"
                    )}
                  </Button>
                )}
              </emailForm.Subscribe>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
