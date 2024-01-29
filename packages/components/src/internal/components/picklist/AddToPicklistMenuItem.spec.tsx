import React from 'react';

import { ReactWrapper } from 'enzyme';
import { Modal } from 'react-bootstrap';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';

import { SAMPLE_STATE_TYPE_COLUMN_NAME } from '../samples/constants';

import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { ChoosePicklistModal } from './ChoosePicklistModal';

beforeAll(() => {
    LABKEY.moduleContext.inventory = { productId: ['FreezerManager'] };
});

describe('AddToPicklistMenuItem', () => {
    const expectedText = 'Add to Picklist';
    const queryModelWithoutSelections = makeTestQueryModel(new SchemaQuery('test', 'query'));
    let queryModelWithSelections = makeTestQueryModel(new SchemaQuery('test', 'query'));
    queryModelWithSelections = queryModelWithSelections.mutate({
        rowCount: 2,
        selections: new Set(['1', '2']),
    });

    test('with queryModel', () => {
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem queryModel={queryModelWithSelections} user={TEST_USER_EDITOR} />
        );
        const menuItem = wrapper.find(SelectionMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(expectedText);

        validateMenuItemClick(wrapper, true);
        const picklistModal = wrapper.find(ChoosePicklistModal);
        expect(picklistModal).toHaveLength(1);
        expect(picklistModal.prop('selectionKey')).toBe(queryModelWithSelections.id);
        expect(picklistModal.prop('numSelected')).toBe(2);
        wrapper.unmount();
    });

    test('with selectedIds', () => {
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem
                queryModel={queryModelWithoutSelections}
                sampleIds={['1']}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(expectedText);

        validateMenuItemClick(wrapper, true);
        const picklistModal = wrapper.find(ChoosePicklistModal);
        expect(picklistModal).toHaveLength(1);
        expect(picklistModal.prop('selectionKey')).toBe(undefined);
        expect(picklistModal.prop('numSelected')).toBe(1);
        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem sampleIds={['1']} user={TEST_USER_READER} />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });

    function validateMenuItemClick(wrapper: ReactWrapper, shouldOpen: boolean): void {
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');
        expect(wrapper.find(Modal)).toHaveLength(shouldOpen ? 1 : 0);
    }

    test('modal open on click, queryModel selections', () => {
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem queryModel={queryModelWithoutSelections} user={TEST_USER_EDITOR} />
        );
        validateMenuItemClick(wrapper, false);

        wrapper.setProps({ queryModel: makeTestQueryModel(new SchemaQuery('test', 'query')) });
        validateMenuItemClick(wrapper, false);

        wrapper.setProps({ queryModel: queryModelWithSelections });
        validateMenuItemClick(wrapper, true);

        wrapper.unmount();
    });

    test('modal open on click, sampleIds', () => {
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem
                queryModel={queryModelWithoutSelections}
                sampleIds={['1']}
                user={TEST_USER_EDITOR}
            />
        );
        validateMenuItemClick(wrapper, true);
        wrapper.unmount();
    });

    test('sample with status', () => {
        let model = makeTestQueryModel(new SchemaQuery('test', 'query'));
        model = model.mutate({
            rows: {
                '1': {
                    RowId: { value: 1 },
                    [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: 'Locked' },
                },
            },
            orderedRows: ['1'],
        });
        const wrapper = mountWithAppServerContext(
            <AddToPicklistMenuItem queryModel={model} sampleIds={['1']} user={TEST_USER_EDITOR} />
        );
        validateMenuItemClick(wrapper, true);
        wrapper.unmount();
    });
});
