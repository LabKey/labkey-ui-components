/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { ExtendedMap } from '../../../../public/ExtendedMap';
import { QueryColumn } from '../../../../public/QueryColumn';
import { Formsy } from '../formsy/index';
import { AmountUnitInput } from './AmountUnitInput';
import { InputRendererProps } from './types';

describe('AmountUnitInput', () => {
    const amountCol = new QueryColumn({ name: 'StoredAmount', caption: 'amount', fieldKey: 'amountKey' });
    const unitCol = new QueryColumn({
        name: 'Units',
        caption: 'unit',
        fieldKey: 'unitKey',
        lookup: {
            hasQueryFilters: jest.fn(),
            displayColumn: 'test',
        },
    });

    function defaultProps(): InputRendererProps {
        return {
            allColumns: new ExtendedMap<string, QueryColumn>({
                [amountCol.fieldKey]: amountCol,
                [unitCol.fieldKey]: unitCol,
            }),
            allowFieldDisable: true,
            col: undefined,
            containerFilter: undefined,
            containerPath: undefined,
            data: { StoredAmount: 12.5, Units: 'mg' },
            initiallyDisabled: false,
            onSelectChange: jest.fn(),
            onToggleDisable: jest.fn(),
            queryFilters: {},
            value: undefined,
        };
    }

    test('returns null when required columns are missing', () => {
        // Missing unit column
        const someColumns = new ExtendedMap<string, QueryColumn>({ [amountCol.fieldKey]: amountCol });
        const { container } = render(
            <Formsy className="inner-test">
                <AmountUnitInput {...defaultProps()} allColumns={someColumns} allowFieldDisable={false} data={{}} />
            </Formsy>
        );

        // Component should render nothing when unit or amount column can't be found
        expect(container.querySelector('.inner-test')).toBeEmptyDOMElement();
    });

    test('with amount and unit column, can disable', () => {
        render(
            <Formsy>
                <AmountUnitInput {...defaultProps()} />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')[0]).toHaveTextContent('Amount and Units');
        expect(document.querySelectorAll('label')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(0);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(4);
        expect(inputs[0]).toHaveAttribute('value', 'true');
        expect(inputs[0]).toHaveAttribute('type', 'hidden');
        expect(inputs[0]).toHaveAttribute('name', 'StoredAmount::enabled');
        expect(inputs[1]).toHaveAttribute('value', '12.5');
        expect(inputs[1]).toHaveAttribute('name', 'amountKey');
        expect(inputs[1]).toHaveAttribute('placeholder', 'Enter amount');
        expect(inputs[2]).toHaveAttribute('role', 'combobox');
        expect(inputs[3]).toHaveAttribute('name', 'Units::enabled');
        expect(inputs[3]).toHaveAttribute('value', 'true');
        expect(inputs[3]).toHaveAttribute('type', 'hidden');
        expect(document.querySelector('.select-input__placeholder')).toHaveTextContent('Select or type to search...');
    });

    test('with amount and unit column, can disable and disabled', () => {
        render(
            <Formsy>
                <AmountUnitInput {...defaultProps()} initiallyDisabled />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')[0]).toHaveTextContent('Amount and Units');
        expect(document.querySelectorAll('label')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(1);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(4);
        expect(inputs[0]).toHaveAttribute('value', 'false');
        expect(inputs[0]).toHaveAttribute('type', 'hidden');
        expect(inputs[0]).toHaveAttribute('name', 'StoredAmount::enabled');
        expect(inputs[1]).toHaveAttribute('value', '12.5');
        expect(inputs[1]).toHaveAttribute('name', 'amountKey');
        expect(inputs[1]).toHaveAttribute('placeholder', 'Enter amount');
        expect(inputs[2]).toHaveAttribute('role', 'combobox');
        expect(inputs[3]).toHaveAttribute('name', 'Units::enabled');
        expect(inputs[3]).toHaveAttribute('value', 'false');
        expect(inputs[3]).toHaveAttribute('type', 'hidden');
        expect(document.querySelector('.select-input__placeholder')).toHaveTextContent('Select or type to search...');
    });

    test('with amount and unit column, can disable and disabled, has mixed value', () => {
        render(
            <Formsy>
                <AmountUnitInput
                    {...defaultProps()}
                    fieldWithMixedValues={['storedamount', 'units']}
                    initiallyDisabled
                />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')[0]).toHaveTextContent('Amount and Units');
        expect(document.querySelectorAll('label')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(1);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(4);
        expect(inputs[0]).toHaveAttribute('value', 'false');
        expect(inputs[0]).toHaveAttribute('type', 'hidden');
        expect(inputs[0]).toHaveAttribute('name', 'StoredAmount::enabled');
        expect(inputs[1]).toHaveAttribute('value', '12.5');
        expect(inputs[1]).toHaveAttribute('name', 'amountKey');
        expect(inputs[1]).toHaveAttribute('placeholder', '[Mixed]');
        expect(inputs[2]).toHaveAttribute('role', 'combobox');
        expect(inputs[3]).toHaveAttribute('name', 'Units::enabled');
        expect(inputs[3]).toHaveAttribute('value', 'false');
        expect(inputs[3]).toHaveAttribute('type', 'hidden');
        expect(document.querySelector('.select-input__placeholder')).toHaveTextContent('[Mixed]');
    });

    test('with amount and unit column, cannot disable', () => {
        render(
            <Formsy>
                <AmountUnitInput {...defaultProps()} allowFieldDisable={false} />
            </Formsy>
        );
        expect(document.querySelectorAll('.form-group.row')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label')[0]).toHaveTextContent('Amount and Units');
        expect(document.querySelectorAll('label')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-on')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-toggle-off')).toHaveLength(0);
        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(2);
        expect(inputs[0]).toHaveAttribute('value', '12.5');
        expect(inputs[0]).toHaveAttribute('name', 'amountKey');
        expect(inputs[0]).toHaveAttribute('placeholder', 'Enter amount');
        expect(inputs[1]).toHaveAttribute('role', 'combobox');
        expect(document.querySelector('.select-input__placeholder')).toHaveTextContent('Select or type to search...');
    });
});
