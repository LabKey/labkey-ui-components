import React from 'react';
import { ReactWrapper } from 'enzyme';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { Alert } from '../base/Alert';
import { mountWithAppServerContext, waitForLifecycle } from '../../test/enzymeTestHelpers';
import { TEST_USER_EDITOR } from '../../userFixtures';

import { SampleAmountEditModal } from './SampleAmountEditModal';
import { act } from 'react-dom/test-utils';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

describe('SampleAmountEditModal', () => {
    const testSchemaQuery = new SchemaQuery('schema', 'query', 'view');
    const emptyRow = {};
    const noun = 'noun';

    function validate(
        wrapper: ReactWrapper,
        amount: number,
        units: string,
        hasSelect: boolean,
        comment: string,
        noun: string,
        canSave: boolean,
        isNegative?: boolean,
        hasLabelUnits = true
    ): void {
        expect(wrapper.find('.checkin-amount-label').text()).toContain(
            'Amount' + (units && hasLabelUnits ? ' (' + units + ')' : '')
        );
        expect(wrapper.find('input.storage-amount-input').prop('value')).toBe(amount);
        expect(wrapper.find('.checkin-unit-select')).toHaveLength(hasSelect ? 1 : 0);
        expect(wrapper.find('input.checkin-unit-input')).toHaveLength(hasSelect ? 0 : 1);

        expect(wrapper.find('textarea').prop('value')).toBe(comment ?? undefined);
        expect(wrapper.find(Alert)).toHaveLength(isNegative ? 2 : 1);
        if (isNegative) expect(wrapper.find(Alert).at(1).text()).toBe('Amount must be a positive value.');
        validateSubmitButton(wrapper, noun, canSave);
    }

    function validateSubmitButton(wrapper: ReactWrapper, noun: string, canSave: boolean): void {
        const success = wrapper.find('button').at(2);
        expect(success.text()).toBe('Update ' + noun);
        expect(success.prop('disabled')).toBe(!canSave);
    }

    test('minimal props', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={emptyRow}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            undefined,
            { user: TEST_USER_EDITOR }
        );

        expect(wrapper.find('button').at(1).text()).toBe('Cancel');
        validate(wrapper, undefined, undefined, false, undefined, noun, false);

        wrapper.unmount();
    });

    test('Amount null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: null },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            undefined,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, undefined, row.Units.value, true, undefined, noun, false);

        wrapper.unmount();
    });

    test('StoredAmount negative', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '-500' },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            undefined,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, true, undefined, noun, false, true);

        wrapper.unmount();
    });

    test('Units null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: null },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            undefined,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, undefined, noun, false);

        wrapper.unmount();
    });

    test('Units custom', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'custom' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            undefined,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, undefined, noun, false);

        wrapper.unmount();
    });

    test('Set units, can save', async () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'oldUnits' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithAppServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            {
                api: getTestAPIWrapper(jest.fn, {
                    folder: getFolderTestAPIWrapper(jest.fn, {
                        getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: false }),
                    }),
                }),
            },
            { user: TEST_USER_EDITOR }
        );
        await waitForLifecycle(wrapper);

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, undefined, noun, false);

        const newUnits = 'newUnits';
        act(() => {
            wrapper.find('input.checkin-unit-input').simulate('change', { target: { value: newUnits } });
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, row.StoredAmount.value, newUnits, false, undefined, noun, true, false, false);

        wrapper.unmount();
    });
});
