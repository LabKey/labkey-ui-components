import React from 'react';
import { ReactWrapper } from 'enzyme';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../domainproperties/list/constants';
import { mountWithAppServerContext } from '../../testHelpers';

import { RemoveFromPicklistButton } from './RemoveFromPicklistButton';
import {Picklist} from "./models";
import {makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {DisableableButton} from "../buttons/DisableableButton";
import {ConfirmModal} from "../base/ConfirmModal";

beforeAll(() => {
    LABKEY.moduleContext = {
        inventory: {},
    };
});

describe('RemoveFromPicklistButton', () => {
    const publicPicklist = new Picklist({
        CreatedBy: 1101, // test user is 1100
        Category: PUBLIC_PICKLIST_CATEGORY,
    });
    const privatePicklistNotOwner = new Picklist({
        CreatedBy: 1101, // test user is 1100
        Category: PRIVATE_PICKLIST_CATEGORY,
    });
    const privatePicklistIsOwner = new Picklist({
        CreatedBy: 1100,
        Category: PRIVATE_PICKLIST_CATEGORY,
    });

    const DEFAULT_PROPS = {
        user: TEST_USER_EDITOR,
        afterSampleActionComplete: jest.fn,
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({
            rowCount: 2,
            selections: new Set(['1', '2']),
        }),
    };

    function validate(wrapper: ReactWrapper, hasPerm = true, showConfirm = false): void {
        expect(wrapper.find(DisableableButton)).toHaveLength(hasPerm ? 1 : 0);
        expect(wrapper.find(ConfirmModal)).toHaveLength(showConfirm ? 1 : 0);
    }

    test('public picklist with remove perm', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={publicPicklist} />,
            {},
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('public picklist without remove perm', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={publicPicklist} user={TEST_USER_READER} />,
            {},
            { user: TEST_USER_READER }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('private picklist not owner with remove perm', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={privatePicklistNotOwner} />,
            {},
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('private picklist as owner with remove perm', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={privatePicklistIsOwner} />,
            {},
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        wrapper.unmount();
    });

    test('private picklist as owner without remove perm', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={privatePicklistIsOwner} user={TEST_USER_READER} />,
            {},
            { user: TEST_USER_READER }
        );
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('menu item click to show confirm modal', () => {
        const wrapper = mountWithAppServerContext(
            <RemoveFromPicklistButton {...DEFAULT_PROPS} picklist={publicPicklist} />,
            {},
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        wrapper.find(DisableableButton).simulate('click');
        validate(wrapper, true, true);
        const modal = wrapper.find(ConfirmModal);
        expect(modal.prop('confirmButtonText')).toBe('Yes, Remove 2 Samples');
        expect(modal.text()).toContain('Permanently remove the 2 selected samples');
        wrapper.unmount();
    });
});
