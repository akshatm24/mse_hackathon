# Smart Alloy Selector – MET-QUEST'26

## What it does

Smart Alloy Selector is an AI-assisted engineering material recommendation tool built for MET-QUEST'26. A user describes a mechanical, thermal, electrical, corrosion, or manufacturing problem in plain English, the system extracts constraints, filters a curated 65-material database, and ranks the best candidates with a deterministic weighted scoring engine. The app also supports follow-up questions, side-by-side comparison, and a searchable database explorer.

## Tech stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Recharts
- Google Gemini (`@google/generative-ai`)
- Lucide React icons

## Local setup

1. Clone the repository and open the project folder.
2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

4. Add your Gemini API key:

```bash
GEMINI_API_KEY=your_real_gemini_api_key
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000).

Notes:
- `.env.local` is ignored by git and should never be committed.
- If the Gemini key is missing, the UI still works using local heuristic extraction and deterministic ranking.

## Vercel deployment

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Add the environment variable `GEMINI_API_KEY` in the Vercel project settings.
4. Redeploy the project.
5. Confirm the homepage and `POST /api/recommend` return successful responses.

CLI workflow:

```bash
vercel --yes --env GEMINI_API_KEY=your_real_key --build-env GEMINI_API_KEY=your_real_key --prod
```

## Why not GitHub Pages

GitHub Pages is designed for static hosting. This project needs a server-side API route for Gemini calls, runtime environment variables, and server execution during recommendation requests. Vercel supports the required Next.js App Router server features out of the box.

## Materials database

- 65 curated materials
- 5 categories: Metal, Polymer, Ceramic, Composite, Solder
- 18 core properties per material
- Sources include ASM Handbook, MatWeb, NASA TPSX, supplier datasheets, and manufacturer technical references

The embedded dataset includes:
- Structural metals such as stainless steels, titanium alloys, aluminum alloys, nickel alloys, and tool steels
- Printable and high-performance polymers such as PLA, ABS, PETG, PA12, PEEK, Ultem, PTFE, and Delrin
- Ceramics including alumina, zirconia, silicon carbide, silicon nitride, and boron nitride
- Composites including CFRP, GFRP, Kevlar/epoxy, and carbon-carbon
- Electronics joining materials including eutectic tin-lead, SAC305, AuSn20, and silver braze

## Scoring methodology

The ranking has two stages:

1. Hard filters
   - Minimum service temperature
   - Minimum tensile strength
   - Maximum density
   - Maximum cost
   - Minimum corrosion requirement
   - Electrical conductivity requirement
   - FDM printability requirement

2. Weighted sum scoring

For each surviving material:

```text
score = 100 * (
  w_thermal   * normalized_thermal +
  w_strength  * normalized_strength +
  w_weight    * normalized_lightness +
  w_cost      * normalized_cost_efficiency +
  w_corrosion * normalized_corrosion
)
```

Where:
- `normalized_thermal = material.max_service_temp / max(max_service_temp)`
- `normalized_strength = material.tensile_strength / max(tensile_strength)`
- `normalized_lightness = 1 - material.density / max(density)`
- `normalized_cost_efficiency = 1 - material.cost / max(cost)`
- `normalized_corrosion = corrosion_rank / 4`

The engine returns the top 10 materials after sorting by descending score.

## Graceful degradation

If Gemini is unavailable or `GEMINI_API_KEY` is not configured:

- the app falls back to local keyword-based constraint inference
- deterministic scoring still works against the embedded database
- the UI remains fully usable for search, comparison, and database exploration

This keeps the tool functional during demos, local development, or API outages.

## Limitations and future work

- The current dataset is curated rather than exhaustive
- The scoring model does not yet include fatigue life, creep, fracture toughness, or joining compatibility
- Numeric properties are literature-typical values and should be validated for a specific grade, temper, supplier, or processing route
- The chatbot currently answers from ranked results rather than a full retrieval pipeline over raw datasheets
- Future work could add Ashby plots, composition-based property prediction, exportable reports, and deeper manufacturing process recommendations
