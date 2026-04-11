# Smart Alloy Selector – MET-QUEST'26

## What it does

Smart Alloy Selector – MET-QUEST'26 is a production-ready Next.js web application for engineering material selection. It combines a curated embedded materials database with a deterministic scoring engine and optional Google Gemini assistance to:

- extract engineering constraints from natural-language problem statements,
- rank candidate materials across metals, polymers, ceramics, composites, and solders,
- explain trade-offs in plain technical language,
- compare shortlisted materials with radar charts and side-by-side tables, and
- continue the analysis through a follow-up chat workflow.

If `GEMINI_API_KEY` is not configured, the app still works in offline mode using manual filters and the local scoring engine.

## Tech stack

- Next.js 14 with App Router
- React 18 + TypeScript (strict mode)
- Tailwind CSS v3
- Recharts for radar visualization
- Google Gemini via `@google/generative-ai`
- Vercel-ready serverless API route architecture

## Local setup (step-by-step including API key)

1. Clone or copy this project into your workspace.
2. In the project root, create a file named `.env.local`.
3. Add this line:

```env
GEMINI_API_KEY=your_key_here
```

4. Get a free Gemini Developer API key from [Google AI Studio](https://aistudio.google.com/apikey).
5. Install dependencies:

```bash
npm install
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000).

Notes:
- The app always reads the key from `process.env.GEMINI_API_KEY`.
- If the key is missing, the API route returns:

```json
{ "error": "GEMINI_API_KEY not configured. See README for setup." }
```

- With no key present, you can still use the app by entering constraints manually in the Advanced Filters panel.

## Vercel deployment (step-by-step including where to paste the key)

1. Push the project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import the GitHub repository.
4. Before clicking **Deploy**, open **Environment Variables**.
5. Add the following variable:

- Name: `GEMINI_API_KEY`
- Value: your Gemini API key

6. Click **Deploy**.
7. Vercel will detect Next.js automatically. No additional manual configuration is required.

## Why not GitHub Pages?

GitHub Pages is static-only. This app needs server-side route handlers under `src/app/api/recommend/route.ts` to call Gemini securely using `process.env.GEMINI_API_KEY`. Because of that, GitHub Pages is not suitable for this project.

Vercel is the correct target because it supports Next.js App Router, serverless API routes, and environment variables out of the box. It is also free for a project of this scale.

## Materials database sources

The embedded database contains 42 engineering materials across five categories:

- Metals and alloys
- Polymers
- Ceramics
- Composites
- Solders and brazing alloys

Property values were compiled from typical literature and engineering reference data, primarily:

- MatWeb material datasheets
- ASM Handbook reference values
- Supplier technical datasheets for specialty composites and solders
- Typical OEM polymer processing/property data

The app stores values for density, strength, stiffness, hardness, conductivity, heat capacity, service temperature, thermal expansion, resistivity, corrosion resistance, machinability, printability, and approximate material cost.

## Scoring methodology

The ranking engine is deterministic and reproducible.

1. Hard filters remove materials that violate active requirements.
   - minimum service temperature
   - minimum tensile strength
   - maximum density
   - maximum cost
   - corrosion requirement
   - FDM printability requirement
   - electrical conductivity requirement
   - optional thermal conductivity preference used by the UI filter set

2. Survivors are normalized across the filtered set.
   - strength score
   - thermal score
   - weight score
   - cost score
   - corrosion score

3. The final score is a weighted sum scaled to 100.

4. The engine generates a short match reason highlighting the strongest contributing factors.

5. If fewer than three materials survive and a cost limit was active, the engine retries once with the cost ceiling doubled.

Gemini is used only for:
- extracting structured constraints from user language, and
- generating the engineering explanation and follow-up responses.

The material ranking itself remains deterministic.

## Limitations and future work

- The database is curated rather than exhaustive, so niche grades and supplier-specific variants are not all included.
- Values are typical engineering values, not certification-grade design allowables.
- The current scoring model does not explicitly include fatigue, creep, fracture toughness, availability, joining compatibility, or sustainability metrics.
- Follow-up chat reuses ranked results and prompt history, but it is not a full agentic simulation or finite-element workflow.
- More advanced future versions could add:
  - fatigue and creep models,
  - process-specific manufacturability scores,
  - downloadable reports,
  - CSV import/export,
  - authenticated project saving,
  - larger reference datasets with citation links per property.
