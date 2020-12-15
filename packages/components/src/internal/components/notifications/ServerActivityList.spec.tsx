import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { DONE_AND_READ, DONE_NOT_READ, IN_PROGRESS, UNREAD_WITH_ERROR } from '../../../test/data/notificationData';

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

describe('<ServerActivityList>', () => {
    test('No data', () => {
        const noActivityMsg = 'None available';
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={undefined}
                noActivityMsg={noActivityMsg}
                onRead={jest.fn()}
            />
        );
        expect(wrapper.text()).toBe(noActivityMsg);
        expect(wrapper.find('.server-notifications-listing')).toHaveLength(0);
        wrapper.unmount();
    });

    test('empty list', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{ data: [], totalRows: 0, unreadCount: 0, inProgressCount: 0 }}
                onRead={jest.fn()}
            />
        );
        expect(wrapper.text()).toBe(ServerActivityList.defaultProps.noActivityMsg);
        expect(wrapper.find('.server-notifications-listing')).toHaveLength(0);
        wrapper.unmount();
    });

    test('more items than max to show', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 2,
                    inProgressCount: 1,
                }}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const listing = wrapper.find('.server-notifications-listing');
        expect(listing).toHaveLength(1);
        const listings = listing.find('li');
        expect(listings).toHaveLength(2);
        const footer = wrapper.find('.server-notifications-footer');
        expect(footer).toHaveLength(1);
        expect(footer.text()).toBe(ServerActivityList.defaultProps.viewAllText);
        wrapper.unmount();
    });

    test('fewer items than max to show', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 2,
                    inProgressCount: 1,
                }}
                onRead={jest.fn()}
            />
        );
        const listing = wrapper.find('.server-notifications-listing');
        const listings = listing.find('li');
        expect(listings).toHaveLength(4);
        expect(listings.at(1).text()).toContain(DONE_AND_READ.HtmlContent);
        expect(wrapper.find('.server-notifications-footer')).toHaveLength(0);
        wrapper.unmount();
    });

    test('custom viewAllText', () => {
        const viewAllText = 'custom text';
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 4,
                    inProgressCount: 1,
                }}
                maxListingSize={2}
                viewAllText={viewAllText}
                onRead={jest.fn()}
            />
        );
        const footer = wrapper.find('.server-notifications-footer');
        expect(footer).toHaveLength(1);
        expect(footer.text()).toBe(viewAllText);
        wrapper.unmount();
    });

    test('with error', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [UNREAD_WITH_ERROR],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, true);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(2);
        expect(links.at(0).text()).toBe(UNREAD_WITH_ERROR.HtmlContent);
        expect(links.at(1).text()).toBe(ServerActivityList.defaultProps.viewErrorDetailsText);
        wrapper.unmount();
    });

    test('custom view error details text', () => {
        const customText = 'custom text';
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [UNREAD_WITH_ERROR],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
                maxListingSize={2}
                viewErrorDetailsText={customText}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, true);
        expect(item.find('.has-error')).toHaveLength(1);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(2);
        expect(links.at(0).text()).toBe(UNREAD_WITH_ERROR.HtmlContent);
        expect(links.at(1).text()).toBe(customText);
        wrapper.unmount();
    });

    test('in progress', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [IN_PROGRESS],
                    totalRows: 1,
                    unreadCount: 0,
                    inProgressCount: 1,
                }}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, false, false);
        expect(item.find('.has-error')).toHaveLength(0);
        expect(item.find('.fa-spinner')).toHaveLength(1);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(0);
        wrapper.unmount();
    });

    test('unread', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, false);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links.at(0).text()).toBe(DONE_NOT_READ.HtmlContent);
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(2);
        expect(data.at(0).text()).toBe(DONE_NOT_READ.CreatedBy);
        expect(data.at(1).text()).toBe('2020-11-11 12:47');
        wrapper.unmount();
    });

    test('read', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [DONE_AND_READ],
                    totalRows: 1,
                    unreadCount: 0,
                    inProgressCount: 0,
                }}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, false);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(0);
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(2);
        expect(data.at(0).text()).toBe(DONE_AND_READ.CreatedBy);
        expect(data.at(1).text()).toBe('2020-11-14 04:47');
        wrapper.unmount();
    });

    function checkActivityListItem(itemWrapper: ReactWrapper, isComplete: boolean, hasError: boolean): void {
        expect(itemWrapper.find('.is-complete')).toHaveLength(isComplete ? 1 : 0);
        expect(itemWrapper.find('.has-error')).toHaveLength(hasError ? 1 : 0);
        expect(itemWrapper.find('.fa-spinner')).toHaveLength(!isComplete ? 1 : 0);
    }
});
