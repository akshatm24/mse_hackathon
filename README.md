# Smart Alloy Selector

Smart Alloy Selector is a Next.js materials recommendation app built for `MET-QUEST'26` Problem Statement 3. It converts plain-English engineering requirements into ranked material recommendations, shortlist-grounded explanations, and rule-of-mixtures estimates for novel compositions.

Live URL: [https://beautiful-tiramisu-211a94.netlify.app](https://beautiful-tiramisu-211a94.netlify.app)
Repository: [https://github.com/akshatm24/mse_hackathon](https://github.com/akshatm24/mse_hackathon)

Team:

- Akshat Mittal
- Harshit Dashore
- Aaditya Mukherjee

## Current Database Snapshot

The current split runtime database contains `7,118` searchable materials.

- Curated engineering materials: `1,382`
- Materials Project compounds: `5,736`
- Total unique IDs across both files: `7,118`
- Duplicate IDs across `src/data/materials.json` + `src/data/mp_materials.json`: `0`

Category distribution:

- `4,731` metals
- `204` polymers
- `2,115` ceramics
- `44` composites
- `24` solders

Data quality distribution:

- `622` experimental
- `35` validated
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

- engineering-only recommendation filtering, with MP compounds reserved for the novel-alloy workflow
- duplicate-ID removal with source/quality-aware deduplication
- property-specific match reasons and deterministic score tie-breakers
- null-safe scoring for missing properties
- negation handling such as `cost not important`, `no ceramics`, and `not magnetic`
- cryogenic and biomedical shortlists
- category hard constraints for soldering, FDM, insulation, and heat-sink queries
- turbine/hot-section intent handling so superalloys surface for blade queries

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
- `npm run fetch-mp-materials`: top up `src/data/mp_materials.json` to 5000+ MP compounds if needed

Key generated artifacts:

- `scripts/mp-materials-raw.json`
- `scripts/mp-processed.json`
- `scripts/scraped-materials-merged.json`
- `scripts/hardcoded-materials.json`
- `src/data/materials.json`
- `src/data/mp_materials.json`

## Evaluation And Verification

```bash
npm run eval:recommend
npm run eval:predict
npm run eval:full
npx jest database.test --runInBand --forceExit
npx tsc --noEmit
npm run build
```

Artifacts are written to `reports/`.

## Key Files

- `src/data/materials.json`: curated engineering materials
- `src/data/mp_materials.json`: Materials Project compound pool for predictor use
- `src/data/index.ts`: deduplicated data barrel and source-kind split
- `src/lib/scoring.ts`: deterministic ranking, intent parsing, and shortlist bonuses
- `src/lib/dedup.ts`: source-aware duplicate-ID cleanup
- `src/lib/filterEngineering.ts`: engineering vs MP pool separation
- `src/lib/gemini.ts`: structured constraint extraction and local fallback logic
- `src/app/api/recommend/route.ts`: recommendation endpoint
- `src/app/api/predictor/route.ts`: MP-compound to engineering-analogue predictor endpoint
- `src/components/AshbyPlot.tsx`: density vs strength Ashby plot
- `src/components/ScoreBreakdown.tsx`: per-result weighted score visualization
- `scripts/fetch-mp.mjs`: paginated Materials Project fetch
- `scripts/fetch_mp_materials.ts`: MP split-database top-up fetcher
- `scripts/process-mp.mjs`: MP-to-runtime normalization and enrichment
- `scripts/scrape/run-all.mjs`: scraper orchestrator
- `scripts/assemble-db.mjs`: final merge and deduplication stage

## Limitations

- Many MP-derived rows are screening-grade estimates rather than certified datasheet values.
- Scraped and hardcoded cited rows still contain nulls where a trustworthy value was not available.
- Novel composition prediction is a composition-only estimate and does not replace CALPHAD, heat-treatment data, or experimental validation.
