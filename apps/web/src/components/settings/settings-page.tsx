type SessionData = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

import ChangePasswordForm from "@/components/settings/change-password-form";
import DeleteAccountForm from "@/components/settings/delete-account-form";
import ProfileForm from "@/components/settings/profile-form";
import SessionsManager from "@/components/settings/sessions-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SettingsPageProps = {
  session: SessionData;
};

export default function SettingsPage({ session }: Readonly<SettingsPageProps>) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, security, and account preferences
        </p>
      </div>

      <Tabs className="space-y-6" defaultValue="profile">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm session={session} />
        </TabsContent>

        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsManager />
        </TabsContent>

        <TabsContent value="danger">
          <DeleteAccountForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
