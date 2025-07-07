import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import {
    DONE_AND_READ,
    DONE_NOT_READ,
    IN_PROGRESS,
    UNREAD_WITH_ERROR,
    UNREAD_WITH_ERROR2,
} from '../../../test/data/notificationData';
import { ServerNotificationModel } from './model';
import { ServerNotifications } from './ServerNotifications';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('<ServerNotifications/>', () => {
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

        const { container } = render(<ServerNotifications onRead={jest.fn()} serverActivity={serverActivity} />);

        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button'));

        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
        expect(container.querySelector('.server-notifications-error')).toHaveTextContent(errorText);
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

        const { container } = render(<ServerNotifications onRead={jest.fn()} serverActivity={serverActivity} />);

        fireEvent.click(screen.getByRole('button'));

        expect(container.querySelector('.server-notifications-listing-container')).toBeInTheDocument();
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(container.querySelector('.badge')).not.toBeInTheDocument();
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

        const { container } = render(<ServerNotifications onRead={jest.fn()} serverActivity={serverActivity} />);

        fireEvent.click(screen.getByRole('button'));

        expect(container.querySelector('.server-notifications-listing-container')).toBeInTheDocument();
        expect(screen.getByText(/Mark all as read/)).toBeInTheDocument();
        expect(container.querySelector('.badge')).toBeInTheDocument();
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

        const { container } = render(<ServerNotifications onRead={jest.fn()} serverActivity={serverActivity} />);

        fireEvent.click(screen.getByRole('button'));

        expect(container.querySelector('.server-notifications-listing-container')).toBeInTheDocument();
        expect(container.querySelector('.fa-spinner')).not.toBeInTheDocument();
        expect(container.querySelector('.fa-bell')).toBeInTheDocument();
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

        const { container } = render(<ServerNotifications onRead={jest.fn()} serverActivity={serverActivity} />);

        fireEvent.click(screen.getByRole('button'));

        expect(container.querySelector('.server-notifications-listing-container')).toBeInTheDocument();
        // one spinner for the menu icon and one within the menu itself
        expect(container.querySelectorAll('.fa-spinner')).toHaveLength(2);
        expect(container.querySelector('.fa-bell')).not.toBeInTheDocument();
        expect(container.querySelector('.badge')).toBeInTheDocument();
    });
});
