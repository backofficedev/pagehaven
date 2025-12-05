import { Eye, Globe, Lock, Users } from "lucide-react";

/**
 * Returns the appropriate icon for a site access type.
 */
export function AccessIcon({ accessType }: { accessType?: string }) {
  switch (accessType) {
    case "public":
      return <Globe className="h-4 w-4 text-green-500" />;
    case "password":
      return <Lock className="h-4 w-4 text-yellow-500" />;
    case "private":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "owner_only":
      return <Eye className="h-4 w-4 text-red-500" />;
    default:
      return <Globe className="h-4 w-4 text-muted-foreground" />;
  }
}
