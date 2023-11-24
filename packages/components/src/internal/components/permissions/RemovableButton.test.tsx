import React from 'react';
import { render, act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RemovableButton } from './RemovableButton';

describe('<RemovableButton/>', () => {
    test('default props', () => {
        const component = <RemovableButton id={1} display="Display Text" onRemove={jest.fn()} onClick={jest.fn()} />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('custom props', () => {
        const component = (
            <RemovableButton
                id={2}
                display="Display Text (Custom)"
                onRemove={jest.fn()}
                onClick={jest.fn()}
                bsStyle="primary"
                added={true}
                disabledMsg="Disabled message"
            />
        );

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('not removable', () => {
        const component = <RemovableButton id={2} display="Display Text (Not Removable)" onClick={jest.fn()} />;

        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('on click remove', async () => {
        render(<RemovableButton id={1} display="Display Text" onRemove={jest.fn()} onClick={jest.fn()} />);

        // test the removed state, should change some css classes
        expect(document.querySelectorAll('.permissions-button-added').length).toBe(0);
        expect(document.querySelectorAll('.permissions-button-removed').length).toBe(0);
        await act(async () => {
            userEvent.click(document.querySelector('.fa-remove'));
        });
        expect(document.querySelectorAll('.permissions-button-removed').length).toBe(1);
    });

    test('added prop', () => {
        const component = (
            <RemovableButton id={1} display="Display Text" added onRemove={jest.fn()} onClick={jest.fn()} />
        );

        render(component);
        expect(document.querySelectorAll('.permissions-button-added').length).toBe(1);
    });

    test('disabledMsg prop', () => {
        const component = (
            <RemovableButton
                id={1}
                display="Display Text"
                disabledMsg="Disabled message"
                onRemove={jest.fn()}
                onClick={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelectorAll('.disabled-button-with-tooltip').length).toBe(1);
        expect(screen.getByText('Display Text')).toBeInTheDocument();
    });
});
