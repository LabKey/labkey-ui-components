import React from 'react';
import { render } from '@testing-library/react';
import Formsy from 'formsy-react';

import { QueryColumn } from '../../../public/QueryColumn';

import { FieldLabel } from './FieldLabel';

const queryColumn = new QueryColumn({
    name: 'testColumn',
    caption: 'test Column',
});

describe('FieldLabel', () => {
    beforeAll(() => {
        console.warn = jest.fn();
    });

    test("don't show label", () => {
        render(<FieldLabel showLabel={false} label="Label" />);
        expect(document.body.textContent).toBe('');
    });

    test('without overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        render(<FieldLabel withLabelOverlay={false} label={label} />);
        expect(document.querySelector('span.label-span').textContent).toBe('This is the label');
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(0);
    });

    test('without overlay, with column', () => {
        render(<FieldLabel withLabelOverlay={false} column={queryColumn} />);
        expect(document.body.textContent).toBe(queryColumn.caption);
        expect(document.querySelectorAll('.span.label-span')).toHaveLength(0);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(0);
    });

    test('with overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        render(<FieldLabel labelOverlayProps={label} />);
        expect(document.body.textContent).toBe(' ');
        expect(document.querySelectorAll('.span.label-span')).toHaveLength(0);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('with overlay, with column', () => {
        render(<FieldLabel column={queryColumn} />);
        expect(document.body.textContent).toBe(queryColumn.caption + ' ');
        expect(document.querySelectorAll('.span.label-span')).toHaveLength(0);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle', () => {
        render(
            <Formsy>
                <FieldLabel id="test" column={queryColumn} showToggle />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, with labelOverlayProps, not formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: false,
        };
        render(
            <Formsy>
                <FieldLabel id="test" column={queryColumn} showToggle labelOverlayProps={props} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label-toggle-input')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, with labelOverlayProps, formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: true,
        };
        render(
            <Formsy>
                <FieldLabel id="test" column={queryColumn} showToggle labelOverlayProps={props} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label-toggle-input')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, with labelOverlayProps, formsy, with toggleClassName', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: true,
        };
        render(
            <Formsy>
                <FieldLabel
                    id="test"
                    column={queryColumn}
                    showToggle
                    labelOverlayProps={props}
                    toggleClassName="toggle-wrapper"
                />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.toggle-wrapper')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, with labelOverlayProps, not formsy, with toggleClassName', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: false,
        };
        render(
            <Formsy>
                <FieldLabel
                    id="test"
                    column={queryColumn}
                    showToggle
                    labelOverlayProps={props}
                    toggleClassName="toggle-wrapper"
                />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.toggle-wrapper')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, toggleProps disabled', () => {
        render(
            <Formsy>
                <FieldLabel id="test" column={queryColumn} showToggle toggleProps={{ toolTip: 'This is a tooltip' }} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.disabled')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(2);
    });

    test('showToggle, toggleProps not disabled', () => {
        render(
            <Formsy>
                <FieldLabel id="test" column={queryColumn} showToggle toggleProps={{ onClick: jest.fn() }} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.disabled')).toHaveLength(0);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });
});
