import { useEffect } from "react";
import { useLocation } from "wouter";

const SITE_URL = "https://digitalelectronics.tech";
const BUSINESS_ID = `${SITE_URL}/#business`;

type SeoConfig = {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots: string;
  type: "website" | "service";
  jsonLd?: Record<string, unknown>;
};

const businessSchema = {
  "@type": "MobilePhoneStore",
  "@id": BUSINESS_ID,
  name: "Digital Phone Hub",
  url: SITE_URL,
  telephone: "+254718114009",
  image: `${SITE_URL}/brand/dph-storefront-sign-wide.webp`,
  logo: `${SITE_URL}/brand/icon.svg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Siaya",
    addressRegion: "Siaya County",
    addressCountry: "KE",
  },
  areaServed: [
    { "@type": "City", name: "Siaya" },
    { "@type": "Country", name: "Kenya" },
  ],
  openingHoursSpecification: [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "08:00",
    closes: "18:00",
  }],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+254718114009",
    contactType: "customer service",
    areaServed: "KE",
    availableLanguage: ["en"],
  },
};

const configs: Record<string, SeoConfig> = {
  "/": {
    title: "Phone Repair in Siaya Town | Digital Phone Hub",
    description: "Need phone repair in Siaya Town? Digital Phone Hub checks screen, battery and charging faults first, with laptop service and compatible parts too.",
    keywords: "phone repair Siaya, laptop repair Siaya, phone parts Kenya, Digital Phone Hub",
    canonical: `${SITE_URL}/`,
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    type: "website",
  },
  "/repair": {
    title: "Phone & Laptop Repair in Siaya | Digital Phone Hub",
    description: "Request phone, laptop or electronics repair in Siaya. Share the brand, model and symptoms. We review the fault and confirm the next step before work.",
    keywords: "phone repair Siaya, laptop repair Siaya, electronics repair Siaya, Digital Phone Hub",
    canonical: `${SITE_URL}/repair`,
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    type: "service",
  },
  "/spares": {
    title: "Phone Parts & Accessories Siaya | Digital Phone Hub",
    description: "Find phone screens, batteries, chargers, cables and laptop parts. Digital Phone Hub helps check device compatibility before you request an item.",
    keywords: "phone parts Siaya, phone accessories Kenya, laptop parts Kenya, Digital Phone Hub",
    canonical: `${SITE_URL}/spares`,
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    type: "website",
  },
  "/phone-repair-siaya": {
    title: "Phone Repair Siaya | Digital Phone Hub",
    description: "Need phone repair in Siaya? Get help with cracked screens, weak batteries, charging faults and software problems, with clear advice before work begins.",
    keywords: "phone repair Siaya, screen replacement Siaya, battery replacement Siaya, Digital Phone Hub",
    canonical: `${SITE_URL}/phone-repair-siaya`,
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    type: "service",
  },
  "/repair-status": {
    title: "Track Your Phone Repair | Digital Phone Hub",
    description: "Check the progress of your Digital Phone Hub repair using your repair reference.",
    keywords: "repair tracking, phone repair Siaya, Digital Phone Hub",
    canonical: "",
    robots: "noindex,nofollow",
    type: "website",
  },
  "/order-status": {
    title: "Track an Item Request | Digital Phone Hub",
    description: "Check your Digital Phone Hub order request and M-PESA payment state using its guest reference.",
    keywords: "Digital Phone Hub order status, Siaya M-PESA",
    canonical: "",
    robots: "noindex,nofollow",
    type: "website",
  },
  "/owner-login": {
    title: "Owner Login | Digital Phone Hub",
    description: "Private Digital Phone Hub owner access.",
    keywords: "Digital Phone Hub, owner login, business portal",
    canonical: `${SITE_URL}/owner-login`,
    robots: "noindex,nofollow",
    type: "website",
  },
  "/admin": {
    title: "Owner Portal | Digital Phone Hub",
    description: "Private Digital Phone Hub owner portal.",
    keywords: "Digital Phone Hub, owner portal, business login",
    canonical: `${SITE_URL}/admin`,
    robots: "noindex,nofollow",
    type: "website",
  },
};

function getConfig(pathname: string): SeoConfig {
  return configs[pathname] ?? {
    title: "Page not found | Digital Phone Hub",
    description: "This page is not available. Visit Digital Phone Hub's repair and parts pages or call the Siaya service desk.",
    keywords: "Digital Phone Hub, Siaya repair, page not found",
    canonical: "",
    robots: "noindex,nofollow",
    type: "website",
  };
}

function upsertMeta(selector: string, attributes: Record<string, string>, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!href) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export default function SeoHead() {
  const [location] = useLocation();

  useEffect(() => {
    const pathname = location.split("?")[0] || "/";
    const config = getConfig(pathname);
    document.title = config.title;
    upsertMeta('meta[name="description"]', { name: "description" }, config.description);
    upsertMeta('meta[name="keywords"]', { name: "keywords" }, config.keywords);
    upsertMeta('meta[name="robots"]', { name: "robots" }, config.robots);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, config.title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, config.description);
    upsertMeta('meta[property="og:type"]', { property: "og:type" }, config.type === "service" ? "website" : config.type);
    if (config.canonical) upsertMeta('meta[property="og:url"]', { property: "og:url" }, config.canonical);
    else document.head.querySelector('meta[property="og:url"]')?.remove();
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name" }, "Digital Phone Hub");
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, `${SITE_URL}/brand/dph-storefront-sign-wide.webp`);
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, config.title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, config.description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, `${SITE_URL}/brand/dph-storefront-sign-wide.webp`);
    upsertLink("canonical", config.canonical);

    const graph: Array<Record<string, unknown>> = [
      { "@context": "https://schema.org", ...businessSchema },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Digital Phone Hub",
        publisher: { "@id": BUSINESS_ID },
        inLanguage: "en-KE",
      },
    ];
    if (config.type === "service") {
      const isSiayaPhoneRepair = location.split("?")[0] === "/phone-repair-siaya";
      graph.push({
        "@type": "Service",
        "@id": `${SITE_URL}${isSiayaPhoneRepair ? "/phone-repair-siaya" : "/repair"}#service`,
        name: isSiayaPhoneRepair ? "Phone repair in Siaya" : "Phone, laptop and electronics repair",
        serviceType: isSiayaPhoneRepair ? "Phone screen, battery, charging and software repair" : "Device repair and diagnostics",
        provider: { "@id": BUSINESS_ID },
        areaServed: [{ "@type": "City", name: "Siaya" }, { "@type": "Country", name: "Kenya" }],
        url: `${SITE_URL}${isSiayaPhoneRepair ? "/phone-repair-siaya" : "/repair"}`,
      });
    }
    if (location.split("?")[0] === "/spares") {
      graph.push({
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/spares#catalogue`,
        name: "Phone parts, laptops and electronics catalogue",
        url: `${SITE_URL}/spares`,
        about: { "@id": BUSINESS_ID },
        mainEntity: {
          "@type": "OfferCatalog",
          name: "Digital Phone Hub parts catalogue",
          itemListElement: [
            "Phone screens",
            "Batteries",
            "Charging parts",
            "Laptop spares",
            "Accessories",
          ].map(name => ({ "@type": "OfferCatalog", name })),
        },
      });
    }
    let script = document.head.querySelector<HTMLScriptElement>("script#dph-seo-jsonld");
    if (!script) {
      script = document.createElement("script");
      script.id = "dph-seo-jsonld";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": graph.map(({ "@context": _context, ...item }) => item) });
  }, [location]);

  return null;
}
