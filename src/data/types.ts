export type Level = 'beginner' | 'intermediate' | 'advanced'
export type ResourceType = 'radio' | 'podcast' | 'youtube' | 'website' | 'newsletter'
export type Interest = 'news' | 'culture' | 'music' | 'stories' | 'science' | 'business' | 'kids' | 'entertainment'

export interface Language {
  code: string
  name: string
  flag: string
  color: string // tailwind bg class for accent
}

export interface Resource {
  id: string
  name: string
  description: string
  type: ResourceType
  language: string
  levels: Level[]
  interests: Interest[]
  url: string
  free: boolean
}

export interface UserPrefs {
  languages: { code: string; level: Level }[]
  interests: Interest[]
}
