/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { QueryColumn, QueryLookup } from '../../../../public/QueryColumn';

import { QuerySelect } from '../QuerySelect';

import { SampleColorInput, SampleColorInputRenderer } from './SampleColorInput';

jest.mock('../QuerySelect', () => ({
    QuerySelect: jest.fn(() => <div data-testid="query-select" />),
}));

const COL = new QueryColumn({
    caption: 'Sample Color',
    fieldKey: 'sampleColor',
    name: 'SampleColor',
    lookup: new QueryLookup({
        containerPath: '/LookupHome',
        displayColumn: 'Label',
        keyColumn: 'RowId',
        queryName: 'DataColors',
        schemaName: 'exp',
    }),
});

const lastQuerySelectProps = (): any => (QuerySelect as jest.Mock).mock.calls.at(-1)[0];

beforeEach(() => {
    (QuerySelect as jest.Mock).mockClear();
});

describe('SampleColorInput', () => {
    test('forces the color lookup query/value column and excludes archived colors', () => {
        render(<SampleColorInput col={COL} />);
        const props = lastQuerySelectProps();
        expect(props.schemaQuery).toBe(COL.lookup.schemaQuery);
        expect(props.valueColumn).toBe('RowId');
        expect(props.displayColumn).toBe('Label');
        expect(props.name).toBe('sampleColor');
        // archived colors are filtered out of the selectable options
        expect(props.queryFilters.size).toBe(1);
        expect(props.queryFilters.get(0).getColumnName()).toBe('Archived');
    });

    test('defaults containerPath to the lookup container', () => {
        render(<SampleColorInput col={COL} />);
        expect(lastQuerySelectProps().containerPath).toBe('/LookupHome');
    });

    test('lets a caller override the lookup containerPath', () => {
        render(<SampleColorInput col={COL} containerPath="/EditHere" />);
        expect(lastQuerySelectProps().containerPath).toBe('/EditHere');
    });

    test('renders the provided label field', () => {
        const renderLabelField = jest.fn(() => <div data-testid="label-field" />);
        render(<SampleColorInput col={COL} renderLabelField={renderLabelField} />);
        expect(renderLabelField).toHaveBeenCalledWith(COL);
        expect(screen.getByTestId('label-field')).toBeInTheDocument();
    });
});
