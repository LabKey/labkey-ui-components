import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { createFormInputId } from './utils';
import { BooleanFieldOptions, BooleanFieldProps } from './BooleanFieldOptions';

describe('BooleanFieldOptions', () => {
    test('Boolean data type', () => {
        const domainIndex = 1;
        const expectedFormat = 'Yes;No;Maybe';
        const expectedLabel = 'Boolean Field Options';
        const index = 1;

        const props: BooleanFieldProps = {
            domainIndex,
            format: expectedFormat,
            index,
            label: expectedLabel,
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            onChange: jest.fn(),
        };

        const { rerender } = render(<BooleanFieldOptions {...props} />);

        // Verify label
        const sectionLabel = document.querySelector('.domain-field-section-heading');
        expect(sectionLabel.innerHTML).toEqual(expectedLabel);

        // Test format field initial value
        let formatField = document.getElementById(createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index));
        expect((formatField as HTMLInputElement).value).toEqual(expectedFormat);

        // Verify value changes with props
        const newFormat = 'Yes;No;Blank';
        rerender(<BooleanFieldOptions {...props} format={newFormat} />);
        formatField = document.getElementById(createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index));
        expect((formatField as HTMLInputElement).value).toEqual(newFormat);
    });

    test('onChange', async () => {
        const domainIndex = 1;
        const format = 'format';
        const index = 1;
        const expectedValue = 'X';
        const onChange = jest.fn();

        render(
            <BooleanFieldOptions
                format="format"
                domainIndex={domainIndex}
                index={index}
                label="Test onChange"
                lockType={DOMAIN_FIELD_NOT_LOCKED}
                onChange={onChange}
            />
        );

        const elementId = createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index);
        const formatField = document.getElementById(elementId);
        await userEvent.type(formatField, expectedValue);
        expect(onChange).toHaveBeenCalledWith(elementId, format + expectedValue);
    });
});
