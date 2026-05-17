import { ReaderPrefsProvider } from '@linguapop/core'
import { ReadTab } from '@linguapop/ui'

export default function App() {
  return (
    <ReaderPrefsProvider>
      <div className="relative overflow-hidden" style={{ width: 420, height: 580 }}>
        <ReadTab />
      </div>
    </ReaderPrefsProvider>
  )
}
