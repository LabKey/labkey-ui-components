import React from 'react';

import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { CalculatedFieldOptions } from './CalculatedFieldOptions';
import { DomainField } from './models';
import { DOMAIN_FIELD_PARTIALLY_LOCKED, INT_RANGE_URI, STRING_RANGE_URI } from './constants';

describe('CalculatedFieldOptions', () => {
    test('default properties', async () => {
        await act(async () => {
            renderWithAppContext(
                <CalculatedFieldOptions
                    domainIndex={0}
                    index={0}
                    onChange={jest.fn()}
                    field={DomainField.create({ rangeURI: STRING_RANGE_URI })}
                />
            );
        });

        expect(document.querySelector('.domain-field-section-heading').textContent).toBe('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(0);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelector('textarea').textContent).toBe('');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe(null);
    });

    test('with existing expression', async () => {
        await act(async () => {
            renderWithAppContext(
                <CalculatedFieldOptions
                    domainIndex={0}
                    index={0}
                    onChange={jest.fn()}
                    field={DomainField.create({ valueExpression: '1=0', rangeURI: INT_RANGE_URI })}
                />
            );
        });

        expect(document.querySelector('.domain-field-section-heading').textContent).toBe('Expression');
        expect(document.querySelectorAll('.margin-bottom')).toHaveLength(1);
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelector('textarea').textContent).toBe('1=0');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe(null);
    });

    test('disabled from lockType', async () => {
        await act(async () => {
            renderWithAppContext(
                <CalculatedFieldOptions
                    domainIndex={0}
                    index={0}
                    onChange={jest.fn()}
                    field={DomainField.create({ valueExpression: '1=0', lockType: DOMAIN_FIELD_PARTIALLY_LOCKED })}
                />
            );
        });

        expect(document.querySelector('.domain-field-section-heading').textContent).toBe('Expression');
        expect(document.querySelectorAll('.form-control')).toHaveLength(1);
        expect(document.querySelector('textarea').textContent).toBe('1=0');
        expect(document.querySelector('textarea').getAttribute('disabled')).toBe('');
    });
});
