#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseXml, transform } from "../dist/index.js";

/**
 * Usage: aeo-build <file.xml> [--out-dir <dir>]
 * - If --out-dir is omitted and the input lives under .../examples/source/,
 *   outputs will be written to the sibling .../examples/expected/ directory.
 * - Otherwise, outputs are written next to the input file.
 */

// ---- args ----
const [, , inFile, ...rest] = process.argv;
if (!inFile) {
  console.error("Usage: aeo-build <file.xml> [--out-dir <dir>]");
  process.exit(1);
}

// parse flags
let outDir = null;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === "--out-dir") {
    outDir = rest[i + 1] ?? null;
    i++;
  }
}

// ---- transform ----
const xml = readFileSync(inFile, "utf8");
const doc = parseXml(xml);
const { html, jsonLd, meta } = transform(doc);

// ---- page HTML ----
const page = `<!doctype html>
<html><head>
<meta charset="utf-8">
<title>${meta.title ?? "Page"}</title>
<meta name="description" content="${(meta.description ?? "").replaceAll(
  '"',
  "&quot;"
)}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head><body><main>${html}</main></body></html>`;

// ---- decide output paths (.html + .jsonld) ----
const inDir = path.dirname(inFile);
const base = path.basename(inFile).replace(/\.xml$/i, ".html");

// Default behavior:
// 1) If --out-dir provided → use it
// 2) Else if input is .../examples/source → write to sibling .../examples/expected
// 3) Else → write next to input
let resolvedOutDir = outDir;
if (!resolvedOutDir) {
  const last = path.basename(inDir);
  const parent = path.basename(path.dirname(inDir));
  if (last === "source" && parent === "examples") {
    resolvedOutDir = path.join(path.dirname(inDir), "output");
  }
}

const outFile = resolvedOutDir
  ? path.join(resolvedOutDir, base)
  : path.join(inDir, base);
const jsonOutFile = outFile.replace(/\.html$/i, ".jsonld");

// ensure out dir exists when needed
if (resolvedOutDir) mkdirSync(resolvedOutDir, { recursive: true });

// ---- write files ----
writeFileSync(outFile, page, "utf8");
writeFileSync(jsonOutFile, JSON.stringify(jsonLd, null, 2), "utf8");

console.log(`Built ${outFile}\nBuilt ${jsonOutFile}`);
