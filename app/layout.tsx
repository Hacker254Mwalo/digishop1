import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Digital Electronics | Phone & Laptop Repair in Siaya",
    template: "%s | Digital Electronics",
  },
  description:
    "Digital Electronics provides phone repair, laptop support, replacement screens, batteries, charging parts and accessories in Siaya, Kenya.",
  keywords: [
    "phone repair Siaya",
    "laptop repair Siaya",
    "phone screen replacement Siaya",
    "phone accessories Siaya",
    "laptop spares Kenya",
    "Digital Electronics Siaya",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Digital Electronics | Phone & Laptop Repair in Siaya",
    description: "Repair, replacement parts and device support with a clearer digital experience.",
    url: site.url,
    siteName: "Digital Electronics",
    type: "website",
    locale: "en_KE",
    images: [
      {
        url: "/images/digital-electronics-exterior-sign.jpg",
        width: 1400,
        height: 591,
        alt: "Digital Electronics exterior sign in Siaya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Electronics | Phone & Laptop Repair in Siaya",
    description: "Repair, parts and device support from Digital Electronics in Siaya, Kenya.",
    images: ["/images/digital-electronics-exterior-sign.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const businessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": `${site.url}/#business`,
  name: site.name,
  url: site.url,
  image: `${site.url}/images/digital-electronics-exterior-sign.jpg`,
  description: site.tagline,
  telephone: site.phoneDisplay,
  priceRange: "KES 850 – KES 5,200",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Siaya Town",
    addressLocality: "Siaya",
    addressRegion: "Siaya County",
    addressCountry: "KE",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:30",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "08:30",
      closes: "17:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Siaya" },
    { "@type": "Country", name: "Kenya" },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Device repair, laptop support and replacement spares",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Phone repair" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Laptop repair and support" } },
      { "@type": "Offer", itemOffered: { "@type": "Product", name: "Phone screens, batteries and charging parts" } },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }} />
      </body>
    </html>
  );
}
