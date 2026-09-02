import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Digital Electronics | Phone Repair & Spares in Siaya",
    template: "%s | Digital Electronics",
  },
  description:
    "Expert phone repair, laptop solutions, accessories and replacement spares from Digital Electronics in Siaya, Kenya.",
  keywords: ["phone repair Siaya", "laptop repair Siaya", "phone accessories Siaya", "Digital Electronics"],
  openGraph: {
    title: "Digital Electronics | Phone Repair & Spares in Siaya",
    description: "Local device care, done clearly and professionally.",
    type: "website",
    locale: "en_KE",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
