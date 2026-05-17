import { ReaderPrefsProvider } from '@linguapop/core'
import { ReadTab } from '@linguapop/ui'

export default function App() {
  return (
    <ReaderPrefsProvider>
      <div className="relative overflow-hidden w-full h-dvh max-w-lg mx-auto">
        <ReadTab />
      </div>
    </ReaderPrefsProvider>
  )
}
