export const LOREM_LANGUAGES = ['latin', 'pt', 'en', 'es'] as const;

export type LoremLanguage = (typeof LOREM_LANGUAGES)[number];

export const LOREM_UNITS = ['paragraphs', 'sentences', 'words'] as const;

export type LoremUnit = (typeof LOREM_UNITS)[number];

export type LoremOptions = {
  language: LoremLanguage;
  unit: LoremUnit;
  count: number;
  startWithClassic: boolean;
};

export type Random = () => number;

export const MAX_COUNT: Record<LoremUnit, number> = { paragraphs: 30, sentences: 100, words: 1000 };

const WORDS: Record<LoremLanguage, readonly string[]> = {
  latin: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
    'enim',
    'ad',
    'minim',
    'veniam',
    'quis',
    'nostrud',
    'exercitation',
    'ullamco',
    'laboris',
    'nisi',
    'aliquip',
    'ex',
    'ea',
    'commodo',
    'consequat',
    'duis',
    'aute',
    'irure',
    'in',
    'reprehenderit',
    'voluptate',
    'velit',
    'esse',
    'cillum',
    'eu',
    'fugiat',
    'nulla',
    'pariatur',
    'excepteur',
    'sint',
    'occaecat',
    'cupidatat',
    'non',
    'proident',
    'sunt',
    'culpa',
    'qui',
    'officia',
    'deserunt',
    'mollit',
    'anim',
    'id',
    'est',
    'laborum',
    'vitae',
    'purus',
    'faucibus',
    'ornare',
    'suspendisse',
    'potenti',
    'nullam',
    'ac',
    'tortor',
    'dignissim',
    'convallis',
    'aenean',
  ],
  pt: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'casa',
    'tempo',
    'pessoa',
    'trabalho',
    'vida',
    'cidade',
    'projeto',
    'equipe',
    'cliente',
    'produto',
    'serviço',
    'qualidade',
    'processo',
    'resultado',
    'caminho',
    'história',
    'momento',
    'palavra',
    'sistema',
    'contexto',
    'proposta',
    'solução',
    'desafio',
    'mercado',
    'empresa',
    'ideia',
    'ponto',
    'forma',
    'valor',
    'grupo',
    'ação',
    'desenvolvimento',
    'experiência',
    'conteúdo',
    'página',
    'texto',
    'imagem',
    'design',
    'cor',
    'espaço',
    'detalhe',
    'estrutura',
    'objetivo',
    'planejamento',
    'entrega',
    'revisão',
    'simples',
    'novo',
    'grande',
    'claro',
    'rápido',
    'seguro',
    'leve',
    'forte',
    'próximo',
    'sempre',
    'também',
    'porque',
    'durante',
    'entre',
    'sobre',
    'para',
    'com',
    'sem',
    'mais',
    'muito',
    'cada',
    'todo',
    'outro',
    'melhor',
    'depois',
    'antes',
    'agora',
    'aqui',
    'ali',
  ],
  en: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'house',
    'time',
    'person',
    'work',
    'life',
    'city',
    'project',
    'team',
    'client',
    'product',
    'service',
    'quality',
    'process',
    'result',
    'path',
    'story',
    'moment',
    'word',
    'system',
    'context',
    'proposal',
    'solution',
    'challenge',
    'market',
    'company',
    'idea',
    'point',
    'shape',
    'value',
    'group',
    'action',
    'development',
    'experience',
    'content',
    'page',
    'text',
    'image',
    'design',
    'color',
    'space',
    'detail',
    'structure',
    'goal',
    'planning',
    'delivery',
    'review',
    'simple',
    'new',
    'large',
    'clear',
    'fast',
    'safe',
    'light',
    'strong',
    'close',
    'always',
    'also',
    'because',
    'during',
    'between',
    'about',
    'for',
    'with',
    'without',
    'more',
    'very',
    'each',
    'every',
    'other',
    'better',
    'after',
    'before',
    'now',
    'here',
    'there',
  ],
  es: [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'casa',
    'tiempo',
    'persona',
    'trabajo',
    'vida',
    'ciudad',
    'proyecto',
    'equipo',
    'cliente',
    'producto',
    'servicio',
    'calidad',
    'proceso',
    'resultado',
    'camino',
    'historia',
    'momento',
    'palabra',
    'sistema',
    'contexto',
    'propuesta',
    'solución',
    'desafío',
    'mercado',
    'empresa',
    'idea',
    'punto',
    'forma',
    'valor',
    'grupo',
    'acción',
    'desarrollo',
    'experiencia',
    'contenido',
    'página',
    'texto',
    'imagen',
    'diseño',
    'color',
    'espacio',
    'detalle',
    'estructura',
    'objetivo',
    'planificación',
    'entrega',
    'revisión',
    'simple',
    'nuevo',
    'grande',
    'claro',
    'rápido',
    'seguro',
    'ligero',
    'fuerte',
    'cercano',
    'siempre',
    'también',
    'porque',
    'durante',
    'entre',
    'sobre',
    'para',
    'con',
    'sin',
    'más',
    'muy',
    'cada',
    'todo',
    'otro',
    'mejor',
    'después',
    'antes',
    'ahora',
    'aquí',
    'allí',
  ],
};

export const CLASSIC_OPENINGS: Record<LoremLanguage, string> = {
  latin: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
  pt: 'Lorem ipsum dolor sit amet, a equipe revisa cada detalhe do projeto',
  en: 'Lorem ipsum dolor sit amet, the team reviews every detail of the project',
  es: 'Lorem ipsum dolor sit amet, el equipo revisa cada detalle del proyecto',
};

const MIN_SENTENCE_WORDS = 6;
const MAX_SENTENCE_WORDS = 15;
const MIN_PARAGRAPH_SENTENCES = 3;
const MAX_PARAGRAPH_SENTENCES = 6;
const COMMA_MIN_WORDS = 9;

const randomInt = (random: Random, min: number, max: number): number =>
  min + Math.floor(random() * (max - min + 1));

const pickWord = (language: LoremLanguage, random: Random): string => {
  const list = WORDS[language];
  return list[Math.floor(random() * list.length)] ?? 'lorem';
};

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

const buildWords = (language: LoremLanguage, count: number, random: Random): string[] => {
  const words: string[] = [];
  while (words.length < count) {
    const word = pickWord(language, random);
    if (word !== words[words.length - 1]) words.push(word);
  }
  return words;
};

const buildSentence = (language: LoremLanguage, random: Random, opening?: string): string => {
  if (opening) return `${opening}.`;
  const length = randomInt(random, MIN_SENTENCE_WORDS, MAX_SENTENCE_WORDS);
  const words = buildWords(language, length, random);
  if (length >= COMMA_MIN_WORDS) {
    const position = randomInt(random, 3, length - 4);
    words[position - 1] = `${words[position - 1]},`;
  }
  return `${capitalize(words.join(' '))}.`;
};

const buildParagraph = (language: LoremLanguage, random: Random, opening?: string): string => {
  const sentenceCount = randomInt(random, MIN_PARAGRAPH_SENTENCES, MAX_PARAGRAPH_SENTENCES);
  const sentences = [buildSentence(language, random, opening)];
  while (sentences.length < sentenceCount) sentences.push(buildSentence(language, random));
  return sentences.join(' ');
};

export const clampCount = (count: number, unit: LoremUnit): number => {
  if (!Number.isFinite(count)) return 1;
  return Math.min(MAX_COUNT[unit], Math.max(1, Math.floor(count)));
};

export const generateLorem = (options: LoremOptions, random: Random = Math.random): string => {
  const count = clampCount(options.count, options.unit);
  const { language, startWithClassic } = options;
  const opening = startWithClassic ? CLASSIC_OPENINGS[language] : undefined;

  if (options.unit === 'words') {
    const words = buildWords(language, count, random);
    if (opening) {
      const openingWords = opening.toLowerCase().replace(/,/g, '').split(' ').slice(0, count);
      words.splice(0, openingWords.length, ...openingWords);
    }
    return words.join(' ');
  }

  if (options.unit === 'sentences') {
    const sentences: string[] = [];
    for (let index = 0; index < count; index += 1) {
      sentences.push(buildSentence(language, random, index === 0 ? opening : undefined));
    }
    return sentences.join(' ');
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < count; index += 1) {
    paragraphs.push(buildParagraph(language, random, index === 0 ? opening : undefined));
  }
  return paragraphs.join('\n\n');
};

export const countWords = (text: string): number =>
  text.trim() ? text.trim().split(/\s+/).length : 0;
