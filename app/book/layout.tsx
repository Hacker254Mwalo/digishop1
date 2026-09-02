import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Phone or Laptop Repair",
  description: "Create a Digital Electronics repair ticket for a phone or laptop, then continue the conversation on WhatsApp.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Phone or Laptop Repair | Digital Electronics",
    description: "Start a clear repair request for phone and laptop support in Siaya, Kenya.",
    url: "/book",
  },
};

export default function BookLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
