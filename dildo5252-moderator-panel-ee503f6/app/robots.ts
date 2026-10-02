import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Development sends `noindex` via HTTP, so crawlers must be allowed to see it.
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
