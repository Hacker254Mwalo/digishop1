import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(site.lastUpdated);
  const routes = ["/", "/book", "/track", "/shop", "/contact"];

  return routes.map((route) => ({
    url: `${site.url}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : route === "/book" || route === "/shop" ? 0.9 : 0.7,
  }));
}
