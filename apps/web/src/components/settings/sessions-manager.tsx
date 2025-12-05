import type { Session } from "better-auth/client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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

type SessionWithInfo = Session & {
  current?: boolean;
  deviceInfo?: {
    userAgent?: string;
    ip?: string;
    location?: string;
  };
};

const MOBILE_REGEX = /Mobile|Android|iPhone|iPad/;
const BROWSER_REGEX = /(Chrome|Firefox|Safari|Edge)\/[\d.]+/;
const OS_REGEX = /(Windows|Mac|Linux|Android|iOS)/;

export default function SessionsManager() {
  const [sessions, setSessions] = useState<SessionWithInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      const result = await authClient.listSessions();
      if (result.data) {
        setSessions(result.data);
      }
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const revokeSession = async (sessionId: string) => {
    setIsRevoking(sessionId);
    try {
      await authClient.revokeSession({ token: sessionId });
      toast.success("Session revoked successfully");
      await loadSessions();
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setIsRevoking(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    const currentSessionToken = sessions.find((s) => s.current)?.token;
    if (!currentSessionToken) {
      return;
    }

    setIsRevoking("all");
    try {
      await Promise.all(
        sessions
          .filter((s) => s.token !== currentSessionToken)
          .map((s) => authClient.revokeSession({ token: s.token }))
      );
      toast.success("All other sessions revoked successfully");
      await loadSessions();
    } catch {
      toast.error("Failed to revoke some sessions");
    } finally {
      setIsRevoking(null);
    }
  };

  const formatDeviceInfo = (userAgent?: string) => {
    if (!userAgent) {
      return "Unknown Device";
    }

    // Simple device detection
    const isMobile = MOBILE_REGEX.test(userAgent);
    const browser = BROWSER_REGEX.exec(userAgent)?.[1] ?? "Unknown Browser";
    const os = OS_REGEX.exec(userAgent)?.[1] ?? "Unknown OS";

    return `${browser} on ${os}${isMobile ? " (Mobile)" : ""}`;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage your active sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Session</CardTitle>
          <CardDescription>
            This is the device you're currently using
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Device:</span>
                <span>
                  {formatDeviceInfo(currentSession.deviceInfo?.userAgent)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Last Active:</span>
                <span>{formatDate(currentSession.expiresAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">IP Address:</span>
                <span>{currentSession.deviceInfo?.ip ?? "Unknown"}</span>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Other Sessions</CardTitle>
          <CardDescription>Active sessions on other devices</CardDescription>
        </CardHeader>
        <CardContent>
          {otherSessions.length === 0 ? (
            <p className="text-muted-foreground">No other active sessions</p>
          ) : (
            <div className="space-y-4">
              {otherSessions.map((session) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4"
                  key={session.token}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {formatDeviceInfo(session.deviceInfo?.userAgent)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Last active: {formatDate(session.expiresAt)}
                    </p>
                    {session.deviceInfo?.ip ? (
                      <p className="text-muted-foreground text-sm">
                        IP: {session.deviceInfo.ip}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    disabled={isRevoking === session.token}
                    onClick={() => revokeSession(session.token)}
                    size="sm"
                    variant="outline"
                  >
                    {isRevoking === session.token ? <Loader /> : "Revoke"}
                  </Button>
                </div>
              ))}

              {otherSessions.length > 0 && (
                <div className="border-t pt-4">
                  <Button
                    className="w-full"
                    disabled={isRevoking === "all"}
                    onClick={revokeAllOtherSessions}
                    variant="destructive"
                  >
                    {isRevoking === "all" ? (
                      <Loader />
                    ) : (
                      "Sign Out All Other Devices"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
