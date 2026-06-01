/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_USER_EDITOR } from '../../userFixtures';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LABKEY_VIS } from '../../constants';

import { QueryInfo } from '../../../public/QueryInfo';

import { ViewInfo } from '../../ViewInfo';

import { ChartBuilderMenuItem } from './ChartBuilderMenuItem';

describe('ChartBuilderMenuItem', () => {
    const actions = makeTestActions();
    const model = makeTestQueryModel(
        new SchemaQuery('schema', 'query'),
        QueryInfo.fromJsonForTests(
            {
                columns: [],
                name: 'query',
                schemaName: 'schema',
                views: [{ columns: [], name: ViewInfo.DEFAULT_NAME }],
            },
            true
        ),
        [],
        0
    );

    LABKEY_VIS = {
        GenericChartHelper: {
            getRenderTypes: () => [
                {
                    name: 'bar_chart',
                    fields: [],
                },
            ],
            getQueryConfigSortKey: () => 'lsid',
            queryChartData: () => Promise.resolve({}),
            TRENDLINE_OPTIONS: {},
        },
    };

    test('default props', async () => {
        renderWithAppContext(
            <ChartBuilderMenuItem
                actions={actions}
                disabledMessage=""
                maxCharts={5}
                model={model}
                selectedReportIds={[]}
            />,
            {
                serverContext: {
                    user: TEST_USER_EDITOR,
                },
            }
        );
        const menuItems = document.querySelectorAll('.lk-menu-item a');
        expect(menuItems).toHaveLength(1);
        expect(document.querySelector('.chart-menu-label').textContent).toBe('Create Chart');
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(0);

        await userEvent.click(menuItems[0]);
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(1);
    });

    test('max charts', async () => {
        renderWithAppContext(
            <ChartBuilderMenuItem
                actions={actions}
                disabledMessage="too many charts"
                maxCharts={5}
                model={model}
                selectedReportIds={['db:1', 'db:2', 'db:3', 'db:4', 'db:5', 'db:6']}
            />,
            {
                serverContext: {
                    user: TEST_USER_EDITOR,
                },
            }
        );
        const menuItems = document.querySelectorAll('.lk-menu-item.disabled');
        expect(menuItems).toHaveLength(1);
        expect(document.querySelector('.chart-menu-label').textContent).toBe('Create Chart');
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(0);

        await userEvent.click(menuItems[0]);
        expect(document.querySelectorAll('.chart-builder-modal')).toHaveLength(0);
    });
});
