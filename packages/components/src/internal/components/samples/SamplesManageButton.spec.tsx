import React from 'react';
import { MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import {
    AddToPicklistMenuItem,
    DataClassDataType,
    EntityLineageEditMenuItem,
    LoadingState,
    makeTestActions,
    makeTestQueryModel,
    ManageDropdownButton,
    QueryInfo,
    SampleDeleteMenuItem,
    SamplesManageButtonSections,
    SampleTypeDataType,
    SchemaQuery,
    SelectionMenuItem,
} from '../../..';

import { TEST_USER_AUTHOR, TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';
import { mountWithServerContext } from '../../testHelpers';

import { SamplesManageButton } from './SamplesManageButton';

describe('SamplesManageButton', () => {
    const queryInfo = new QueryInfo({
        showInsertNewButton: true,
        importUrl: 'test',
        importUrlDisabled: false,
        schemaQuery: SchemaQuery.create('schema', 'query'),
    });

    function validate(
        wrapper: ReactWrapper,
        show = true,
        parentEntityItemCount = 2,
        selMenuItemCount = 6,
        menuItemCount = 7,
        deleteItemCount = 1,
        picklistItemCount = 1
    ): void {
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(show ? 1 : 0);
        if (show) {
            expect(wrapper.find(EntityLineageEditMenuItem)).toHaveLength(parentEntityItemCount);
            expect(wrapper.find(SelectionMenuItem)).toHaveLength(selMenuItemCount);
            expect(wrapper.find(SampleDeleteMenuItem)).toHaveLength(deleteItemCount);
            expect(wrapper.find(AddToPicklistMenuItem)).toHaveLength(picklistItemCount);
            expect(wrapper.find(MenuItem)).toHaveLength(menuItemCount);
        }
    }

    const DEFAULT_PROPS = {
        user: TEST_USER_EDITOR,
        parentEntityDataTypes: [DataClassDataType, SampleTypeDataType],
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query'), queryInfo).mutate({
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        }),
        actions: makeTestActions(),
    };

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} />, { user: TEST_USER_EDITOR });
        validate(wrapper);
        expect(wrapper.find(MenuItem).first().prop('href')).toBe('#/samples/new?target=query&tab=2');
        wrapper.unmount();
    });

    test('loading', () => {
        const wrapper = mountWithServerContext(
            <SamplesManageButton
                {...DEFAULT_PROPS}
                model={makeTestQueryModel(SchemaQuery.create('schema', 'query'))}
            />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('combineParentTypes', () => {
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} combineParentTypes />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 1, 5, 6);
        wrapper.unmount();
    });

    test('author', () => {
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} user={TEST_USER_AUTHOR} />, {
            user: TEST_USER_AUTHOR,
        });
        validate(wrapper, true, 0, 0, 1, 0, 1);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} user={TEST_USER_READER} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('children', () => {
        const wrapper = mountWithServerContext(
            <SamplesManageButton {...DEFAULT_PROPS}>
                <div id="test-child-comp">test</div>
            </SamplesManageButton>,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        expect(wrapper.find('#test-child-comp')).toHaveLength(1);
        wrapper.unmount();
    });

    test('not showImportDataButton', () => {
        const queryInfo2 = new QueryInfo({ showInsertNewButton: false });
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query'), queryInfo2).mutate({
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        });

        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 2, 6, 6);
        wrapper.unmount();
    });

    test('showLinkToStudy with study module present', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['study'] } };
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} showLinkToStudy />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 2, 7, 8);
        wrapper.unmount();
    });

    test('showLinkToStudy without study module present', () => {
        LABKEY.moduleContext = { api: { moduleNames: [] } };
        const wrapper = mountWithServerContext(<SamplesManageButton {...DEFAULT_PROPS} showLinkToStudy />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper);
        wrapper.unmount();
    });

    test('hideButtons', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['study'] } };
        const wrapper = mountWithServerContext(
            <SamplesManageButton
                {...DEFAULT_PROPS}
                showLinkToStudy
                hideButtons={[
                    SamplesManageButtonSections.IMPORT,
                    SamplesManageButtonSections.DELETE,
                    SamplesManageButtonSections.EDIT,
                    SamplesManageButtonSections.LINKTOSTUDY,
                    SamplesManageButtonSections.PICKLIST,
                ]}
            />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper, true, 0, 0, 0, 0, 0);
        wrapper.unmount();
    });
});
