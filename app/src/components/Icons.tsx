import type { PartKind } from '../data/parts'
import type { ToolId } from '../data/tools'

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const }

export function PartIcon({ kind, size = 44 }: { kind: PartKind; size?: number }) {
  const body = (() => {
    switch (kind) {
      case 'hranol':
        return <path {...S} d="M4 26 L30 12 L40 16 L14 30 Z M14 30 L14 36 L4 32 L4 26 M14 36 L40 22 L40 16" />
      case 'prkno':
        return <path {...S} d="M4 27 L34 13 L40 15 L10 29 Z M10 29 L10 31 L4 29 L4 27 M10 31 L40 17 L40 15" />
      case 'palubka':
        return <path {...S} d="M3 26 L33 12 L41 15 L11 29 Z M11 29 L11 31 L3 28 M11 31 L41 17 L41 15 M7 27.5 L37 13.5" />
      case 'modul':
        return <path {...S} d="M6 12 L38 12 L38 32 L6 32 Z M6 18.7 L38 18.7 M6 25.3 L38 25.3" />
      case 'okno':
        return <path {...S} d="M5 8 L39 8 L39 36 L5 36 Z M13 15 L31 15 L31 27 L13 27 Z M5 13 L13 13 M31 13 L39 13 M5 31 L39 31" />
      case 'stit':
        return <path {...S} d="M4 30 L40 30 L40 12 Z M10 30 L10 26.5 M16 30 L16 23 M22 30 L22 19.5 M28 30 L28 16 M34 30 L34 12.5" />
      case 'dvere':
        return <path {...S} d="M12 4 L32 4 L32 40 L12 40 Z M12 11 L32 11 M12 33 L32 33 M12 33 L32 11 M17 4 L17 40 M22 4 L22 40 M27 4 L27 40" />
      case 'logo':
        return <path {...S} d="M8 18 L13 12 L31 12 L36 18 L36 26 L31 32 L13 32 L8 26 Z M15 22 a7 4 0 1 0 14 0 a7 4 0 1 0 -14 0" />
      case 'zaves':
        return <path {...S} d="M6 18 L30 20 L30 24 L6 26 Z M30 12 L36 12 L36 32 L30 32 Z M33 12 L33 32" />
      case 'petlice':
        return <path {...S} d="M8 16 L24 16 L24 28 L8 28 Z M14 22 L36 22 M30 15 L36 15 L36 29 L30 29" />
      case 'vrut':
        return <path {...S} d="M6 14 L11 9 L14 12 L9 17 Z M12 15 L36 37 M15 17 L18 15 M19 21 L22 19 M23 25 L26 23 M27 29 L30 27" />
      case 'podlozka':
        return <path {...S} d="M6 22 L22 14 L38 22 L22 30 Z M6 22 L6 25 L22 33 L38 25 L38 22" />
      case 'vrtak':
        return <path {...S} d="M6 30 L18 22 M18 22 L38 10 M21 20 L24 22 M26 17 L29 19 M31 14 L34 16" />
    }
  })()
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  )
}

export function ToolIcon({ id, size = 40 }: { id: ToolId; size?: number }) {
  const body = (() => {
    switch (id) {
      case 'vrtacka':
        return <path {...S} d="M8 12 L30 12 L30 20 L8 20 Z M30 15 L38 15 M14 20 L12 34 L20 34 L20 20" />
      case 'vrtak':
        return <path {...S} d="M6 30 L18 22 M18 22 L38 10 M21 20 L24 22 M26 17 L29 19 M31 14 L34 16" />
      case 'sroubovak':
        return <path {...S} d="M8 32 L16 24 M14 22 L18 26 L12 32 L8 32 L8 28 Z M17 23 L34 6" />
      case 'metr':
        return <path {...S} d="M6 12 L28 12 L28 32 L6 32 Z M17 22 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0 M28 28 L40 28 L40 32 L28 32 M32 28 L32 30 M36 28 L36 30" />
      case 'vodovaha':
        return <path {...S} d="M4 16 L40 16 L40 26 L4 26 Z M17 19 L27 19 L27 23 L17 23 Z M22 19 L22 23" />
      case 'podpery':
        return <path {...S} d="M12 6 L12 38 M6 38 L18 38 M12 14 L30 38 M24 38 L36 38" />
      case 'zebrik':
        return <path {...S} d="M12 4 L8 40 M32 4 L36 40 M11.5 10 L32.5 10 M10.5 18 L33.5 18 M9.6 26 L34.4 26 M8.7 34 L35.3 34" />
      case 'pila':
        return <path {...S} d="M6 26 L32 14 L38 18 L12 32 Z M32 14 L34 8 L40 10 L38 18 M10 30 L11 33 M15 28 L16 31 M20 26 L21 29 M25 24 L26 27" />
      case 'kladivo':
        return <path {...S} d="M8 10 L22 10 L22 18 L8 18 Z M15 18 L15 38" />
      case 'palicka':
        return <path {...S} d="M6 8 L24 8 L24 20 L6 20 Z M15 20 L15 38" />
      case 'nuz':
        return <path {...S} d="M6 30 L18 24 L22 28 L10 34 Z M18 24 L38 12 L34 22 L22 28" />
      case 'kleste':
        return <path {...S} d="M20 6 L16 20 L8 38 M24 6 L28 20 L36 38 M16 20 L28 20" />
      case 'rukavice':
        return <path {...S} d="M12 38 L12 18 L14 8 L17 8 L17 18 L19 6 L22 6 L22 18 L24 7 L27 7 L27 19 L29 11 L32 12 L30 28 L28 38 Z" />
    }
  })()
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-hidden="true">
      {body}
    </svg>
  )
}

export function Hex({ n, small }: { n: number | string; small?: boolean }) {
  return <span className={small ? 'hex hex-sm' : 'hex'}>{n}</span>
}
