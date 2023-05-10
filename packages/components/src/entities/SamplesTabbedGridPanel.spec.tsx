import React from 'react';
import { act } from 'react-dom/test-utils';
import { fromJS } from 'immutable';
import { ReactWrapper } from 'enzyme';

import { mountWithAppServerContext, waitForLifecycle } from '../internal/testHelpers';

import { TEST_USER_READER, TEST_USER_STORAGE_DESIGNER } from '../internal/userFixtures';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';

import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import { SamplesBulkUpdateForm } from './SamplesBulkUpdateForm';
import { SamplesEditableGrid } from './SamplesEditableGrid';

const SQ = new SchemaQuery('schema', 'query');
const QI = new QueryInfo({ title: 'Test title' });

const ALL_QM = makeTestQueryModel(SQ, QI);
const QM1 = makeTestQueryModel(SQ, QI);
const QM2 = makeTestQueryModel(SQ, QI);

const DEFAULT_PROPS = {
    user: TEST_USER_READER,
    queryModels: {
        all: ALL_QM,
        tab1: QM1,
        tab2: QM2,
    },
    actions: makeTestActions(),
    samplesEditableGridProps: {},
    gridButtons: undefined,
    isAllSamplesTab: () => false,
};

const SINGLE_TAB_PROPS = {
    user: TEST_USER_READER,
    queryModels: {
        tab1: QM1,
    },
    actions: makeTestActions(),
    samplesEditableGridProps: {},
    gridButtons: undefined,
};

describe('SamplesTabbedGridPanel', () => {
    function validate(wrapper: ReactWrapper, editable = false, activeTab = 'all', bulkUpdate = false): void {
        expect(wrapper.find(SamplesEditableGrid)).toHaveLength(editable ? 1 : 0);

        expect(wrapper.find(TabbedGridPanel)).toHaveLength(!editable ? 1 : 0);
        if (!editable) {
            expect(wrapper.find(TabbedGridPanel).prop('tabOrder')).toStrictEqual(['all', 'tab1', 'tab2']);
            expect(wrapper.find(TabbedGridPanel).prop('activeModelId')).toBe(activeTab);
        }

        expect(wrapper.find(SamplesBulkUpdateForm)).toHaveLength(bulkUpdate ? 1 : 0);
    }

    test('activeModelId is first tab by default for multiple types', () => {
        const wrapper = mountWithAppServerContext(<SamplesTabbedGridPanel {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('activeModelId is second tab when one sample type', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={ {
                    all: ALL_QM,
                    tab1: QM1,
                }}
            />);

        expect(wrapper.find(TabbedGridPanel)).toHaveLength( 1);
        expect(wrapper.find(TabbedGridPanel).prop('tabOrder')).toStrictEqual(['all', 'tab1']);
        expect(wrapper.find(TabbedGridPanel).prop('activeModelId')).toBe('tab1');

        wrapper.unmount();
    });

    test('activeModelId is initialTabId', () => {
        const wrapper = mountWithAppServerContext(<SamplesTabbedGridPanel {...DEFAULT_PROPS} initialTabId="tab2" />);
        validate(wrapper, false, 'tab2');
        wrapper.unmount();
    });

    test('createBtnParent props without activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                createBtnParentType="testParentType"
                createBtnParentKey="testParentKey"
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
                    tab1: makeTestQueryModel(SQ, QI),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        expect(buttonProps['createBtnParentType']).toBe('testParentType');
        expect(buttonProps['createBtnParentKey']).toBe('testParentKey');
        wrapper.unmount();
    });

    test('createBtnParent props with activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                createBtnParentType="testParentType"
                createBtnParentKey="testParentKey"
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab1: makeTestQueryModel(SQ, QI),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        expect(buttonProps['createBtnParentType']).toBe('testParentType');
        expect(buttonProps['createBtnParentKey']).toBe('testParentKey');
        wrapper.unmount();
    });

    test('call toggleEditWithGridUpdate without activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        buttonProps['toggleEditWithGridUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper);
        wrapper.unmount();
    });

    test('call toggleEditWithGridUpdate with activeModel selections', async () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        act(() => {
            const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
            buttonProps['toggleEditWithGridUpdate']();
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);

        validate(wrapper, true);
        wrapper.unmount();
    });

    test('call showBulkUpdate without activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        buttonProps['showBulkUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper);
        wrapper.unmount();
    });

    test('call showBulkUpdate with activeModel selections', async () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);

        act(() => {
            const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
            buttonProps['showBulkUpdate']();
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);

        validate(wrapper, false, 'all', true);
        expect(wrapper.find(SamplesBulkUpdateForm).prop('sampleSet')).toBe('query');
        expect(wrapper.find(SamplesBulkUpdateForm).prop('sampleSetLabel')).toBe('Test title');
        wrapper.unmount();
    });

    test('onBulkUpdateComplete set selectionData', async () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    all: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);

        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        act(() => {
            buttonProps['showBulkUpdate']();
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, false, 'all', true);

        // call onBulkUpdateComplete with submitForEdit false, which does not puts the component in edit grid mode
        act(() => {
            wrapper.find(SamplesBulkUpdateForm).invoke('onBulkUpdateComplete')(fromJS({ a: 1 }), false);
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);
        validate(wrapper);

        // open back up the bulk edit modal
        act(() => {
            buttonProps['showBulkUpdate']();
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);

        // call onBulkUpdateComplete with submitForEdit true, which puts the component in edit grid mode
        act(() => {
            wrapper.find(SamplesBulkUpdateForm).invoke('onBulkUpdateComplete')(fromJS({ a: 1 }), true);
            wrapper.setProps({ actions: makeTestActions() }); // force re-render
        });
        await waitForLifecycle(wrapper);
        validate(wrapper, true);
        wrapper.unmount();
    });

    // Expected: Printing is allowed on pages with no tabs (e.g., Single model)
    test('showLabelOption true, user.isGuest false, Single model, isAllSamplesSchema false', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...SINGLE_TAB_PROPS}
                tabbedGridPanelProps={{ alwaysShowTabs: true }}
                showLabelOption={true}
            />,
            {},
            { user: TEST_USER_READER },
            {},
            {},
            { printServiceUrl: 'jest', defaultLabel: 3 }
        );
        expect(wrapper.find(SamplesEditableGrid)).toHaveLength(0);
        expect(wrapper.find(TabbedGridPanel)).toHaveLength(1);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeDefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeDefined();
        wrapper.unmount();
    });

    // Expected: Printing not allowed on single tab with alwaysShowTabs set
    test('showLabelOption true, user.isGuest false, Single model, isAllSamplesSchema', () => {
        const isAllSamples = (): boolean => true;
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...SINGLE_TAB_PROPS}
                tabbedGridPanelProps={{ alwaysShowTabs: true }}
                showLabelOption={true}
                isAllSamplesTab={isAllSamples}
            />,
            {},
            { user: TEST_USER_READER },
            {},
            {},
            { printServiceUrl: 'jest' }
        );
        expect(wrapper.find(SamplesEditableGrid)).toHaveLength(0);
        expect(wrapper.find(TabbedGridPanel)).toHaveLength(1);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });

    // Expected: Printing not allowed on 'All' tab
    test('showLabelOption true, user.isGuest false, isAllSamples = true', () => {
        const isAllSamples = (): boolean => true;
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel {...DEFAULT_PROPS} showLabelOption={true} isAllSamplesTab={isAllSamples} />,
            {},
            { user: TEST_USER_READER },
            {},
            {},
            { printServiceUrl: 'jest' }
        );
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });

    // Expected: Printing allowed on secondary tab
    test('showLabelOption true, user.isGuest false, isAllSamples = false', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel {...DEFAULT_PROPS} showLabelOption={true} initialTabId={QM1.id} />,
            {},
            { user: TEST_USER_READER },
            {},
            {},
            { printServiceUrl: 'jest' }
        );
        validate(wrapper, false, 'model');
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeDefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeDefined();
        wrapper.unmount();
    });

    // Expected: Printing not allowed -- flag set to false
    test('showLabelOption false, user.isGuest false', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel {...DEFAULT_PROPS} showLabelOption={false} />,
            {},
            { user: TEST_USER_READER },
            {},
            {},
            { printServiceUrl: 'jest' }
        );
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });

    // Expected: Printing not allowed -- flag set to false and user is guest
    test('showLabelOption false, user.isGuest true', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel {...DEFAULT_PROPS} showLabelOption={false} />,
            {},
            { user: TEST_USER_STORAGE_DESIGNER },
            {},
            {}
        );
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });

    // Expected: Printing not allowed -- user is guest
    test('showLabelOption true, user.isGuest true', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel {...DEFAULT_PROPS} showLabelOption={true} />,
            {},
            { user: TEST_USER_STORAGE_DESIGNER },
            {},
            {}
        );
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });
});
