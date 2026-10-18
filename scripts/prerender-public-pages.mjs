import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("dist/public");
const origin = "https://digitalelectronics.tech";
const baseHtml = await readFile(path.join(output, "index.html"), "utf8");
const image = `${origin}/brand/dph-storefront-sign-wide.webp`;

const pages = [
  {
    path: "/",
    title: "Phone Repair in Siaya Town | Digital Phone Hub",
    description: "Need phone repair in Siaya Town? Digital Phone Hub checks screen, battery and charging faults first, with laptop service and compatible parts too.",
    keywords: "phone repair Siaya, laptop repair Siaya, phone parts Kenya, Digital Phone Hub",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    body: `<main id="main-content"><section><p>Phone, laptop &amp; electronics care in Siaya Town</p><h1>A clear answer for a device that is not working.</h1><p>Bring us the problem, the model or even a photo. We diagnose first, explain the sensible option and let you approve before repair.</p><p><a href="/repair">Book a repair</a> <a href="/spares">Shop parts &amp; accessories</a> <a href="https://wa.me/254718114009">Ask us on WhatsApp</a></p><p>Siaya Town · Monday–Saturday, 8:00–18:00 · Approve the repair before work begins</p><img src="/brand/dph-service-desk-portrait.webp" alt="Digital Phone Hub service desk in Siaya Town" width="480" height="640"></section><section><h2>Phone repair, laptop checks and the right parts—without guessing.</h2><p>For cracked screens, batteries that will not hold charge, charging problems or a laptop that will not start, tell us the device model and symptoms. We check first, explain the options and confirm the cost with you before repair. Ask us to check part compatibility before you order.</p><h2>Start with the problem</h2><ul><li><a href="/phone-repair-siaya">Phone repair in Siaya</a> for screens, batteries, charging faults and software issues.</li><li><a href="/repair?device=laptop">Laptop service</a> for slow, dead, overheating or charging problems.</li><li><a href="/repair?device=electronics">Electronics care</a> for a practical first check.</li><li><a href="/spares">Parts and accessories</a> including screens, batteries, chargers and cables.</li></ul></section><section><h2>How it works</h2><ol><li>Tell us the device brand, model and what changed.</li><li>Our Siaya service desk checks the fault and explains the available options.</li><li>You approve the repair plan and confirmed cost before work begins.</li></ol><p><a href="/repair">Send a repair request</a> · <a href="tel:+254718114009">Call 0718 114 009</a></p></section></main>`,
  },
  {
    path: "/phone-repair-siaya",
    title: "Phone Repair Siaya | Digital Phone Hub",
    description: "Need phone repair in Siaya? Get help with cracked screens, weak batteries, charging faults and software problems, with clear advice before work begins.",
    keywords: "phone repair Siaya, screen replacement Siaya, battery replacement Siaya, Digital Phone Hub",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    body: `<main id="main-content"><p>Phone repair in Siaya · Digital Phone Hub</p><h1>A phone repair starts with the right check.</h1><p>Bring a cracked screen, weak battery, charging fault or software problem to a local service desk that explains the next step clearly.</p><p><a href="/repair">Book a phone repair</a> <a href="tel:+254718114009">Call 0718 114 009</a> <a href="https://wa.me/254718114009">Ask on WhatsApp</a></p><p>Siaya Town service desk · Monday–Saturday, 8:00–18:00</p><img src="/brand/dph-repair-bench-portrait.webp" alt="Digital Phone Hub repair desk in Siaya" width="480" height="640"><h2>Phone problems we help with</h2><ul><li>Cracked or unresponsive phone screens</li><li>Weak batteries, fast drain or charging faults</li><li>Charging ports, microphones and speakers</li><li>Software issues, setup and device diagnostics</li></ul><h2>How phone repair works</h2><ol><li>Share your phone brand, model and issue.</li><li>We check the fault and explain the practical next step.</li><li>You choose whether to approve the repair or ask about a compatible part.</li></ol><h2>Phone repair questions</h2><details><summary>Where can I get phone repair in Siaya?</summary><p>Digital Phone Hub provides phone repair support from its service desk in Siaya Town. Start online or call 0718 114 009 so the team can confirm the next step before work begins.</p></details><details><summary>Can you help me find the right screen?</summary><p>Share the exact phone brand and model. The team can help confirm compatibility and check the available screen option before you place an order.</p></details><details><summary>How long does a phone repair take?</summary><p>Timing depends on the fault and part availability. We check the device first and then explain the expected next step.</p></details><p><a href="/repair">Send a repair request</a> · <a href="/spares">Browse parts and accessories</a></p></main>`,
  },
  {
    path: "/repair",
    title: "Phone & Laptop Repair in Siaya | Digital Phone Hub",
    description: "Request phone, laptop or electronics repair in Siaya. Share the brand, model and symptoms. We review the fault and confirm the next step before work.",
    keywords: "phone repair Siaya, laptop repair Siaya, electronics repair Siaya, Digital Phone Hub",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    body: `<main id="main-content"><p>Start with the real problem · Siaya Town</p><h1>Tell us what changed. We will help with the next step.</h1><p>You do not need to diagnose the device yourself. Share the brand, model and symptoms; the service desk reviews the request before recommending repair or a part.</p><h2>Request a phone, laptop or electronics check</h2><p>Include your name, phone number, device brand and model, and a short description of the issue. The desk reviews the request and contacts you about the next step. No repair starts before you approve the confirmed plan.</p><ul><li>Phone screen, battery and charging faults</li><li>Laptop performance, power and charging problems</li><li>Electronics checks and compatible parts</li></ul><p><a href="tel:+254718114009">Call 0718 114 009</a> · <a href="/phone-repair-siaya">Phone repair in Siaya</a> · <a href="/repair-status">Track an existing repair</a></p></main>`,
  },
  {
    path: "/spares",
    title: "Phone Parts & Accessories Siaya | Digital Phone Hub",
    description: "Find phone screens, batteries, chargers, cables and laptop parts. Digital Phone Hub helps check device compatibility before you request an item.",
    keywords: "phone parts Siaya, phone accessories Kenya, laptop parts Kenya, Digital Phone Hub",
    robots: "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
    body: `<main id="main-content"><p>Digital Phone Hub parts &amp; electronics · Siaya Town</p><h1>Find the right parts for your device.</h1><p>Request phone screens, batteries, charging parts, laptop spares and everyday accessories. Share your device model so we can help check compatibility before you order.</p><p>Item availability and price are confirmed by the service desk. Ask about delivery or collection options.</p><h2>Popular parts and accessories</h2><ul><li>Phone screens and displays</li><li>Phone batteries</li><li>Charging ports, chargers and cables</li><li>Laptop spares and chargers</li><li>Device covers and accessories</li></ul><p><a href="https://wa.me/254718114009">Ask about a part on WhatsApp</a> · <a href="tel:+254718114009">Call 0718 114 009</a> · <a href="/repair">Request a device check</a></p></main>`,
  },
  {
    path: "/repair-status",
    title: "Track Your Phone Repair | Digital Phone Hub",
    description: "Check the progress of your Digital Phone Hub repair using your repair reference.",
    keywords: "repair tracking, phone repair Siaya, Digital Phone Hub",
    robots: "noindex,nofollow",
    canonical: "",
    body: `<main id="main-content"><h1>Track your repair</h1><p>Use your repair reference to check the current stage of your request.</p><p><a href="/repair">Book a repair</a> · <a href="tel:+254718114009">Call 0718 114 009</a></p></main>`,
  },
  {
    path: "/order-status",
    title: "Track an Item Request | Digital Phone Hub",
    description: "Check your Digital Phone Hub order request and M-PESA payment state using its guest reference.",
    keywords: "Digital Phone Hub order status, Siaya M-PESA",
    robots: "noindex,nofollow",
    canonical: "",
    body: `<main id="main-content"><h1>Check an item request</h1><p>Use the guest order reference saved after your request. Sign-in is not required.</p><p><a href="/spares">Parts and accessories</a> · <a href="tel:+254718114009">Call 0718 114 009</a></p></main>`,
  },
  {
    path: "/account",
    title: "Customer Account | Digital Phone Hub",
    description: "Private Digital Phone Hub customer sign-in and order history.",
    keywords: "Digital Phone Hub customer account, private order history",
    robots: "noindex,nofollow",
    canonical: "",
    body: `<main id="main-content"><h1>Customer account</h1><p>Sign in or create an account with a username and Kenyan phone number.</p><p>Phone sign-in is unavailable until SMS setup is complete. Guest requests remain available.</p><p><a href="/spares">Continue as a guest</a> · <a href="tel:+254718114009">Call 0718 114 009</a></p></main>`,
  },
  {
    path: "/owner-login",
    title: "Owner Login | Digital Phone Hub",
    description: "Private Digital Phone Hub owner access.",
    keywords: "Digital Phone Hub, owner login, business portal",
    robots: "noindex,nofollow",
    body: `<main id="main-content"><h1>Owner login</h1><p>Private Digital Phone Hub owner access.</p></main>`,
  },
  {
    path: "/admin",
    title: "Owner Portal | Digital Phone Hub",
    description: "Private Digital Phone Hub owner portal.",
    keywords: "Digital Phone Hub, owner portal, business login",
    robots: "noindex,nofollow",
    body: `<main id="main-content"><h1>Owner portal</h1><p>Private Digital Phone Hub owner access.</p></main>`,
  },
];

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function updateMeta(html, selector, attrs, content) {
  const escaped = escapeAttribute(content);
  const find = new RegExp(`<meta\\b(?=[^>]*${selector})[^>]*>`, "i");
  const replacement = `<meta ${attrs} content="${escaped}" />`;
  return find.test(html) ? html.replace(find, replacement) : html.replace("</head>", `  ${replacement}\n  </head>`);
}

function pageHtml(page) {
  const canonical = `${origin}${page.path === "/" ? "/" : page.path}`;
  let html = baseHtml.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(page.title)}</title>`);
  html = updateMeta(html, 'name="description"', 'name="description"', page.description);
  html = updateMeta(html, 'name="keywords"', 'name="keywords"', page.keywords);
  html = updateMeta(html, 'name="robots"', 'name="robots"', page.robots);
  html = updateMeta(html, 'property="og:title"', 'property="og:title"', page.title);
  html = updateMeta(html, 'property="og:description"', 'property="og:description"', page.description);
  html = page.canonical === ""
    ? html.replace(/<meta property="og:url"[^>]*\s*\/>/, "")
    : updateMeta(html, 'property="og:url"', 'property="og:url"', canonical);
  html = updateMeta(html, 'property="og:image"', 'property="og:image"', image);
  html = updateMeta(html, 'name="twitter:title"', 'name="twitter:title"', page.title);
  html = updateMeta(html, 'name="twitter:description"', 'name="twitter:description"', page.description);
  html = updateMeta(html, 'name="twitter:image"', 'name="twitter:image"', image);
  html = page.canonical === ""
    ? html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, "")
    : html.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${page.canonical || canonical}" />`);
  html = html.replace(/<div id="root"><\/div>/, `<div id="root">${page.body}</div>`);
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (jsonLd) {
    const structuredData = JSON.parse(jsonLd[1]);
    if (page.path === "/phone-repair-siaya" || page.path === "/repair") {
      structuredData["@graph"].push({
        "@type": "Service",
        "@id": `${canonical}#service`,
        name: page.path === "/phone-repair-siaya" ? "Phone repair in Siaya" : "Phone, laptop and electronics repair in Siaya",
        serviceType: page.path === "/phone-repair-siaya" ? "Phone screen, battery, charging and software repair" : "Device repair and diagnostics",
        provider: { "@id": `${origin}/#business` },
        areaServed: { "@type": "City", name: "Siaya" },
        url: canonical,
      });
    }
    if (page.path === "/spares") {
      structuredData["@graph"].push({
        "@type": "CollectionPage",
        "@id": `${canonical}#catalogue`,
        name: "Phone parts and accessories in Siaya",
        url: canonical,
        about: { "@id": `${origin}/#business` },
        mainEntity: {
          "@type": "OfferCatalog",
          name: "Digital Phone Hub parts and accessories",
          itemListElement: ["Phone screens", "Batteries", "Charging parts", "Laptop parts", "Accessories"].map(name => ({ "@type": "OfferCatalog", name })),
        },
      });
    }
    html = html.replace(jsonLd[0], `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`);
  }
  return html;
}

function notFoundHtml() {
  const page = {
    path: "/404",
    title: "Page not found | Digital Phone Hub",
    description: "This page is not available. Visit Digital Phone Hub's repair and parts pages or call the Siaya service desk.",
    keywords: "Digital Phone Hub, Siaya repair, page not found",
    robots: "noindex,nofollow",
    body: `<main id="main-content" style="max-width:760px;margin:10vh auto;padding:24px;color:#202a30;background:#fff;border:1px solid #d9d2c8;border-radius:24px;font-family:system-ui,sans-serif"><p style="color:#a93823;font-weight:800;letter-spacing:.12em">404 · PAGE NOT FOUND</p><h1>That page is not here.</h1><p>The address may have changed. Choose a service below or call the Siaya desk and we will help you find the right next step.</p><p><a href="/">Home</a> · <a href="/repair">Request a repair</a> · <a href="/spares">Find parts</a> · <a href="tel:+254718114009">Call 0718 114 009</a></p></main>`,
  };
  return pageHtml(page).replace(/\s*<link rel="canonical" href="[^"]*"\s*\/>/, "");
}

for (const page of pages) {
  const target = page.path === "/" ? path.join(output, "index.html") : path.join(output, page.path.slice(1), "index.html");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, pageHtml(page));
}
await writeFile(path.join(output, "404.html"), notFoundHtml());

console.log(`Generated crawler-visible HTML for ${pages.length} public routes.`);
