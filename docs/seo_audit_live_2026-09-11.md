# Live SEO audit — 2026-09-11

## Confirmed live findings

The production deployment was checked directly in a live browser at `https://digishop1-ljc3jylv6-hacker254mwalos-projects.vercel.app/`.

| Endpoint | Result | Implication |
|---|---|---|
| `/robots.txt` | 404 NOT_FOUND | Crawlers do not receive an explicit crawl policy or sitemap declaration. |
| `/sitemap.xml` | 404 NOT_FOUND | Google does not have a submitted URL inventory from the site itself. |

These are high-priority technical SEO gaps. The next audit steps are to inspect page titles, descriptions, canonical signals, structured data, indexability directives, and the public route structure, then implement robots, sitemap, metadata, and local-business/schema improvements.

## Homepage metadata audit

The live homepage has a useful title and description, but the raw HTML inspection found no canonical link, no robots meta tag, and no JSON-LD structured data. The rendered page contains strong human-readable local and service content, including phone repair, laptop service, electronics diagnostics, spare parts, Siaya, and the phone number `0718 114 009`. The main SEO risk is that these signals are not yet reinforced with machine-readable local-business, service, website, and product schema.

Current head signals:

| Signal | Live status |
|---|---|
| Title | Present: `Digital Phone Hub | Repair & Electronics` |
| Meta description | Present, but can be made more intent-focused around phone repair in Siaya and parts across Kenya. |
| Canonical URL | Missing |
| Robots meta | Missing |
| JSON-LD | Missing |
| XML sitemap | Missing |
| robots.txt | Missing |

## Content and Google guidance findings

The live homepage already has strong people-first content for the target business: phone repair in Siaya, laptop service, electronics diagnostics, parts and accessories, repair status tracking, a visible telephone number, and clear calls to action. Its content is substantially better than a blank or thin landing page.

Google’s official SEO Starter Guide explains that Google discovers pages mainly through links, needs to be able to see the page like a normal user, and can be helped by submitting a sitemap. It also emphasizes descriptive titles, descriptions, useful anchor text, unique helpful content, and canonical URLs where duplicate versions exist. These points support the implementation plan for robots.txt, sitemap.xml, canonical tags, page-specific metadata, and structured data rather than keyword stuffing.

## LocalBusiness structured-data research

Google’s LocalBusiness documentation states that `address` and `name` are required properties. It recommends adding `telephone`, `url`, `geo`, `openingHoursSpecification`, `priceRange`, and review or rating information when those values are real and visible on the page. The implementation should therefore use a specific local business type such as `ElectronicsStore` or `MobilePhoneStore` only if it accurately represents the business, include the real Siaya address and phone number, and avoid inventing ratings, review counts, coordinates, or opening hours that have not been verified.

## Product and sitemap research

Google’s Product structured-data documentation explains that product markup can make product information eligible for richer search presentations, and that merchant listings have additional requirements beyond basic product snippets. Because Digishop currently uses an enquiry/order-request flow rather than online payment, product structured data should be added only where each product page has a stable crawlable URL and the displayed price, availability, name, image, and identifiers are accurate. The current catalogue is a client-side collection page, so it is safer to begin with site-level and category-page SEO, then introduce individual product URLs if the catalogue needs product-rich results.

Google’s sitemap guidance recommends UTF-8 sitemaps with fully qualified absolute URLs, hosted at the site root when possible. The sitemap should contain only URLs intended for search results, should reflect canonical URLs, and should be referenced from `robots.txt`. Google also recommends submitting it through Search Console.

## Custom-domain audit

The Vercel project has the custom domains `digitalelectronics.tech` and `www.digitalelectronics.tech`, plus Vercel aliases. The apex domain redirects to the `www` host, so `https://www.digitalelectronics.tech/` should be treated as the canonical public host for canonical tags, Open Graph URLs, sitemap entries, and Search Console setup. The live `https://www.digitalelectronics.tech/robots.txt` endpoint currently returns 404, confirming that the indexing gap affects the customer-facing custom domain, not only the deployment alias.
