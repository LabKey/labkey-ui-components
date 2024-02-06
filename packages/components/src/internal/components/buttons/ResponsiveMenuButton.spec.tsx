import React from 'react';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';

import { ResponsiveMenuButton } from './ResponsiveMenuButton';

describe('ResponsiveMenuButton', () => {
    const items = <PicklistButton model={makeTestQueryModel(new SchemaQuery('s', 'q'))} user={TEST_USER_READER} />;
    const DEFAULT_PROPS = {
        className: 'test-className',
        items,
        text: 'Test Menu',
    };

    test('default props', () => {
        const wrapper = mountWithServerContext(<ResponsiveMenuButton {...DEFAULT_PROPS} />, {
            user: TEST_USER_READER,
        });
        expect(wrapper.find('DropdownButton')).toHaveLength(1);
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        expect(wrapper.find(PicklistButton)).toHaveLength(1);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const wrapper = mountWithServerContext(<ResponsiveMenuButton {...DEFAULT_PROPS} asSubMenu />, {
            user: TEST_USER_READER,
        });
        expect(wrapper.find('DropdownButton')).toHaveLength(0);
        expect(wrapper.find('MenuItem')).toHaveLength(1);
        expect(wrapper.find(PicklistButton)).toHaveLength(1);
        wrapper.unmount();
    });
});
