/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { ExpirationDateColumnRenderer } from './ExpirationDateColumnRenderer';

const DEFAULT_PROPS = {
    data: fromJS({ value: '2022-02-12 11:58:54.385', formattedValue: '2022-02-12' }),
};

describe('ExpirationDateColumnRenderer', () => {
    const TestWrapper = props => {
        if (props.tableCell === false) {
            return <ExpirationDateColumnRenderer {...props} />;
        }
        return (
            <table>
                <tbody>
                    <tr>
                        <ExpirationDateColumnRenderer {...props} />
                    </tr>
                </tbody>
            </table>
        );
    };

    function validate(container: HTMLElement, hasExpired = true, displayValue?: string, hasTd = true): void {
        expect(container.querySelectorAll('td')).toHaveLength(hasTd ? 1 : 0);
        if (hasTd) {
            expect(container.querySelectorAll('.expired-grid-cell')).toHaveLength(hasExpired ? 1 : 0);
        } else {
            expect(container.querySelectorAll('.expired-form-field')).toHaveLength(hasExpired ? 1 : 0);
        }

        if (!displayValue) expect(container.textContent).toEqual('');
        else expect(container.textContent).toBe(displayValue);
    }

    test('no data', () => {
        const { container } = render(<TestWrapper data={null} />);
        validate(container, false);
    });

    test('default', () => {
        const { container } = render(<TestWrapper {...DEFAULT_PROPS} />);
        validate(container, true, '2022-02-12');
    });

    test('not tablecell', () => {
        const { container } = render(<TestWrapper {...DEFAULT_PROPS} tableCell={false} />);
        validate(container, true, '2022-02-12', false);
    });

    test('has formattedValue and has displayValue', () => {
        const data = fromJS({
            value: '2022-02-12 11:58:54.385',
            formattedValue: '2022-02-12',
            displayValue: '2022-02-12 11:58',
        });
        const { container } = render(<TestWrapper data={data} />);
        validate(container, true, '2022-02-12');
    });

    test('has formattedValue and has displayValue - not immutable map', () => {
        const data = {
            value: '2022-02-12 11:58:54.385',
            formattedValue: '2022-02-12',
            displayValue: '2022-02-12 11:58',
        };
        const { container } = render(<TestWrapper data={data} />);
        validate(container, true, '2022-02-12');
    });

    test('no formattedValue and no displayValue', () => {
        const data = fromJS({ value: '2022-02-12 11:58:54.385' });
        const { container } = render(<TestWrapper data={data} />);
        validate(container, true, '2022-02-12 11:58:54.385');
    });

    test('no formattedValue and no displayValue - not immutable map', () => {
        const data = { value: '2022-02-12 11:58:54.385' };
        const { container } = render(<TestWrapper data={data} />);
        validate(container, true, '2022-02-12 11:58:54.385');
    });

    test('no formattedValue but with displayValue', () => {
        const data = fromJS({ value: '2022-02-12 11:58:54.385', displayValue: '2022-02-12 11:58' });
        const { container } = render(<TestWrapper data={data} />);
        validate(container, true, '2022-02-12 11:58');
    });

    test('future date', () => {
        const data = fromJS({ value: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' });
        const { container } = render(<TestWrapper data={data} />);
        validate(container, false, '2222-02-12', true);
    });

    test('future date - not immutable map', () => {
        const data = { value: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' };
        const { container } = render(<TestWrapper data={data} />);
        validate(container, false, '2222-02-12', true);
    });

    test('future display date, but no value', () => {
        const data = fromJS({ displayValue: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' });
        const { container } = render(<TestWrapper data={data} />);
        validate(container, false, '2222-02-12', true);
    });
});
