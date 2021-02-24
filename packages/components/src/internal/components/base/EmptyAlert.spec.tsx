import React from 'react';
import { mount } from 'enzyme';
import { PermissionTypes } from '@labkey/api';

import { App, AppURL } from '../../..';

import { EmptyAlert, EmptyAlertWithPermissions } from './EmptyAlert';

const EMPTY_ALERT = 'div.empty-alert';

describe('EmptyAlert', () => {
    test('required props only', () => {
        // Arrange
        const expectedMessage = 'I have a message for you';

        // Act
        const wrapper = mount(<EmptyAlert message={expectedMessage} />);

        // Assert
        expect(wrapper.find(EMPTY_ALERT).text()).toEqual(expectedMessage);
    });
    test('displays action link', () => {
        // Arrange
        const actionURL = AppURL.create('who', 'done', 'it');
        const expectedMessage = 'I have a message for you';

        // Act
        const wrapper = mount(<EmptyAlert actionURL={actionURL} message={expectedMessage} />);

        // Assert
        // Should not display link unless action is allowed
        expect(wrapper.find(EMPTY_ALERT).text()).toEqual(expectedMessage);

        wrapper.setProps({ allowAction: true });

        // Assert
        // Should display action link
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(actionURL.toHref());
    });
});

describe('EmptyAlertWithPermissions', () => {
    test('respect allowAction and user', () => {
        // Arrange
        const actionURL = AppURL.create('over', 'the', 'rainbow');
        const expectedMessage = 'Permission granted';
        const expectedPermission = PermissionTypes.Insert;

        // Act
        const wrapper = mount(
            <EmptyAlertWithPermissions
                actionURL={actionURL}
                permission={expectedPermission}
                message={expectedMessage}
            />
        );

        // Assert
        // Should not display action link when user is not provided
        expect(wrapper.find(EMPTY_ALERT).text()).toEqual(expectedMessage);

        wrapper.setProps({ user: App.TEST_USER_EDITOR });

        // Assert
        // Should display action link for editor
        expect(wrapper.find(`${EMPTY_ALERT} a`).prop('href')).toEqual(actionURL.toHref());

        wrapper.setProps({ user: App.TEST_USER_READER });

        // Assert
        // Should not display action link for reader
        expect(wrapper.find(EMPTY_ALERT).text()).toEqual(expectedMessage);
    });
});
