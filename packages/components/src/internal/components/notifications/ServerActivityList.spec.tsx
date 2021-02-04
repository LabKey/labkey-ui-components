import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import {
    DONE_AND_READ,
    DONE_NOT_READ,
    IN_PROGRESS,
    UNREAD_WITH_ERROR,
    UNREAD_WITH_ERROR_HTML
} from '../../../test/data/notificationData';

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
                maxRows={2}
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
                maxRows={2}
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
                maxRows={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, false, true, false);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links.at(0).text()).toBe(UNREAD_WITH_ERROR.ActionLinkText);

        const errorSubject = item.find('.server-notifications-item-subject');
        const errorDetails = item.find('.server-notifications-item-details');
        expect(errorSubject).toHaveLength(1);
        expect(errorDetails).toHaveLength(1);
        expect(errorSubject.text()).toBe("Sample import failed from file file1.xlsx");
        expect(errorDetails.text()).toBe("There was a problem creating your data.  Check the existing data for possible duplicates and make sure any referenced data are still valid.");
        wrapper.unmount();
    });

    test('html content type', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                serverActivity={{
                    data: [UNREAD_WITH_ERROR_HTML],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
                maxRows={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, false, true, false);

        const errorSubject = item.find('.server-notifications-item-subject');
        const errorDetails = item.find('.server-notifications-item-details');
        expect(errorSubject).toHaveLength(1);
        expect(errorDetails).toHaveLength(1);
        expect(errorSubject.text()).toBe("Assay import failed from file file1.xlsx");
        expect(errorDetails.text()).toContain("SampleId: Failed to convert \'SampleId\': Could not translate value: sdfs");
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
                maxRows={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, false, false, true);
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
                maxRows={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, false, false);
        const content = item.find('.server-notifications-item');
        expect(content).toHaveLength(1);
        expect(content.at(0).text()).toBe(DONE_NOT_READ.Content);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links.at(0).text()).toBe('View sample details');
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(1);
        expect(data.at(0).text()).toBe('2020-11-11 12:47');
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
                maxRows={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        checkActivityListItem(item, true, false, false);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links.at(0).text()).toBe('View sources');
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(1);
        expect(data.at(0).text()).toBe('2020-11-14 04:47');
        wrapper.unmount();
    });

    function checkActivityListItem(itemWrapper: ReactWrapper, isComplete: boolean, hasError: boolean, inProgress: boolean): void {
        expect(itemWrapper.find('.is-complete')).toHaveLength(isComplete ? 1 : 0);
        expect(itemWrapper.find('.has-error')).toHaveLength(hasError ? 1 : 0);
        expect(itemWrapper.find('.fa-spinner')).toHaveLength(inProgress ? 1 : 0);
    }
});
