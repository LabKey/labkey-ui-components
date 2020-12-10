import React from 'react';
import { mount } from 'enzyme';

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
                activityData={undefined}
                noActivityMsg={noActivityMsg}
                onRead={jest.fn()}
            />
        );
        expect(wrapper.text()).toBe(noActivityMsg);
        expect(wrapper.find('.server-notifications-listing')).toHaveLength(0);
    });

    test('empty list', () => {
        const wrapper = mount(<ServerActivityList onViewAll={jest.fn()} activityData={[]} onRead={jest.fn()} />);
        expect(wrapper.text()).toBe(ServerActivityList.defaultProps.noActivityMsg);
        expect(wrapper.find('.server-notifications-listing')).toHaveLength(0);
    });

    test('more items than max to show', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR]}
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
    });

    test('fewer items than max to show', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR]}
                onRead={jest.fn()}
            />
        );
        const listing = wrapper.find('.server-notifications-listing');
        const listings = listing.find('li');
        expect(listings).toHaveLength(4);
        expect(wrapper.find('.server-notifications-footer')).toHaveLength(0);
    });

    test('custom viewAllText', () => {
        const viewAllText = 'custom text';
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR]}
                maxListingSize={2}
                viewAllText={viewAllText}
                onRead={jest.fn()}
            />
        );
        const footer = wrapper.find('.server-notifications-footer');
        expect(footer).toHaveLength(1);
        expect(footer.text()).toBe(viewAllText);
    });

    test('with error', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[UNREAD_WITH_ERROR]}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        expect(item.find('.has-error')).toHaveLength(1);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(2);
        expect(links.at(0).text()).toBe(UNREAD_WITH_ERROR.HtmlContent);
        expect(links.at(1).text()).toBe(ServerActivityList.defaultProps.viewErrorDetailsText);
    });

    test('in progress', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[IN_PROGRESS]}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        expect(item.find('.has-error')).toHaveLength(0);
        expect(item.find('.fa-spinner')).toHaveLength(1);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(0);
    });

    test('unread', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[DONE_NOT_READ]}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        expect(item.find('.is-complete')).toHaveLength(1);
        expect(item.find('.has-error')).toHaveLength(0);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links.at(0).text()).toBe(DONE_NOT_READ.HtmlContent);
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(2);
        expect(data.at(0).text()).toBe(DONE_NOT_READ.CreatedBy);
        expect(data.at(1).text()).toBe('2020-11-11 12:47');
    });

    test('read', () => {
        const wrapper = mount(
            <ServerActivityList
                onViewAll={jest.fn()}
                activityData={[DONE_AND_READ]}
                maxListingSize={2}
                onRead={jest.fn()}
            />
        );
        const item = wrapper.find('li');
        expect(item).toHaveLength(1);
        expect(item.find('.is-complete')).toHaveLength(1);
        expect(item.find('.has-error')).toHaveLength(0);
        const links = item.find('.server-notifications-link');
        expect(links).toHaveLength(0);
        const data = item.find('.server-notification-data');
        expect(data).toHaveLength(2);
        expect(data.at(0).text()).toBe(DONE_AND_READ.CreatedBy);
        expect(data.at(1).text()).toBe('2020-11-14 04:47');
    });
});
