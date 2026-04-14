# Predictor Evaluation

Base URL: http://localhost:3000
Total formulas: 15
Correct: 0
Acceptable but suboptimal: 6
Wrong: 9
Warning missing: 0

## Failing or review-needed cases

- [acceptable but suboptimal] exact-niti :: NiTi -> HSLA Steel A36 (method hybrid-screening differed from expected exact-match)
- [wrong] exact-alumina :: Al2O3 -> Alumina Al2O3 (Alumina Al2O3 did not match any expected analogue)
- [acceptable but suboptimal] exact-ti3sic2 :: Ti3SiC2 -> Stainless Steel 316L (method analog-fallback differed from expected exact-match)
- [wrong] hybrid-fe70ni30 :: Fe70Ni30 -> Carbon Steel 1020 (Carbon Steel 1020 did not match any expected analogue)
- [acceptable but suboptimal] hybrid-cu60zn40 :: Cu60Zn40 -> Copper C110 (method analog-fallback differed from expected hybrid-screening)
- [wrong] hybrid-ni3al :: Ni3Al -> Cupronickel 90/10 (Cupronickel 90/10 did not match any expected analogue)
- [acceptable but suboptimal] hybrid-ti3al :: Ti3Al -> Ti3Al (MP) (method exact-match differed from expected hybrid-screening)
- [acceptable but suboptimal] hybrid-cuzn :: Cu55Zn45 -> Copper C110 (method analog-fallback differed from expected hybrid-screening)
- [acceptable but suboptimal] hybrid-hea :: Fe20Ni20Co20Cr20Mn20 -> Aluminum 7075-T6 (method analog-fallback differed from expected hybrid-screening)
- [wrong] fallback-gaas :: GaAs -> Silicon Carbide SiC (predicted category Metal did not match Ceramic)
- [wrong] fallback-gan :: GaN -> Molybdenum Mo (Molybdenum Mo did not match any expected analogue)
- [wrong] hybrid-wn :: WN -> Sialon (Si6-zAlzOzN8-z) (Sialon (Si6-zAlzOzN8-z) did not match any expected analogue)
- [wrong] hybrid-zrc :: ZrC -> Alumina Al2O3 (Alumina Al2O3 did not match any expected analogue)
- [wrong] parse-spaced :: Fe 70 Ni 30 -> Carbon Steel 1020 (Carbon Steel 1020 did not match any expected analogue)
- [wrong] fallback-unparsed :: nickel titanium-ish -> Nitinol (NiTi 50-50) (Nitinol (NiTi 50-50) did not match any expected analogue)
