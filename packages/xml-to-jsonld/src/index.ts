/**
 * Transform pipeline for AEO authoring.
 *
 * Responsibilities:
 *  1) Parse XML into a JS object using fast-xml-parser
 *  2) Detect the document's root element/type (Article, HowTo, BreadcrumbList, OrgRoot, LocalBusiness, Product)
 *  3) Convert the root subtree into:
 *      - Semantic HTML string (body only)
 *      - Schema.org JSON-LD object
 *      - Meta (title/description) for SEO
 *
 * NOTE: This file intentionally keeps one-file structure for clarity. Logic is unchanged;
 * only comments were added to explain what each part does.
 */

import { XMLParser } from "fast-xml-parser";


/**
 * Unified output for all transformers.
 * - html:   Rendered semantic HTML body (string)
 * - jsonLd: Schema.org JSON-LD object (will usually be stringified into a <script type="application/ld+json">)
 * - meta:   Lightweight metadata for <title> and <meta name="description">
 */
export type TransformOutput = {
  html: string;
  jsonLd: any;
  meta: { title?: string; description?: string };
};

/**
 * XML parser configured to:
 *  - keep attributes (ignoreAttributes: false)
 *  - not prefix attribute names (attributeNamePrefix: "")
 *
 * fast-xml-parser produces a plain JS object tree, which we then traverse below.
 */
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

/**
 * Small helper: normalize a value into an array
 * - If v is falsy -> []
 * - If v is already an array -> v
 * - Otherwise -> [v]
 *
 * This keeps downstream mapping code concise and consistent.
 */
const A = (v: any) => (v ? (Array.isArray(v) ? v : [v]) : []);

/**
 * parseXml
 * -----
 * Converts a raw XML string into a plain JS object using fast-xml-parser.
 * Any parsing error would be thrown by the parser.
 */
export function parseXml(xml: string): any {
  return parser.parse(xml);
}

/**
 * transform
 * -----
 * Entry point for converting a parsed XML document (object form) into:
 *  - HTML body string
 *  - JSON-LD object
 *  - meta (title/description)
 *
 * Steps:
 *  1) Identify the first real document element key (ignoring processing instructions like ?xml)
 *  2) Dispatch to the corresponding handler based on that root element name
 */
export function transform(doc: any): TransformOutput {
  // Find the first element key that is NOT a processing instruction (e.g., "?xml")
  const root = Object.keys(doc).find((k) => !k.startsWith("?"));
  if (!root) throw new Error("No document root element found");

  // Subtree for the detected root element
  const data = (doc as any)[root];

  // Dispatch to a specific transformer based on the root element name.
  switch (root) {
    case "Article":
      return article(data);
    case "HowTo":
      return howto(data);
    case "BreadcrumbList":
      return breadcrumbs(data);
    case "OrgRoot":
      return organization(data);
    case "LocalBusiness":
      return localBusiness(data);
    case "Product":
      return product(data);
    default:
      throw new Error(`Unsupported root: ${root}`);
  }
}

/* ---------- shared helpers ---------- */

/**
 * esc
 * HTML-escape a string for safe insertion into HTML text/attributes.
 */
const esc = (s: any = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/**
 * clean
 * Remove keys with null/undefined or empty arrays from an object.
 * Useful before returning JSON-LD so we don't emit noisy undefined fields.
 */
const clean = (o: any) => {
  Object.keys(o).forEach(
    (k) =>
      (o[k] == null || (Array.isArray(o[k]) && !o[k].length)) && delete o[k]
  );
  return o;
};

/* ---------- Article ---------- */
/**
 * article
 * -----
 * Consumes an Article-shaped subtree and returns:
 *  - JSON-LD with "@type": "Article"
 *  - Basic semantic HTML (h1 + paragraphs/sections)
 *  - Meta (title/description)
 *
 * Expected shape (simplified):
 *  <Article>
 *    <headline>...</headline>
 *    <description>...</description>
 *    <datePublished>...</datePublished>
 *    <author>
 *      <Person><name>...</name><url>...</url></Person>
 *      OR
 *      <Organization><name>...</name><url>...</url></Organization>
 *    </author>
 *    <image><ImageObject><url>...</url></ImageObject></image>
 *    <body>
 *      <p>...</p>
 *      <section>
 *        <title>...</title>
 *        <p>...</p>
 *      </section>
 *    </body>
 *  </Article>
 */
function article(Ax: any): TransformOutput {
  // Map XML data to JSON-LD
  const jsonLd = clean({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: Ax.headline,
    datePublished: Ax.datePublished,
    author: Ax.author?.Person
      ? {
          "@type": "Person",
          name: Ax.author.Person.name,
          url: Ax.author.Person.url,
        }
      : Ax.author?.Organization
      ? {
          "@type": "Organization",
          name: Ax.author.Organization.name,
          url: Ax.author.Organization.url,
        }
      : undefined,
    image: Ax.image?.ImageObject?.url,
  });

  // Build simple HTML body from <body> subtree
  const body = Ax.body || {};
  const ps = A(body.p)
    .map((t: any) => `<p>${esc(t)}</p>`)
    .join("");

  const secs = A(body.section)
    .map(
      (s: any) =>
        `<section><h2>${esc(s.title)}</h2>${A(s.p)
          .map((t: any) => `<p>${esc(t)}</p>`)
          .join("")}</section>`
    )
    .join("");

  const html = `<h1>${esc(Ax.headline || "Article")}</h1>${ps}${secs}`;
  return {
    html,
    jsonLd,
    meta: { title: Ax.headline, description: Ax.description },
  };
}

/* ---------- HowTo ---------- */
/**
 * howto
 * -----
 * Consumes a HowTo-shaped subtree and returns JSON-LD/HTML/meta.
 *
 * Supports:
 *  - <supply><HowToSupply/></supply>
 *  - <tool><HowToTool/></tool>
 *  - Steps as either:
 *      <step><HowToStep/></step> (flat)
 *    or
 *      <section><HowToSection><step><HowToStep/></step>...</HowToSection></section> (grouped)
 */
function howto(H: any): TransformOutput {
  // Normalize supplies/tools
  const supplies = A(H.supply)
    .flatMap((s: any) => A(s?.HowToSupply))
    .filter(Boolean);

  const tools = A(H.tool)
    .flatMap((t: any) => A(t?.HowToTool))
    .filter(Boolean);

  // Collect steps (flat HowToStep)
  let step: any[] = [];
  if (H.step) {
    const flat = A(H.step)
      .map((s: any) => s.HowToStep)
      .filter(Boolean);
    step = flat.map((s: any) => ({
      "@type": "HowToStep",
      name: s.name,
      text: s.text,
      image: s.image,
    }));
  }

  // Collect grouped sections (HowToSection with itemListElement of HowToStep)
  if (H.section) {
    const secs = A(H.section)
      .map((s: any) => s.HowToSection)
      .filter(Boolean);
    step = step.concat(
      secs.map((sec: any) => ({
        "@type": "HowToSection",
        name: sec.name,
        itemListElement: A(sec.step)
          .map((x: any) => x.HowToStep)
          .filter(Boolean)
          .map((s: any) => ({
            "@type": "HowToStep",
            name: s.name,
            text: s.text,
            image: s.image,
          })),
      }))
    );
  }

  // Build HowTo JSON-LD
  const jsonLd = clean({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: H.name,
    description: H.description,
    totalTime: H.totalTime,
    supply: supplies.length
      ? supplies.map((s: any) => ({
          "@type": "HowToSupply",
          name: s.name,
          requiredQuantity: s.requiredQuantity,
        }))
      : undefined,
    tool: tools.length
      ? tools.map((t: any) => ({ "@type": "HowToTool", name: t.name }))
      : undefined,
    step,
  });

  // Build HTML
  const sup = supplies.length
    ? `<h2>Supplies</h2><ul>${supplies
        .map(
          (s: any) =>
            `<li>${esc(s.name)}${
              s.requiredQuantity ? ` — ${esc(s.requiredQuantity)}` : ""
            }</li>`
        )
        .join("")}</ul>`
    : "";

  const tl = tools.length
    ? `<h2>Tools</h2><ul>${tools
        .map((t: any) => `<li>${esc(t.name)}</li>`)
        .join("")}</ul>`
    : "";

  const stepsHtml = step
    .map((s) =>
      s["@type"] === "HowToSection"
        ? `<section><h2>${esc(s.name)}</h2><ol>${s.itemListElement
            .map((st: any) => li(st))
            .join("")}</ol></section>`
        : li(s)
    )
    .join("");

  function li(s: any) {
    return `<li><strong>${esc(s.name || "")}</strong>${
      s.text ? `<div>${esc(s.text)}</div>` : ""
    }${
      s.image ? `<figure><img src="${esc(s.image)}" alt=""></figure>` : ""
    }</li>`;
  }

  const html = `<h1>${esc(H.name || "HowTo")}</h1>${
    H.description ? `<p>${esc(H.description)}</p>` : ""
  }${sup}${tl}<h2>Steps</h2><ol>${stepsHtml}</ol>`;

  return { html, jsonLd, meta: { title: H.name, description: H.description } };
}

/* ---------- BreadcrumbList ---------- */
/**
 * breadcrumbs
 * -----
 * Consumes a BreadcrumbList-shaped subtree and returns:
 *  - JSON-LD ListItem array with positions
 *  - <nav aria-label="Breadcrumb"> HTML
 *  - meta.title from the last crumb
 */
function breadcrumbs(B: any): TransformOutput {
  const items = A(B.itemListElement?.ListItem);

  // JSON-LD mapping
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it: any) => ({
      "@type": "ListItem",
      position: Number(it.position),
      name: it.name,
      item: it.item,
    })),
  };

  // Basic breadcrumb HTML
  const html = `<nav aria-label="Breadcrumb"><ol>${items
    .map(
      (it: any) =>
        `<li><a href="${esc(it.item || "#")}">${esc(it.name)}</a></li>`
    )
    .join("")}</ol></nav>`;

  const last = items.at(-1);
  return { html, jsonLd, meta: { title: last?.name } };
}

/* ---------- Organization / LocalBusiness ---------- */
/**
 * organization
 * -----
 * Transforms an OrgRoot subtree into Organization JSON-LD + minimal HTML.
 */
function organization(O: any): TransformOutput {
  const jsonLd = clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: O.name,
    url: O.url,
    logo: O.logo?.ImageObject?.url,
    sameAs: A(O.sameAs),
    contactPoint: O.contactPoint
      ? A(O.contactPoint.ContactPoint).map((c: any) => ({
          "@type": "ContactPoint",
          telephone: c.telephone,
          contactType: c.contactType,
        }))
      : undefined,
  });

  const html = `<h1>${esc(O.name)}</h1>${
    O.url ? `<p><a href="${esc(O.url)}">${esc(O.url)}</a></p>` : ""
  }`;

  return { html, jsonLd, meta: { title: O.name } };
}

/**
 * localBusiness
 * -----
 * Transforms a LocalBusiness subtree into LocalBusiness JSON-LD + minimal HTML.
 * Supports PostalAddress and OpeningHoursSpecification.
 */
function localBusiness(L: any): TransformOutput {
  const addr = L.address || {};

  const jsonLd = clean({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: L.name,
    url: L.url,
    telephone: L.telephone,
    address: L.address
      ? {
          "@type": "PostalAddress",
          streetAddress: addr.streetAddress,
          addressLocality: addr.addressLocality,
          addressRegion: addr.addressRegion,
          postalCode: addr.postalCode,
          addressCountry: addr.addressCountry,
        }
      : undefined,
    openingHoursSpecification: L.openingHoursSpecification
      ? A(L.openingHoursSpecification.OpeningHoursSpecification).map(
          (o: any) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: A(o.dayOfWeek),
            opens: o.opens,
            closes: o.closes,
          })
        )
      : undefined,
    sameAs: A(L.sameAs),
  });

  const html = `<h1>${esc(L.name)}</h1>${
    L.telephone ? `<p>${esc(L.telephone)}</p>` : ""
  }`;

  return { html, jsonLd, meta: { title: L.name } };
}

/* ---------- Product ---------- */
/**
 * product
 * -----
 * Transforms a Product subtree into Product JSON-LD + minimal HTML.
 * Supports Brand, multiple ImageObject entries, and Offer arrays.
 */
function product(P: any): TransformOutput {
  const offers = A(P.offers?.Offer);

  const jsonLd = clean({
    "@context": "https://schema.org",
    "@type": "Product",
    name: P.name,
    description: P.description,
    image: A(P.image)
      .map((im: any) => im.ImageObject?.url)
      .filter(Boolean),
    brand: P.brand?.Brand?.name
      ? { "@type": "Brand", name: P.brand.Brand.name }
      : undefined,
    sku: P.sku,
    gtin13: P.gtin13,
    offers: offers.map((o: any) => ({
      "@type": "Offer",
      price: o.price,
      priceCurrency: o.priceCurrency,
      availability: o.availability,
    })),
    aggregateRating: P.aggregateRating
      ? {
          "@type": "AggregateRating",
          ratingValue: P.aggregateRating.ratingValue,
          reviewCount: P.aggregateRating.reviewCount,
        }
      : undefined,
  });

  const html = `<article>
    <h1>${esc(P.name)}</h1>
    ${P.description ? `<p>${esc(P.description)}</p>` : ""}
    ${
      offers.length
        ? `<p><strong>From:</strong> ${esc(offers[0].price)} ${esc(
            offers[0].priceCurrency
          )}</p>`
        : ""
    }
  </article>`;

  return { html, jsonLd, meta: { title: P.name, description: P.description } };
}
