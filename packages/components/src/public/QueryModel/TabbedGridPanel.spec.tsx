import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { makeQueryInfo, makeTestData } from '../../internal/testHelpers';
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
            SchemaQuery.create('exp.data', 'mixtures'),
            MIXTURES_QUERY_INFO,
            MIXTURES_DATA.rows,
            MIXTURES_DATA.orderedRows,
            MIXTURES_DATA.rowCount,
            'mixtures'
        );
        aminoAcidsModel = makeTestQueryModel(
            SchemaQuery.create('assay.General.Amino Acids', 'Runs'),
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

    const expectTabs = (wrapper: ReactWrapper, activeTab: string): void => {
        const tabs = wrapper.find('.nav-tabs li');
        expect(tabs.length).toEqual(2);

        [MIXTURES_TITLE, AMINO_ACIDS_TITLE].forEach((tab, index) => {
            expect(tabs.at(index).text()).toEqual(tab);

            if (tab === activeTab) {
                expect(tabs.at(index).props().className).toContain('active');
            } else {
                expect(tabs.at(index).props().className).not.toContain('active');
            }
        });
    };

    const clickTab = (wrapper: ReactWrapper, index: number) => {
        wrapper.find('.nav-tabs li a').at(index).simulate('click');
    };

    test('default render', () => {
        const wrapper = mount(<TabbedGridPanel tabOrder={tabOrder} queryModels={queryModels} actions={actions} />);
        const tabs = wrapper.find('.nav-tabs li');

        // Here we test that tab order is honored, and that by default we set the first tab to active
        expect(tabs.length).toEqual(2);
        expect(tabs.at(0).text()).toEqual('Mixtures');
        expect(tabs.at(0).props().className).toContain('active');
        // Model title should get priority for tab title over QueryInfo attributes.
        expect(tabs.at(1).text()).toEqual(AMINO_ACIDS_TITLE);
        expect(tabs.at(1).props().className).not.toContain('active');
    });

    test('activeTab', () => {
        const wrapper = mount(
            <TabbedGridPanel
                activeModelId="aminoAcids"
                tabOrder={tabOrder}
                queryModels={queryModels}
                actions={actions}
            />
        );

        expectTabs(wrapper, AMINO_ACIDS_TITLE);
        clickTab(wrapper, 0);
        expectTabs(wrapper, MIXTURES_TITLE);
    });

    test('asPanel', () => {
        const title = 'My Tabbed Grid';
        const wrapper = mount(
            <TabbedGridPanel tabOrder={tabOrder} title={title} queryModels={queryModels} actions={actions} />
        );

        // When asPanel is true we should render the title
        expect(wrapper.find('.tabbed-grid-panel.panel-default').exists()).toEqual(true);
        expect(wrapper.find('.tabbed-grid-panel__title').text()).toEqual(title);

        // When asPanel is false we should not render the title
        wrapper.setProps({ asPanel: false });
        expect(wrapper.find('.tabbed-grid-panel.panel-default').exists()).toEqual(false);
        expect(wrapper.find('.tabbed-grid-panel__title').exists()).toEqual(false);
    });

    test('single model', () => {
        const wrapper = mount(
            <TabbedGridPanel tabOrder={['mixtures']} queryModels={{ mixtures: mixturesModel }} actions={actions} />
        );

        // Hide the tabs if we only have one model.
        expect(wrapper.find('.nav-tabs').exists()).toEqual(false);
    });

    test('controlled', () => {
        const onTabSelect = jest.fn();
        const wrapper = mount(
            <TabbedGridPanel
                actions={actions}
                activeModelId="aminoAcids"
                onTabSelect={onTabSelect}
                queryModels={queryModels}
                tabOrder={tabOrder}
            />
        );
        expectTabs(wrapper, AMINO_ACIDS_TITLE);
        clickTab(wrapper, 0);
        expect(onTabSelect).toHaveBeenCalledWith('mixtures');
        // This is a controlled component, and we didn't change the activeModelId prop, so the tab shouldn't change
        // after click.
        expectTabs(wrapper, AMINO_ACIDS_TITLE);
        wrapper.setProps({ activeModelId: 'mixtures' });
        expectTabs(wrapper, MIXTURES_TITLE);
    });
});
