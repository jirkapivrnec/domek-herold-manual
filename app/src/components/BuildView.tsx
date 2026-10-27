import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { STEPS, type Step } from '../data/steps'
import { PART_BY_NO } from '../data/parts'
import { TOOL_BY_ID } from '../data/tools'
import { Hex, PartIcon, ToolIcon } from './Icons'
import type { ViewMode } from '../three/ShedScene'

const ShedScene = lazy(() => import('../three/ShedScene'))
const BASE = import.meta.env.BASE_URL

const FLAG_LABEL = { vrtani: 'Vrtání', rezani: 'Řezání', sroubovani: 'Šroubování' } as const

// výřezy detailů z výkresů (tools/manual_images.py); A a B, O a P jsou na jednom výřezu
const DETAIL_IMG: Record<string, string> = { A: 'AB', B: 'AB', O: 'OP', P: 'OP' }

type Sheet = { src: string; label: string }

function sheetsFor(s: Step): Sheet[] {
  const details = [...new Set((s.details ?? []).map((d) => DETAIL_IMG[d] ?? d))]
  return [
    ...details.map((d) => ({ src: `${BASE}manual/detail-${d}.png`, label: `Detail ${d.split('').join(' a ')}` })),
    { src: `${BASE}manual/${s.crop}.png`, label: `Strana ${s.page}` },
  ]
}

export function stepTag(s: Step) {
  if (s.manual === 'P') return 'Příprava'
  if (s.manual === '✓') return 'Hotovo'
  return `Krok ${s.manual}${s.sub ?? ''}`
}

type Props = {
  stepIdx: number
  setStep: (i: number) => void
  mode: ViewMode
  paused: boolean
  setPaused: (p: boolean) => void
  slow: boolean
  setSlow: (s: boolean) => void
  replay: number
  doReplay: () => void
}

export default function BuildView(p: Props) {
  const step = STEPS[p.stepIdx]
  const [zoom, setZoom] = useState<number | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [camKey, setCamKey] = useState(0)
  const [ready, setReady] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<HTMLElement>(null)
  const firstStep = useRef(true)
  const sheets = sheetsFor(step)
  const onReady = useCallback(() => setReady(true), [])
  const last = p.stepIdx === STEPS.length - 1

  // při změně kroku: panel nahoru, na mobilu posunout stránku na 3D, zavřít lightbox
  useEffect(() => {
    setZoom(null)
    panelRef.current?.scrollTo({ top: 0 })
    if (firstStep.current) {
      firstStep.current = false
      return
    }
    const v = viewerRef.current
    if (v && window.matchMedia('(max-width: 860px)').matches && v.getBoundingClientRect().top < 0)
      window.scrollTo({ top: window.scrollY + v.getBoundingClientRect().top - 8 })
  }, [p.stepIdx])

  // lightbox: Esc zavře, šipky přepínají obrázky (ne kroky)
  useEffect(() => {
    if (zoom === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoom(null)
      else if (e.key === 'ArrowRight') setZoom((z) => ((z ?? 0) + 1) % sheets.length)
      else if (e.key === 'ArrowLeft') setZoom((z) => ((z ?? 0) - 1 + sheets.length) % sheets.length)
      else if (e.key !== ' ' && e.key !== 'r' && e.key !== 'R') return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [zoom, sheets.length])

  const chips = step.parts.filter((x) => typeof x.qty === 'number' && (PART_BY_NO.get(x.no)?.kind ?? 'vrut') !== 'vrut').slice(0, 4)

  return (
    <div className="build">
      <section className="viewer" ref={viewerRef}>
        <Suspense fallback={<div className="loading">Načítám 3D model…</div>}>
          <ShedScene
            stepIdx={p.stepIdx}
            mode={p.mode}
            paused={p.paused}
            slow={p.slow}
            replay={p.replay}
            camKey={camKey}
            onReady={onReady}
          />
        </Suspense>
        {!ready && <div className="loading loading-over">Načítám 3D model…</div>}

        <div className="overlay-top">
          <div className="big-num">
            {step.manual}
            {step.sub && <small>{step.sub}</small>}
          </div>
          <div className="caption">
            <span className="caption-tag">{stepTag(step)}.</span> {step.title}
          </div>
        </div>
        {chips.length > 0 && (
          <div className="chips">
            {chips.map((c) => {
              const part = PART_BY_NO.get(c.no)!
              return (
                <div className="chip" key={c.no} title={part.name}>
                  <PartIcon kind={part.kind} size={34} />
                  <span>
                    <Hex n={c.no} small /> {c.qty}×
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div className="controls">
          <button className="round" onClick={p.doReplay} title="Přehrát znovu (R)" aria-label="Přehrát znovu">
            ↻
          </button>
          <button className="round" onClick={() => p.setPaused(!p.paused)} title="Pauza (mezerník)" aria-label="Pauza">
            {p.paused ? '▶' : 'Ⅱ'}
          </button>
          <button className={p.slow ? 'pill on' : 'pill'} onClick={() => p.setSlow(!p.slow)}>
            Pomalu
          </button>
          <button className="pill" onClick={() => setCamKey((k) => k + 1)} title="Vrátit kameru do výchozího pohledu kroku">
            Výchozí pohled
          </button>
          <span className="hint">Táhnutím otáčejte, kolečkem přibližujte</span>
        </div>

        <div className="progress" role="tablist" aria-label="Kroky">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={i === p.stepIdx ? 'dot cur' : i < p.stepIdx ? 'dot done' : 'dot'}
              title={`${stepTag(s)} – ${s.title}`}
              onClick={() => p.setStep(i)}
              aria-label={`${stepTag(s)} – ${s.title}`}
            />
          ))}
        </div>
      </section>

      <aside className="panel">
        <div className="panel-scroll" ref={panelRef}>
          <div className="panel-meta">
            <span>
              {stepTag(step)} · {p.stepIdx + 1} z {STEPS.length}
            </span>
            <span className="page-ref">návod str. {step.page}</span>
          </div>
          <h1>{step.title}</h1>
          <p className="lead">{step.lead}</p>

          {step.flags && step.flags.length > 0 && (
            <div className="flags">
              {step.flags.map((f) => (
                <span key={f} className={`flag flag-${f}`}>
                  {FLAG_LABEL[f]}
                </span>
              ))}
            </div>
          )}

          {step.quote && (
            <blockquote>
              <span>Z návodu</span>„{step.quote}“
            </blockquote>
          )}

          {step.parts.length > 0 && (
            <>
              <h2>Potřebujete</h2>
              <ul className="need">
                {step.parts.map((sp) => {
                  const part = PART_BY_NO.get(sp.no)!
                  return (
                    <li key={sp.no}>
                      <PartIcon kind={part.kind} size={40} />
                      <Hex n={sp.no} />
                      <div className="need-name">
                        {part.name}
                        {sp.note && <small>{sp.note}</small>}
                      </div>
                      {sp.qty !== undefined ? (
                        <b>{sp.qty}×</b>
                      ) : (
                        <span className="need-total" title="Návod počet pro tento krok neuvádí">
                          v balení
                          <br />
                          {part.qty} ks
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {step.tools.length > 0 && (
            <div className="tool-row">
              {step.tools.map((t) => (
                <span key={t} className="tool-chip" title={TOOL_BY_ID.get(t)?.name}>
                  <ToolIcon id={t} size={22} />
                  {TOOL_BY_ID.get(t)?.name}
                </span>
              ))}
            </div>
          )}

          <h2>Postup</h2>
          <ul className="bullets">
            {step.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          {step.note && (
            <div className="note">
              <b>Poznámka (není v návodu):</b> {step.note}
            </div>
          )}

          <h2>Výkres z návodu</h2>
          <div className={sheets.length > 1 ? 'sheets' : 'sheets one'}>
            {sheets.map((sh, i) => (
              <button key={sh.src} className="manual-thumb" onClick={() => setZoom(i)}>
                <img src={sh.src} alt={`Výkres z návodu – ${sh.label}`} loading="lazy" />
                <span>{sh.label} – zvětšit</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel-foot">
          <div className="nav-row">
            <button className="back" disabled={p.stepIdx === 0} onClick={() => p.setStep(p.stepIdx - 1)} aria-label="Předchozí krok">
              ←
            </button>
            <button className="next" disabled={last} onClick={() => p.setStep(p.stepIdx + 1)}>
              <span className="check">✓</span>
              {last ? 'Domek je hotový' : 'Hotovo, další krok'}
              <span className="arrow">→</span>
            </button>
          </div>
          <div className="keys">
            <kbd>←</kbd>
            <kbd>→</kbd> pohyb · <kbd>R</kbd> přehrát · <kbd>mezerník</kbd> pauza
          </div>
        </div>
      </aside>

      {zoom !== null && sheets[zoom] && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-bar">
              <span>
                {sheets[zoom].label}
                {sheets[zoom].label.startsWith('Detail') && ` · návod str. ${step.page}`}
              </span>
              {sheets.length > 1 && (
                <span className="lb-nav">
                  <button onClick={() => setZoom((zoom - 1 + sheets.length) % sheets.length)} aria-label="Předchozí obrázek">
                    ‹
                  </button>
                  {zoom + 1}/{sheets.length}
                  <button onClick={() => setZoom((zoom + 1) % sheets.length)} aria-label="Další obrázek">
                    ›
                  </button>
                </span>
              )}
              <a href={`${BASE}manual/page-${String(step.page).padStart(2, '0')}.png`} target="_blank" rel="noreferrer">
                Celá strana
              </a>
              <a href={`${BASE}manual/navod.pdf#page=${step.page}`} target="_blank" rel="noreferrer">
                PDF
              </a>
              <button onClick={() => setZoom(null)} aria-label="Zavřít (Esc)">
                ✕
              </button>
            </div>
            <div className={zoomed ? 'lb-img zoomed' : 'lb-img'} onClick={() => setZoomed(!zoomed)}>
              <img src={sheets[zoom].src} alt={`Výkres z návodu – ${sheets[zoom].label}`} />
            </div>
            <div className="lb-hint">Kliknutím na obrázek přiblížíte · Esc zavře</div>
          </div>
        </div>
      )}
    </div>
  )
}
