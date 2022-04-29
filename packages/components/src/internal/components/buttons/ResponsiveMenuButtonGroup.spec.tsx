import React from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithServerContext } from '../../testHelpers';

import { ResponsiveMenuButtonGroup } from './ResponsiveMenuButtonGroup';

describe('ResponsiveMenuButtonGroup', () => {
    const model = makeTestQueryModel(SchemaQuery.create('s', 'q'));
    const DEFAULT_PROPS = {
        items: [
            <PicklistButton model={model} user={TEST_USER_READER} />,
            <PicklistButton model={model} user={TEST_USER_READER} />,
        ],
    };

    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(1);
        expect(wrapper.find(MenuItem)).toHaveLength(1); // divider
        expect(wrapper.find(PicklistButton).first().prop('asSubMenu')).toBe(true);
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<ResponsiveMenuButtonGroup {...DEFAULT_PROPS} />, {
            user: TEST_USER_READER,
        });
        validate(wrapper);
        wrapper.unmount();
    });
});
