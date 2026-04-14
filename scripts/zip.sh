#!/bin/bash
set -euo pipefail

rm -rf _submission SmartAlloySelectorSubmission.zip
mkdir -p _submission/code _submission/datasets

rsync -av \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.netlify' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='_submission' \
  --exclude='submission' \
  --exclude='SmartAlloySelectorSubmission.zip' \
  --exclude='SmartAlloySelector_AkshatMittal_HarshitDashore_AadityaMukherjee.zip' \
  --exclude='scripts/mp-materials-raw.json' \
  . _submission/code/

cat > /tmp/export.mjs <<'JSEOF'
import { readFileSync, writeFileSync } from 'fs';

const db = JSON.parse(
  readFileSync('_submission/code/src/lib/materials-db-export.json', 'utf8')
);

const headers = [
  'id',
  'name',
  'category',
  'subcategory',
  'density_g_cm3',
  'tensile_strength_mpa',
  'yield_strength_mpa',
  'elastic_modulus_gpa',
  'hardness_vickers',
  'thermal_conductivity_w_mk',
  'specific_heat_j_gk',
  'melting_point_c',
  'glass_transition_c',
  'max_service_temp_c',
  'thermal_expansion_ppm_k',
  'electrical_resistivity_ohm_m',
  'corrosion_resistance',
  'machinability',
  'printability_fdm',
  'cost_usd_kg',
  'tags',
  'data_source'
];

const rows = db.map((material) =>
  headers
    .map((header) => {
      const value = material[header];
      if (Array.isArray(value)) return `"${value.join(';')}"`;
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return String(value);
    })
    .join(',')
);

writeFileSync(
  '_submission/datasets/materials_database.csv',
  [headers.join(','), ...rows].join('\n')
);

console.log('Exported', db.length, 'materials to CSV');
JSEOF

node /tmp/export.mjs 2>/dev/null || echo "CSV export skipped (run after npm run build)"

cp smart_alloy_report.tex _submission/ 2>/dev/null || echo "Add smart_alloy_report.tex manually"
cp smart_alloy_report.pdf _submission/ 2>/dev/null || echo "Compile report at overleaf.com and add PDF"

cat > _submission/README.txt <<'EOF'
SMART ALLOY SELECTOR — MET-QUEST'26 SUBMISSION
================================================
Live URL : https://beautiful-tiramisu-211a94.netlify.app
GitHub   : https://github.com/akshatm24/mse_hackathon

DELIVERABLES:
  code/                  Complete source code
  datasets/              Materials database as CSV
  smart_alloy_report.tex LaTeX report source
  smart_alloy_report.pdf Technical report (compiled)

LOCAL SETUP:
  cd code
  cp .env.example .env.local
  # Get free keys:
  # GEMINI_API_KEY     -> aistudio.google.com/apikey
  # MP_API_KEY         -> next.materialsproject.org/api
  npm install && npm run dev
  Open: http://localhost:3000

API KEYS NOT INCLUDED (security — both keys are free).
App works fully in heuristic mode without keys.

PROBLEM STATEMENT EXAMPLES VERIFIED:
  "3D printed bracket for 85°C motor" -> PETG
  "4-point probe for Cu-Co pellets"   -> Beryllium Copper / Tungsten
  "BGA solder joint lead-free"        -> SAC305 / Sn96Ag4

DATA SOURCES:
  ASM Handbook Vol 1 & 2
  MatWeb
  MakeItFrom.com
  Materials Project API (filtered engineering subset)
  NASA TPSX
  Manufacturer datasheets
EOF

cd _submission
zip -r ../SmartAlloySelectorSubmission.zip . --exclude="*.DS_Store" --exclude="__pycache__"
cd ..

echo ""
echo "Created: SmartAlloySelectorSubmission.zip"
du -sh SmartAlloySelectorSubmission.zip
echo "Contents preview:"
unzip -l SmartAlloySelectorSubmission.zip | head -30
