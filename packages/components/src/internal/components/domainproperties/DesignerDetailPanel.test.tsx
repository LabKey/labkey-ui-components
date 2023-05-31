import React from 'react';
import { act } from 'react-dom/test-utils';
import { screen, fireEvent } from '@testing-library/react';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { renderWithAppContext } from '../../testUtils';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { getTestAPIWrapper } from '../../APIWrapper';

import { QueryInfo } from '../../../public/QueryInfo';

import { ViewInfo } from '../../ViewInfo';

import { getDomainPropertiesTestAPIWrapper } from './APIWrapper';
import { DesignerDetailPanel, DesignerDetailPanelProps } from './DesignerDetailPanel';

describe('DesignerDetailPanel', () => {
    function defaultProps(): DesignerDetailPanelProps {
        const schemaQuery = new SchemaQuery('schema', 'query');
        const columns = [
            { fieldKey: 'rowId', shownInDetailsView: true },
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
                    },
                },
                ['1'],
                1
            ),
            schemaQuery,
        };
    }

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

        fireEvent.mouseOver(labelHelpTips[0]);
        screen.getByText(`Example name that will be generated from the current pattern: ${sampleNameExpression}`);

        fireEvent.mouseOver(labelHelpTips[1]);
        screen.getByText(
            `Example aliquot name that will be generated from the current pattern: ${aliquotNameExpression}`
        );
    });
});
