#!/bin/bash

set -euo pipefail

echo "Creating submission package..."

mkdir -p submission/smart-alloy-selector

rsync -av \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.netlify' \
  --exclude='.git' \
  --exclude='.env.local' \
  --exclude='.env.production' \
  --exclude='.env.development.local' \
  --exclude='scripts/mp-materials-raw.json' \
  --exclude='submission' \
  --exclude='SmartAlloySelectorSubmission.zip' \
  . submission/smart-alloy-selector/

mkdir -p submission/datasets
cp src/lib/materials-db.ts submission/datasets/materials_database.ts
cp src/lib/mp-materials-generated.ts submission/datasets/mp_materials_generated.ts 2>/dev/null || true

export PATH="/tmp/node20/bin:$PATH"
node --import tsx scripts/export-csv.mjs
cp submission/materials_export.csv submission/datasets/ 2>/dev/null || true

cp smart_alloy_report.tex submission/
cp smart_alloy_report.pdf submission/ 2>/dev/null || \
  echo "PDF not found - compile smart_alloy_report.tex on Overleaf"

cat > submission/README.txt << 'EOF'
SMART ALLOY SELECTOR — MET-QUEST'26 SUBMISSION
===============================================

TEAM: Smart Alloy Selector Team
EVENT: MET-QUEST'26

LIVE URL: https://beautiful-tiramisu-211a94.netlify.app
GITHUB:   https://github.com/akshatm24/mse_hackathon

CONTENTS:
  smart-alloy-selector/   - Complete source code
  datasets/               - Materials database (TypeScript + CSV)
  smart_alloy_report.tex  - LaTeX technical report source
  smart_alloy_report.pdf  - Compiled technical report (if present)

SETUP (local):
  cd smart-alloy-selector
  cp .env.example .env.local
  # Add your GEMINI_API_KEY and MATERIALS_PROJECT_API_KEY
  npm install
  npm run dev
  # Open http://localhost:3000

API KEYS REQUIRED (not included for security):
  GEMINI_API_KEY             - from aistudio.google.com/apikey
  MATERIALS_PROJECT_API_KEY  - from next.materialsproject.org/api

NOTE: API keys are NOT included in this submission.
The app still provides deterministic scoring and local explanations
even when a remote model is not used.
EOF

cd submission
zip -r ../SmartAlloySelectorSubmission.zip . --exclude="*.DS_Store"
cd ..

echo ""
echo "Submission created: SmartAlloySelectorSubmission.zip"
echo "Size: $(du -sh SmartAlloySelectorSubmission.zip | cut -f1)"
echo ""
echo "Contents:"
unzip -l SmartAlloySelectorSubmission.zip | head -40
