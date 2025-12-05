import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type SitePageHeaderProps = {
  siteId: string;
  siteName?: string;
  title: string;
  description: string;
};

/**
 * Shared header component for site subpages (deploy, settings, analytics).
 * Includes back link and page title/description.
 */
export function SitePageHeader({
  siteId,
  siteName,
  title,
  description,
}: Readonly<SitePageHeaderProps>) {
  return (
    <>
      <div className="mb-6">
        <Link
          className="mb-4 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          params={{ siteId }}
          to="/sites/$siteId"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {siteName ?? "Site"}
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="font-bold text-3xl">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </>
  );
}
