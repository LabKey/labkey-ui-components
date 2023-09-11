import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { getTestAPIWrapper } from '../../APIWrapper';

import { QueryInfo } from '../../../public/QueryInfo';

import { ViewInfo } from '../../ViewInfo';

import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';
import { DesignerDetailTooltip, DesignerDetailPanel, DesignerDetailPanelProps } from './DesignerDetailPanel';

function defaultProps(): DesignerDetailPanelProps {
    const schemaQuery = new SchemaQuery('schema', 'query');
    const columns = [
        { fieldKey: 'rowId', shownInDetailsView: true },
        { fieldKey: 'description', shownInDetailsView: true },
        { fieldKey: 'nameExpression', shownInDetailsView: true },
        { fieldKey: 'aliquotNameExpression', shownInDetailsView: true },
    ];

    return {
        actions: makeTestActions(jest.fn),
        model: makeTestQueryModel(
            schemaQuery,
            QueryInfo.fromJsonForTests(
                {
                    columns,
                    name: schemaQuery.queryName,
                    schemaName: schemaQuery.schemaName,
                    views: [{ columns, name: ViewInfo.DETAIL_NAME }],
                },
                true
            ),
            {
                1: {
                    RowId: { value: 1 },
                    Description: { value: 'Test desc' },
                },
            },
            ['1'],
            1
        ),
        schemaQuery,
    };
}

describe('DesignerDetailPanel', () => {
    test('render', async () => {
        const aliquotNameExpression = 'aliquotNameExpression-AQ-2';
        const sampleNameExpression = 'sampleNameExpression-S-1';
        const expectedResults = [sampleNameExpression, aliquotNameExpression];

        // eslint-disable-next-line require-await
        await act(async () => {
            renderWithAppContext(<DesignerDetailPanel {...defaultProps()} />, {
                appContext: {
                    api: getTestAPIWrapper(jest.fn, {
                        domain: getDomainPropertiesTestAPIWrapper(jest.fn, {
                            getDomainNamePreviews: jest.fn().mockResolvedValue(expectedResults),
                        }),
                    }),
                },
            });
        });

        // Expect a LabelHelpTip that displays the name expression for both
        // the "NameExpression" and "AliquotNameExpression" columns
        const labelHelpTips = document.querySelectorAll('.label-help-target');
        expect(labelHelpTips).toHaveLength(2);

        userEvent.hover(labelHelpTips[0]);
        screen.getByText(`Example name that will be generated from the current pattern: ${sampleNameExpression}`);

        userEvent.hover(labelHelpTips[1]);
        screen.getByText(
            `Example aliquot name that will be generated from the current pattern: ${aliquotNameExpression}`
        );

        // verify table contents, description should be filtered out
        expect(document.getElementsByTagName('tr').length).toBe(3);
        expect(document.getElementsByTagName('table')[0].innerHTML).toContain('rowId');
        expect(document.getElementsByTagName('table')[0].innerHTML).not.toContain('description');
        expect(document.getElementsByTagName('table')[0].innerHTML).toContain('nameExpression');
        expect(document.getElementsByTagName('table')[0].innerHTML).toContain('aliquotNameExpression');
    });
});

describe('DesignerDetailTooltip', () => {
    test('with description', async () => {
        renderWithAppContext(<DesignerDetailTooltip {...defaultProps()} />, {});
        expect(document.getElementsByClassName('header-details-description')).toHaveLength(1);
        expect(document.getElementsByClassName('header-details-description')[0].innerHTML).toBe('Test desc');
    });

    test('with description', async () => {
        const props = defaultProps();
        const model = props.model.mutate({
            rows: {
                1: {
                    RowId: { value: 1 },
                    Description: { value: undefined },
                },
            },
        });
        renderWithAppContext(<DesignerDetailTooltip {...props} model={model} />, {});
        expect(document.getElementsByClassName('header-details-description')).toHaveLength(0);
    });
});
