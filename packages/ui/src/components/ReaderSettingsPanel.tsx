import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { BUILTIN_THEMES } from '@linguapop/core'
import type { ReaderFontFamily, ReaderLayout, ReaderPrefs, ReaderTheme, ReaderViewMode } from '@linguapop/core'

const FONT_FAMILIES: { id: ReaderFontFamily; label: string; css: string }[] = [
  { id: 'serif',    label: 'Serif',    css: 'Georgia, "Times New Roman", serif' },
  { id: 'sans',     label: 'Sans',     css: 'system-ui, -apple-system, "Helvetica Neue", sans-serif' },
  { id: 'mono',     label: 'Mono',     css: 'ui-monospace, "Menlo", monospace' },
  { id: 'dyslexic', label: 'Dyslexic', css: '"OpenDyslexic", "Comic Sans MS", sans-serif' },
]

export function ReaderSettingsPanel({
  prefs,
  onUpdate,
  onAddCustomTheme,
  onRemoveCustomTheme,
  onClose,
}: {
  prefs: ReaderPrefs
  onUpdate: (patch: Partial<ReaderPrefs>) => void
  onAddCustomTheme: (theme: ReaderTheme) => void
  onRemoveCustomTheme: (id: string) => void
  onClose: () => void
}) {
  const allThemes: ReaderTheme[] = [...BUILTIN_THEMES, ...prefs.customThemes]
  const currentTheme = allThemes.find(t => t.id === prefs.themeId) || BUILTIN_THEMES[0]

  // Color tokens derived from the active theme.
  const t = currentTheme
  // Card sits on top of theme.bg. For dark themes lighten with fg-overlay; for light, darken with fg-overlay.
  const cardBg     = t.dark ? withAlpha(t.fg, 0.06)  : withAlpha(t.fg, 0.04)
  const cardBorder = withAlpha(t.muted, 0.35)
  const subtleBg   = t.dark ? withAlpha(t.fg, 0.04)  : withAlpha(t.fg, 0.025)
  const accentSoft = withAlpha(t.accent, t.dark ? 0.28 : 0.18)
  const accentSofter = withAlpha(t.accent, 0.10)
  const dividerColor = withAlpha(t.muted, 0.25)

  // Allow Escape to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close settings"
        onClick={onClose}
        className="absolute inset-0 z-30"
        style={{ background: t.dark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.30)' }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Reader settings"
        className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl shadow-2xl max-h-[88%] flex flex-col"
        style={{
          background: t.bg,
          color: t.fg,
          borderTop: `1px solid ${cardBorder}`,
        }}
      >
        {/* Handle + title bar */}
        <div className="px-4 pt-2 pb-3 shrink-0" style={{ borderBottom: `1px solid ${dividerColor}` }}>
          <div className="mx-auto mb-2 w-10 h-1 rounded-full" style={{ background: withAlpha(t.muted, 0.6) }} />
          <div className="flex items-center">
            <div className="text-sm font-bold">Reader Settings</div>
            <button
              onClick={onClose}
              className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: accentSoft, color: t.fg }}
            >
              Done
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* View */}
          <Card title="View" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <Segmented<ReaderViewMode>
              value={prefs.viewMode}
              options={[
                { id: 'original',   label: 'Original' },
                { id: 'translated', label: 'Translated' },
                { id: 'parallel',   label: 'Parallel' },
              ]}
              onChange={v => onUpdate({ viewMode: v })}
              t={t}
              subtleBg={subtleBg}
              accentSoft={accentSoft}
            />
          </Card>

          {/* Layout */}
          <Card title="Layout" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <Segmented<ReaderLayout>
              value={prefs.layout}
              options={[
                { id: 'scroll', label: 'Scroll' },
                { id: 'paged',  label: 'Paged' },
              ]}
              onChange={v => onUpdate({ layout: v })}
              t={t}
              subtleBg={subtleBg}
              accentSoft={accentSoft}
            />
          </Card>

          {/* Font + Type */}
          <Card title="Typography" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <div className="grid grid-cols-4 gap-2">
              {FONT_FAMILIES.map(f => {
                const active = prefs.fontFamily === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => onUpdate({ fontFamily: f.id })}
                    className="rounded-xl py-2.5 px-2 text-center border-2 transition-all"
                    style={{
                      fontFamily: f.css,
                      background: active ? accentSoft : subtleBg,
                      borderColor: active ? t.accent : 'transparent',
                      color: t.fg,
                    }}
                  >
                    <div className="text-lg leading-none">Aa</div>
                    <div className="text-[10px] mt-1" style={{ color: active ? t.fg : t.muted }}>{f.label}</div>
                  </button>
                )
              })}
            </div>

            <Divider color={dividerColor} />

            <Slider label="Size"           value={prefs.fontSize}        min={12}  max={32}   step={1}     unit="px"  t={t} subtleBg={subtleBg} onChange={v => onUpdate({ fontSize: v })} />
            <Slider label="Line height"    value={prefs.lineHeight}      min={1.2} max={2.4}  step={0.05}             t={t} subtleBg={subtleBg} onChange={v => onUpdate({ lineHeight: v })} />
            <Slider label="Letter spacing" value={prefs.letterSpacing}   min={-0.05} max={0.2} step={0.01} unit="em"  t={t} subtleBg={subtleBg} onChange={v => onUpdate({ letterSpacing: v })} />
            <Slider label="Paragraph gap"  value={prefs.paragraphSpacing} min={0.4} max={2.4}  step={0.1}  unit="em"  t={t} subtleBg={subtleBg} onChange={v => onUpdate({ paragraphSpacing: v })} />
            <Slider label="Column width"   value={prefs.maxWidth}        min={420} max={1100} step={20}    unit="px"  t={t} subtleBg={subtleBg} onChange={v => onUpdate({ maxWidth: v })} />
          </Card>

          {/* Themes */}
          <Card title="Theme — applies app-wide" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <div className="grid grid-cols-3 gap-2">
              {allThemes.map(item => {
                const active = prefs.themeId === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => onUpdate({ themeId: item.id })}
                    className="rounded-xl overflow-hidden text-left relative transition-all"
                    style={{
                      background: item.bg,
                      color: item.fg,
                      borderWidth: 2,
                      borderStyle: 'solid',
                      borderColor: active ? item.accent : withAlpha(item.muted, 0.35),
                      boxShadow: active ? `0 0 0 3px ${withAlpha(item.accent, 0.25)}` : 'none',
                    }}
                  >
                    <div className="px-3 py-2.5">
                      <div className="font-semibold leading-snug" style={{ fontSize: 13 }}>Aa</div>
                      <div className="text-[10px] truncate mt-1" style={{ color: item.muted }}>{item.name}</div>
                    </div>
                    <div className="h-1.5" style={{ background: item.accent }} />
                    {item.custom && (
                      <span
                        onClick={e => { e.stopPropagation(); onRemoveCustomTheme(item.id) }}
                        className="absolute top-1 right-1.5 text-xs leading-none cursor-pointer opacity-60 hover:opacity-100"
                        style={{ color: item.fg }}
                      >
                        ×
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                onClick={() => {
                  const id = 'custom-' + Math.random().toString(36).slice(2, 8)
                  onAddCustomTheme({
                    id, name: 'Custom',
                    bg: t.bg, fg: t.fg, accent: t.accent, muted: t.muted,
                    dark: t.dark, custom: true,
                  })
                  onUpdate({ themeId: id })
                }}
                className="rounded-xl border-2 border-dashed py-3 text-xs font-semibold transition-colors"
                style={{
                  borderColor: withAlpha(t.muted, 0.5),
                  color: t.fg,
                  background: subtleBg,
                }}
              >
                + Custom
              </button>
            </div>

            {currentTheme.custom && (
              <>
                <Divider color={dividerColor} />
                <div className="flex flex-col gap-2.5">
                  <ColorRow label="Background" value={currentTheme.bg}     muted={t.muted} onChange={v => updateCustomColor(prefs, currentTheme.id, 'bg', v, onAddCustomTheme)} />
                  <ColorRow label="Text"       value={currentTheme.fg}     muted={t.muted} onChange={v => updateCustomColor(prefs, currentTheme.id, 'fg', v, onAddCustomTheme)} />
                  <ColorRow label="Accent"     value={currentTheme.accent} muted={t.muted} onChange={v => updateCustomColor(prefs, currentTheme.id, 'accent', v, onAddCustomTheme)} />
                </div>
              </>
            )}
          </Card>

          {/* Japanese */}
          <Card title="Japanese learning" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <Toggle label="Color words by JLPT level"   checked={prefs.coloriseJapanese}      onChange={v => onUpdate({ coloriseJapanese: v })}      t={t} subtleBg={subtleBg} />
            {prefs.coloriseJapanese && <JlptLegend muted={t.muted} subtleBg={subtleBg} />}
          </Card>

          {/* Behavior */}
          <Card title="Behavior" muted={t.muted} cardBg={cardBg} cardBorder={cardBorder}>
            <Toggle label="Tap paragraph to translate"  checked={prefs.tapToTranslate}        onChange={v => onUpdate({ tapToTranslate: v })}        t={t} subtleBg={subtleBg} />
            <Toggle label="Show furigana / rubies"      checked={prefs.showRubies}            onChange={v => onUpdate({ showRubies: v })}            t={t} subtleBg={subtleBg} />
            <Divider color={dividerColor} />
            <Slider label="TTS speed" value={prefs.ttsRate} min={0.5} max={2} step={0.05} t={t} subtleBg={subtleBg} onChange={v => onUpdate({ ttsRate: v })} />
          </Card>
        </div>
      </div>
    </>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────────

function Card({
  title, muted, cardBg, cardBorder, children,
}: {
  title: string; muted: string; cardBg: string; cardBorder: string; children: ReactNode
}) {
  return (
    <section
      className="rounded-2xl p-3.5 flex flex-col gap-2.5"
      style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
    >
      <h3 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: muted }}>{title}</h3>
      {children}
    </section>
  )
}

function Divider({ color }: { color: string }) {
  return <div className="my-1 h-px w-full" style={{ background: color }} />
}

function Segmented<T extends string>({
  value, options, onChange, t, subtleBg, accentSoft,
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  t: ReaderTheme
  subtleBg: string
  accentSoft: string
}) {
  return (
    <div className="flex rounded-xl p-1 gap-1" style={{ background: subtleBg }}>
      {options.map(o => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg transition-colors"
            style={{
              background: active ? t.accent : 'transparent',
              color: active ? readableOn(t.accent) : t.fg,
              boxShadow: active ? `0 1px 2px ${accentSoft}` : 'none',
            }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Slider({
  label, value, min, max, step, unit, onChange, t, subtleBg,
}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string
  onChange: (v: number) => void
  t: ReaderTheme; subtleBg: string
}) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-28 shrink-0" style={{ color: t.muted }}>{label}</span>
      <input
        type="range"
        value={value}
        min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: t.accent, background: subtleBg }}
      />
      <span
        className="w-16 text-right tabular-nums font-semibold px-2 py-0.5 rounded"
        style={{ background: subtleBg, color: t.fg }}
      >
        {value.toFixed(step < 1 ? 2 : 0)}{unit || ''}
      </span>
    </label>
  )
}

function Toggle({
  label, checked, onChange, t, subtleBg,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void
  t: ReaderTheme; subtleBg: string
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-xs py-1.5 px-2 -mx-2 text-left rounded-lg transition-colors"
      onMouseEnter={e => { e.currentTarget.style.background = subtleBg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      <span
        className="w-10 h-6 rounded-full relative transition-colors shrink-0"
        style={{ background: checked ? t.accent : withAlpha(t.muted, 0.35) }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm"
          style={{ left: checked ? '18px' : '2px' }}
        />
      </span>
      <span style={{ color: t.fg }}>{label}</span>
    </button>
  )
}

function JlptLegend({ muted, subtleBg }: { muted: string; subtleBg: string }) {
  const items: { level: string; color: string }[] = [
    { level: 'N5', color: '#0d9488' },
    { level: 'N4', color: '#16a34a' },
    { level: 'N3', color: '#ca8a04' },
    { level: 'N2', color: '#ea580c' },
    { level: 'N1', color: '#dc2626' },
  ]
  return (
    <div className="flex items-center gap-1.5 mt-1 px-2 py-1.5 rounded-lg" style={{ background: subtleBg }}>
      {items.map(i => (
        <span key={i.level} className="flex items-center gap-1 text-[10px] font-semibold">
          <span className="inline-block w-2 h-2 rounded-full" style={{ background: i.color }} />
          <span style={{ color: i.color }}>{i.level}</span>
        </span>
      ))}
      <span className="ml-auto text-[10px]" style={{ color: muted }}>easiest → hardest</span>
    </div>
  )
}

function ColorRow({
  label, value, muted, onChange,
}: {
  label: string; value: string; muted: string; onChange: (v: string) => void
}) {
  return (
    <label className="flex items-center gap-3 text-xs">
      <span className="w-24 shrink-0" style={{ color: muted }}>{label}</span>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-9 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-transparent outline-none font-mono"
        style={{ border: `1px solid ${withAlpha(muted, 0.35)}` }}
      />
    </label>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function updateCustomColor(
  prefs: ReaderPrefs,
  themeId: string,
  key: 'bg' | 'fg' | 'accent',
  value: string,
  setter: (theme: ReaderTheme) => void,
) {
  const existing = prefs.customThemes.find(t => t.id === themeId)
  if (!existing) return
  setter({ ...existing, [key]: value })
}

/** Apply an alpha component to a hex / named color, returning rgba(). */
function withAlpha(color: string, alpha: number): string {
  const hex = color.trim()
  if (hex.startsWith('#')) {
    const h = hex.slice(1)
    const expand = h.length === 3 ? h.split('').map(c => c + c).join('') : h
    const r = parseInt(expand.slice(0, 2), 16)
    const g = parseInt(expand.slice(2, 4), 16)
    const b = parseInt(expand.slice(4, 6), 16)
    if ([r, g, b].some(n => Number.isNaN(n))) return color
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  // For non-hex colors (named, rgb()) we just fall back — alpha won't apply
  // but the visuals will still render in a sane way.
  return color
}

/** Pick a foreground that has decent contrast on the given background hex. */
function readableOn(bg: string): string {
  const hex = bg.trim()
  if (!hex.startsWith('#')) return '#ffffff'
  const h = hex.slice(1)
  const expand = h.length === 3 ? h.split('').map(c => c + c).join('') : h
  const r = parseInt(expand.slice(0, 2), 16)
  const g = parseInt(expand.slice(2, 4), 16)
  const b = parseInt(expand.slice(4, 6), 16)
  if ([r, g, b].some(n => Number.isNaN(n))) return '#ffffff'
  // Perceived luminance.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#1c1917' : '#ffffff'
}
