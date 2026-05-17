/**
 * Curated starter set of common JLPT vocabulary mapped to level.
 *
 * The full Tanos / Jonathan Waller lists carry ~9,000 entries across N5–N1
 * and are the de-facto open standard. To keep bundle size sane, only common
 * entries are embedded directly here. Additional entries can be merged at
 * runtime via `registerJlptVocab()`.
 *
 * The dataset is keyed by *dictionary form* (the kuromoji `basic_form` field).
 * Where a kana-only reading is more useful (particles, common kana words), it
 * is added under both the kana and kanji surface forms.
 */

export type JlptLevel = 1 | 2 | 3 | 4 | 5

interface RawEntry {
  /** Comma-separated keys — surface forms / readings. */
  k: string
  /** JLPT level (5 easiest → 1 hardest). */
  n: JlptLevel
  /** Optional English gloss for the popover. */
  g?: string
}

const RAW: RawEntry[] = [
  // ─── N5 (very common) ─────────────────────────────────────────
  { k: '私,わたし', n: 5, g: 'I, me' },
  { k: '貴方,あなた', n: 5, g: 'you' },
  { k: '彼,かれ', n: 5, g: 'he' },
  { k: '彼女,かのじょ', n: 5, g: 'she' },
  { k: '人,ひと', n: 5, g: 'person' },
  { k: '日,ひ', n: 5, g: 'day, sun' },
  { k: '本,ほん', n: 5, g: 'book' },
  { k: '日本,にほん', n: 5, g: 'Japan' },
  { k: '日本語,にほんご', n: 5, g: 'Japanese (language)' },
  { k: '英語,えいご', n: 5, g: 'English' },
  { k: '学校,がっこう', n: 5, g: 'school' },
  { k: '学生,がくせい', n: 5, g: 'student' },
  { k: '先生,せんせい', n: 5, g: 'teacher' },
  { k: '友達,ともだち', n: 5, g: 'friend' },
  { k: '家族,かぞく', n: 5, g: 'family' },
  { k: '父,ちち', n: 5, g: 'father' },
  { k: '母,はは', n: 5, g: 'mother' },
  { k: '兄,あに', n: 5, g: 'older brother' },
  { k: '姉,あね', n: 5, g: 'older sister' },
  { k: '弟,おとうと', n: 5, g: 'younger brother' },
  { k: '妹,いもうと', n: 5, g: 'younger sister' },
  { k: '子供,こども', n: 5, g: 'child' },
  { k: '家,いえ', n: 5, g: 'house, home' },
  { k: '部屋,へや', n: 5, g: 'room' },
  { k: '会社,かいしゃ', n: 5, g: 'company' },
  { k: '車,くるま', n: 5, g: 'car' },
  { k: '電車,でんしゃ', n: 5, g: 'train' },
  { k: '駅,えき', n: 5, g: 'station' },
  { k: '道,みち', n: 5, g: 'road, way' },
  { k: '町,まち', n: 5, g: 'town' },
  { k: '国,くに', n: 5, g: 'country' },
  { k: '水,みず', n: 5, g: 'water' },
  { k: '火,ひ', n: 5, g: 'fire' },
  { k: '空,そら', n: 5, g: 'sky' },
  { k: '山,やま', n: 5, g: 'mountain' },
  { k: '川,かわ', n: 5, g: 'river' },
  { k: '海,うみ', n: 5, g: 'sea' },
  { k: '木,き', n: 5, g: 'tree' },
  { k: '花,はな', n: 5, g: 'flower' },
  { k: '魚,さかな', n: 5, g: 'fish' },
  { k: '犬,いぬ', n: 5, g: 'dog' },
  { k: '猫,ねこ', n: 5, g: 'cat' },
  { k: '鳥,とり', n: 5, g: 'bird' },
  { k: '食べる', n: 5, g: 'to eat' },
  { k: '飲む', n: 5, g: 'to drink' },
  { k: '見る', n: 5, g: 'to see, watch' },
  { k: '聞く', n: 5, g: 'to listen, ask' },
  { k: '話す', n: 5, g: 'to speak' },
  { k: '読む', n: 5, g: 'to read' },
  { k: '書く', n: 5, g: 'to write' },
  { k: '行く', n: 5, g: 'to go' },
  { k: '来る', n: 5, g: 'to come' },
  { k: '帰る', n: 5, g: 'to return home' },
  { k: '入る', n: 5, g: 'to enter' },
  { k: '出る', n: 5, g: 'to exit' },
  { k: '立つ', n: 5, g: 'to stand' },
  { k: '座る', n: 5, g: 'to sit' },
  { k: '寝る', n: 5, g: 'to sleep' },
  { k: '起きる', n: 5, g: 'to get up' },
  { k: '買う', n: 5, g: 'to buy' },
  { k: '売る', n: 5, g: 'to sell' },
  { k: '作る', n: 5, g: 'to make' },
  { k: '使う', n: 5, g: 'to use' },
  { k: '待つ', n: 5, g: 'to wait' },
  { k: '会う', n: 5, g: 'to meet' },
  { k: '言う', n: 5, g: 'to say' },
  { k: '思う', n: 5, g: 'to think' },
  { k: '知る', n: 5, g: 'to know' },
  { k: '分かる,わかる', n: 5, g: 'to understand' },
  { k: '好き', n: 5, g: 'liked, favorite' },
  { k: '嫌い', n: 5, g: 'disliked' },
  { k: '大きい', n: 5, g: 'big' },
  { k: '小さい', n: 5, g: 'small' },
  { k: '新しい', n: 5, g: 'new' },
  { k: '古い', n: 5, g: 'old (things)' },
  { k: '高い', n: 5, g: 'tall, expensive' },
  { k: '低い', n: 5, g: 'low' },
  { k: '安い', n: 5, g: 'cheap' },
  { k: '良い,いい,よい', n: 5, g: 'good' },
  { k: '悪い', n: 5, g: 'bad' },
  { k: '早い', n: 5, g: 'early, fast' },
  { k: '遅い', n: 5, g: 'late, slow' },
  { k: '長い', n: 5, g: 'long' },
  { k: '短い', n: 5, g: 'short' },
  { k: '面白い', n: 5, g: 'interesting' },
  { k: '楽しい', n: 5, g: 'fun' },
  { k: '美味しい,おいしい', n: 5, g: 'delicious' },
  { k: '今,いま', n: 5, g: 'now' },
  { k: '今日,きょう', n: 5, g: 'today' },
  { k: '明日,あした', n: 5, g: 'tomorrow' },
  { k: '昨日,きのう', n: 5, g: 'yesterday' },
  { k: '朝,あさ', n: 5, g: 'morning' },
  { k: '昼,ひる', n: 5, g: 'noon, daytime' },
  { k: '夜,よる', n: 5, g: 'night' },
  { k: '時間,じかん', n: 5, g: 'time' },
  { k: '一,いち', n: 5, g: 'one' },
  { k: '二,に', n: 5, g: 'two' },
  { k: '三,さん', n: 5, g: 'three' },
  { k: '四,よん,し', n: 5, g: 'four' },
  { k: '五,ご', n: 5, g: 'five' },
  { k: '六,ろく', n: 5, g: 'six' },
  { k: '七,なな,しち', n: 5, g: 'seven' },
  { k: '八,はち', n: 5, g: 'eight' },
  { k: '九,きゅう,く', n: 5, g: 'nine' },
  { k: '十,じゅう', n: 5, g: 'ten' },
  { k: '百,ひゃく', n: 5, g: 'hundred' },
  { k: '千,せん', n: 5, g: 'thousand' },
  { k: '万,まん', n: 5, g: 'ten thousand' },
  { k: '円,えん', n: 5, g: 'yen' },

  // ─── N4 ───────────────────────────────────────────────────────
  { k: '世界,せかい', n: 4, g: 'world' },
  { k: '社会,しゃかい', n: 4, g: 'society' },
  { k: '文化,ぶんか', n: 4, g: 'culture' },
  { k: '経済,けいざい', n: 4, g: 'economy' },
  { k: '政治,せいじ', n: 4, g: 'politics' },
  { k: '歴史,れきし', n: 4, g: 'history' },
  { k: '科学,かがく', n: 4, g: 'science' },
  { k: '勉強,べんきょう', n: 4, g: 'study' },
  { k: '宿題,しゅくだい', n: 4, g: 'homework' },
  { k: '試験,しけん', n: 4, g: 'exam' },
  { k: '質問,しつもん', n: 4, g: 'question' },
  { k: '答え,こたえ', n: 4, g: 'answer' },
  { k: '意味,いみ', n: 4, g: 'meaning' },
  { k: '理由,りゆう', n: 4, g: 'reason' },
  { k: '気持ち,きもち', n: 4, g: 'feeling' },
  { k: '気,き', n: 4, g: 'spirit, mood' },
  { k: '心,こころ', n: 4, g: 'heart, mind' },
  { k: '頭,あたま', n: 4, g: 'head' },
  { k: '顔,かお', n: 4, g: 'face' },
  { k: '目,め', n: 4, g: 'eye' },
  { k: '耳,みみ', n: 4, g: 'ear' },
  { k: '口,くち', n: 4, g: 'mouth' },
  { k: '手,て', n: 4, g: 'hand' },
  { k: '足,あし', n: 4, g: 'foot, leg' },
  { k: '体,からだ', n: 4, g: 'body' },
  { k: '声,こえ', n: 4, g: 'voice' },
  { k: '空気,くうき', n: 4, g: 'air' },
  { k: '味,あじ', n: 4, g: 'taste' },
  { k: '色,いろ', n: 4, g: 'color' },
  { k: '音,おと', n: 4, g: 'sound' },
  { k: '光,ひかり', n: 4, g: 'light' },
  { k: '影,かげ', n: 4, g: 'shadow' },
  { k: '考える', n: 4, g: 'to think (about)' },
  { k: '感じる', n: 4, g: 'to feel' },
  { k: '覚える', n: 4, g: 'to remember' },
  { k: '忘れる', n: 4, g: 'to forget' },
  { k: '答える', n: 4, g: 'to answer' },
  { k: '伝える', n: 4, g: 'to convey, tell' },
  { k: '届ける', n: 4, g: 'to deliver' },
  { k: '助ける', n: 4, g: 'to help, save' },
  { k: '楽しむ', n: 4, g: 'to enjoy' },
  { k: '泣く', n: 4, g: 'to cry' },
  { k: '笑う', n: 4, g: 'to laugh' },
  { k: '怒る', n: 4, g: 'to get angry' },
  { k: '驚く', n: 4, g: 'to be surprised' },
  { k: '困る', n: 4, g: 'to be troubled' },
  { k: '止まる', n: 4, g: 'to stop' },
  { k: '始まる', n: 4, g: 'to begin' },
  { k: '終わる', n: 4, g: 'to end' },
  { k: '続く', n: 4, g: 'to continue' },
  { k: '変わる', n: 4, g: 'to change' },
  { k: '違う', n: 4, g: 'to differ' },
  { k: '同じ', n: 4, g: 'same' },
  { k: '簡単', n: 4, g: 'simple, easy' },
  { k: '大変', n: 4, g: 'tough, very' },
  { k: '色々,いろいろ', n: 4, g: 'various' },
  { k: '便利', n: 4, g: 'convenient' },
  { k: '不便', n: 4, g: 'inconvenient' },
  { k: '安全', n: 4, g: 'safe' },
  { k: '危険', n: 4, g: 'dangerous' },
  { k: '必要', n: 4, g: 'necessary' },
  { k: '可能', n: 4, g: 'possible' },

  // ─── N3 ───────────────────────────────────────────────────────
  { k: '存在,そんざい', n: 3, g: 'existence' },
  { k: '関係,かんけい', n: 3, g: 'relationship' },
  { k: '影響,えいきょう', n: 3, g: 'influence' },
  { k: '結果,けっか', n: 3, g: 'result' },
  { k: '原因,げんいん', n: 3, g: 'cause' },
  { k: '目的,もくてき', n: 3, g: 'purpose' },
  { k: '方法,ほうほう', n: 3, g: 'method' },
  { k: '場合,ばあい', n: 3, g: 'case, situation' },
  { k: '様子,ようす', n: 3, g: 'appearance, state' },
  { k: '記憶,きおく', n: 3, g: 'memory' },
  { k: '想像,そうぞう', n: 3, g: 'imagination' },
  { k: '表現,ひょうげん', n: 3, g: 'expression' },
  { k: '感情,かんじょう', n: 3, g: 'emotion' },
  { k: '性格,せいかく', n: 3, g: 'personality' },
  { k: '態度,たいど', n: 3, g: 'attitude' },
  { k: '行動,こうどう', n: 3, g: 'action' },
  { k: '経験,けいけん', n: 3, g: 'experience' },
  { k: '機会,きかい', n: 3, g: 'opportunity' },
  { k: '事件,じけん', n: 3, g: 'incident' },
  { k: '事故,じこ', n: 3, g: 'accident' },
  { k: '計画,けいかく', n: 3, g: 'plan' },
  { k: '準備,じゅんび', n: 3, g: 'preparation' },
  { k: '練習,れんしゅう', n: 3, g: 'practice' },
  { k: '努力,どりょく', n: 3, g: 'effort' },
  { k: '成功,せいこう', n: 3, g: 'success' },
  { k: '失敗,しっぱい', n: 3, g: 'failure' },
  { k: '解決,かいけつ', n: 3, g: 'solution' },
  { k: '判断,はんだん', n: 3, g: 'judgment' },
  { k: '決定,けってい', n: 3, g: 'decision' },
  { k: '選択,せんたく', n: 3, g: 'choice' },
  { k: '比較,ひかく', n: 3, g: 'comparison' },
  { k: '違い,ちがい', n: 3, g: 'difference' },
  { k: '関心,かんしん', n: 3, g: 'interest, concern' },
  { k: '興味,きょうみ', n: 3, g: 'interest' },
  { k: '感謝,かんしゃ', n: 3, g: 'gratitude' },
  { k: '尊敬,そんけい', n: 3, g: 'respect' },
  { k: '迷う', n: 3, g: 'to hesitate, lose one\'s way' },
  { k: '悩む', n: 3, g: 'to be troubled' },
  { k: '諦める', n: 3, g: 'to give up' },
  { k: '頑張る', n: 3, g: 'to persevere' },
  { k: '認める', n: 3, g: 'to acknowledge' },
  { k: '比べる', n: 3, g: 'to compare' },
  { k: '比べ', n: 3, g: 'comparing' },
  { k: '増える', n: 3, g: 'to increase' },
  { k: '減る', n: 3, g: 'to decrease' },
  { k: '伸びる', n: 3, g: 'to grow, extend' },
  { k: '縮む', n: 3, g: 'to shrink' },
  { k: '広がる', n: 3, g: 'to spread' },
  { k: '狭まる', n: 3, g: 'to narrow' },
  { k: '深い', n: 3, g: 'deep' },
  { k: '浅い', n: 3, g: 'shallow' },
  { k: '厚い', n: 3, g: 'thick' },
  { k: '薄い', n: 3, g: 'thin' },

  // ─── N2 ───────────────────────────────────────────────────────
  { k: '基本,きほん', n: 2, g: 'foundation, basis' },
  { k: '原則,げんそく', n: 2, g: 'principle' },
  { k: '前提,ぜんてい', n: 2, g: 'premise' },
  { k: '根拠,こんきょ', n: 2, g: 'grounds, basis' },
  { k: '前提条件,ぜんていじょうけん', n: 2, g: 'precondition' },
  { k: '構造,こうぞう', n: 2, g: 'structure' },
  { k: '組織,そしき', n: 2, g: 'organization' },
  { k: '機能,きのう', n: 2, g: 'function' },
  { k: '役割,やくわり', n: 2, g: 'role' },
  { k: '責任,せきにん', n: 2, g: 'responsibility' },
  { k: '義務,ぎむ', n: 2, g: 'duty' },
  { k: '権利,けんり', n: 2, g: 'right(s)' },
  { k: '実現,じつげん', n: 2, g: 'realization' },
  { k: '達成,たっせい', n: 2, g: 'achievement' },
  { k: '実施,じっし', n: 2, g: 'implementation' },
  { k: '実行,じっこう', n: 2, g: 'execution' },
  { k: '採用,さいよう', n: 2, g: 'adoption, hiring' },
  { k: '対応,たいおう', n: 2, g: 'response, handling' },
  { k: '対策,たいさく', n: 2, g: 'measure, countermeasure' },
  { k: '配慮,はいりょ', n: 2, g: 'consideration' },
  { k: '考慮,こうりょ', n: 2, g: 'consideration' },
  { k: '検討,けんとう', n: 2, g: 'examination, consideration' },
  { k: '評価,ひょうか', n: 2, g: 'evaluation' },
  { k: '分析,ぶんせき', n: 2, g: 'analysis' },
  { k: '研究,けんきゅう', n: 2, g: 'research' },
  { k: '調査,ちょうさ', n: 2, g: 'investigation, survey' },
  { k: '報告,ほうこく', n: 2, g: 'report' },
  { k: '発表,はっぴょう', n: 2, g: 'announcement' },
  { k: '訴える', n: 2, g: 'to appeal, sue' },
  { k: '主張する,しゅちょう', n: 2, g: 'to claim, assert' },
  { k: '指摘する,してき', n: 2, g: 'to point out' },
  { k: '示す,しめす', n: 2, g: 'to indicate' },
  { k: '述べる,のべる', n: 2, g: 'to state' },
  { k: '繰り返す,くりかえす', n: 2, g: 'to repeat' },
  { k: '改める,あらためる', n: 2, g: 'to revise, reform' },
  { k: '及ぼす,およぼす', n: 2, g: 'to exert (influence)' },
  { k: '至る,いたる', n: 2, g: 'to arrive at, lead to' },
  { k: '基づく,もとづく', n: 2, g: 'to be based on' },
  { k: '応じる,おうじる', n: 2, g: 'to respond, comply' },
  { k: '一方,いっぽう', n: 2, g: 'on the other hand' },
  { k: '更に,さらに', n: 2, g: 'further, moreover' },
  { k: '従って,したがって', n: 2, g: 'therefore' },
  { k: '結局,けっきょく', n: 2, g: 'in the end' },
  { k: '当然,とうぜん', n: 2, g: 'natural(ly)' },

  // ─── N1 ───────────────────────────────────────────────────────
  { k: '概念,がいねん', n: 1, g: 'concept' },
  { k: '理念,りねん', n: 1, g: 'philosophy, ideal' },
  { k: '本質,ほんしつ', n: 1, g: 'essence' },
  { k: '抽象,ちゅうしょう', n: 1, g: 'abstract' },
  { k: '具現,ぐげん', n: 1, g: 'embodiment' },
  { k: '矛盾,むじゅん', n: 1, g: 'contradiction' },
  { k: '葛藤,かっとう', n: 1, g: 'inner conflict' },
  { k: '相克,そうこく', n: 1, g: 'rivalry, conflict' },
  { k: '所詮,しょせん', n: 1, g: 'after all' },
  { k: '事象,じしょう', n: 1, g: 'phenomenon, event' },
  { k: '思惟,しい', n: 1, g: 'thought, contemplation' },
  { k: '所謂,いわゆる', n: 1, g: 'so-called' },
  { k: '甚だしい,はなはだしい', n: 1, g: 'extreme' },
  { k: '甚だ,はなはだ', n: 1, g: 'extremely' },
  { k: '極めて,きわめて', n: 1, g: 'extremely' },
  { k: '殊更,ことさら', n: 1, g: 'particularly' },
  { k: '尚更,なおさら', n: 1, g: 'all the more' },
  { k: '一見,いっけん', n: 1, g: 'at first glance' },
  { k: '挙句,あげく', n: 1, g: 'in the end' },
  { k: '一概に,いちがいに', n: 1, g: 'unconditionally' },
  { k: '一律,いちりつ', n: 1, g: 'uniform(ly)' },
  { k: '余儀ない,よぎない', n: 1, g: 'unavoidable' },
  { k: '辛うじて,かろうじて', n: 1, g: 'barely' },
  { k: '到底,とうてい', n: 1, g: '(not) possibly, hardly' },
  { k: '頑なに,かたくなに', n: 1, g: 'stubbornly' },
  { k: '抑える,おさえる', n: 1, g: 'to suppress, hold down' },
  { k: '挑む,いどむ', n: 1, g: 'to challenge' },
  { k: '貫く,つらぬく', n: 1, g: 'to pierce, carry through' },
  { k: '陥る,おちいる', n: 1, g: 'to fall into' },
  { k: '滅びる,ほろびる', n: 1, g: 'to perish' },
  { k: '欺く,あざむく', n: 1, g: 'to deceive' },
  { k: '弁える,わきまえる', n: 1, g: 'to discern' },
  { k: '促す,うながす', n: 1, g: 'to urge, prompt' },
  { k: '阻む,はばむ', n: 1, g: 'to obstruct' },
  { k: '怠る,おこたる', n: 1, g: 'to neglect' },
  { k: '及ぼし,およぼし', n: 1, g: 'extending influence' },
  { k: '免れる,まぬがれる', n: 1, g: 'to escape, be exempted' },
  { k: '揺るぐ,ゆるぐ', n: 1, g: 'to shake, waver' },
  { k: '焦る,あせる', n: 1, g: 'to be impatient' },
  { k: '潜む,ひそむ', n: 1, g: 'to lurk' },
]

interface VocabEntry {
  level: JlptLevel
  gloss?: string
}

const map = new Map<string, VocabEntry>()

function ingest(raw: RawEntry[]) {
  for (const e of raw) {
    const keys = e.k.split(',').map(s => s.trim()).filter(Boolean)
    for (const k of keys) {
      // Don't downgrade a higher level (lower number) by re-inserting at a lower level.
      const existing = map.get(k)
      if (existing && existing.level <= e.n) continue
      map.set(k, { level: e.n, gloss: e.g })
    }
  }
}

ingest(RAW)

/**
 * Look up a word's JLPT level. Tries the base form first, then the surface form
 * if different, then the kana reading.
 */
export function lookupJlpt(forms: { base?: string; surface?: string; reading?: string }): { level: JlptLevel; gloss?: string } | null {
  const tries = [forms.base, forms.surface, forms.reading].filter((s): s is string => !!s)
  for (const k of tries) {
    const hit = map.get(k)
    if (hit) return hit
  }
  return null
}

/**
 * Merge additional entries into the lookup table at runtime. Useful for
 * loading a fuller list (e.g. from a CDN) without rebundling.
 */
export function registerJlptVocab(entries: { key: string; level: JlptLevel; gloss?: string }[]) {
  for (const e of entries) {
    const existing = map.get(e.key)
    if (existing && existing.level <= e.level) continue
    map.set(e.key, { level: e.level, gloss: e.gloss })
  }
}

/** Total entries currently in the lookup (for diagnostics / settings UI). */
export function jlptVocabSize(): number {
  return map.size
}
