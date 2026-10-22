import { describe, expect, it } from 'vitest';
import {
  assertDraftEditable,
  nextVersionNumber,
  validateControlInput,
} from '../../server/src/domain/controlVersionPolicy';
import { ImmutableRecordError, ValidationError } from '../../server/src/domain/errors';

const valid = {
  frameworkCode: 'ISO27001',
  controlId: 'A.5.1',
  title: 'Policies for information security',
  description: 'Synthetic description',
  category: 'Organizational',
  defaultSeverity: 'HIGH',
};

describe('[AC-01] control version policy', () => {
  it('[AC-01] accepts a well-formed control', () => {
    expect(validateControlInput(valid)).toEqual(valid);
  });

  it.each([
    ['controlId', 'has space'],
    ['controlId', ''],
    ['title', 'ab'],
    ['description', ''],
    ['category', 'x'],
    ['defaultSeverity', 'SEVERE'],
    ['frameworkCode', ''],
  ])('[AC-01] rejects invalid %s=%j', (field, value) => {
    try {
      validateControlInput({ ...valid, [field]: value });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).fields).toHaveProperty(field);
    }
  });

  it('[AC-01][NFR-08] a published version is never editable', () => {
    expect(() => assertDraftEditable('PUBLISHED')).toThrow(ImmutableRecordError);
    expect(() => assertDraftEditable('DRAFT')).not.toThrow();
  });

  it('[AC-01] revisions get the next integer version', () => {
    expect(nextVersionNumber([])).toBe(1);
    expect(nextVersionNumber([1])).toBe(2);
    expect(nextVersionNumber([1, 3, 2])).toBe(4);
  });
});
