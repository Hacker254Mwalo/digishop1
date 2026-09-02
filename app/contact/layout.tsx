import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location, Hours & Contact in Siaya",
  description: "Find Digital Electronics in Siaya Town, check opening hours, get directions and contact the repair and spares team.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Location, Hours & Contact in Siaya | Digital Electronics",
    description: "Plan a visit to Digital Electronics for phone repair, laptop support and replacement parts.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
