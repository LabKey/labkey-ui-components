/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';

import { ValueDescriptor } from './models';

import { LookupCell, LookupCellProps } from './LookupCell';

describe('LookupCell', () => {
    function defaultProps(): LookupCellProps {
        return {
            col: new QueryColumn({
                lookup: new QueryLookup({
                    schemaName: 'schema',
                    queryName: 'query',
                    displayColumn: 'display',
                    keyColumn: 'key',
                }),
            }),
            colIdx: 0,
            forUpdate: false,
            modifyCell: jest.fn(),
            onBlur: jest.fn(),
            rowIdx: 0,
            select: jest.fn(),
            values: List.of({ raw: 'a' } as ValueDescriptor, { raw: 'b' } as ValueDescriptor, {} as ValueDescriptor),
        };
    }

    test('col with validValues', () => {
        render(<LookupCell {...defaultProps()} col={new QueryColumn({ validValues: ['a', 'b'] })} />);

        expect(document.querySelectorAll('.select-input-cell')).toHaveLength(1);
        expect(document.querySelector('.select-input__single-value')).toHaveTextContent('a');

        const options = document.querySelectorAll('.select-input__option');
        expect(options).toHaveLength(2);
        expect(options[0]).toHaveTextContent('a');
        expect(options[1]).toHaveTextContent('b');
    });

    test('col with defaultInputValue', () => {
        render(
            <LookupCell
                {...defaultProps()}
                col={new QueryColumn({ validValues: ['aa', 'ab', 'bb', 'ca'] })}
                defaultInputValue="a"
            />
        );

        expect(document.querySelectorAll('.select-input-cell')).toHaveLength(1);
        expect(document.querySelector('.select-input__input')).toHaveValue('a');

        const options = document.querySelectorAll('.select-input__option');
        expect(options).toHaveLength(3);
        expect(options[0]).toHaveTextContent('aa');
        expect(options[1]).toHaveTextContent('ab');
        expect(options[2]).toHaveTextContent('ca');
    });
});
