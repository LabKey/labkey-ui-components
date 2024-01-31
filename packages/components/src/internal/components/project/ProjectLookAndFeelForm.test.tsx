import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

import userEvent from '@testing-library/user-event';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getFolderTestAPIWrapper } from '../container/FolderAPIWrapper';

import { ProjectLookAndFeelForm } from './ProjectLookAndFeelForm';

describe('ProjectLookAndFeelForm', () => {
    function saveButton(): HTMLButtonElement {
        return document.querySelector<HTMLButtonElement>('.btn-success');
    }

    test('save successful', async () => {
        const api = getFolderTestAPIWrapper(jest.fn, {
            updateProjectLookAndFeelSettings: jest.fn().mockResolvedValue({}),
        });

        await act(async () => {
            render(<ProjectLookAndFeelForm api={api} container={TEST_PROJECT_CONTAINER} />);
        });

        expect(saveButton().disabled).toBe(true);

        const dateInput = document.getElementById('date-format-input');
        expect((dateInput as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateFormat);
        await userEvent.type(dateInput, 'aa');

        const dateTimeInput = document.getElementById('datetime-format-input');
        expect((dateTimeInput as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateTimeFormat);
        await userEvent.type(dateTimeInput, 'z');

        const timeInput = document.getElementById('time-format-input');
        expect((timeInput as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.timeFormat);
        await userEvent.type(timeInput, 'a');

        expect(saveButton().disabled).toBe(false);

        await act(async () => {
            userEvent.click(saveButton());
        });

        expect(api.updateProjectLookAndFeelSettings).toHaveBeenCalledWith(
            {
                defaultDateFormat: 'yyyy-MM-ddaa',
                defaultDateTimeFormat: 'yyyy-MM-dd HH:mmz',
                defaultTimeFormat: 'HH:mma',
            },
            TEST_PROJECT_CONTAINER.path
        );

        expect(document.querySelector('.alert-danger')).toBeNull();

        expect(saveButton().disabled).toBe(true);
    });

    test('save with failure', async () => {
        const api = getFolderTestAPIWrapper(jest.fn, {
            updateProjectLookAndFeelSettings: jest.fn().mockRejectedValue('invalid format'),
        });

        await act(async () => {
            render(<ProjectLookAndFeelForm api={api} container={TEST_PROJECT_CONTAINER} />);
        });

        const input = document.getElementById('datetime-format-input');
        expect((input as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateTimeFormat);

        expect(saveButton().disabled).toBe(true);

        await userEvent.type(input, 'b');

        expect(saveButton().disabled).toBe(false);

        await act(async () => {
            userEvent.click(saveButton());
        });

        expect(api.updateProjectLookAndFeelSettings).toHaveBeenCalledWith(
            {
                defaultDateFormat: 'yyyy-MM-dd',
                defaultDateTimeFormat: 'yyyy-MM-dd HH:mmb',
                defaultTimeFormat: "HH:mm",
            },
            TEST_PROJECT_CONTAINER.path
        );

        expect(document.querySelector('.alert-danger').innerHTML).toEqual('invalid format');

        expect(saveButton().disabled).toBe(false);
    });
});
