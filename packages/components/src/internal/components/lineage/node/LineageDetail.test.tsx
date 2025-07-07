import React from 'react';
import { render, screen } from '@testing-library/react';
import { fromJS } from 'immutable';

import { CustomPropertiesRenderer } from './LineageDetail';

describe('CustomPropertiesRenderer', () => {
    const DEFAULT_PROPS = {
        data: fromJS([]),
    };

    function validateTable(expectedRowCount: number) {
        const table = screen.getByTestId('custom-properties-table');
        expect(table).toHaveClass('lineage-detail-prop-table');

        const rows = document.querySelectorAll('.lineage-detail-prop-row');
        expect(rows).toHaveLength(expectedRowCount);

        const cells = document.querySelectorAll('.lineage-detail-prop-cell');
        expect(cells).toHaveLength(expectedRowCount * 2);

        return { cells };
    }

    test('no data', () => {
        render(<CustomPropertiesRenderer {...DEFAULT_PROPS} />);
        validateTable(0);
    });

    test('with data', () => {
        render(
            <CustomPropertiesRenderer
                {...DEFAULT_PROPS}
                data={fromJS([
                    { fieldKey: 'urn:lsid:labkey$Pcom:Vocabulary$PFolder-771:ProtocolDomain#prop1', value: 1 },
                    { fieldKey: 'urn:lsid:labkey$Pcom:Vocabulary$PFolder-771:ProtocolDomain#prop2', value: 'test2' },
                ])}
            />
        );

        const { cells } = validateTable(2);

        expect(cells[0]).toHaveTextContent('prop1');
        expect(cells[1]).toHaveTextContent('1');
        expect(cells[2]).toHaveTextContent('prop2');
        expect(cells[3]).toHaveTextContent('test2');
    });
});
