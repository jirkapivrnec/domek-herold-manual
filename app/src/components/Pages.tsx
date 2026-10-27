import { useState } from 'react'
import { PARTS, SPECS } from '../data/parts'
import { TOOLS } from '../data/tools'
import { STEPS } from '../data/steps'
import { Hex, PartIcon, ToolIcon } from './Icons'

const BASE = import.meta.env.BASE_URL

const CHECK_KEY = 'herold-dily-zkontrolovano'

function usedIn(no: number) {
  return STEPS.flatMap((s, i) => (s.parts.some((p) => p.no === no) ? [{ i, label: `${s.manual}${s.sub ?? ''}` }] : []))
}

// odškrtnuté díly si pamatuje jen tento prohlížeč
function useChecked() {
  const [checked, setChecked] = useState<Set<number>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(CHECK_KEY) ?? '[]'))
    } catch {
      return new Set()
    }
  })
  const toggle = (no: number) =>
    setChecked((cur) => {
      const next = new Set(cur)
      if (next.has(no)) next.delete(no)
      else next.add(no)
      try {
        localStorage.setItem(CHECK_KEY, JSON.stringify([...next]))
      } catch {
        /* úložiště nemusí být dostupné */
      }
      return next
    })
  return [checked, toggle] as const
}

export function ToolsPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Nářadí</h1>
        <p>
          Seznam podle návodu (str. 2 – „Nástroje a příprava komponentů“). Vrták Ø5 mm je součástí dodávky. Návod doporučuje
          předvrtávat otvory pro vruty průměru 5 a 6 mm.
        </p>
      </div>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <div className="tool-card" key={t.id}>
            <ToolIcon id={t.id} size={48} />
            <b>{t.name}</b>
            {t.note && <small>{t.note}</small>}
          </div>
        ))}
      </div>
      <div className="page-head">
        <h2>Technické údaje (str. 1)</h2>
      </div>
      <dl className="specs">
        {SPECS.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <button className="next wide" onClick={onStart}>
        <span className="check">✓</span>Mám nářadí, jdeme na díly<span className="arrow">→</span>
      </button>
    </div>
  )
}

const GROUPS: [string, number, number][] = [
  ['Hranoly a prkna', 1, 22],
  ['Moduly a sestavy', 23, 28],
  ['Kování', 29, 30],
  ['Spojovací materiál a ostatní', 31, 43],
]

export function PartsPage({ onStart, onStep }: { onStart: () => void; onStep: (i: number) => void }) {
  const [checked, toggle] = useChecked()
  return (
    <div className="page">
      <div className="page-head">
        <h1>Díly</h1>
        <p>
          Seznam dodaného materiálu (str. 3–6). Před montáží zkontrolujte počty kusů a zkontrolované díly si odškrtněte.
          Pakety bloků rozeberte až těsně před montáží. Tlačítka s čísly kroků u každého dílu otevřou krok, kde se díl používá.
        </p>
        <div className="buy-note">
          <b>Dokupte:</b> střešní krytina není součástí dodávky (str. 1). Návod doporučuje lišty střechy montovat až po
          krytině (krok 9).
        </div>
        <p className="check-count">
          Zkontrolováno {checked.size} z {PARTS.length} položek
        </p>
      </div>
      {GROUPS.map(([title, a, b]) => (
        <section key={title}>
          <h2>{title}</h2>
          <div className="parts-table">
            {PARTS.filter((p) => p.no >= a && p.no <= b).map((p) => (
              <div className={checked.has(p.no) ? 'part-row checked' : 'part-row'} key={p.no}>
                <label className="part-check">
                  <input type="checkbox" checked={checked.has(p.no)} onChange={() => toggle(p.no)} aria-label={`Zkontrolováno: ${p.name}`} />
                </label>
                <PartIcon kind={p.kind} size={40} />
                <Hex n={p.no} />
                <div className="part-name">
                  {p.name}
                  {p.note && <em>{p.note}</em>}
                  <small>{p.code}</small>
                </div>
                <span className="part-steps">
                  {usedIn(p.no).map((u) => (
                    <button key={u.i} onClick={() => onStep(u.i)} title="Otevřít krok">
                      {u.label}
                    </button>
                  ))}
                </span>
                <b>{p.qty}×</b>
              </div>
            ))}
          </div>
        </section>
      ))}
      <h2>Originální soupis</h2>
      <div className="manual-pages">
        {[3, 4, 5, 6].map((n) => (
          <a key={n} href={`${BASE}manual/page-${String(n).padStart(2, '0')}.png`} target="_blank" rel="noreferrer">
            <img src={`${BASE}manual/page-${String(n).padStart(2, '0')}.png`} alt={`Návod strana ${n}`} loading="lazy" />
            <span>Strana {n}</span>
          </a>
        ))}
      </div>
      <button className="next wide" onClick={onStart}>
        <span className="check">✓</span>Díly mám, začít stavět<span className="arrow">→</span>
      </button>
    </div>
  )
}
