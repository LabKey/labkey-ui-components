import React from 'react';
import { fromJS } from 'immutable';
import { ReactWrapper } from 'enzyme';
import { AuditBehaviorTypes } from '@labkey/api';

import { mountWithAppServerContext } from '../../testHelpers';

import { TEST_USER_READER } from '../../userFixtures';

import { SamplesEditableGrid } from './SamplesEditableGrid';
import { SamplesBulkUpdateForm } from './SamplesBulkUpdateForm';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import {SchemaQuery} from "../../../public/SchemaQuery";
import {QueryInfo} from "../../../public/QueryInfo";
import {makeTestActions, makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {TabbedGridPanel} from "../../../public/QueryModel/TabbedGridPanel";

const SQ = SchemaQuery.create('schema', 'query');
const QI = QueryInfo.create({ title: 'Test title' });

const DEFAULT_PROPS = {
    user: TEST_USER_READER,
    queryModels: {
        tab1: makeTestQueryModel(SQ, QI),
        tab2: makeTestQueryModel(SQ, QI),
    },
    actions: makeTestActions(),
    samplesEditableGridProps: {},
    gridButtons: undefined,
    getSampleAuditBehaviorType: () => AuditBehaviorTypes.DETAILED,
};

describe('SamplesTabbedGridPanel', () => {
    function validate(wrapper: ReactWrapper, editable = false, activeTab = 'tab1', bulkUpdate = false): void {
        expect(wrapper.find(SamplesEditableGrid)).toHaveLength(editable ? 1 : 0);

        expect(wrapper.find(TabbedGridPanel)).toHaveLength(!editable ? 1 : 0);
        if (!editable) {
            expect(wrapper.find(TabbedGridPanel).prop('tabOrder')).toStrictEqual(['tab1', 'tab2']);
            expect(wrapper.find(TabbedGridPanel).prop('activeModelId')).toBe(activeTab);
        }

        expect(wrapper.find(SamplesBulkUpdateForm)).toHaveLength(bulkUpdate ? 1 : 0);
    }

    test('activeModelId is first tab by default', () => {
        const wrapper = mountWithAppServerContext(<SamplesTabbedGridPanel {...DEFAULT_PROPS} />);
        validate(wrapper);
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
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set() }),
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
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
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

    test('call toggleEditWithGridUpdate with activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        buttonProps['toggleEditWithGridUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('call showBulkUpdate without activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
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

    test('call showBulkUpdate with activeModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        buttonProps['showBulkUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper, false, 'tab1', true);
        expect(wrapper.find(SamplesBulkUpdateForm).prop('sampleSet')).toBe('query');
        expect(wrapper.find(SamplesBulkUpdateForm).prop('sampleSetLabel')).toBe('Test title');
        wrapper.unmount();
    });

    test('onBulkUpdateComplete set selectionData', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesTabbedGridPanel
                {...DEFAULT_PROPS}
                queryModels={{
                    tab1: makeTestQueryModel(SQ, QI).mutate({ selections: new Set(['1']) }),
                    tab2: makeTestQueryModel(SQ, QI),
                }}
            />
        );
        validate(wrapper);
        const buttonProps = wrapper.find(TabbedGridPanel).prop('buttonsComponentProps');
        buttonProps['showBulkUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper, false, 'tab1', true);

        // call onBulkUpdateComplete with submitForEdit false, which does not puts the component in edit grid mode
        wrapper.find(SamplesBulkUpdateForm).invoke('onBulkUpdateComplete')(fromJS({ a: 1 }), false);
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper);

        // open back up the bulk edit modal
        buttonProps['showBulkUpdate']();
        wrapper.setProps({ actions: makeTestActions() }); // force re-render

        // call onBulkUpdateComplete with submitForEdit true, which puts the component in edit grid mode
        wrapper.find(SamplesBulkUpdateForm).invoke('onBulkUpdateComplete')(fromJS({ a: 1 }), true);
        wrapper.setProps({ actions: makeTestActions() }); // force re-render
        validate(wrapper, true);
        wrapper.unmount();
    });

    test('canPrintLabels false', () => {
        const wrapper = mountWithAppServerContext(<SamplesTabbedGridPanel {...DEFAULT_PROPS} canPrintLabels={false} />);
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeUndefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeUndefined();
        wrapper.unmount();
    });

    test('canPrintLabels true', () => {
        const wrapper = mountWithAppServerContext(<SamplesTabbedGridPanel {...DEFAULT_PROPS} canPrintLabels={true} />);
        validate(wrapper);
        expect(wrapper.find(TabbedGridPanel).prop('supportedExportTypes')).toBeDefined();
        expect(wrapper.find(TabbedGridPanel).prop('onExport')).toBeDefined();
        wrapper.unmount();
    });
});
