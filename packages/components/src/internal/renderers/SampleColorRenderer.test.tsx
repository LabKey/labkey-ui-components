/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { fromJS, Map } from 'immutable';

import { SAMPLE_COLOR_COLOR_COLUMN_NAME, SAMPLE_COLOR_COLUMN_NAME } from '../components/samples/constants';

import { SampleColorRenderer } from './SampleColorRenderer';

const RED = '#FF0000';

function getIcon(): HTMLElement {
    return document.querySelector('i');
}

describe('SampleColorRenderer', () => {
    describe('label', () => {
        test('undefined data renders nothing', () => {
            // Act
            render(<SampleColorRenderer data={undefined} />);

            // Assert - no label text and no color icon are rendered
            expect(document.body.textContent).toBe('');
            expect(getIcon()).toBeNull();
        });

        test('empty data renders nothing', () => {
            // Act
            render(<SampleColorRenderer data={Map({})} />);

            // Assert - a data Map without value/displayValue produces no output
            expect(document.body.textContent).toBe('');
            expect(getIcon()).toBeNull();
        });

        test('null value renders nothing', () => {
            // Act
            render(<SampleColorRenderer data={Map({ value: null, displayValue: null })} />);

            // Assert - null is treated as no label, so nothing is rendered
            expect(document.body.textContent).toBe('');
            expect(getIcon()).toBeNull();
        });

        test('empty string value renders nothing', () => {
            // Act
            render(<SampleColorRenderer data={Map({ value: '' })} />);

            // Assert - empty string is treated as no label, so nothing is rendered
            expect(document.body.textContent).toBe('');
            expect(getIcon()).toBeNull();
        });

        test('falls back to value when displayValue is not present', () => {
            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} />);

            // Assert - the raw value is used as the label
            expect(document.body.textContent).toBe('Red');
        });

        test('prefers displayValue over value', () => {
            // Act
            render(<SampleColorRenderer data={Map({ displayValue: 'Bright Red', value: 'Red' })} />);

            // Assert - displayValue wins over value for the label
            expect(document.body.textContent).toBe('Bright Red');
        });

        test('showLabel false renders the color swatch without the label', () => {
            // Arrange
            const data = Map({ displayValue: 'Red' });
            const row = fromJS({ [SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED } });

            // Act
            render(<SampleColorRenderer data={data} row={row} showLabel={false} />);

            // Assert - the swatch is still colored but no label text is rendered
            expect(document.body.textContent).toBe('');
            expect(getIcon()).toHaveStyle({ backgroundColor: RED });
        });
    });

    describe('color resolution', () => {
        test('resolves color from the sample color column', () => {
            // Arrange
            const row = fromJS({
                [SAMPLE_COLOR_COLUMN_NAME]: { value: 'Red' },
                [SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED },
            });

            // Act
            render(<SampleColorRenderer data={row.get(SAMPLE_COLOR_COLUMN_NAME)} row={row} />);

            // Assert - the icon is filled with the row's color and the label is shown
            expect(document.body.textContent).toBe('Red');
            expect(getIcon()).toHaveStyle({ backgroundColor: RED });
        });

        test('resolves color from the SampleID-prefixed column', () => {
            // Arrange - assay/other grids expose the color under a SampleID/ prefixed field key
            const row = fromJS({ ['SampleID/' + SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED } });

            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} row={row} />);

            // Assert - the prefixed column is used as the fallback color source
            expect(getIcon()).toHaveStyle({ backgroundColor: RED });
        });

        test('prefers the unprefixed color column over the SampleID-prefixed one', () => {
            // Arrange
            const row = fromJS({
                [SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED },
                ['SampleID/' + SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: '#00FF00' },
            });

            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} row={row} />);

            // Assert - the unprefixed column wins
            expect(getIcon()).toHaveStyle({ backgroundColor: RED });
        });

        test('resolves color regardless of row key casing', () => {
            // Arrange - selectRows key casing is not guaranteed to match the column name constant
            const row = fromJS({ [SAMPLE_COLOR_COLOR_COLUMN_NAME.toLowerCase()]: { value: RED } });

            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} row={row} />);

            // Assert - the lookup is case-insensitive
            expect(getIcon()).toHaveStyle({ backgroundColor: RED });
        });

        test('renders the label without a swatch when the row has no color', () => {
            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} row={fromJS({ Name: { value: 'S-1' } })} />);

            // Assert - no icon is rendered when no color is resolved, but the label remains
            expect(document.body.textContent).toBe('Red');
            expect(getIcon()).toBeNull();
        });

        test('renders the label without a swatch when no row is provided', () => {
            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} />);

            // Assert - color resolution is skipped entirely without a row
            expect(document.body.textContent).toBe('Red');
            expect(getIcon()).toBeNull();
        });
    });

    describe('cls', () => {
        test('applies the default class', () => {
            // Arrange
            const row = fromJS({ [SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED } });

            // Act
            render(<SampleColorRenderer data={Map({ value: 'Red' })} row={row} />);

            // Assert - the icon carries the base circle class plus the default sample-color class
            expect(getIcon()).toHaveClass('color-icon__circle', 'sample-color');
        });

        test('applies a cls override alongside the base class', () => {
            // Arrange
            const row = fromJS({ [SAMPLE_COLOR_COLOR_COLUMN_NAME]: { value: RED } });

            // Act
            render(<SampleColorRenderer cls="sample-color-header" data={Map({ value: 'Red' })} row={row} />);

            // Assert - the override replaces the default class but keeps the base circle class
            expect(getIcon()).toHaveClass('color-icon__circle', 'sample-color-header');
            expect(getIcon()).not.toHaveClass('sample-color');
        });
    });
});
