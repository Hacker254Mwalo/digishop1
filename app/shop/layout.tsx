import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phone Screens, Batteries & Laptop Spares",
  description: "Browse phone screens, charging ports, batteries, laptop spares and accessories from Digital Electronics in Siaya.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Phone Screens, Batteries & Laptop Spares | Digital Electronics",
    description: "Find common replacement parts and accessories, then confirm compatibility and fulfillment with the team.",
    url: "/shop",
  },
};

export default function ShopLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
