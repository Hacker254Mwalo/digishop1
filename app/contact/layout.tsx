import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Location, Hours & Contact in Siaya",
  description: "Find Digital Phone Hub Repair & Electronics in Siaya Town, check opening hours, get directions and contact the repair team.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Phone Repair Location, Hours & Contact in Siaya | Digital Phone Hub Repair & Electronics",
    description: "Plan a visit to Digital Phone Hub Repair & Electronics for phone repair, laptop support and local replacement parts.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
