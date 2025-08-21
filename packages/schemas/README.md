# `@aeo/schemas`

Relax NG Compact (**.rnc**) schemas for AEO-friendly XML authoring.
These schemas power **editor autocomplete + validation** (e.g., VS Code with Red Hat XML) and are consumable by build tools like `@aeo/transform`.

---

## What’s inside

- `rnc/site-seo.rnc` – core schema with elements for common AEO/SEO content types (e.g., `Article`, `HowTo`, `Product`, `Organization`, `BreadcrumbList`).
- (room for more) Add additional `.rnc` files as you grow coverage.

---

## Quick start

### 1) Install

```sh
pnpm add -D @aeo/schemas
# or: npm i -D @aeo/schemas
```

### 2) Point your XML files at the schema

**Option A — XML processing instruction (portable)**

```xml
<?xml-model href="node_modules/@aeo/schemas/rnc/site-seo.rnc"
            type="application/relax-ng-compact-syntax"?>
<Article>
  <!-- Your content here -->
</Article>
```

**Option B — VS Code workspace settings (no PI needed)**

```json
// .vscode/settings.json
{
  "xml.fileAssociations": [
    {
      "pattern": "**/*.xml",
      "systemId": "node_modules/@aeo/schemas/rnc/site-seo.rnc"
    }
  ]
}
```

Open an `.xml` file and press **Ctrl/⌃ + Space** to get **context-aware tags/attributes** and validation errors.

---

## Using with `@aeo/transform`

If your build/transformation pipeline uses `@aeo/transform`, you can still keep schemas separate for reuse:

```json
// packages/transform/package.json
{
  "dependencies": {
    "@aeo/schemas": "^x.y.z"
  }
}
```

Schemas remain editor/dev assets; the transform reads your XML content (no runtime schema dependency required).

---

## Why Relax NG Compact (`.rnc`)?

- **Human-friendly**: far less verbose than XSD.
- **Great tooling**: Red Hat XML extension supports RNG/RNC validation + IntelliSense.
- **Flexible**: easy to evolve as your content models grow.

---

## Authoring conventions

- **Element names** mirror content types (e.g., `<Article>`, `<HowTo>`).
- **Attributes** are used sparingly; prefer child elements for structured values.
- **Arrays/lists**: use repeated elements (e.g., multiple `<step>` items).
- **Optionals**: mark with `?` in `.rnc`; lists with `*` (zero+), `+` (one+).
- **Datatypes**: use `xsd:*` where appropriate (e.g., decimals, dates).

Example snippet (illustrative):

```
default namespace = ""

start = Article | HowTo | Product | Organization | BreadcrumbList

Article =
  element Article {
    element headline { text },
    element description { text }?,
    element datePublished { xsd:date }?,
    element author { Person | Organization }?,
    element image { ImageObject }?,
    element body { Body }?
  }

Person = element Person { element name { text }, element url { text }? }
Organization = element Organization { element name { text }, element url { text }? }
ImageObject = element ImageObject { element url { text } }
Body = element body { ( element p { text }* | Section* ) }
Section = element section { element title { text }, element p { text }* }
```

---

## Extending the schemas

1. Add a new `.rnc` file (e.g., `product-extended.rnc`) or extend `site-seo.rnc`.
2. Update `start` to include your new root type (if it’s a new document root).
3. Keep names stable to avoid breaking editor associations.

Tip: keep modules small and import with `include` if you split files.

---

## Testing & validation

- **VS Code**: The Red Hat XML extension shows validation errors inline as you type.
- **CI (optional)**: You can validate XML against RNG/RNC using standard tools (e.g., convert `.rnc` → `.rng` with `trang`, then validate with your preferred validator). This is optional if editor validation is sufficient for your workflow.

---

## Package structure

```
@aeo/schemas
└─ rnc/
   └─ site-seo.rnc
```

**Recommended `package.json` (already set up here):**

```json
{
  "name": "@aeo/schemas",
  "files": ["rnc/**", "README.md", "LICENSE"],
  "exports": {
    "./rnc/*": "./rnc/*"
  }
}
```

This lets consumers reference files like:

```
node_modules/@aeo/schemas/rnc/site-seo.rnc
```

---

## Versioning

- **SemVer**:

  - **Patch**: fixes/typos that don’t change allowed content.
  - **Minor**: additive changes (new optional elements/attrs).
  - **Major**: breaking changes (rename/remove required parts).

---

## FAQ

**Do I have to check in the `xml-model` PI everywhere?**
No. If your team standardizes on VS Code, use workspace settings instead.

**Can I bundle schemas with my transform?**
You can, but keeping them separate encourages reuse (IDEs, other tools, documentation sites). If you need a single install for end users, consider a small “bundle” package that depends on both.
