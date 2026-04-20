import type { Language } from './types'

export const LANGUAGES: Language[] = [
  { code: 'fr', name: 'French',     flag: '🇫🇷', color: 'bg-blue-100 text-blue-700'   },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸', color: 'bg-red-100 text-red-700'    },
  { code: 'de', name: 'German',     flag: '🇩🇪', color: 'bg-yellow-100 text-yellow-700' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹', color: 'bg-green-100 text-green-700' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', color: 'bg-emerald-100 text-emerald-700' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵', color: 'bg-rose-100 text-rose-700'  },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷', color: 'bg-indigo-100 text-indigo-700' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳', color: 'bg-orange-100 text-orange-700' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦', color: 'bg-teal-100 text-teal-700'  },
  { code: 'ru', name: 'Russian',    flag: '🇷🇺', color: 'bg-purple-100 text-purple-700' },
]

export const LANG_MAP = Object.fromEntries(LANGUAGES.map(l => [l.code, l]))
