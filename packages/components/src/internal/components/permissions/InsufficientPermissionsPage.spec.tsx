import React from 'react';

import { mountWithAppServerContext } from '../../testHelpers';

import { InsufficientPermissionsPage } from './InsufficientPermissionsPage';

describe('<PermissionsPanel/>', () => {
    test('default properties', () => {
        const title = 'Test Page Title';
        const wrapper = mountWithAppServerContext(<InsufficientPermissionsPage title={title} />, {}, {});
        expect(wrapper.find('Page').props().title).toEqual(title);
        expect(wrapper.find('PageHeader').props().title).toEqual(title);
        expect(wrapper.find('InsufficientPermissionsAlert').exists()).toEqual(true);
    });
});
