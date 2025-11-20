import React from 'react';
import { render } from '@testing-library/react';
import { AmountUnitInput } from './AmountUnitInput';
import { ExtendedMap } from '../../../../public/ExtendedMap';
import { QueryColumn } from '../../../../public/QueryColumn';
import { Formsy } from '../formsy/index';

describe('AmountUnitInput', () => {

    const amountCol = { name: 'StoredAmount', caption: 'amount', fieldKey: 'amountKey' };
    const unitCol = { name: 'Units', caption: 'unit', fieldKey: 'unitKey',
        lookup: {
            hasQueryFilters: jest.fn(),
            displayColumn: new QueryColumn({caption: 'test'})
        }
    };
    const data = { StoredAmount: 12.5, Units: 'mg' };
    const allColumns = new ExtendedMap<string, QueryColumn>({ [amountCol.fieldKey]: amountCol, [unitCol.fieldKey]: unitCol });

    const CAN_DISABLE: any = {
        allowFieldDisable: true,
        onSelectChange: jest.fn(),
        onToggleDisable: jest.fn(),
        initiallyDisabled: false,
        containerFilter: undefined,
        containerPath: undefined,
        allColumns,
        data,
        queryFilters: {},
    };

    const DISABLED: any = {
        ...CAN_DISABLE,
        initiallyDisabled: true
    };

    const NOT_DISABLABLE: any = {
        ...CAN_DISABLE,
        allowFieldDisable: false
    };

    test('returns null when required columns are missing', () => {
        // Missing unit column

        const someColumns = new ExtendedMap<string, QueryColumn>({ [amountCol.fieldKey]: amountCol });
        const { container } = render(
            <Formsy className='inner-test'>
                <AmountUnitInput
                    allowFieldDisable={false}
                    onSelectChange={jest.fn()}
                    onToggleDisable={jest.fn()}
                    initiallyDisabled={false}
                    containerFilter={undefined}
                    containerPath={undefined}
                    allColumns={someColumns}
                    data={{}}
                    queryFilters={{}}
                />
            </Formsy>
        );

        // Component should render nothing when unit or amount column can't be found
        expect(container.querySelector('.inner-test')).toBeEmptyDOMElement();
    });

    test('with amount and unit column, can disable', () => {

        const { container } = render(
            <Formsy>
                <AmountUnitInput {...CAN_DISABLE} />
            </Formsy>
            );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('label')).toHaveLength(2);
        expect(document.querySelectorAll('label')[0].textContent).toBe('Amount and Units ');
        expect(document.querySelectorAll('label')[1].textContent).toBe('');
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(0);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(4);
        expect(inputs[0].getAttribute('value')).toBe('true');
        expect(inputs[0].getAttribute('type')).toBe('hidden');
        expect(inputs[0].getAttribute('name')).toBe('StoredAmount::enabled');
        expect(inputs[1].getAttribute('value')).toBe('12.5');
        expect(inputs[1].getAttribute('name')).toBe('amountKey');
        expect(inputs[2].getAttribute('role')).toBe('combobox');
        expect(inputs[3].getAttribute('name')).toBe('Units::enabled');
        expect(inputs[3].getAttribute('value')).toBe('true');
        expect(inputs[3].getAttribute('type')).toBe('hidden');

    });

    test('with amount and unit column, can disable and disabled', () => {

        const { container } = render(
            <Formsy>
                <AmountUnitInput {...DISABLED} />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('label')).toHaveLength(2);
        expect(document.querySelectorAll('label')[0].textContent).toBe('Amount and Units ');
        expect(document.querySelectorAll('label')[1].textContent).toBe('');
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(1);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(4);
        expect(inputs[0].getAttribute('value')).toBe('false');
        expect(inputs[0].getAttribute('type')).toBe('hidden');
        expect(inputs[0].getAttribute('name')).toBe('StoredAmount::enabled');
        expect(inputs[1].getAttribute('value')).toBe('12.5');
        expect(inputs[1].getAttribute('name')).toBe('amountKey');
        expect(inputs[2].getAttribute('role')).toBe('combobox');
        expect(inputs[3].getAttribute('name')).toBe('Units::enabled');
        expect(inputs[3].getAttribute('value')).toBe('false');
        expect(inputs[3].getAttribute('type')).toBe('hidden');

    });

    test('with amount and unit column, cannot disable', () => {

        const { container } = render(
            <Formsy>
                <AmountUnitInput {...NOT_DISABLABLE} />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('label')).toHaveLength(2);
        expect(document.querySelectorAll('label')[0].textContent).toBe('Amount and Units ');
        expect(document.querySelectorAll('label')[1].textContent).toBe('');
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(0);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[0].getAttribute('value')).toBe('12.5');
        expect(inputs[0].getAttribute('name')).toBe('amountKey');
        expect(inputs[1].getAttribute('role')).toBe('combobox');
    });
})
