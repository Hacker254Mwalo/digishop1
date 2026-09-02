import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Electronics",
    short_name: "Digital Electronics",
    description: "Phone repair, laptop support, replacement parts and accessories in Siaya, Kenya.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fc",
    theme_color: "#061632",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
