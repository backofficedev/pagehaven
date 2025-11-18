import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a Convex deployment URL to the HTTP endpoint URL
 * Example: https://adjoining-pheasant-454.convex.cloud -> https://adjoining-pheasant-454.convex.site
 */
export function getConvexHttpUrl(path: string = ""): string {
  const convexUrl = import.meta.env.VITE_CONVEX_URL;
  if (!convexUrl) {
    throw new Error("VITE_CONVEX_URL is not set");
  }
  
  // Convert .convex.cloud to .convex.site for HTTP endpoints
  const httpUrl = convexUrl.replace(".convex.cloud", ".convex.site");
  
  // Remove trailing slash and add path
  const baseUrl = httpUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}
