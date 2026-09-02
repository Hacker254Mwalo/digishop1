import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Digital Phone Hub Repair & Electronics",
    short_name: "Digital Phone Hub",
    description: "Phone repair and electronics support in Siaya, with spare parts supplied across Kenya.",
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
