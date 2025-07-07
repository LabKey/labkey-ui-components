import React from 'react';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import {
    DONE_AND_READ,
    DONE_NOT_READ,
    IN_PROGRESS,
    UNREAD_WITH_ERROR,
    UNREAD_WITH_ERROR_HTML,
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
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={undefined}
            />
        );
        expect(container.textContent).toBe('No notifications available.');
        expect(document.querySelectorAll('.server-notifications-listing')).toHaveLength(0);
    });

    test('empty list', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{ data: [], totalRows: 0, unreadCount: 0, inProgressCount: 0 }}
            />
        );
        expect(container.textContent).toBe('No notifications available.');
        expect(document.querySelectorAll('.server-notifications-listing')).toHaveLength(0);
    });

    test('more items to show', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 2,
                    inProgressCount: 1,
                }}
            />
        );

        expect(document.querySelectorAll('.server-notifications-listing li')).toHaveLength(4);
        const footer = container.querySelector('.server-notifications-footer');
        expect(footer).toBeTruthy();
        expect(footer.textContent).toBe('View all activity');
    });

    test('fewer items than max to show', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 2,
                    inProgressCount: 1,
                }}
            />
        );

        const listings = document.querySelectorAll('.server-notifications-listing li');
        expect(listings).toHaveLength(4);
        expect(listings[1].textContent).toContain(DONE_AND_READ.HtmlContent);
        expect(container.querySelector('.server-notifications-footer')).toBeTruthy();
    });

    test('custom viewAllText', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
                    totalRows: 4,
                    unreadCount: 4,
                    inProgressCount: 1,
                }}
            />
        );

        const footer = container.querySelector('.server-notifications-footer');
        expect(footer).toBeTruthy();
        expect(footer.textContent).toBe('View all activity');
    });

    test('with error', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [UNREAD_WITH_ERROR],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
            />
        );

        const item = container.querySelector('li');
        checkActivityListItem(item, false, true, false);

        const links = container.querySelectorAll('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe('View all activity');

        const errorSubject = item.querySelector('.server-notifications-item-subject');
        const errorDetails = item.querySelector('.server-notifications-item-details');
        expect(errorSubject.textContent).toBe('Sample import failed from file file1.xlsx');
        expect(errorDetails.textContent).toBe("There was a problem creating your data. Duplicate name 'L-40.1' found.");
    });

    test('html content type', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [UNREAD_WITH_ERROR_HTML],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
            />
        );

        const item = container.querySelector('li');
        checkActivityListItem(item, false, true, false);

        const errorSubject = item.querySelector('.server-notifications-item-subject');
        const errorDetails = item.querySelector('.server-notifications-item-details');
        expect(errorSubject.textContent).toBe('Assay import failed from file file1.xlsx');
        expect(errorDetails.textContent).toContain(
            "SampleId: Failed to convert 'SampleId': Could not translate value: sdfs"
        );
    });

    test('in progress', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [IN_PROGRESS],
                    totalRows: 1,
                    unreadCount: 0,
                    inProgressCount: 1,
                }}
            />
        );

        const item = container.querySelector('li');
        checkActivityListItem(item, false, false, true);
        expect(item.querySelector('.has-error')).toBeFalsy();
        expect(item.querySelector('.fa-spinner')).toBeTruthy();
        expect(item.querySelectorAll('.server-notifications-link')).toHaveLength(0);
    });

    test('unread', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [DONE_NOT_READ],
                    totalRows: 1,
                    unreadCount: 1,
                    inProgressCount: 0,
                }}
            />
        );

        const item = container.querySelector('li');
        checkActivityListItem(item, true, false, false);

        const content = item.querySelector('.server-notifications-item');
        expect(content.textContent).toBe(DONE_NOT_READ.Content);

        const links = container.querySelectorAll('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe('View all activity');

        const data = item.querySelector('.server-notification-data');
        expect(data.textContent).toBe('2020-11-11 12:47');
    });

    test('read', () => {
        const { container } = renderWithAppContext(
            <ServerActivityList
                onRead={jest.fn()}
                onViewAll={jest.fn()}
                onViewClick={jest.fn()}
                serverActivity={{
                    data: [DONE_AND_READ],
                    totalRows: 1,
                    unreadCount: 0,
                    inProgressCount: 0,
                }}
            />
        );

        const item = container.querySelector('li');
        checkActivityListItem(item, true, false, false);

        const links = container.querySelectorAll('.server-notifications-link');
        expect(links).toHaveLength(1);
        expect(links[0].textContent).toBe('View all activity');

        const data = item.querySelector('.server-notification-data');
        expect(data.textContent).toBe('2020-11-14 04:47');
    });

    function checkActivityListItem(item: Element, isComplete: boolean, hasError: boolean, inProgress: boolean): void {
        expect(item.querySelectorAll('.is-complete')).toHaveLength(isComplete ? 1 : 0);
        expect(item.querySelectorAll('.has-error')).toHaveLength(hasError ? 1 : 0);
        expect(item.querySelectorAll('.fa-spinner')).toHaveLength(inProgress ? 1 : 0);
    }
});
