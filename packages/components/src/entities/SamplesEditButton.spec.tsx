import React from 'react';
import { MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import {
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_EDITOR_WITHOUT_DELETE,
    TEST_USER_READER,
    TEST_USER_STORAGE_EDITOR,
} from '../internal/userFixtures';
import { mountWithAppServerContext, mountWithServerContext } from '../internal/testHelpers';

import { QueryInfo } from '../public/QueryInfo';
import { SchemaQuery } from '../public/SchemaQuery';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';
import { makeTestActions, makeTestQueryModel } from '../public/QueryModel/testUtils';
import { LoadingState } from '../public/LoadingState';

import { SamplesEditButtonSections } from '../internal/components/samples/utils';

import { SampleDeleteMenuItem } from './SampleDeleteMenuItem';
import { SamplesEditButton } from './SamplesEditButton';
import { EntityLineageEditMenuItem } from './EntityLineageEditMenuItem';
import { SampleMoveMenuItem } from './SampleMoveMenuItem';

describe('SamplesEditButton', () => {
    const queryInfo = new QueryInfo({
        showInsertNewButton: true,
        importUrl: 'test',
        importUrlDisabled: false,
        schemaQuery: new SchemaQuery('schema', 'query'),
    });

    function validate(
        wrapper: ReactWrapper,
        show = true,
        parentEntityItemCount = 2,
        selMenuItemCount = 5,
        menuItemCount = 8,
        deleteItemCount = 1,
        moveItemCount = 0
    ): void {
        expect(wrapper.find(ManageDropdownButton)).toHaveLength(show ? 1 : 0);
        if (show) {
            expect(wrapper.find(EntityLineageEditMenuItem)).toHaveLength(parentEntityItemCount);
            expect(wrapper.find(SelectionMenuItem)).toHaveLength(selMenuItemCount);
            expect(wrapper.find(SampleDeleteMenuItem)).toHaveLength(deleteItemCount);
            expect(wrapper.find(SampleMoveMenuItem)).toHaveLength(moveItemCount);
            expect(wrapper.find(MenuItem)).toHaveLength(menuItemCount);
        }
    }

    const DEFAULT_PROPS = {
        parentEntityDataTypes: [DataClassDataType, SampleTypeDataType],
        model: makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        }),
        actions: makeTestActions(),
    };

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} />, { user: TEST_USER_EDITOR });
        validate(wrapper);
        wrapper.unmount();
    });

    test('loading', () => {
        const wrapper = mountWithServerContext(
            <SamplesEditButton {...DEFAULT_PROPS} model={makeTestQueryModel(new SchemaQuery('schema', 'query'))} />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('combineParentTypes', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} combineParentTypes />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 1, 4, 7);
        wrapper.unmount();
    });

    test('editor without delete', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} />, {
            user: TEST_USER_EDITOR_WITHOUT_DELETE,
        });
        validate(wrapper, true, 2, 4, 6, 0);
        wrapper.unmount();
    });

    test('author', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} />, {
            user: TEST_USER_AUTHOR,
        });
        validate(wrapper, true, 0, 0, 0, 0);
        wrapper.unmount();
    });

    test('storage editor', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} />, {
            user: TEST_USER_STORAGE_EDITOR,
        });
        validate(wrapper, true, 0, 1, 1, 0);
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('not showImportDataButton', () => {
        const queryInfo2 = new QueryInfo({ showInsertNewButton: false });
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo2).mutate({
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        });

        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 2, 5, 7);
        wrapper.unmount();
    });

    test('showLinkToStudy with study module present', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['study'] } };
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} showLinkToStudy />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, 2, 6, 9);
        wrapper.unmount();
    });

    test('showLinkToStudy without study module present', () => {
        LABKEY.moduleContext = { api: { moduleNames: [] } };
        const wrapper = mountWithServerContext(<SamplesEditButton {...DEFAULT_PROPS} showLinkToStudy />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper);
        wrapper.unmount();
    });

    test('excludedMenuKeys', () => {
        LABKEY.moduleContext = { api: { moduleNames: ['study'] } };
        const wrapper = mountWithServerContext(
            <SamplesEditButton
                {...DEFAULT_PROPS}
                showLinkToStudy
                excludedMenuKeys={[
                    SamplesEditButtonSections.IMPORT,
                    SamplesEditButtonSections.DELETE,
                    SamplesEditButtonSections.EDIT,
                    SamplesEditButtonSections.LINK_TO_STUDY,
                ]}
            />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper, true, 0, 0, 0, 0);
        wrapper.unmount();
    });

    test('hasProductProjects as editor, includes move', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesEditButton {...DEFAULT_PROPS} />,
            {},
            {
                user: TEST_USER_EDITOR,
                moduleContext: { query: { hasProductProjects: true } },
            }
        );
        validate(wrapper, true, 2, 6, 9, 1, 1);
        wrapper.unmount();
    });

    test('hasProductProjects as author', () => {
        const wrapper = mountWithAppServerContext(
            <SamplesEditButton {...DEFAULT_PROPS} />,
            {},
            {
                user: TEST_USER_AUTHOR,
                moduleContext: { query: { hasProductProjects: true } },
            }
        );
        validate(wrapper, true, 0, 0, 0, 0);
        wrapper.unmount();
    });
});
