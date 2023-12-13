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

        const input = document.getElementById('date-format-input');
        expect((input as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateTimeFormat);

        expect(saveButton().disabled).toBe(true);

        await userEvent.type(input, 'aa');

        expect(saveButton().disabled).toBe(false);

        await act(async () => {
            userEvent.click(saveButton());
        });

        expect(api.updateProjectLookAndFeelSettings).toHaveBeenCalledWith(
            {
                defaultDateFormat: 'yyyy-MM-dd HH:mmaa',
                defaultDateTimeFormat: 'yyyy-MM-dd HH:mmaa',
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

        const input = document.getElementById('date-format-input');
        expect((input as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateTimeFormat);

        expect(saveButton().disabled).toBe(true);

        await userEvent.type(input, 'b');

        expect(saveButton().disabled).toBe(false);

        await act(async () => {
            userEvent.click(saveButton());
        });

        expect(api.updateProjectLookAndFeelSettings).toHaveBeenCalledWith(
            {
                defaultDateFormat: 'yyyy-MM-dd HH:mmb',
                defaultDateTimeFormat: 'yyyy-MM-dd HH:mmb',
            },
            TEST_PROJECT_CONTAINER.path
        );

        expect(document.querySelector('.alert-danger').innerHTML).toEqual('invalid format');

        expect(saveButton().disabled).toBe(false);
    });
});
