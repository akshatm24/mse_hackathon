# Smart Alloy Selector

Smart Alloy Selector is a Next.js materials recommendation app built for `MET-QUEST'26` Problem Statement 3. It converts plain-English engineering requirements into ranked material recommendations, shortlist-grounded explanations, and rule-of-mixtures estimates for novel compositions.

Live URL: [https://beautiful-tiramisu-211a94.netlify.app](https://beautiful-tiramisu-211a94.netlify.app)
Repository: [https://github.com/akshatm24/mse_hackathon](https://github.com/akshatm24/mse_hackathon)

Team:

- Akshat Mittal
- Harshit Dashore
- Aaditya Mukherjee

## Current Database Snapshot

The current assembled runtime database contains `7,116` searchable materials.

- Preserved baseline entries from this checkout: `655`
- Added Materials Project entries: `5,690`
- Added scraped entries: `758`
- Added hardcoded cited entries: `13`

Category distribution:

- `4,716` metals
- `214` polymers
- `2,114` ceramics
- `43` composites
- `29` solders

Data quality distribution:

- `655` experimental / curated
- `13` hardcoded cited
- `758` scraped
- `3,348` estimated
- `2,342` MP-calculated

## Recommendation Pipeline

Each recommendation request follows one deterministic pipeline:

1. The query is parsed into structured constraints with Gemini plus a local heuristic fallback.
2. Domain intent adds category gates for cases like soldering, FDM printing, biomedical use, cryogenic service, or heat sinks.
3. The database is hard-filtered and scored with null-safe ranking.
4. A shortlist-only RAG helper chooses explanation context from the scored candidates.
5. The API returns the ranked cards, warnings, inferred constraints, and explanation.

The ranking layer now includes:

- null-safe scoring for missing properties
- negation handling such as `cost not important`, `no ceramics`, and `not magnetic`
- cryogenic and biomedical shortlists
- category hard constraints for soldering, FDM, insulation, and heat-sink queries
- rule-of-mixtures prediction for novel typed compositions such as `Fe-18Cr-8Ni`

## Data Sources

The assembled database merges curated references, web pipelines, and cited source files.

Primary source families:

- Materials Project API: [https://api.materialsproject.org](https://api.materialsproject.org)
- EngineeringToolbox tables: [https://www.engineeringtoolbox.com](https://www.engineeringtoolbox.com)
- Wikipedia property tables: [https://www.wikipedia.org](https://www.wikipedia.org)
- Haynes alloy pages: [https://www.haynes.com/en-us/alloys](https://www.haynes.com/en-us/alloys)
- Special Metals technical bulletins: [https://www.specialmetals.com/documents/technical-bulletins/](https://www.specialmetals.com/documents/technical-bulletins/)
- Carpenter Technology alloy pages: [https://www.carpentertechnology.com/alloy-tech-center](https://www.carpentertechnology.com/alloy-tech-center)
- NIST WebBook: [https://webbook.nist.gov](https://webbook.nist.gov)
- ASM / datasheet-backed curated entries used for handbook-grade materials and hardcoded cited additions

Pipeline connectors also exist for AZoM and MatWeb. Those stages are treated as best-effort because site structure, robots rules, and rate limits can change.

## Running Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```bash
GEMINI_API_KEY=your_gemini_api_key_here
MATERIALS_PROJECT_API_KEY=your_mp_api_key_here
```

Security notes:

- keep real secrets in `.env.local` or Netlify only
- never commit `.env.local`
- rotate any key that was exposed outside local development

## Running The Data Pipeline

The data pipeline is split into explicit stages so fetch, cleanup, and assembly can be rerun independently.

```bash
npm run fetch-mp
npm run process-mp
npm run scrape:all
npm run assemble-db
```

Convenience commands:

- `npm run update-db-mp`: fetch + process Materials Project data
- `npm run build-db`: fetch MP data, run scrapers, and assemble the final database

Key generated artifacts:

- `scripts/mp-materials-raw.json`
- `scripts/mp-processed.json`
- `scripts/scraped-materials-merged.json`
- `scripts/hardcoded-materials.json`
- `src/lib/materials-db.json`

## Evaluation And Verification

```bash
npm run eval:recommend
npm run eval:predict
npm run eval:full
npx tsc --noEmit
npm run build
```

Artifacts are written to `reports/`.

## Key Files

- `src/lib/materials-db.json`: assembled runtime database
- `src/lib/scoring.ts`: deterministic ranking, intent parsing, and shortlist bonuses
- `src/lib/gemini.ts`: structured constraint extraction and local fallback logic
- `src/app/api/recommend/route.ts`: recommendation endpoint
- `src/app/api/predict/route.ts`: novel-alloy predictor endpoint
- `scripts/fetch-mp.mjs`: paginated Materials Project fetch
- `scripts/process-mp.mjs`: MP-to-runtime normalization and enrichment
- `scripts/scrape/run-all.mjs`: scraper orchestrator
- `scripts/assemble-db.mjs`: final merge and deduplication stage

## Limitations

- Many MP-derived rows are screening-grade estimates rather than certified datasheet values.
- Scraped and hardcoded cited rows still contain nulls where a trustworthy value was not available.
- Novel composition prediction is a composition-only estimate and does not replace CALPHAD, heat-treatment data, or experimental validation.
