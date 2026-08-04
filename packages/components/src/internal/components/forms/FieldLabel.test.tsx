/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';

import { QueryColumn } from '../../../public/QueryColumn';

import { Formsy } from './formsy';
import { FieldLabel } from './FieldLabel';
import { LabelOverlayProps } from './LabelOverlay';
import { INPUT_LABEL_CLASS_NAME_WITH_TOGGLE } from './constants';

const queryColumn = new QueryColumn({
    name: 'testColumn',
    caption: 'test Column',
});

describe('FieldLabel', () => {
    beforeAll(() => {
        console.warn = jest.fn();
    });

    test("don't show label", () => {
        render(<FieldLabel label="Label" showLabel={false} />);
        expect(document.body).toHaveTextContent('');
    });

    test('without overlay, with label', () => {
        const label = <span className="label-span">This is the label</span>;
        render(<FieldLabel label={label} withLabelOverlay={false} />);
        expect(document.querySelector('span.label-span')).toHaveTextContent('This is the label');
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(0);
    });

    test('without overlay, with column', () => {
        render(<FieldLabel column={queryColumn} withLabelOverlay={false} />);
        expect(document.body).toHaveTextContent(queryColumn.caption);
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
                <FieldLabel column={queryColumn} id="test" showToggle />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle requires a column or an id and fieldName', () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        expect(() => render(<FieldLabel showToggle />)).toThrow(
            'FieldLabel: when showing the toggle, either a column or an id and fieldName must be provided.'
        );
        expect(() => render(<FieldLabel fieldName="test" showToggle />)).toThrow();
        expect(() => render(<FieldLabel id="test" showToggle />)).toThrow();

        consoleError.mockRestore();
    });

    test('showToggle, with labelOverlayProps, not formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: false,
        };
        render(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" labelOverlayProps={props} showToggle />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.control-label-toggle-input')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });

    test('showToggle, with labelOverlayProps, not formsy, sizes the label and toggle columns', () => {
        const props: LabelOverlayProps = { isFormsy: false, label: 'This is the label' };
        const { rerender } = render(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" labelOverlayProps={props} showToggle />
            </Formsy>
        );

        const expectToggleColumns = (): void => {
            expect(document.querySelector('.control-label')).toHaveClass(INPUT_LABEL_CLASS_NAME_WITH_TOGGLE);
            expect(document.querySelector('.control-label-toggle-input')).toHaveClass(
                'control-label-toggle-input-size-fixed'
            );
            expect(document.querySelector('.control-label-toggle-input').parentElement).toHaveClass('col-xs-1');
        };

        expectToggleColumns();

        // The labelOverlayProps supplied by the caller are not modified, so the columns are sized
        // consistently no matter how many times the same props object is rendered.
        expect(props.labelClass).toBeUndefined();

        rerender(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" labelOverlayProps={props} showToggle />
            </Formsy>
        );

        expectToggleColumns();
    });

    test('showToggle, with labelOverlayProps, not formsy, respects a supplied labelClass', () => {
        const props: LabelOverlayProps = { isFormsy: false, label: 'This is the label', labelClass: 'custom-label' };
        render(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" labelOverlayProps={props} showToggle />
            </Formsy>
        );

        expect(document.querySelector('.custom-label')).toBeInTheDocument();
        expect(document.querySelector('.custom-label')).not.toHaveClass(INPUT_LABEL_CLASS_NAME_WITH_TOGGLE);
        expect(document.querySelector('.control-label-toggle-input')).not.toHaveClass(
            'control-label-toggle-input-size-fixed'
        );
        expect(document.querySelector('.control-label-toggle-input').parentElement).not.toHaveClass('col-xs-1');
    });

    test('showToggle, with labelOverlayProps, formsy', () => {
        const label = 'This is the label';
        const props = {
            label,
            isFormsy: true,
        };
        render(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" labelOverlayProps={props} showToggle />
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
                    column={queryColumn}
                    id="test"
                    labelOverlayProps={props}
                    showToggle
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
                    column={queryColumn}
                    id="test"
                    labelOverlayProps={props}
                    showToggle
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
                <FieldLabel column={queryColumn} id="test" showToggle toggleProps={{ toolTip: 'This is a tooltip' }} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.disabled')).toHaveLength(1);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(2);
    });

    test('showToggle, toggleProps not disabled', () => {
        render(
            <Formsy>
                <FieldLabel column={queryColumn} id="test" showToggle toggleProps={{ onClick: jest.fn() }} />
            </Formsy>
        );
        expect(document.querySelectorAll('.toggle')).toHaveLength(1);
        expect(document.querySelectorAll('.disabled')).toHaveLength(0);
        expect(document.querySelectorAll('.overlay-trigger')).toHaveLength(1);
    });
});
