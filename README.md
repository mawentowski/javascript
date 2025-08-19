XML ➜ JSON-LD (your engine) ➜ Validate ➜ Graph/Sitemap ➜ Query ➜ SSR JSON-LD

```shell
# pnpm init → create package.json.
pnpm init
# make sure Corepack can manage pnpm/yarn.
corepack enable
# install the latest pnpm through Corepack.
corepack prepare pnpm@latest --activate
# install project dependencies.
pnpm i



# Building a package
pnpm --filter @semanticapis/xxxx build

# Need these?
# pnpm add -w jsonld n3 xmlbuilder2 ldkit @comunica/query-sparql
# pnpm add -D -w typescript ts-node @types/node rdf-validate-shacl

# Restart
rm -rf node_modules pnpm-lock.yamlpnpm install
```

## Todos
- incorporate packages from /Users/mark/Repos/docsgeek/monorepo
  - Refer to the README for instructions

## Wishlist
- Need to understand PNPM workspaces better
- Need to explore to see capabilities to lverage:
  - https://ldkit.io/docs/about-ldkit
- Roadmap - youre starting with the schema.org MD files instead of OpenAPI because we need to see how those openapi ids are referenced.
- 
- AtlasIQ - (mapping data + knowledge)
  - A linked-data engine for building AEO-optimized apps.
  - “A smart mapping engine that turns your content into structured, linked data for search engines and AI.”
- Goal:
  - Automatically generate structured data from ___ formats and insert it into head of output, estensive semantic data to promote seo and aeo. JS linked data framework for buidling AEO and SEO optimized web applications with ways of measuring metrics.
  - If you are suggesting that structured data helps AEO you hace to prove it first so after you create the site. You can do this with docsgeek.
- Steps
  - Take Schema.org tutorial
  - Strategy: Create output first.
  - Create schema.org template
    - Validate it programmatically.
  - Design Schema.org structured data for Finix manually first.
    - From that, you have a schema
  - API
    - Read
      - /Users/mark/Repos/docsgeek/aeo-schema-authoring-fixed/docs/linked-data.md
    - Define types of API resources using:
      - LDKit
        - https://share.google/ygkPzIM6lsajbF5qO

----

  - Deine requirements for OAS conversion based on finished schema.org website.
  - 
- Schema.org
  - Categorize RDF book notes
  - Take schema.org test again
- Package to convert OAS to RDF
  - 
- All
  - Typescript tutorial
  - Javascript tutorials relearn + React advanced features
- LLMS.txt
  - Main website
    - https://llmstxt.org/
  - Need JS framework agnostic way of generating it.
  - Unified
  - Mimick this functionality:
    - https://github.com/rachfop/docusaurus-plugin-llms
- Next.js Plugin
  - Next.js Tutorial
- Linked Data application / Schemas
  - LDKit
    - https://share.google/ygkPzIM6lsajbF5qO
    - Deno
      - https://deno.land/


## Big picture

- ### New Product Focus: Structured data for consumption by LLMs
  tags:: semanticapi
	- Goals:
		- Structured data to provide rich search results, where possible, about individual pages.
		- Structured data for consumption by LLMs
		- GraphRAG / LLM applications
		- Testing of instructions (i.e., HowTos) both frontend and APIs
	- Profound
		- Analyze AI visibility
		- https://www.tryprofound.com/
	- LLMs.text
		- SPEC
			- https://github.com/AnswerDotAI/llms-txt?tab=readme-ov-file#format
	- Strategy for JSON-ld
		- Everything is based on the pages on your site. All pages must resolve to a viewable URL in the browser. Content negotiation can be done for each page, but you would need to set up a server to do that (your own framework).
		- Because of this, there is a focus on schema.org to the greatest extent possible, including actions for the API flows.
	- Site structure:
		- The resource pages are the links to the resource descriptions in the API reference that have links to other related pages.
			- ex: https://docs.finix.com/api/authorizations
	- Redocly json-ld and llms.text support
		- https://redocly.com/docs/realm/config/seo
	- Schema.org
		- Actions
			- https://schema.org/Action
			- Read research paper.
			- Consider using SHACL to define types.'
		- Potential Actions
			- https://schema.org/docs/actions.html
			- Includes Fields and APIs
	- Syntax checking:
		- https://json-ld.org/playground/
		- https://validator.schema.org/
		- Google rich text analyzer
	- Schema Validation:
		- **OWL Ontology Validators (Reasoners)**
			- Protégé + HermiT or Pellet reasoner
		- RDF Triple Stores with Validation Support
			- Ontotext