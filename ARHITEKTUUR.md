# BRON — TalTech ruumibroneerimissüsteem · Arhitektuuridokument

> **Versioon:** 0.0.0 · **Kuupäev:** 07.08.2026  
> **Keskkond:** React 19 + Vite 8 prototüüp  
> **URL:** [taltech-312257.vercel.app](https://taltech-312257.vercel.app) · parool: `bron2026`

---

## 1. Süsteemi ülevaade

BRON on TalTech ruumibroneerimissüsteemi interaktiivne prototüüp, mis kuvab rollipõhiselt broneerimise, halduse ja statistika vaateid. Prototüübis kasutatakse ainult klientpoolset koodiga genereeritud näidisandmeid — taustasüsteemi ega andmebaasi ei ole.

```
Kasutaja brauser
    └── PasswordGate (bron2026)
        └── ConfigProvider (TalTech CVI teema)
            └── BrowserRouter
                └── RoleProvider
                    └── AppLayout (Topbar + Sidebar + Outlet)
                        └── vaate komponendid
```

---

## 2. Tehniline virn

| Kiht | Tehnoloogia | Versioon |
|------|------------|---------|
| UI raamistik | React | 19.2.8 |
| Build tool | Vite | 8.2.0 |
| Marsruutimine | React Router DOM | 7.18.2 |
| Kujundusteek | @TalTech-IT/styleguide (CVI) | 11.11.2 |
| Graafikud | Chart.js + react-chartjs-2 | 4.5.1 / 5.3.1 |
| Kalender | FullCalendar (React + DayGrid + TimeGrid) | 6/7 |
| Lintija | OxLint | 1.75.0 |
| Deploy | Vercel (SPA rewrite) | — |

---

## 3. Kataloogistruktuur

```
src/
├── App.jsx                     # Juurkomponent — PasswordGate, providerid, Routes
├── main.jsx                    # ReactDOM.createRoot
├── index.css                   # Globaalsed BRON CSS klassid + mobiilibreakpointid
│
├── context/
│   └── RoleContext.jsx         # Rollimudel + useRole hook
│
├── layout/
│   ├── AppLayout.jsx           # Sidebar + Topbar + <Outlet>
│   ├── AppSidebar.jsx          # Rollipõhine vasakpoolne navigatsioon
│   └── AppTopbar.jsx           # Päise riba + profiilimenüü + rollivalija
│
├── components/bron/
│   ├── BronBreadcrumbs.jsx     # Leivaraas
│   ├── KpiKaart.jsx            # KPI numbrikaart (väärtus + silt + variant)
│   ├── LigipaasPuudub.jsx      # 403-vaade — rollile keelatud leht
│   ├── PlatseholderVaade.jsx   # Valmimata lehtede ajutine täide
│   ├── RuumiGalerii.jsx        # Ruumi fotogalerii komponent
│   ├── StaatusKaart.jsx        # Staatusbadge wrapper
│   └── StatistikaFilter.jsx    # Statistikavaadete filtripaneel
│
├── views/bron/
│   ├── Avaleht.jsx             # Avaleht — rollipõhine töölaud + kiirlingid
│   ├── OtsiRuumi.jsx           # Ruumiotsing (filter + tulemuste nimekiri)
│   ├── RuumiDetail.jsx         # Ühe ruumi detail (info, kalender, galleria)
│   ├── BroneeringuVorm.jsx     # Broneeringu/taotluse täitmise vorm
│   ├── MinuBroneeringud.jsx    # "Minu broneeringud" — tulevased + ajalugu + tühistamine
│   ├── MinuTaotlused.jsx       # "Minu taotlused" / "Broneeringute haldus" (haldur)
│   ├── AvalikPopulaarsedAjad.jsx  # Avalik populaarsemate aegade vaade (sisselogimata)
│   │
│   ├── StatistikaLeht.jsx      # Statistika shellvaade — tabid + StatistikaFilter
│   ├── StatistikaYlevaade.jsx  # Ülevaade — globaalsed KPI-d, graafikud
│   ├── StatistikaRuumid.jsx    # Ruumide kasutustabelis (kõik ruumid, sorteering)
│   ├── StatistikaRuumiDetail.jsx  # Ühe ruumi detail — trend, sündmused, tagasiside, bronid
│   ├── StatistikaPopulaarsedAjad.jsx  # Populaarseimad broneerimisajad
│   ├── StatistikaTagasiside.jsx   # Kasutajate tagasiside analüüs
│   ├── StatistikaTuhistamised.jsx # Tühistamiste analüüs
│   ├── StatistikaKeskkond.jsx     # Keskkonnasensor- ja energiaandmed
│   └── LigipaasPuudub.jsx         # (ka views/bron/ all — kasutatakse inline 403-na)
│
├── BronBookingsService.js      # Mock: broneeringud, taotlused, tagasiside
└── BronStatisticsService.js    # Mock: statistika, ruumide andmed, KPI arvutus
```

---

## 4. Rollimudel

Rollid on defineeritud `src/context/RoleContext.jsx`-is ja salvestatakse `localStorage`-i.

| Roll | Konstant | Kirjeldus |
|------|---------|-----------|
| Külastaja | `GUEST` | Sisselogimata — ainult avalik info |
| Tudeng | `TUDENG` | Üliõpilane — broneeringud + taotlused |
| Töötaja / õppejõud | `TOOTAJA` | Uni-ID kasutaja, laiem broneerimisõigus |
| Väline kasutaja | `EXT` | Ilma uni-ID-ta — ainult taotlemine |
| Ruumi haldur | `HALDUR` | Oma ruumide statistika + taotluste menetlus |
| Superkasutaja | `SUPER` | Täielik ligipääs — kõik statistika + kõik haldus |

### Rollipõhised õigused

| Funktsioon | GUEST | EXT | TUDENG | TOOTAJA | HALDUR | SUPER |
|------------|:-----:|:---:|:------:|:-------:|:------:|:-----:|
| Avaleht (avalik info) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Otsi ruumi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Broneeri ruum | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Minu broneeringud | — | — | ✓ | ✓ | ✓ | ✓ |
| Minu taotlused | — | ✓ | ✓ | ✓ | — | — |
| Broneeringute haldus | — | — | — | — | ✓ | ✓ |
| Statistika (täis) | — | — | — | — | ✓ | ✓ |
| Avalik populaarseimad ajad | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 5. Marsruutimine

Kõik marsruudid on pesastatud `AppLayout` alla (Sidebar + Topbar püsivad).

```
/                              → Avaleht
/otsi-ruumi                    → OtsiRuumi
/ruum/:id                      → RuumiDetail
/broneeri/:ruum_id?            → BroneeringuVorm
/broneeringud                  → MinuBroneeringud        [canSeeOwnBookings]
/taotlused                     → MinuTaotlused           [canSeeOwnBookings]
/populaarsed-ajad              → AvalikPopulaarsedAjad
/statistika                    → StatistikaLeht          [canSeeFullStatistics]
  ?tab=ulevaade                  └─ StatistikaYlevaade
  ?tab=ruumid                    └─ StatistikaRuumid
  ?tab=populaarsed-ajad          └─ StatistikaPopulaarsedAjad
  ?tab=tagasiside                └─ StatistikaTagasiside
  ?tab=tuhistamised              └─ StatistikaTuhistamised
  ?tab=keskkond                  └─ StatistikaKeskkond
/statistika/ruumid/:id         → StatistikaRuumiDetail   [canSeeFullStatistics]
/statistika/ruumid             → redirect → /statistika?tab=ruumid
/statistika/populaarsed-ajad   → redirect → /statistika?tab=populaarsed-ajad
```

Ligipääsupiirangud rakendatakse iga vaate sees `useRole()` hook-iga — piiratud lehed renderdavad `<LigipaasPuudub />` komponendi.

---

## 6. Andmekiht (mock teenused)

Prototüübis ei ole taustasüsteemi. Kõik andmed on deterministlikult genereeritud juhuslikud näidisandmed.

### `BronStatisticsService.js`
Ekspordib:
- `RUUMID` — ruumide massiiv (kood, hoone, tüüp, mahutavus, arvutikohad)
- `RUUMITYYBID`, `SYNDMUSETYYBID`, `BRONEERINGU_STAATUS` — klassifikaatorid
- `BRONEERINGUD` — kõikide broneeringute massiiv (~3500 tk)
- `getKpiSummary({ ruum_id?, hoone?, kuupäev_alates?, kuupäev_kuni? })` — KPI arvutus filtriga
- `getRuumideSummary()` — ruumide kasutusprocent + broneeringute arv
- `getRoomDetail(id)` — ühe ruumi trend, sündmuste jaotus, viimased broneeringud
- `getGlobalCounts()` — hoonete arv, ruumide arv, broneeringute koguarv

### `BronBookingsService.js`
Ekspordib:
- `getMyBookings(role)` — "minu" broneeringud (tulevased + ajalugu)
- `getMyRequests(role)` — "minu" taotlused (ootab / kinnitatud / tagasi lükatud)
- `getAllRequests()` — kõik taotlused (halduri vaade, menetlusel esimesena)
- `getAllBookings()` — kõik broneeringud halduri tabelivaateks
- `getAllFeedback(ruumid)` — kõigi ruumide tagasiside koos kommentaaridega
- `getRoomFeedback(ruum_id)` — ühe ruumi tagasiside (temperatuur, puhtus, õhk, varustus)

---

## 7. Kujundussüsteem

Kasutatakse TalTech CVI teema `@TalTech-IT/styleguide` v11.11.2 paketti (GitHub Packages).  
Paketi konfiguratsioon: `.npmrc` — `@TalTech-IT:registry=https://npm.pkg.github.com`

### CVI komponendid kasutusel
`ConfigProvider`, `Tabs`, `TabPanel`, `Badge`, `StatusTag`, `TTNewButton`

### Kohandatud CSS klassid (`src/index.css`)

| Klass | Kirjeldus |
|-------|-----------|
| `.bron-page` | Lehekülje kontainer (maks-laius, padding) |
| `.bron-page-header` | Pealkiri + tegevusnupud reana |
| `.bron-card` | Valge kaart varjuga |
| `.bron-kpi-grid` | KPI kaartide 6-veeruline grid |
| `.bron-otsi-grid` | 2-veeruline grid (otsing, trendigraafik) |
| `.bron-toolaud-grid` | 2-veeruline töölaua grid |
| `.bron-table` + `.bron-table-wrap` | Tabelistiil |
| `.bron-sidebar` | Vasakpoolne navigatsioonipaneel |
| `.bron-empty` | Tühja nimekirja teade |
| `.bron-btn` | Nupu alusstiil |

### Mobiilibreakpointid
- `≤ 768px` — sidebar peidetud (`display: none`), grid-id üheveerguliseks, font-suurused väiksemaks
- `≤ 480px` — täiendav kompaktsioon, väiksemad padingud

---

## 8. Valikute kirjeldused

### Tühistamise modaal (`MinuBroneeringud`)
Kohustuslik põhjuse valimine (klassifikaatorist) + vabatekst kommentaar. Tühistatud broneeringud märgitakse seisuga `tuhistatud` kohalikus `useState`-is.

### Tagasilükkamise modaal (`MinuTaotlused`)
Haldur/super saab taotluse tagasi lükata koos kohustusliku põhjuse ja vabateksti kommentaariga. Lükkamispõhjused on fikseeritud klassifikaatoris.

### Rollipõhine navigatsioon
Haldur ja super näevad sidebarris eraldi sektsioone "Minu" (enda broneeringud) ja "Haldus" (broneeringute haldus). Teised rollid näevad ainult "Minu" sektsiooni.

### Avaleht töölaud (haldur/super)
Sisaldab KPI rida (menetlusel, broneeritud%, tühistamised, kriitilised kommentaarid), menetlusel taotluste nimekirja ja kriitiliste kommentaaride paneeli. Superkasuajale lisaks madalaima hinnanguga ruumide tabel.

---

## 9. Deploy

```
npm run build          # dist/ kausta loomine (Vite)
git add -A
git commit -m "..."
git push               # GitHub → Vercel automaatne deploy
```

**`vercel.json`:**
```json
{
  "buildCommand": "",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

SPA rewrite tagab, et kõik URL-id (sh `/statistika/ruumid/R100`) laevad `index.html` — React Router haldab marsruutimist klientpoolselt.

---

## 10. Arendusvoog

```bash
# Dev server käivitus
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd /Users/kaisa.liiv/Desktop/TalTech/Proovikas/bron-react
npm run dev
# → http://localhost:5174
```

Git repo: `https://github.com/ngkaisa/TalTech-312257.git`  
Live URL: `https://taltech-312257.vercel.app`
