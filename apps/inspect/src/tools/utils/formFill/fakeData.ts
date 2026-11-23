export type Random = () => number;

const randomInt = (random: Random, min: number, max: number): number =>
  min + Math.floor(random() * (max - min + 1));

const pick = <T>(list: readonly T[], random: Random): T =>
  list[Math.floor(random() * list.length)] as T;

const digitsOf = (value: string): number[] =>
  [...value.replace(/\D/g, '')].map((digit) => Number(digit));

const allSame = (digits: readonly number[]): boolean =>
  digits.every((digit) => digit === digits[0]);

const checkDigit = (digits: readonly number[], weights: readonly number[]): number => {
  const sum = digits.reduce((total, digit, index) => total + digit * (weights[index] ?? 0), 0);
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

const CPF_WEIGHTS_FIRST = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CPF_WEIGHTS_SECOND = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const CNPJ_WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

export const formatCpf = (digits: string): string =>
  digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');

export const formatCnpj = (digits: string): string =>
  digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');

export const formatCep = (digits: string): string => digits.replace(/^(\d{5})(\d{3})$/, '$1-$2');

export const isValidCpf = (value: string): boolean => {
  const digits = digitsOf(value);
  if (digits.length !== 11 || allSame(digits)) return false;
  const first = checkDigit(digits.slice(0, 9), CPF_WEIGHTS_FIRST);
  const second = checkDigit(digits.slice(0, 10), CPF_WEIGHTS_SECOND);
  return digits[9] === first && digits[10] === second;
};

export const isValidCnpj = (value: string): boolean => {
  const digits = digitsOf(value);
  if (digits.length !== 14 || allSame(digits)) return false;
  const first = checkDigit(digits.slice(0, 12), CNPJ_WEIGHTS_FIRST);
  const second = checkDigit(digits.slice(0, 13), CNPJ_WEIGHTS_SECOND);
  return digits[12] === first && digits[13] === second;
};

export const generateCpfDigits = (random: Random): string => {
  let base: number[];
  do {
    base = Array.from({ length: 9 }, () => randomInt(random, 0, 9));
  } while (allSame(base));
  const first = checkDigit(base, CPF_WEIGHTS_FIRST);
  const second = checkDigit([...base, first], CPF_WEIGHTS_SECOND);
  return [...base, first, second].join('');
};

export const generateCnpjDigits = (random: Random): string => {
  let root: number[];
  do {
    root = Array.from({ length: 8 }, () => randomInt(random, 0, 9));
  } while (allSame(root));
  const base = [...root, 0, 0, 0, 1];
  const first = checkDigit(base, CNPJ_WEIGHTS_FIRST);
  const second = checkDigit([...base, first], CNPJ_WEIGHTS_SECOND);
  return [...base, first, second].join('');
};

const FIRST_NAMES = [
  'Ana',
  'Bruno',
  'Carla',
  'Daniel',
  'Elisa',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'João',
  'Karina',
  'Lucas',
  'Mariana',
  'Nicolas',
  'Olívia',
  'Paulo',
  'Rafaela',
  'Sérgio',
  'Tatiana',
  'Vitor',
] as const;

const LAST_NAMES = [
  'Almeida',
  'Barros',
  'Cardoso',
  'Dias',
  'Ferreira',
  'Gomes',
  'Lima',
  'Martins',
  'Nunes',
  'Oliveira',
  'Pereira',
  'Ribeiro',
  'Santos',
  'Souza',
  'Teixeira',
  'Vieira',
] as const;

const COMPANY_SUFFIXES = ['Comércio', 'Serviços', 'Tecnologia', 'Consultoria', 'Soluções'] as const;

const AREA_CODES = ['11', '21', '31', '41', '47', '51', '61', '71', '81', '85'] as const;

export type CityRecord = {
  city: string;
  state: string;
  neighborhood: string;
  street: string;
  cepPrefix: string;
};

export const CITIES: readonly CityRecord[] = [
  {
    city: 'São Paulo',
    state: 'SP',
    neighborhood: 'Bela Vista',
    street: 'Avenida Paulista',
    cepPrefix: '01310',
  },
  {
    city: 'Rio de Janeiro',
    state: 'RJ',
    neighborhood: 'Copacabana',
    street: 'Avenida Atlântica',
    cepPrefix: '22021',
  },
  {
    city: 'Belo Horizonte',
    state: 'MG',
    neighborhood: 'Savassi',
    street: 'Rua Pernambuco',
    cepPrefix: '30130',
  },
  {
    city: 'Curitiba',
    state: 'PR',
    neighborhood: 'Centro',
    street: 'Rua XV de Novembro',
    cepPrefix: '80020',
  },
  {
    city: 'Porto Alegre',
    state: 'RS',
    neighborhood: 'Moinhos de Vento',
    street: 'Rua Padre Chagas',
    cepPrefix: '90570',
  },
  {
    city: 'Salvador',
    state: 'BA',
    neighborhood: 'Pituba',
    street: 'Avenida Manoel Dias da Silva',
    cepPrefix: '41830',
  },
  {
    city: 'Recife',
    state: 'PE',
    neighborhood: 'Boa Viagem',
    street: 'Avenida Boa Viagem',
    cepPrefix: '51011',
  },
  { city: 'Brasília', state: 'DF', neighborhood: 'Asa Sul', street: 'SQS 308', cepPrefix: '70355' },
];

export type FakePerson = {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  username: string;
  phoneDigits: string;
  phone: string;
  cpf: string;
  cpfDigits: string;
  cnpj: string;
  cnpjDigits: string;
  company: string;
  birthDate: string;
  cepDigits: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  website: string;
  password: string;
  age: number;
};

export const slugify = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const pad = (value: number): string => String(value).padStart(2, '0');

export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const formatPhone = (digits: string): string =>
  digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');

export const generatePerson = (random: Random, today: Date = new Date()): FakePerson => {
  const firstName = pick(FIRST_NAMES, random);
  const lastName = pick(LAST_NAMES, random);
  const place = pick(CITIES, random);
  const cpfDigits = generateCpfDigits(random);
  const cnpjDigits = generateCnpjDigits(random);
  const phoneDigits = `${pick(AREA_CODES, random)}9${String(randomInt(random, 0, 99999999)).padStart(8, '0')}`;
  const cepDigits = `${place.cepPrefix}${String(randomInt(random, 0, 999)).padStart(3, '0')}`;
  const age = randomInt(random, 18, 65);
  const birth = new Date(
    today.getFullYear() - age,
    randomInt(random, 0, 11),
    randomInt(random, 1, 28),
  );
  const slug = `${slugify(firstName)}.${slugify(lastName)}`;
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`,
    email: `${slug}${randomInt(random, 10, 99)}@example.com`,
    username: `${slugify(firstName)}${slugify(lastName)}${randomInt(random, 10, 99)}`,
    phoneDigits,
    phone: formatPhone(phoneDigits),
    cpf: formatCpf(cpfDigits),
    cpfDigits,
    cnpj: formatCnpj(cnpjDigits),
    cnpjDigits,
    company: `${lastName} ${pick(COMPANY_SUFFIXES, random)} Ltda`,
    birthDate: toIsoDate(birth),
    cepDigits,
    cep: formatCep(cepDigits),
    street: place.street,
    number: String(randomInt(random, 10, 2500)),
    complement: `Sala ${randomInt(random, 1, 99)}`,
    neighborhood: place.neighborhood,
    city: place.city,
    state: place.state,
    country: 'Brasil',
    website: 'https://example.com',
    password: 'Teste@12345',
    age,
  };
};

export type FieldKind =
  | 'skip'
  | 'firstName'
  | 'lastName'
  | 'fullName'
  | 'email'
  | 'phone'
  | 'cpf'
  | 'cnpj'
  | 'cep'
  | 'street'
  | 'number'
  | 'complement'
  | 'neighborhood'
  | 'city'
  | 'state'
  | 'country'
  | 'company'
  | 'username'
  | 'password'
  | 'website'
  | 'birthDate'
  | 'age'
  | 'date'
  | 'dateTime'
  | 'time'
  | 'month'
  | 'week'
  | 'numeric'
  | 'range'
  | 'color'
  | 'message'
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'select';

export type FieldDescriptor = {
  tag: 'input' | 'select' | 'textarea';
  type: string;
  name: string;
  id: string;
  autocomplete: string;
  placeholder: string;
  label: string;
  disabled: boolean;
  readOnly: boolean;
};

export const normalizeHint = (value: string): string =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const AUTOCOMPLETE_KINDS: Readonly<Record<string, FieldKind>> = {
  'given-name': 'firstName',
  'additional-name': 'firstName',
  'family-name': 'lastName',
  name: 'fullName',
  email: 'email',
  tel: 'phone',
  'tel-national': 'phone',
  'postal-code': 'cep',
  'street-address': 'street',
  'address-line1': 'street',
  'address-line2': 'complement',
  'address-level1': 'state',
  'address-level2': 'city',
  'address-level3': 'neighborhood',
  country: 'country',
  'country-name': 'country',
  organization: 'company',
  username: 'username',
  url: 'website',
  bday: 'birthDate',
  'new-password': 'password',
  'current-password': 'password',
};

const HINT_RULES: readonly (readonly [RegExp, FieldKind])[] = [
  [/\b(cc|card|cartao|cvv|cvc|csc|iban|conta bancaria|agencia)\b/, 'skip'],
  [/\b(captcha|otp|token|codigo de verificacao|verification)\b/, 'skip'],
  [/\b(senha|password|passwd|pwd)\b/, 'password'],
  [/\bcnpj\b/, 'cnpj'],
  [/\bcpf\b/, 'cpf'],
  [/\b(cep|zip|zipcode|postal|codigo postal)\b/, 'cep'],
  [/\be ?mail\b|\bemail\b/, 'email'],
  [/\b(telefone|celular|fone|whats|whatsapp|phone|mobile|tel)\b/, 'phone'],
  [/\b(razao social|empresa|company|organization|organizacao)\b/, 'company'],
  [/\b(sobrenome|ultimo nome|last name|surname|family name)\b/, 'lastName'],
  [/\b(nome completo|full name|your name|seu nome|nome e sobrenome)\b/, 'fullName'],
  [/\b(primeiro nome|first name|given name)\b/, 'firstName'],
  [/\b(usuario|username|user name|login|apelido|nickname)\b/, 'username'],
  [/\b(nascimento|aniversario|birth|birthday|bday|dob)\b/, 'birthDate'],
  [/\b(idade|age)\b/, 'age'],
  [/\b(complemento|apto|apartamento|bloco|address line 2|apt)\b/, 'complement'],
  [/\b(bairro|neighborhood|neighbourhood|district)\b/, 'neighborhood'],
  [/\b(cidade|city|municipio|town)\b/, 'city'],
  [/\b(estado|uf|state|province|provincia)\b/, 'state'],
  [/\b(pais|country)\b/, 'country'],
  [/\b(endereco|logradouro|rua|avenida|street|address)\b/, 'street'],
  [/\b(numero|num|number|nro)\b/, 'number'],
  [/\b(site|website|url|link|pagina web)\b/, 'website'],
  [
    /\b(mensagem|message|comentario|comment|observacao|observacoes|descricao|description|assunto|texto|bio|sobre)\b/,
    'message',
  ],
  [/\b(nome|name)\b/, 'fullName'],
];

const SKIPPED_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'file']);

const classifyByType = (type: string): FieldKind | null => {
  switch (type) {
    case 'email':
      return 'email';
    case 'tel':
      return 'phone';
    case 'url':
      return 'website';
    case 'password':
      return 'password';
    case 'date':
      return 'date';
    case 'datetime-local':
      return 'dateTime';
    case 'time':
      return 'time';
    case 'month':
      return 'month';
    case 'week':
      return 'week';
    case 'range':
      return 'range';
    case 'color':
      return 'color';
    case 'checkbox':
      return 'checkbox';
    case 'radio':
      return 'radio';
    default:
      return null;
  }
};

export const classifyField = (field: FieldDescriptor): FieldKind => {
  if (field.disabled || field.readOnly) return 'skip';
  if (SKIPPED_TYPES.has(field.type)) return 'skip';
  if (field.tag === 'select') return 'select';

  const autocompleteTokens = field.autocomplete.toLowerCase().split(/\s+/).filter(Boolean);
  if (autocompleteTokens.some((token) => token.startsWith('cc-'))) return 'skip';
  if (autocompleteTokens.includes('one-time-code')) return 'skip';
  for (const token of autocompleteTokens) {
    const kind = Object.hasOwn(AUTOCOMPLETE_KINDS, token) ? AUTOCOMPLETE_KINDS[token] : undefined;
    if (kind) return kind;
  }

  const byType = classifyByType(field.type);
  if (byType === 'checkbox' || byType === 'radio') return byType;

  const hint = normalizeHint([field.name, field.id, field.placeholder, field.label].join(' '));
  for (const [pattern, kind] of HINT_RULES) {
    if (pattern.test(hint)) {
      if (byType === 'password' && kind !== 'password') break;
      return kind;
    }
  }

  if (byType) return byType;
  if (field.type === 'number') return 'numeric';
  if (field.tag === 'textarea') return 'message';
  return 'text';
};

export const isTermsHint = (hint: string): boolean =>
  /\b(termos|terms|aceito|accept|agree|concordo|lgpd|privacidade|privacy|politica|newsletter|li e)\b/.test(
    normalizeHint(hint),
  );

export type ValueRequest = {
  kind: FieldKind;
  type: string;
  maxLength: number;
  min: string;
  max: string;
  step: string;
};

const clampLength = (value: string, maxLength: number): string =>
  maxLength > 0 && value.length > maxLength ? value.slice(0, maxLength) : value;

const withinMask = (formatted: string, plain: string, request: ValueRequest): string =>
  request.type === 'number' || (request.maxLength > 0 && request.maxLength < formatted.length)
    ? plain
    : formatted;

const parseBound = (raw: string, fallback: number): number => {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const numericValue = (request: ValueRequest, person: FakePerson, random: Random): string => {
  const min = parseBound(request.min, 0);
  const max = parseBound(request.max, min + 100);
  const step = parseBound(request.step, 1);
  if (request.kind === 'age') return String(Math.min(max, Math.max(min, person.age)));
  if (request.kind === 'range') return String(min + Math.floor((max - min) / 2 / step) * step);
  const steps = Math.max(0, Math.floor((max - min) / step));
  const picked = min + randomInt(random, 0, steps) * step;
  return String(Number.isInteger(step) ? picked : Number(picked.toFixed(4)));
};

const boundedHouseNumber = (request: ValueRequest, person: FakePerson): string => {
  const min = parseBound(request.min, 0);
  const max = parseBound(request.max, Number.POSITIVE_INFINITY);
  return String(Math.min(max, Math.max(min, Number(person.number))));
};

export const valueFor = (
  request: ValueRequest,
  person: FakePerson,
  random: Random,
  today: Date = new Date(),
): string => {
  const { kind, maxLength } = request;
  switch (kind) {
    case 'firstName':
      return person.firstName;
    case 'lastName':
      return person.lastName;
    case 'fullName':
      return clampLength(person.fullName, maxLength);
    case 'email':
      return person.email;
    case 'phone':
      return withinMask(person.phone, person.phoneDigits, request);
    case 'cpf':
      return withinMask(person.cpf, person.cpfDigits, request);
    case 'cnpj':
      return withinMask(person.cnpj, person.cnpjDigits, request);
    case 'cep':
      return withinMask(person.cep, person.cepDigits, request);
    case 'street':
      return clampLength(person.street, maxLength);
    case 'number':
      return request.type === 'number' ? boundedHouseNumber(request, person) : person.number;
    case 'complement':
      return person.complement;
    case 'neighborhood':
      return person.neighborhood;
    case 'city':
      return person.city;
    case 'state':
      return person.state;
    case 'country':
      return person.country;
    case 'company':
      return clampLength(person.company, maxLength);
    case 'username':
      return clampLength(person.username, maxLength);
    case 'password':
      return person.password;
    case 'website':
      return person.website;
    case 'birthDate':
      return request.type === 'date' ? person.birthDate : formatBrDate(person.birthDate);
    case 'age':
    case 'range':
    case 'numeric':
      return numericValue(request, person, random);
    case 'date': {
      const future = new Date(today.getTime() + randomInt(random, 1, 60) * 86_400_000);
      return toIsoDate(future);
    }
    case 'dateTime': {
      const future = new Date(today.getTime() + randomInt(random, 1, 60) * 86_400_000);
      return `${toIsoDate(future)}T${pad(randomInt(random, 8, 18))}:00`;
    }
    case 'time':
      return `${pad(randomInt(random, 8, 18))}:${pad(randomInt(random, 0, 3) * 15)}`;
    case 'month':
      return `${today.getFullYear()}-${pad(randomInt(random, 1, 12))}`;
    case 'week':
      return `${today.getFullYear()}-W${pad(randomInt(random, 1, 52))}`;
    case 'color':
      return `#${randomInt(random, 0x202020, 0xe0e0e0).toString(16).padStart(6, '0')}`;
    case 'message':
      return clampLength(
        'Mensagem de teste gerada pelo Neruz Inspect. Pode ignorar este envio.',
        maxLength,
      );
    default:
      return clampLength('Texto de teste', maxLength);
  }
};

export const formatBrDate = (iso: string): string => {
  const [year, month, day] = iso.split('-');
  return year && month && day ? `${day}/${month}/${year}` : iso;
};
