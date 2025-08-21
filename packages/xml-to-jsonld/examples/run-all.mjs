// Run all examples: read XML from source/, write HTML + JSON-LD into output/
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";

// If @aeo/transform builds to ESM:
import { parseXml, transform } from "../dist/index.js";
// If it builds to CJS, use:
// import mod from "../dist/index.js";
// const { parseXml, transform } = mod;

const ROOT = new URL(".", import.meta.url).pathname;
const SRC = join(ROOT, "source");
const OUT = join(ROOT, "output");

await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => extname(f) === ".xml");
for (const f of files) {
  const name = basename(f, ".xml");
  const xml = await readFile(join(SRC, f), "utf8");
  const doc = parseXml(xml);
  const { html, jsonLd } = transform(doc);

  await writeFile(join(OUT, `${name}.html`), html, "utf8");
  await writeFile(
    join(OUT, `${name}.jsonld`),
    JSON.stringify(jsonLd, null, 2),
    "utf8"
  );
  console.log(`✓ ${name}`);
}
