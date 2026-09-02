import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Repair Ticket",
  description: "Check the latest stage of your Digital Electronics phone or laptop repair using your DE ticket number.",
  alternates: { canonical: "/track" },
  openGraph: {
    title: "Track Your Repair Ticket | Digital Electronics",
    description: "Follow your repair from received to diagnostics, repair in progress and ready for pickup.",
    url: "/track",
  },
};

export default function TrackLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
