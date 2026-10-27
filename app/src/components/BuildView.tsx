import { Suspense, lazy, useCallback, useState } from 'react'
import { STEPS, type Step } from '../data/steps'
import { PART_BY_NO } from '../data/parts'
import { TOOL_BY_ID } from '../data/tools'
import { Hex, PartIcon, ToolIcon } from './Icons'
import type { ViewMode } from '../three/ShedScene'

const ShedScene = lazy(() => import('../three/ShedScene'))
const BASE = import.meta.env.BASE_URL

const FLAG_LABEL = { vrtani: 'Vrtání', rezani: 'Řezání', sroubovani: 'Šroubování' } as const

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
  const [zoom, setZoom] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const last = p.stepIdx === STEPS.length - 1
  const chips = step.parts.filter((x) => typeof x.qty === 'number' && (PART_BY_NO.get(x.no)?.kind ?? 'vrut') !== 'vrut').slice(0, 4)

  return (
    <div className="build">
      <section className="viewer">
        <Suspense fallback={<div className="loading">Načítám 3D model…</div>}>
          <ShedScene stepIdx={p.stepIdx} mode={p.mode} paused={p.paused} slow={p.slow} replay={p.replay} onReady={onReady} />
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
        <div className="panel-scroll">
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
                      <b>{sp.qty !== undefined ? `${sp.qty}×` : ''}</b>
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
          <button className="manual-thumb" onClick={() => setZoom(step.crop)}>
            <img src={`${BASE}manual/${step.crop}.png`} alt={`Výkres z návodu, strana ${step.page}`} loading="lazy" />
            <span>
              Strana {step.page}
              {step.details && step.details.length > 0 && ` · detail ${step.details.join(', ')}`} – kliknutím zvětšíte
            </span>
          </button>
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

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-modal="true">
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-bar">
              <span>Návod, strana {step.page}</span>
              <a href={`${BASE}manual/page-${String(step.page).padStart(2, '0')}.png`} target="_blank" rel="noreferrer">
                Celá strana
              </a>
              <a href={`${BASE}manual/navod.pdf#page=${step.page}`} target="_blank" rel="noreferrer">
                PDF
              </a>
              <button onClick={() => setZoom(null)} aria-label="Zavřít">
                ✕
              </button>
            </div>
            <img src={`${BASE}manual/${zoom}.png`} alt="Výkres z návodu" />
          </div>
        </div>
      )}
    </div>
  )
}
