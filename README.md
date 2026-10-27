# Domek Herold P 3322_A – interaktivní 3D návod

**Online:** https://jirkapivrnec.github.io/domek-herold-manual/

Krok za krokem podle originálního montážního návodu (`Domek Herold P 3322_A_Návod (1).pdf`).
Domek stojí na dřevěné plošině s podlahou (podle fotky); plošina má stejný půdorys jako domek – 3270 × 2210 mm.

## Spuštění

```bash
cd app && npm install && npm run dev
```

## Odkazy (URL routing)

Adresa vždy odpovídá tomu, co je na obrazovce – po refreshi nebo ze sdíleného odkazu se otevře stejné místo:

- `#/naradi`, `#/dily`
- `#/stavba/priprava`, `#/stavba/1a` … `#/stavba/10`, `#/stavba/hotovo`
- vzhled modelu: `?vzhled=drevo` (např. `#/stavba/6c?vzhled=drevo`), bez parametru je vzhled „Návod“

## Struktura

- `blender/build_herold.py` – parametrický model v Blenderu (rozměry z návodu) → exportuje `app/public/models/herold.glb`.
  Spuštění: v Blenderu přes MCP / Text Editor, nebo `blender --background --python blender/build_herold.py`.
- `tools/manual_images.py` – vyrenderuje stránky návodu a výřezy ke krokům do `app/public/manual/` (potřebuje `pymupdf`).
- `app/src/data/steps.ts` – texty kroků s odkazy na stránky a detaily návodu.
- `app/src/data/parts.ts`, `tools.ts` – soupis materiálu (str. 3–6) a nářadí (str. 2).
- `app/src/three/ShedScene.tsx` – 3D scéna (react-three-fiber), animace dílů a kamery.

## Nasazení

Každý push do `main` sestaví aplikaci a nasadí ji na GitHub Pages (`.github/workflows/pages.yml`).
`vite.config.ts` má `base: './'` a routing je přes hash, takže web funguje v libovolné podsložce bez přesměrování.
