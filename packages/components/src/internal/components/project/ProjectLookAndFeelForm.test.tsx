import React from 'react';
import { render } from '@testing-library/react';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { ProjectLookAndFeelFrom } from './ProjectLookAndFeelForm';

describe('ProjectLookAndFeelFrom', () => {
    test('container datetime format', () => {
        render(<ProjectLookAndFeelFrom container={TEST_PROJECT_CONTAINER} />);

        const input = document.getElementById('date-format-input');
        expect((input as HTMLInputElement).value).toEqual(TEST_PROJECT_CONTAINER.formats.dateTimeFormat);
        expect(document.querySelector<HTMLButtonElement>('.btn-success').disabled).toBe(true);
    });
});
