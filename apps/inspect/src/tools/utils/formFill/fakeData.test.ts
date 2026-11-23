import { describe, expect, it } from 'vitest';
import {
  classifyField,
  type FieldDescriptor,
  formatCnpj,
  formatCpf,
  generateCnpjDigits,
  generateCpfDigits,
  generatePerson,
  isTermsHint,
  isValidCnpj,
  isValidCpf,
  normalizeHint,
  slugify,
  type ValueRequest,
  valueFor,
} from './fakeData';

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const field = (patch: Partial<FieldDescriptor>): FieldDescriptor => ({
  tag: 'input',
  type: 'text',
  name: '',
  id: '',
  autocomplete: '',
  placeholder: '',
  label: '',
  disabled: false,
  readOnly: false,
  ...patch,
});

const request = (patch: Partial<ValueRequest>): ValueRequest => ({
  kind: 'text',
  type: 'text',
  maxLength: -1,
  min: '',
  max: '',
  step: '',
  ...patch,
});

describe('CPF', () => {
  it('validates known numbers with the check digits', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-26')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(isValidCpf('123')).toBe(false);
  });

  it('generates only valid numbers', () => {
    const random = seeded(42);
    for (let index = 0; index < 500; index += 1) {
      const digits = generateCpfDigits(random);
      expect(digits).toMatch(/^\d{11}$/);
      expect(isValidCpf(digits)).toBe(true);
      expect(isValidCpf(formatCpf(digits))).toBe(true);
    }
  });

  it('formats with dots and dash', () => {
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
  });
});

describe('CNPJ', () => {
  it('validates known numbers with the check digits', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    expect(isValidCnpj('00.000.000/0000-00')).toBe(false);
  });

  it('generates only valid numbers with the 0001 branch', () => {
    const random = seeded(7);
    for (let index = 0; index < 500; index += 1) {
      const digits = generateCnpjDigits(random);
      expect(digits).toMatch(/^\d{8}0001\d{2}$/);
      expect(isValidCnpj(digits)).toBe(true);
      expect(isValidCnpj(formatCnpj(digits))).toBe(true);
    }
  });
});

describe('generatePerson', () => {
  const person = generatePerson(seeded(3), new Date(2026, 10, 22));

  it('keeps the identity coherent across fields', () => {
    expect(person.fullName).toBe(`${person.firstName} ${person.lastName}`);
    expect(
      person.email.startsWith(`${slugify(person.firstName)}.${slugify(person.lastName)}`),
    ).toBe(true);
    expect(person.email.endsWith('@example.com')).toBe(true);
    expect(person.company).toContain(person.lastName);
  });

  it('produces valid documents and Brazilian formats', () => {
    expect(isValidCpf(person.cpf)).toBe(true);
    expect(isValidCnpj(person.cnpj)).toBe(true);
    expect(person.phone).toMatch(/^\(\d{2}\) 9\d{4}-\d{4}$/);
    expect(person.cep).toMatch(/^\d{5}-\d{3}$/);
    expect(person.state).toMatch(/^[A-Z]{2}$/);
    expect(person.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('draws an adult birth date matching the age', () => {
    const year = Number(person.birthDate.slice(0, 4));
    expect(2026 - year).toBe(person.age);
    expect(person.age).toBeGreaterThanOrEqual(18);
  });

  it('is deterministic for the same random source', () => {
    expect(generatePerson(seeded(3), new Date(2026, 10, 22))).toEqual(person);
  });
});

describe('classifyField', () => {
  it('trusts autocomplete tokens first', () => {
    expect(classifyField(field({ autocomplete: 'given-name', name: 'x' }))).toBe('firstName');
    expect(classifyField(field({ autocomplete: 'family-name' }))).toBe('lastName');
    expect(classifyField(field({ autocomplete: 'shipping postal-code' }))).toBe('cep');
    expect(classifyField(field({ autocomplete: 'address-level2' }))).toBe('city');
  });

  it('never touches payment, one-time code and technical fields', () => {
    expect(classifyField(field({ autocomplete: 'cc-number' }))).toBe('skip');
    expect(classifyField(field({ name: 'cardNumber' }))).toBe('skip');
    expect(classifyField(field({ name: 'cvv' }))).toBe('skip');
    expect(classifyField(field({ autocomplete: 'one-time-code' }))).toBe('skip');
    expect(classifyField(field({ type: 'hidden', name: 'csrf' }))).toBe('skip');
    expect(classifyField(field({ type: 'file' }))).toBe('skip');
    expect(classifyField(field({ disabled: true, name: 'email' }))).toBe('skip');
    expect(classifyField(field({ readOnly: true, name: 'email' }))).toBe('skip');
  });

  it('reads names, placeholders and labels in Portuguese and English', () => {
    expect(classifyField(field({ name: 'cpf' }))).toBe('cpf');
    expect(classifyField(field({ placeholder: '00.000.000/0000-00', name: 'cnpj' }))).toBe('cnpj');
    expect(classifyField(field({ name: 'user_email' }))).toBe('email');
    expect(classifyField(field({ label: 'E-mail' }))).toBe('email');
    expect(classifyField(field({ name: 'telefone' }))).toBe('phone');
    expect(classifyField(field({ label: 'Celular (WhatsApp)' }))).toBe('phone');
    expect(classifyField(field({ name: 'CEP' }))).toBe('cep');
    expect(classifyField(field({ name: 'zipCode' }))).toBe('cep');
    expect(classifyField(field({ name: 'sobrenome' }))).toBe('lastName');
    expect(classifyField(field({ name: 'nome' }))).toBe('fullName');
    expect(classifyField(field({ name: 'razao_social' }))).toBe('company');
    expect(classifyField(field({ name: 'bairro' }))).toBe('neighborhood');
    expect(classifyField(field({ name: 'data_nascimento' }))).toBe('birthDate');
    expect(classifyField(field({ name: 'endereco' }))).toBe('street');
    expect(classifyField(field({ name: 'numero' }))).toBe('number');
  });

  it('falls back to the input type, then to text', () => {
    expect(classifyField(field({ type: 'email' }))).toBe('email');
    expect(classifyField(field({ type: 'tel' }))).toBe('phone');
    expect(classifyField(field({ type: 'date' }))).toBe('date');
    expect(classifyField(field({ type: 'number' }))).toBe('numeric');
    expect(classifyField(field({ type: 'checkbox' }))).toBe('checkbox');
    expect(classifyField(field({ type: 'radio' }))).toBe('radio');
    expect(classifyField(field({ tag: 'select' }))).toBe('select');
    expect(classifyField(field({ tag: 'textarea' }))).toBe('message');
    expect(classifyField(field({ name: 'xyz' }))).toBe('text');
  });

  it('flags password fields so the caller can require consent', () => {
    expect(classifyField(field({ type: 'password' }))).toBe('password');
    expect(classifyField(field({ type: 'password', name: 'confirmar_senha' }))).toBe('password');
  });
});

describe('hints', () => {
  it('normalises camelCase, accents and separators', () => {
    expect(normalizeHint('firstName')).toBe('first name');
    expect(normalizeHint('Endereço_de-Entrega')).toBe('endereco de entrega');
  });

  it('recognises terms and consent checkboxes', () => {
    expect(isTermsHint('Li e aceito os termos de uso')).toBe(true);
    expect(isTermsHint('I agree to the privacy policy')).toBe(true);
    expect(isTermsHint('Receber ofertas por SMS')).toBe(false);
  });
});

describe('valueFor', () => {
  const person = generatePerson(seeded(11), new Date(2026, 10, 22));
  const random = seeded(5);

  it('uses masks unless the field is too short or numeric', () => {
    expect(valueFor(request({ kind: 'cpf' }), person, random)).toBe(person.cpf);
    expect(valueFor(request({ kind: 'cpf', maxLength: 11 }), person, random)).toBe(
      person.cpfDigits,
    );
    expect(valueFor(request({ kind: 'cpf', type: 'number' }), person, random)).toBe(
      person.cpfDigits,
    );
    expect(valueFor(request({ kind: 'phone', maxLength: 11 }), person, random)).toBe(
      person.phoneDigits,
    );
    expect(valueFor(request({ kind: 'cep' }), person, random)).toBe(person.cep);
  });

  it('respects number bounds and steps', () => {
    for (let index = 0; index < 50; index += 1) {
      const value = Number(
        valueFor(
          request({ kind: 'numeric', type: 'number', min: '10', max: '20', step: '5' }),
          person,
          random,
        ),
      );
      expect([10, 15, 20]).toContain(value);
    }
    expect(
      valueFor(
        request({ kind: 'range', type: 'range', min: '0', max: '10', step: '1' }),
        person,
        random,
      ),
    ).toBe('5');
    expect(
      valueFor(request({ kind: 'age', type: 'number', min: '0', max: '17' }), person, random),
    ).toBe('17');
  });

  it('writes dates in the format of the input type', () => {
    const today = new Date(2026, 10, 22);
    expect(valueFor(request({ kind: 'birthDate', type: 'date' }), person, random, today)).toBe(
      person.birthDate,
    );
    expect(valueFor(request({ kind: 'birthDate', type: 'text' }), person, random, today)).toMatch(
      /^\d{2}\/\d{2}\/\d{4}$/,
    );
    expect(valueFor(request({ kind: 'date', type: 'date' }), person, random, today)).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
    expect(valueFor(request({ kind: 'time', type: 'time' }), person, random, today)).toMatch(
      /^\d{2}:\d{2}$/,
    );
    expect(
      valueFor(request({ kind: 'dateTime', type: 'datetime-local' }), person, random, today),
    ).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
  });

  it('truncates text to maxlength', () => {
    expect(valueFor(request({ kind: 'message', maxLength: 10 }), person, random)).toHaveLength(10);
    expect(valueFor(request({ kind: 'fullName', maxLength: 5 }), person, random)).toHaveLength(5);
  });
});
