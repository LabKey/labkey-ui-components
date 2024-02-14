import React from 'react';

import { mount } from 'enzyme';

import { LoadingSpinner } from '../base/LoadingSpinner';

import {
    DONE_AND_READ,
    DONE_NOT_READ,
    IN_PROGRESS,
    markAllNotificationsRead,
    UNREAD_WITH_ERROR,
    UNREAD_WITH_ERROR2,
} from '../../../test/data/notificationData';

import { ServerNotificationModel } from './model';

import { ServerNotifications } from './ServerNotifications';
import { ServerActivityList } from './ServerActivityList';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('<ServerNotificaitons/>', () => {
    test('loading', () => {
        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={new ServerNotificationModel({ isLoading: true })}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(ServerActivityList)).toHaveLength(0);
        wrapper.find('button').simulate('click');
        expect(wrapper.find('LoadingSpinner')).toHaveLength(1);
        const title = wrapper.find('.navbar-menu-header');
        expect(title.text()).toBe('Notifications');
        expect(wrapper.find(ServerActivityList)).toHaveLength(0);
        wrapper.unmount();
    });

    test('error', () => {
        const errorText = 'Something is wrong';
        const serverActivity = new ServerNotificationModel({
            data: undefined,
            totalRows: 0,
            unreadCount: 0,
            inProgressCount: 0,

            isLoaded: true,
            isLoading: false,
            isError: true,
            errorMessage: errorText,
        });
        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={serverActivity}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        wrapper.find('button').simulate('click');
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        const error = wrapper.find('.server-notifications-error');
        expect(error).toHaveLength(1);
        expect(error.text()).toBe(errorText);
        wrapper.unmount();
    });

    test('all read', () => {
        const serverActivity = new ServerNotificationModel({
            data: [DONE_AND_READ, IN_PROGRESS],
            totalRows: 2,
            unreadCount: 0,
            inProgressCount: 1,

            isLoaded: true,
            isLoading: false,
            isError: false,
        });

        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={serverActivity}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );

        wrapper.find('button').simulate('click');
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        const title = wrapper.find('.navbar-menu-header');
        expect(title.text()).toBe('Notifications');
        expect(wrapper.find('.badge')).toHaveLength(0);
        wrapper.unmount();
    });

    test('some unread', () => {
        const serverActivity = new ServerNotificationModel({
            data: [DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR, UNREAD_WITH_ERROR2],
            totalRows: 2,
            unreadCount: 2,
            inProgressCount: 1,

            isLoaded: true,
            isLoading: false,
            isError: false,
        });

        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={serverActivity}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );

        wrapper.find('button').simulate('click');
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        const title = wrapper.find('.navbar-menu-header');
        expect(title.text()).toContain('Mark all as read');
        expect(wrapper.find('.badge')).toHaveLength(1);
        wrapper.unmount();
    });

    test('none in progress', () => {
        const serverActivity = new ServerNotificationModel({
            data: [DONE_AND_READ, DONE_NOT_READ, UNREAD_WITH_ERROR, UNREAD_WITH_ERROR2],
            totalRows: 2,
            unreadCount: 2,
            inProgressCount: 0,

            isLoaded: true,
            isLoading: false,
            isError: false,
        });

        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={serverActivity}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );

        wrapper.find('button').simulate('click');
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find('.fa-bell')).toHaveLength(1);
        wrapper.unmount();
    });

    test('some in progress', () => {
        const serverActivity = new ServerNotificationModel({
            data: [DONE_AND_READ, IN_PROGRESS],
            totalRows: 2,
            unreadCount: 1,
            inProgressCount: 1,

            isLoaded: true,
            isLoading: false,
            isError: false,
        });

        const wrapper = mount(
            <ServerNotifications
                maxRows={8}
                serverActivity={serverActivity}
                markAllNotificationsRead={markAllNotificationsRead}
                onViewAll={jest.fn()}
            />
        );

        wrapper.find('button').simulate('click');
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        // one spinner for the menu icon and one within the menu itself.
        expect(wrapper.find('.fa-spinner')).toHaveLength(2);
        expect(wrapper.find('.fa-bell')).toHaveLength(0);
        expect(wrapper.find('.badge')).toHaveLength(1);
        wrapper.unmount();
    });
});
