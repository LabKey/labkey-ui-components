/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { act } from 'react';
import { render, screen } from '@testing-library/react';

import { Progress } from './Progress';

beforeAll(() => {
    jest.useFakeTimers();
});

describe('Progress', () => {
    test('render not toggled, not modal', () => {
        const { container } = render(<Progress toggle={false} />);
        expect(container.firstChild).toBeNull();
        act(() => {
            jest.runAllTimers();
        });
        expect(container.firstChild).toBeNull();
    });

    test('render toggled, not modal', () => {
        const { container, rerender } = render(<Progress toggle={false} />);
        // update prop of toggle to true
        rerender(<Progress toggle />);

        // Should not be displaying anything until time has passed
        expect(container.firstChild).toBeNull();
        act(() => {
            jest.advanceTimersByTime(4000);
        });

        rerender(<Progress toggle />);

        //  should be displaying progress bar now
        expect(container.firstChild).not.toBeNull();

        // verify the progress bar is at 80%
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');

        // verify modal is not displayed
        expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('render modal without title', () => {
        const { container, rerender } = render(<Progress toggle={false} modal />);
        // update prop of toggle to true
        rerender(<Progress toggle modal />);

        // Should not be displaying anything until time has passed
        expect(container.firstChild).toBeNull();
        act(() => {
            jest.advanceTimersByTime(400);
        });

        // verify modal is displayed
        expect(document.querySelectorAll('.modal')).toHaveLength(1);
        expect(document.querySelectorAll('.modal-header')).toHaveLength(0);
    });

    test('render toggled, modal with title', () => {
        const title = 'Modal Progress title';
        const { container, rerender } = render(<Progress toggle={false} modal title={title} />);
        // update prop of toggle to true
        rerender(<Progress toggle modal title={title} />);

        // Should not be displaying anything until time has passed
        expect(container.firstChild).toBeNull();
        act(() => {
            jest.advanceTimersByTime(400);
        });

        // verify modal is displayed with title
        expect(document.querySelectorAll('.modal')).toHaveLength(1);
        expect(document.querySelectorAll('.modal-header')).toHaveLength(1);
        expect(screen.getByText(title)).toBeInTheDocument();
    });

    test('render non-modal, set estimate, delay, and increment', () => {
        const { container, rerender } = render(
            <Progress toggle={false} estimate={200} delay={20} updateIncrement={10} />
        );
        // update prop of toggle to true
        rerender(<Progress toggle estimate={200} delay={20} updateIncrement={10} />);

        // Should not be displaying anything until time has passed
        expect(container.firstChild).toBeNull();
        act(() => {
            jest.advanceTimersByTime(20);
        });

        // verify the progress bar is at 10%
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');

        // verify modal is not displayed
        expect(screen.queryByRole('dialog')).toBeNull();

        // advance timer by 5ms
        act(() => {
            jest.advanceTimersByTime(5);
        });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10');

        // advance timer by 10ms
        act(() => {
            jest.advanceTimersByTime(10);
        });
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '15');
    });
});
