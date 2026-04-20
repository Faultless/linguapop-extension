import type { Resource } from './types'

export const RESOURCES: Resource[] = [
  // ── FRENCH ────────────────────────────────────────────────────────────────
  {
    id: 'rfi-facile', name: 'RFI Français Facile',
    description: 'Daily news read slowly and clearly. Perfect for building listening comprehension with real-world content.',
    type: 'podcast', language: 'fr', levels: ['beginner', 'intermediate'],
    interests: ['news', 'culture'], url: 'https://www.rfi.fr/fr/podcasts/journal-en-francais-facile', free: true,
  },
  {
    id: 'inner-french', name: 'InnerFrench',
    description: 'Hugo Cotton speaks at natural speed about fascinating topics. Ideal for breaking the intermediate plateau.',
    type: 'podcast', language: 'fr', levels: ['intermediate'],
    interests: ['culture', 'stories', 'science'], url: 'https://innerfrench.com', free: true,
  },
  {
    id: 'francais-authentique', name: 'Français Authentique',
    description: 'Johan teaches natural, spoken French used by real native speakers — not the textbook kind.',
    type: 'youtube', language: 'fr', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.youtube.com/@francaisauthentique', free: true,
  },
  {
    id: 'france-inter', name: 'France Inter',
    description: 'France\'s top public radio — news, culture, debates, and comedy. Full native speed.',
    type: 'radio', language: 'fr', levels: ['advanced'],
    interests: ['news', 'culture', 'entertainment'], url: 'https://www.radiofrance.fr/franceinter/direct', free: true,
  },
  {
    id: 'tv5monde', name: 'TV5Monde',
    description: 'French-language international TV with subtitles available. Great for watching real French films and shows.',
    type: 'website', language: 'fr', levels: ['intermediate', 'advanced'],
    interests: ['culture', 'news', 'entertainment'], url: 'https://www.tv5monde.com/emission/apprendre', free: true,
  },
  {
    id: 'rfi-savoirs', name: 'RFI Savoirs',
    description: 'Structured French learning resources built around real news content from RFI journalists.',
    type: 'website', language: 'fr', levels: ['beginner', 'intermediate'],
    interests: ['news', 'culture'], url: 'https://savoirs.rfi.fr', free: true,
  },

  // ── SPANISH ───────────────────────────────────────────────────────────────
  {
    id: 'dreaming-spanish', name: 'Dreaming Spanish',
    description: 'The gold standard for Spanish comprehensible input. Thousands of hours of content across all levels.',
    type: 'youtube', language: 'es', levels: ['beginner', 'intermediate', 'advanced'],
    interests: ['culture', 'stories', 'science', 'entertainment'], url: 'https://www.youtube.com/@DreamingSpanish', free: true,
  },
  {
    id: 'radio-ambulante', name: 'Radio Ambulante',
    description: 'NPR\'s Spanish-language narrative journalism podcast. Real stories from Latin America, told beautifully.',
    type: 'podcast', language: 'es', levels: ['intermediate', 'advanced'],
    interests: ['culture', 'stories', 'news'], url: 'https://radioambulante.org', free: true,
  },
  {
    id: 'notes-in-spanish', name: 'Notes in Spanish',
    description: 'Ben and Marina\'s bilingual conversations — from beginners chatting slowly to native-speed discussions.',
    type: 'podcast', language: 'es', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.notesinspanish.com', free: true,
  },
  {
    id: 'cnn-espanol', name: 'CNN en Español',
    description: 'Live Spanish-language news channel. No compromises, full native speed — real broadcasting.',
    type: 'radio', language: 'es', levels: ['advanced'],
    interests: ['news', 'business'], url: 'https://cnnespanol.cnn.com/radio', free: true,
  },
  {
    id: 'espanol-con-juan', name: 'Español con Juan',
    description: 'Warm, conversational Spanish lessons on YouTube. Great explanations of why the language works as it does.',
    type: 'youtube', language: 'es', levels: ['beginner', 'intermediate'],
    interests: ['culture'], url: 'https://www.youtube.com/@EspanolconJuan', free: true,
  },

  // ── GERMAN ────────────────────────────────────────────────────────────────
  {
    id: 'slow-german', name: 'Slow German',
    description: 'Annik Rubens reads fascinating texts about German culture and daily life at a learner-friendly pace.',
    type: 'podcast', language: 'de', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'stories'], url: 'https://slowgerman.com', free: true,
  },
  {
    id: 'easy-german', name: 'Easy German',
    description: 'Street interviews and conversations with real Germans, with bilingual subtitles. Authentic and addictive.',
    type: 'youtube', language: 'de', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.youtube.com/@EasyGerman', free: true,
  },
  {
    id: 'dw-learn', name: 'Deutsche Welle Learn German',
    description: 'DW\'s structured learning portal — free courses, audio trainer, and level-appropriate news content.',
    type: 'website', language: 'de', levels: ['beginner', 'intermediate', 'advanced'],
    interests: ['news', 'culture'], url: 'https://learngerman.dw.com', free: true,
  },
  {
    id: 'deutschlandfunk', name: 'Deutschlandfunk',
    description: 'Germany\'s flagship public radio. In-depth news, culture, and science at full native speed.',
    type: 'radio', language: 'de', levels: ['advanced'],
    interests: ['news', 'culture', 'science'], url: 'https://www.deutschlandfunk.de/live-stream', free: true,
  },

  // ── ITALIAN ───────────────────────────────────────────────────────────────
  {
    id: 'news-slow-italian', name: 'News in Slow Italian',
    description: 'Weekly current affairs podcast delivered slowly and clearly, with transcripts. A learner classic.',
    type: 'podcast', language: 'it', levels: ['beginner', 'intermediate'],
    interests: ['news', 'culture'], url: 'https://www.newsinslowitalian.com', free: false,
  },
  {
    id: 'italiano-automatico', name: 'Italiano Automatico',
    description: 'Alberto speaks naturally about everyday topics. Great for training your ear to real spoken Italian.',
    type: 'youtube', language: 'it', levels: ['intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.youtube.com/@ItalianoAutomatico', free: true,
  },
  {
    id: 'rai-radio1', name: 'RAI Radio 1',
    description: 'Italy\'s main public radio station — national news, culture, sport, and entertainment.',
    type: 'radio', language: 'it', levels: ['advanced'],
    interests: ['news', 'culture', 'entertainment'], url: 'https://www.raiplaysound.it/radio1', free: true,
  },
  {
    id: 'one-world-italiano', name: 'One World Italiano',
    description: 'A podcast that covers Italian culture, grammar, and real conversations in a relaxed format.',
    type: 'podcast', language: 'it', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'stories'], url: 'https://www.oneworlditaliano.com/podcast', free: true,
  },

  // ── PORTUGUESE ────────────────────────────────────────────────────────────
  {
    id: 'portuguese-with-leo', name: 'Portuguese with Leo',
    description: 'Leo makes Brazilian Portuguese fun and approachable. Great explanations of slang and everyday speech.',
    type: 'youtube', language: 'pt', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.youtube.com/@portuguesewithleo', free: true,
  },
  {
    id: 'falar-portugues', name: 'Falar... Ler... Escrever...',
    description: 'University of São Paulo\'s free Portuguese course — structured and thorough.',
    type: 'website', language: 'pt', levels: ['beginner', 'intermediate'],
    interests: ['culture'], url: 'https://www.falarlerEscrever.fflch.usp.br', free: true,
  },
  {
    id: 'cbn-radio', name: 'CBN Rádio (Brazil)',
    description: 'Brazil\'s all-news radio station. Fast-paced, modern Brazilian Portuguese at full native speed.',
    type: 'radio', language: 'pt', levels: ['advanced'],
    interests: ['news', 'business'], url: 'https://cbn.globoradio.globo.com', free: true,
  },
  {
    id: 'streetsmartbrazil', name: 'Street Smart Brazil',
    description: 'Short podcast episodes focused on business and everyday Brazilian Portuguese vocabulary.',
    type: 'podcast', language: 'pt', levels: ['intermediate'],
    interests: ['business', 'culture'], url: 'https://streetsmartbrazil.com/podcast', free: true,
  },

  // ── JAPANESE ──────────────────────────────────────────────────────────────
  {
    id: 'nhk-web-easy', name: 'NHK Web Easy',
    description: 'Real Japanese news rewritten in simple language with furigana. The best bridge to native content.',
    type: 'website', language: 'ja', levels: ['beginner', 'intermediate'],
    interests: ['news', 'culture'], url: 'https://www3.nhk.or.jp/news/easy', free: true,
  },
  {
    id: 'nihongo-teppei', name: 'Nihongo con Teppei',
    description: 'Teppei talks about everyday topics in natural Japanese — no English, no slow speech. Highly addictive.',
    type: 'podcast', language: 'ja', levels: ['intermediate', 'advanced'],
    interests: ['culture', 'entertainment'], url: 'https://nihongoconteppei.com', free: true,
  },
  {
    id: 'nhk-world-radio', name: 'NHK World Radio Japan',
    description: 'NHK\'s international service — Japanese and world news in clear, measured Japanese.',
    type: 'radio', language: 'ja', levels: ['intermediate', 'advanced'],
    interests: ['news', 'culture'], url: 'https://www3.nhk.or.jp/nhkworld/en/radio/japan', free: true,
  },
  {
    id: 'japanesepod101', name: 'JapanesePod101',
    description: 'Extensive library of structured audio lessons from absolute zero to advanced.',
    type: 'podcast', language: 'ja', levels: ['beginner', 'intermediate', 'advanced'],
    interests: ['culture'], url: 'https://www.japanesepod101.com', free: false,
  },
  {
    id: 'comprehensible-japanese', name: 'Comprehensible Japanese',
    description: 'Immersion-method YouTube channel with content calibrated carefully to each level. Start from zero.',
    type: 'youtube', language: 'ja', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'stories'], url: 'https://www.youtube.com/@cijapanese', free: true,
  },

  // ── KOREAN ────────────────────────────────────────────────────────────────
  {
    id: 'ttmik', name: 'Talk To Me In Korean',
    description: 'The most loved Korean learning resource. Podcasts, YouTube, and structured lessons from A1 to C1.',
    type: 'podcast', language: 'ko', levels: ['beginner', 'intermediate', 'advanced'],
    interests: ['culture', 'entertainment'], url: 'https://talktomeinkorean.com', free: true,
  },
  {
    id: 'kbs-world', name: 'KBS World Radio',
    description: 'Korea\'s international broadcaster. News and cultural programmes in clear, standard Korean.',
    type: 'radio', language: 'ko', levels: ['intermediate', 'advanced'],
    interests: ['news', 'culture'], url: 'https://world.kbs.co.kr', free: true,
  },
  {
    id: 'iyagi-ttmik', name: 'Iyagi – Natural Korean',
    description: 'Two hosts chat naturally about everyday Korean topics. Great for intermediate listening training.',
    type: 'podcast', language: 'ko', levels: ['intermediate'],
    interests: ['culture', 'stories'], url: 'https://talktomeinkorean.com/iyagi', free: true,
  },

  // ── CHINESE ───────────────────────────────────────────────────────────────
  {
    id: 'chinesepod', name: 'ChinesePod',
    description: 'One of the longest-running Mandarin learning podcasts. Thousands of episodes with dialogue and explanation.',
    type: 'podcast', language: 'zh', levels: ['beginner', 'intermediate', 'advanced'],
    interests: ['culture', 'business'], url: 'https://chinesepod.com', free: false,
  },
  {
    id: 'cgtn-radio', name: 'CGTN Radio (CRI)',
    description: 'China\'s international radio in standard Mandarin. Great for exposure to formal, clear Chinese.',
    type: 'radio', language: 'zh', levels: ['intermediate', 'advanced'],
    interests: ['news', 'culture'], url: 'https://www.cri.cn', free: true,
  },
  {
    id: 'hsk-online', name: 'HSK Online',
    description: 'Free HSK-aligned reading and listening practice. Well-structured for exam prep and self-study.',
    type: 'website', language: 'zh', levels: ['beginner', 'intermediate'],
    interests: ['culture'], url: 'https://www.hskonline.com', free: true,
  },
  {
    id: 'mandarin-corner', name: 'Mandarin Corner',
    description: 'Intermediate-to-advanced YouTube channel with native conversations and excellent subtitles.',
    type: 'youtube', language: 'zh', levels: ['intermediate', 'advanced'],
    interests: ['culture', 'stories'], url: 'https://www.youtube.com/@MandarinCorner', free: true,
  },

  // ── ARABIC ────────────────────────────────────────────────────────────────
  {
    id: 'bbc-arabic', name: 'BBC Arabic Radio',
    description: 'Clear, high-quality Modern Standard Arabic broadcasts. One of the best models of MSA in use.',
    type: 'radio', language: 'ar', levels: ['intermediate', 'advanced'],
    interests: ['news', 'culture'], url: 'https://www.bbc.co.uk/arabic/media-38745636', free: true,
  },
  {
    id: 'arabic-with-sam', name: 'Arabic with Sam',
    description: 'Fun, approachable YouTube channel explaining Modern Standard and Egyptian Arabic from scratch.',
    type: 'youtube', language: 'ar', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'entertainment'], url: 'https://www.youtube.com/@arabicwithsam', free: true,
  },
  {
    id: 'al-jazeera-arabic', name: 'Al Jazeera Arabic',
    description: 'The Arab world\'s most-watched news channel. Live broadcasts in formal Arabic around the clock.',
    type: 'radio', language: 'ar', levels: ['advanced'],
    interests: ['news', 'business'], url: 'https://www.aljazeera.net/live', free: true,
  },

  // ── RUSSIAN ───────────────────────────────────────────────────────────────
  {
    id: 'russian-with-max', name: 'Russian with Max',
    description: 'Max explains Russian clearly in English, with a focus on natural spoken Russian rather than textbook forms.',
    type: 'youtube', language: 'ru', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'stories'], url: 'https://www.youtube.com/@RussianWithMax', free: true,
  },
  {
    id: 'radio-russia', name: 'Radio Russia (Радио России)',
    description: 'Russia\'s main federal radio — full immersion in standard Russian across news, culture, and debate.',
    type: 'radio', language: 'ru', levels: ['advanced'],
    interests: ['news', 'culture', 'entertainment'], url: 'https://rusradio.ru', free: true,
  },
  {
    id: 'russian-from-russia', name: 'Russian from Russia',
    description: 'Katya Petrovskaya\'s podcast for intermediate learners — slow, clear, and conversational.',
    type: 'podcast', language: 'ru', levels: ['beginner', 'intermediate'],
    interests: ['culture', 'stories'], url: 'https://www.russianfromrussia.com', free: true,
  },
]
