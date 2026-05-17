import { useCallback, useEffect, useState } from 'react'
import { useNovels, useReaderPrefs } from '@linguapop/core'
import type { AddNovelInput, Chapter, NovelBody, NovelMeta } from '@linguapop/core'
import { Library } from '../views/Library'
import { Reader } from '../views/Reader'
import { ImportNovelPanel } from './ImportNovelPanel'
import { ReaderSettingsPanel } from './ReaderSettingsPanel'

/**
 * Self-contained library + import flow + reader overlay — the entirety of the
 * app now lives inside this component.
 *
 * - Library is the home screen (list of imported novels + import button).
 * - Import opens as an in-place panel.
 * - Opening a novel renders the Reader as an absolute overlay inside the same
 *   container, so the settings sheet, popovers, etc. all stay constrained.
 * - The settings panel can also be opened from the Library header (so the
 *   user can pick a theme without having to open a novel first).
 */
export function ReadTab() {
  const { novels, add, remove, updateMeta, getBody, updateChapter } = useNovels()
  const { prefs, update, addCustomTheme, removeCustomTheme } = useReaderPrefs()
  const [importOpen, setImportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [body, setBody] = useState<NovelBody | null>(null)
  const [bodyLoading, setBodyLoading] = useState(false)

  // Load body when a novel is opened.
  useEffect(() => {
    if (!openId) { setBody(null); return }
    let cancelled = false
    setBodyLoading(true)
    getBody(openId).then(b => {
      if (!cancelled) {
        setBody(b || null)
        setBodyLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [openId, getBody])

  const open = (n: NovelMeta) => setOpenId(n.id)
  const closeReader = () => setOpenId(null)

  const handleAdd = async (input: AddNovelInput) => {
    await add(input)
  }

  const openedMeta = novels.find(n => n.id === openId)

  // Stable callback identities — Reader's effects depend on these and would loop if they changed each render.
  const handleUpdateMeta = useCallback((patch: Partial<NovelMeta>) => {
    if (openId) updateMeta(openId, patch)
  }, [openId, updateMeta])
  const handleUpdateChapter = useCallback((idx: number, patch: Partial<Chapter>) => {
    if (openId) updateChapter(openId, idx, patch)
  }, [openId, updateChapter])

  return (
    <>
      <Library
        novels={novels}
        onOpen={open}
        onRemove={remove}
        onAddClick={() => setImportOpen(true)}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {importOpen && (
        <ImportNovelPanel
          onAdd={handleAdd}
          onClose={() => setImportOpen(false)}
        />
      )}

      {openId && openedMeta && body && (
        <Reader
          meta={openedMeta}
          body={body}
          onUpdateMeta={handleUpdateMeta}
          onUpdateChapter={handleUpdateChapter}
          onClose={closeReader}
        />
      )}
      {openId && bodyLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center text-stone-400">
          <div className="flex flex-col items-center gap-2">
            <div className="text-2xl animate-spin">◌</div>
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      )}

      {/* Settings opened from the Library — same panel as the reader's. */}
      {settingsOpen && !openId && (
        <ReaderSettingsPanel
          prefs={prefs}
          onUpdate={update}
          onAddCustomTheme={addCustomTheme}
          onRemoveCustomTheme={removeCustomTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  )
}
