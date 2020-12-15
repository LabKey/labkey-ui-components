import React from 'react';

import { mount } from 'enzyme';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR } from '../../../test/data/notificationData';

import { ServerNotifications } from './ServerNotifications';
import { ServerActivityList } from './ServerActivityList';
import { ServerActivity } from './model';

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
    function getNotificationData(): Promise<ServerActivity> {
        return new Promise(resolve => {
            resolve({
                data: [],
                totalRows: 0,
                unreadCount: 0,
                inProgressCount: 0,
            });
        });
    }

    function markAllNotificationsRead(): Promise<boolean> {
        return new Promise(resolve => {
            resolve(true);
        });
    }

    test('loading', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        wrapper.setState({ isLoading: true });
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        const title = wrapper.find('.server-notifications-header');
        expect(title.text()).toBe('Notifications');
        expect(wrapper.find(ServerActivityList)).toHaveLength(0);
        wrapper.unmount();
    });

    test('error', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        const errorText = 'Something is wrong';
        wrapper.setState({ isLoading: false, error: errorText });
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        const error = wrapper.find('.server-notifications-error');
        expect(error).toHaveLength(1);
        expect(error.text()).toBe(errorText);
        wrapper.unmount();
    });

    test('all read', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        wrapper.setState({
            isLoading: false,
            serverActivity: {
                data: [DONE_AND_READ, IN_PROGRESS],
                totalRows: 2,
                unreadCount: 0,
                inProgressCount: 1,
            },
        });
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        const title = wrapper.find('.server-notifications-header');
        expect(title.text()).toBe('Notifications');
        wrapper.unmount();
    });

    test('some unread', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        wrapper.setState({
            isLoading: false,
            serverActivity: {
                data: [DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                totalRows: 2,
                unreadCount: 2,
                inProgressCount: 1,
            },
        });
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        const title = wrapper.find('.server-notifications-header');
        expect(title.text()).toContain('Mark all as read');
        wrapper.unmount();
    });

    test('none in progress', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        wrapper.setState({
            isLoading: false,
            serverActivity: {
                data: [DONE_AND_READ, DONE_NOT_READ, UNREAD_WITH_ERROR],
                totalRows: 2,
                unreadCount: 2,
                inProgressCount: 0,
            },
        });
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        expect(wrapper.find('.fa-spinner')).toHaveLength(0);
        expect(wrapper.find('.fa-bell')).toHaveLength(1);
        wrapper.unmount();
    });

    test('some in progress', () => {
        const wrapper = mount(
            <ServerNotifications
                getNotificationData={getNotificationData}
                markAllNotificationsRead={markAllNotificationsRead}
            />
        );
        wrapper.setState({
            isLoading: false,
            serverActivity: {
                data: [DONE_AND_READ, IN_PROGRESS],
                totalRows: 2,
                unreadCount: 1,
                inProgressCount: 1,
            },
        });
        expect(wrapper.find(ServerActivityList)).toHaveLength(1);
        // one spinner for the menu icon and one within the menu itself.
        expect(wrapper.find('.fa-spinner')).toHaveLength(2);
        expect(wrapper.find('.fa-bell')).toHaveLength(0);
        wrapper.unmount();
    });
});
