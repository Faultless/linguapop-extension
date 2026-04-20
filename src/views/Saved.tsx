import { RESOURCES } from '../data/resources'
import { ResourceCard } from '../components/ResourceCard'

export function Saved({ saved, onSave }: { saved: Set<string>; onSave: (id: string) => void }) {
  const items = RESOURCES.filter(r => saved.has(r.id))

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {items.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <div className="text-4xl mb-3">🔖</div>
            <p className="text-sm font-medium text-stone-500">Nothing saved yet</p>
            <p className="text-xs text-stone-400 mt-1">Tap 🤍 on any resource to save it here</p>
          </div>
        ) : (
          items.map(r => (
            <ResourceCard key={r.id} resource={r} saved onSave={() => onSave(r.id)} />
          ))
        )}
      </div>
    </div>
  )
}
