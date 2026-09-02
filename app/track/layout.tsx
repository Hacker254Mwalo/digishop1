import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Repair Ticket",
  description: "Check the latest stage of your Digital Phone Hub Repair & Electronics phone or laptop repair using your DPH ticket number.",
  alternates: { canonical: "/track" },
  openGraph: {
    title: "Track Your Repair Ticket | Digital Phone Hub Repair & Electronics",
    description: "Follow your repair from received to diagnostics, repair in progress and ready for pickup.",
    url: "/track",
  },
};

export default function TrackLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
