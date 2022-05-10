import React from 'react';

import { mountWithServerContext } from '../../testHelpers';
import { initNotificationsState } from '../notifications/global';

import { InsufficientPermissionsPage } from './InsufficientPermissionsPage';

beforeAll(() => {
    initNotificationsState();
});

describe('<PermissionsPanel/>', () => {
    test('default properties', () => {
        const title = 'Test Page Title';
        const wrapper = mountWithServerContext(<InsufficientPermissionsPage title={title} />, undefined);
        expect(wrapper.find('Page').props().title).toEqual(title);
        expect(wrapper.find('PageHeader').props().title).toEqual(title);
        expect(wrapper.find('InsufficientPermissionsAlert').exists()).toEqual(true);
    });
});
