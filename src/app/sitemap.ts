import type { MetadataRoute } from "next";

const BASE = "https://recon.sakil.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${BASE}/track`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${BASE}/kills`, lastModified: now, changeFrequency: "hourly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
