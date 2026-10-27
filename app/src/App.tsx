import { useCallback, useEffect, useRef, useState } from 'react'
import BuildView from './components/BuildView'
import { PartsPage, ToolsPage } from './components/Pages'
import { STEPS } from './data/steps'
import { parseHash, toHash, type Route, type View } from './route'
import type { ViewMode } from './three/ShedScene'

const BASE = import.meta.env.BASE_URL

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  const { view, step: stepIdx, mode } = route
  const routeRef = useRef(route)
  routeRef.current = route
  const [paused, setPaused] = useState(false)
  const [slow, setSlow] = useState(false)
  const [replay, setReplay] = useState(0)

  // URL je jediný zdroj pravdy – po refreshi nebo ze sdíleného odkazu se otevře stejné místo
  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash))
    if (window.location.hash !== toHash(route)) history.replaceState(null, '', toHash(route))
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  const navigate = useCallback((next: Partial<Route>, replace = false) => {
    const r = { ...routeRef.current, ...next }
    const hash = toHash(r)
    if (hash !== window.location.hash) {
      if (replace) history.replaceState(null, '', hash)
      else history.pushState(null, '', hash)
    }
    setRoute(r)
  }, [])

  const setView = useCallback((v: View) => navigate({ view: v }), [navigate])
  const setMode = useCallback((m: ViewMode) => navigate({ mode: m }, true), [navigate])

  useEffect(() => {
    setPaused(false)
  }, [stepIdx])

  const setStep = useCallback(
    (i: number) => navigate({ view: 'build', step: Math.max(0, Math.min(STEPS.length - 1, i)) }),
    [navigate],
  )

  useEffect(() => {
    if (view !== 'build') return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') setStep(stepIdx + 1)
      else if (e.key === 'ArrowLeft') setStep(stepIdx - 1)
      else if (e.key === 'r' || e.key === 'R') setReplay((r) => r + 1)
      else if (e.key === ' ') {
        e.preventDefault()
        setPaused((p) => !p)
      } else return
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, stepIdx, setStep])

  const last = STEPS.length - 1
  const tab = (v: View, label: React.ReactNode, active: boolean, onClick?: () => void) => (
    <button className={active ? 'tab active' : 'tab'} onClick={onClick ?? (() => setView(v))}>
      {label}
    </button>
  )

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <b>DOMEK HEROLD</b>
            <small>P 3322_A · zahradní domek 221 × 327 cm</small>
          </div>
        </div>
        <nav className="tabs">
          {tab('tools', 'Nářadí', view === 'tools')}
          {tab('parts', 'Díly', view === 'parts')}
          {tab(
            'build',
            <>
              Stavba{' '}
              <span className="tab-count">
                {stepIdx + 1}/{STEPS.length}
              </span>
            </>,
            view === 'build' && stepIdx !== last,
            () => setStep(view === 'build' && stepIdx === last ? 0 : stepIdx),
          )}
          {tab('build', 'Hotovo', view === 'build' && stepIdx === last, () => setStep(last))}
        </nav>
        <div className="top-right">
          <div className="seg" role="group" aria-label="Vzhled modelu">
            <button className={mode === 'navod' ? 'on' : ''} onClick={() => setMode('navod')}>
              Návod
            </button>
            <button className={mode === 'drevo' ? 'on' : ''} onClick={() => setMode('drevo')}>
              Dřevo
            </button>
          </div>
          <a className="pdf-link" href={`${BASE}manual/navod.pdf`} target="_blank" rel="noreferrer" title="Originální návod (PDF)">
            PDF
          </a>
        </div>
      </header>

      <main>
        {view === 'tools' && <ToolsPage onStart={() => setView('parts')} />}
        {view === 'parts' && <PartsPage onStart={() => setView('build')} />}
        {view === 'build' && (
          <BuildView
            stepIdx={stepIdx}
            setStep={setStep}
            mode={mode}
            paused={paused}
            setPaused={setPaused}
            slow={slow}
            setSlow={setSlow}
            replay={replay}
            doReplay={() => setReplay((r) => r + 1)}
          />
        )}
      </main>
    </div>
  )
}
