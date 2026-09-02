import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Phone or Laptop Repair",
  description: "Create a Digital Phone Hub Repair & Electronics ticket for phone or laptop repair in Siaya, then continue the conversation on WhatsApp.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book Phone Repair or Laptop Support in Siaya | Digital Phone Hub Repair & Electronics",
    description: "Start a clear phone repair or laptop support request at Digital Phone Hub Repair & Electronics in Siaya, Kenya.",
    url: "/book",
  },
};

export default function BookLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
