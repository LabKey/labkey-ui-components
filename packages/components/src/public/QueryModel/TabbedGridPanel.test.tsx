/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { fireEvent } from '@testing-library/react';

import { makeQueryInfo, makeTestData } from '../../internal/test/testHelpers';
import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';
import aminoAcidsQuery from '../../test/data/assayAminoAcidsData-getQuery.json';
import aminoAcidsQueryInfo from '../../test/data/assayAminoAcidsData-getQueryDetails.json';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';
import { QueryInfo } from '../QueryInfo';
import { SchemaQuery } from '../SchemaQuery';

import { QueryModel } from './QueryModel';

import { RowsResponse } from './QueryModelLoader';
import { TabbedGridPanel } from './TabbedGridPanel';
import { makeTestActions, makeTestQueryModel } from './testUtils';

let MIXTURES_QUERY_INFO: QueryInfo;
let MIXTURES_DATA: RowsResponse;
let AMINO_ACIDS_QUERY_INFO: QueryInfo;
let AMINO_ACIDS_DATA: RowsResponse;
const AMINO_ACIDS_TITLE = 'My Amino Acids';
const MIXTURES_TITLE = 'Mixtures';

const TABS_SELECTOR = '.nav-tabs li';

beforeAll(() => {
    MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    AMINO_ACIDS_QUERY_INFO = makeQueryInfo(aminoAcidsQueryInfo);
    AMINO_ACIDS_DATA = makeTestData(aminoAcidsQuery);
    MIXTURES_DATA = makeTestData(mixturesQuery);
});

describe('TabbedGridPanel', () => {
    let tabOrder;
    let queryModels;
    let mixturesModel: QueryModel;
    let aminoAcidsModel: QueryModel;
    let actions;

    beforeEach(() => {
        mixturesModel = makeTestQueryModel(
            new SchemaQuery('exp.data', 'mixtures'),
            MIXTURES_QUERY_INFO,
            MIXTURES_DATA.rows,
            MIXTURES_DATA.orderedRows,
            MIXTURES_DATA.rowCount,
            'mixtures'
        );
        aminoAcidsModel = makeTestQueryModel(
            new SchemaQuery('assay.General.Amino Acids', 'Runs'),
            AMINO_ACIDS_QUERY_INFO,
            AMINO_ACIDS_DATA.rows,
            AMINO_ACIDS_DATA.orderedRows,
            AMINO_ACIDS_DATA.rowCount,
            'aminoAcids'
        ).mutate({ title: AMINO_ACIDS_TITLE });
        tabOrder = ['mixtures', 'aminoAcids'];
        queryModels = {
            mixtures: mixturesModel,
            aminoAcids: aminoAcidsModel,
        };
        actions = makeTestActions(jest.fn);
    });

    const expectTabs = (container: HTMLElement, activeTab: string): void => {
        const tabs = container.querySelectorAll(TABS_SELECTOR);
        expect(tabs.length).toEqual(2);

        [MIXTURES_TITLE, AMINO_ACIDS_TITLE].forEach((tab, index) => {
            expect(tabs[index].textContent.trim()).toEqual(tab);

            if (tab === activeTab) {
                expect(tabs[index].className).toContain('active');
            } else {
                expect(tabs[index].className).not.toContain('active');
            }
        });
    };

    const clickTab = (container: HTMLElement, index: number) => {
        fireEvent.click(container.querySelectorAll(`${TABS_SELECTOR} a`)[index]);
    };

    test('default render', () => {
        const { container } = renderWithAppContext(
            <TabbedGridPanel tabOrder={tabOrder} queryModels={queryModels} actions={actions} />
        );
        const tabs = container.querySelectorAll(TABS_SELECTOR);

        // Here we test that tab order is honored, and that by default we set the first tab to active
        expect(tabs.length).toEqual(2);
        expect(tabs[0].textContent.trim()).toEqual('Mixtures');
        expect(tabs[0].className).toContain('active');
        // Model title should get priority for tab title over QueryInfo attributes.
        expect(tabs[1].textContent.trim()).toEqual(AMINO_ACIDS_TITLE);
        expect(tabs[1].className).not.toContain('active');
    });

    test('activeTab', () => {
        const { container } = renderWithAppContext(
            <TabbedGridPanel
                activeModelId="aminoAcids"
                tabOrder={tabOrder}
                queryModels={queryModels}
                actions={actions}
            />
        );

        expectTabs(container, AMINO_ACIDS_TITLE);
        clickTab(container, 0);
        expectTabs(container, MIXTURES_TITLE);
    });

    test('asPanel', () => {
        const title = 'My Tabbed Grid';
        let container: HTMLElement;
        let unmount: () => void;

        ({ container, unmount } = renderWithAppContext(
            <TabbedGridPanel tabOrder={tabOrder} title={title} queryModels={queryModels} actions={actions} />
        ));

        // When asPanel is true, we use appropriate styling classes
        expect(container.querySelector('.tabbed-grid-panel.panel-default')).not.toBeNull();
        expect(container.querySelector('.tabbed-grid-panel.panel')).not.toBeNull();
        expect(container.querySelector('.panel-heading').textContent.trim()).toBe(title);
        // GridPanel does not receive the title when asPanel is true (rendered by TabbedGridPanel itself)
        expect(container.querySelector('.panel-heading.view-header')).toBeNull();
        unmount();

        ({ container } = renderWithAppContext(
            <TabbedGridPanel
                tabOrder={tabOrder}
                title={title}
                queryModels={queryModels}
                actions={actions}
                asPanel={false}
            />
        ));

        // When asPanel is false we don't use those classes
        expect(container.querySelector('.tabbed-grid-panel.panel-default')).toBeNull();
        expect(container.querySelector('.tabbed-grid-panel.panel')).toBeNull();
        // GridPanel receives the title when asPanel is false
        expect(container.querySelector('.panel-heading.view-header')).not.toBeNull();
        expect(container.querySelector('.panel-heading').textContent.trim()).toBe(title);
    });

    test('single model', () => {
        const { container } = renderWithAppContext(
            <TabbedGridPanel tabOrder={['mixtures']} queryModels={{ mixtures: mixturesModel }} actions={actions} />
        );

        // Hide the tabs if we only have one model.
        expect(container.querySelector('.nav-tabs')).toBeNull();
    });

    test('controlled', () => {
        const onTabSelect = jest.fn();
        const { container, rerender } = renderWithAppContext(
            <TabbedGridPanel
                actions={actions}
                activeModelId="aminoAcids"
                onTabSelect={onTabSelect}
                queryModels={queryModels}
                tabOrder={tabOrder}
            />
        );
        expectTabs(container, AMINO_ACIDS_TITLE);
        clickTab(container, 0);
        expect(onTabSelect).toHaveBeenCalledWith('mixtures');
        // This is a controlled component, and we didn't change the activeModelId prop, so the tab shouldn't change
        // after click.
        expectTabs(container, AMINO_ACIDS_TITLE);
        rerender(
            <TabbedGridPanel
                actions={actions}
                activeModelId="mixtures"
                onTabSelect={onTabSelect}
                queryModels={queryModels}
                tabOrder={tabOrder}
            />
        );
        expectTabs(container, MIXTURES_TITLE);
    });

    test('showRowCountOnTabs', () => {
        const { container } = renderWithAppContext(
            <TabbedGridPanel
                actions={actions}
                activeModelId="aminoAcids"
                queryModels={queryModels}
                showRowCountOnTabs
                tabOrder={tabOrder}
            />
        );

        const tabs = container.querySelectorAll(TABS_SELECTOR);
        expect(tabs.length).toEqual(2);
        expect(tabs[0].textContent.trim()).toEqual(`${MIXTURES_TITLE} (${queryModels.mixtures.rowCount})`);
        expect(tabs[1].textContent.trim()).toEqual(`${AMINO_ACIDS_TITLE} (${queryModels.aminoAcids.rowCount})`);
    });

    test('showRowCountOnTabs with large counts', () => {
        const largeCountModels = {
            mixtures: mixturesModel.mutate({ rowCount: 1242 }),
            aminoAcids: aminoAcidsModel.mutate({ rowCount: 54321 }),
        };
        const { container } = renderWithAppContext(
            <TabbedGridPanel
                actions={actions}
                activeModelId="aminoAcids"
                queryModels={largeCountModels}
                showRowCountOnTabs
                tabOrder={tabOrder}
            />
        );

        const tabs = container.querySelectorAll(TABS_SELECTOR);
        expect(tabs.length).toEqual(2);
        expect(tabs[0].textContent.trim()).toEqual(`${MIXTURES_TITLE} (1,242)`);
        expect(tabs[1].textContent.trim()).toEqual(`${AMINO_ACIDS_TITLE} (54,321)`);
    });
});
