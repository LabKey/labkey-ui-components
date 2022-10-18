import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';
import { Button, SplitButton } from 'react-bootstrap';

import { AssayStateModel } from '../internal/components/assay/models';
import { Alert } from '../internal/components/base/Alert';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { LoadingState } from '../public/LoadingState';
import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';
import { QueryInfo } from '../public/QueryInfo';

import { mountWithAppServerContext, mountWithServerContext, waitForLifecycle } from '../internal/testHelpers';
import { TEST_USER_AUTHOR, TEST_USER_READER } from '../internal/userFixtures';
import { getTestAPIWrapper } from '../internal/APIWrapper';

import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';
import { ALIQUOT_FILTER_MODE } from '../internal/components/samples/constants';
import {
    AssayResultPanel,
    getSampleAssayDetailEmptyText,
    SampleAssayDetailBody,
    SampleAssayDetailBodyImpl,
    SampleAssayDetailButtons,
    SampleAssayDetailButtonsRight,
    SampleAssayDetailImpl,
} from './SampleAssayDetail';
import { getSamplesTestAPIWrapper } from '../internal/components/samples/APIWrapper';

const assayModel = new AssayStateModel({
    definitions: [
        new AssayDefinitionModel({ id: 17, name: 'First Assay', type: 'General', links: fromJS({ import: 'test1' }) }),
        new AssayDefinitionModel({ id: 41, name: 'NAb Assay', type: 'NAb', links: fromJS({ import: 'test2' }) }),
    ],
    definitionsLoadingState: LoadingState.LOADED,
});
const SQ = SchemaQuery.create('schema', 'query');
const modelLoadedNoRows = makeTestQueryModel(SQ, new QueryInfo(), {}, [], 0).mutate({
    queryInfoLoadingState: LoadingState.LOADED,
    rowsLoadingState: LoadingState.LOADED,
});
const modelLoadedWithRow = makeTestQueryModel(
    SQ,
    new QueryInfo(),
    { 1: { RowId: { value: 1 }, Name: { value: 'Name1' } } },
    ['1'],
    1
).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
const modelLoading = makeTestQueryModel(SQ).mutate({
    queryInfoLoadingState: LoadingState.LOADED,
    rowsLoadingState: LoadingState.LOADING,
});
const sampleModel = makeTestQueryModel(SQ);
const model = makeTestQueryModel(SQ).mutate({ title: 'First Assay' });
const DEFAULT_PROPS = {
    assayModel,
    sampleModel,
    model,
    actions: makeTestActions(),
    user: TEST_USER_READER,
};

describe('SampleAssayDetailButtons', () => {
    function validate(wrapper: ReactWrapper, buttonCount = 0): void {
        expect(wrapper.find(SplitButton)).toHaveLength(buttonCount > 1 ? 1 : 0);
        expect(wrapper.find(Button)).toHaveLength(buttonCount);
    }

    test('without insert perm', () => {
        const wrapper = mount(<SampleAssayDetailButtons {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('currentAssayHref undefined', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ title: 'Other Assay' });
        const wrapper = mount(<SampleAssayDetailButtons {...DEFAULT_PROPS} model={model} user={TEST_USER_AUTHOR} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('multiple menu items', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ title: 'NAb Assay' });
        const wrapper = mount(<SampleAssayDetailButtons {...DEFAULT_PROPS} model={model} user={TEST_USER_AUTHOR} />);
        validate(wrapper, 2);
        expect(wrapper.find(SplitButton).prop('href')).toBe('test2');
        wrapper.unmount();
    });

    test('one menu item', () => {
        const assayModel = new AssayStateModel({
            definitions: [
                new AssayDefinitionModel({
                    id: 17,
                    name: 'First Assay',
                    type: 'General',
                    links: fromJS({ import: 'test1' }),
                }),
            ],
            definitionsLoadingState: LoadingState.LOADED,
        });

        const wrapper = mount(
            <SampleAssayDetailButtons {...DEFAULT_PROPS} assayModel={assayModel} user={TEST_USER_AUTHOR} />
        );
        validate(wrapper, 1);
        expect(wrapper.find(Button).prop('href')).toBe('test1');
        wrapper.unmount();
    });
});

describe('SampleAssayDetailButtonsRight', () => {
    test('isSourceSampleAssayGrid false', () => {
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtonsRight {...DEFAULT_PROPS} isSourceSampleAssayGrid={false} />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(SampleAliquotViewSelector)).toHaveLength(1);
        expect(wrapper.find(SampleAliquotViewSelector).prop('headerLabel')).toBe('Show Assay Data with Samples');
        expect(wrapper.find(SampleAliquotViewSelector).prop('samplesLabel')).toBe('Sample Only');
        expect(wrapper.find(SampleAliquotViewSelector).prop('allLabel')).toBe('Sample or Aliquots');
        wrapper.unmount();
    });

    test('isSourceSampleAssayGrid true', () => {
        const wrapper = mountWithServerContext(
            <SampleAssayDetailButtonsRight {...DEFAULT_PROPS} isSourceSampleAssayGrid={true} />,
            { user: TEST_USER_READER }
        );
        expect(wrapper.find(SampleAliquotViewSelector)).toHaveLength(1);
        expect(wrapper.find(SampleAliquotViewSelector).prop('headerLabel')).toBe('Show Assay Data with Source Samples');
        expect(wrapper.find(SampleAliquotViewSelector).prop('samplesLabel')).toBe('Derived Samples Only');
        expect(wrapper.find(SampleAliquotViewSelector).prop('allLabel')).toBe('Derived Samples or Aliquots');
        wrapper.unmount();
    });
});

describe('getSampleAssayDetailEmptyText', () => {
    test('return undefined', () => {
        expect(getSampleAssayDetailEmptyText(true)).toBeUndefined();
        expect(getSampleAssayDetailEmptyText(false, undefined)).toBeUndefined();
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.all)).toBeUndefined();
    });

    test('return empty view message', () => {
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.none)).toBeDefined();
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.aliquots)).toBeDefined();
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.samples)).toBeDefined();
    });

    test('custom empty view message', () => {
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.none, 'test1', 'test2')).toBe('test1');
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.aliquots, 'test1', 'test2')).toBe('test2');
        expect(getSampleAssayDetailEmptyText(false, ALIQUOT_FILTER_MODE.samples, 'test1', 'test2')).toBe('test1');
    });
});

const SUMMARY_GRID_ID = 'assay-detail:assayruncount:1';
const SUMMARY_GRID_MODEL = makeTestQueryModel(
    SchemaQuery.create('exp', 'AssayRunsPerSample'),
    new QueryInfo(),
    { 1: { RowId: { value: 1 }, Name: { value: 'Name1' } } },
    ['1'],
    1
).mutate({
    id: SUMMARY_GRID_ID,
    queryInfoLoadingState: LoadingState.LOADED,
    rowsLoadingState: LoadingState.LOADED,
});

const IMPL_PROPS = {
    assayModel,
    sampleModel: modelLoadedWithRow,
    reloadAssays: jest.fn,
    assayDefinition: undefined,
    assayProtocol: undefined,
    onTabChange: jest.fn,
    actions: makeTestActions(),
    queryModels: { [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL },
    user: TEST_USER_READER,
};

describe('SampleAssayDetailBodyImpl', () => {
    function validate(wrapper: ReactWrapper, hasAssayResultsPanel = true, alertText?: string, loading = false): void {
        expect(wrapper.find(AssayResultPanel)).toHaveLength(hasAssayResultsPanel ? 1 : 0);
        if (alertText) {
            expect(wrapper.find(Alert).text()).toContain(alertText);
        }
        expect(wrapper.find(LoadingSpinner)).toHaveLength(loading ? 1 : 0);
        expect(wrapper.find(TabbedGridPanel)).toHaveLength(!hasAssayResultsPanel ? 1 : 0);
    }

    test('no assay models', () => {
        const wrapper = mountWithAppServerContext(<SampleAssayDetailBodyImpl {...IMPL_PROPS} />);
        validate(wrapper, true, 'There are no assay designs defined that reference this sample type');
        wrapper.unmount();
    });

    test('no assay models with emptyAssayDefDisplay', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                emptyAssayDefDisplay={
                    <AssayResultPanel>
                        <Alert>emptyAssayDefDisplay</Alert>
                    </AssayResultPanel>
                }
            />
        );
        validate(wrapper, true, 'emptyAssayDefDisplay');
        wrapper.unmount();
    });

    test('models loading', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                queryModels={{
                    [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL,
                    id1: modelLoadedNoRows,
                    id2: modelLoadedWithRow,
                    id3: modelLoading,
                }}
            />
        );
        validate(wrapper, true, undefined, true);
        wrapper.unmount();
    });

    test('no assay results for models', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                queryModels={{
                    [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL,
                    id1: modelLoadedNoRows,
                }}
            />
        );
        validate(wrapper, true, 'No assay results available for this sample.');
        wrapper.unmount();
    });

    test('no assay results for models with emptyAssayResultDisplay', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                queryModels={{
                    [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL,
                    id1: modelLoadedNoRows,
                }}
                emptyAssayResultDisplay={
                    <AssayResultPanel>
                        <Alert>emptyAssayResultDisplay</Alert>
                    </AssayResultPanel>
                }
            />
        );
        validate(wrapper, true, 'emptyAssayResultDisplay');
        wrapper.unmount();
    });

    test('with assay results', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                queryModels={{
                    [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL,
                    id1: modelLoadedNoRows.mutate({ id: 'id1' }),
                    id2: modelLoadedWithRow.mutate({ id: 'id2' }),
                }}
            />
        );
        validate(wrapper, false, undefined, true);
        const modelKeys = Object.keys(wrapper.find(TabbedGridPanel).prop('queryModels'));
        expect(modelKeys.indexOf(SUMMARY_GRID_ID)).toBe(0);
        expect(modelKeys.indexOf('id1')).toBe(1);
        expect(modelKeys.indexOf('id2')).toBe(2);
        const tabKeys = Object.keys(wrapper.find(TabbedGridPanel).prop('tabOrder'));
        expect(tabKeys.length).toBe(2);
        expect(tabKeys[0]).toBe('0');
        wrapper.unmount();
    });

    test('tabOrder by title', () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailBodyImpl
                {...IMPL_PROPS}
                queryModels={{
                    [SUMMARY_GRID_ID]: SUMMARY_GRID_MODEL,
                    id1: modelLoadedNoRows.mutate({ id: 'id1', title: 'C' }),
                    id2: modelLoadedWithRow.mutate({ id: 'id2', title: 'B' }),
                    id3: modelLoadedWithRow.mutate({ id: 'id3', title: 'A' }),
                }}
            />
        );
        validate(wrapper, false, undefined, true);
        expect(wrapper.find(TabbedGridPanel).prop('tabOrder')).toStrictEqual(['id3', 'id2', SUMMARY_GRID_ID]);
        wrapper.unmount();
    });
});

describe('SampleAssayDetailImpl', () => {
    // TODO more test cases for other parts of the SampleAssayDetailImpl to be added

    test('sampleAssayResultViewConfigs - none', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailImpl
                {...IMPL_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleAssayResultViewConfigs: () => Promise.resolve([]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        const configs = wrapper.find(SampleAssayDetailBody).prop('queryConfigs');
        expect(Object.keys(configs).length).toBe(1); // just summary grid
        wrapper.unmount();
    });

    const moduleAssayConfig = {
        title: 'Test',
        moduleName: 'ModuleB',
        schemaName: 'schema',
        queryName: 'query',
        filterKey: 'filterKey',
    };

    test('sampleAssayResultViewConfigs - module not enabled', async () => {
        LABKEY.container.activeModules = ['ModuleA'];

        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailImpl
                {...IMPL_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleAssayResultViewConfigs: () => Promise.resolve([moduleAssayConfig]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        const configs = wrapper.find(SampleAssayDetailBody).prop('queryConfigs');
        expect(Object.keys(configs).length).toBe(1); // just summary grid
        wrapper.unmount();
    });

    test('sampleAssayResultViewConfigs - module is enabled', async () => {
        LABKEY.container.activeModules = ['ModuleA', 'ModuleB'];

        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailImpl
                {...IMPL_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleAssayResultViewConfigs: () => Promise.resolve([moduleAssayConfig]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        const configs = wrapper.find(SampleAssayDetailBody).prop('queryConfigs');
        const configKeys = Object.keys(configs);
        expect(configKeys.length).toBe(2); // first is summary grid
        expect(configs[configKeys[1]].baseFilters[0].getColumnName()).toBe('filterKey');
        expect(configs[configKeys[1]].baseFilters[0].getValue()).toStrictEqual([1]); // RowId value of sample row
        wrapper.unmount();
    });

    test('sampleAssayResultViewConfigs - sampleRowKey', async () => {
        LABKEY.container.activeModules = ['ModuleA', 'ModuleB'];

        const wrapper = mountWithAppServerContext(
            <SampleAssayDetailImpl
                {...IMPL_PROPS}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleAssayResultViewConfigs: () =>
                            Promise.resolve([
                                {
                                    ...moduleAssayConfig,
                                    sampleRowKey: 'Name',
                                },
                            ]),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        const configs = wrapper.find(SampleAssayDetailBody).prop('queryConfigs');
        const configKeys = Object.keys(configs);
        expect(configKeys.length).toBe(2); // first is summary grid
        expect(configs[configKeys[1]].baseFilters[0].getColumnName()).toBe('filterKey');
        expect(configs[configKeys[1]].baseFilters[0].getValue()).toStrictEqual(['Name1']); // Name value of sample row
        wrapper.unmount();
    });
});
