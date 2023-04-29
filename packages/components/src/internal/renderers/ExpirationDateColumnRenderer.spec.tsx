import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { fromJS } from 'immutable';

import { ExpirationDateColumnRenderer } from './ExpirationDateColumnRenderer';

const DEFAULT_PROPS = {
    data: fromJS({ value: '2022-02-12 11:58:54.385', formattedValue: '2022-02-12' }),
};

describe('ExpirationDateColumnRenderer', () => {
    function validate(wrapper: ReactWrapper, hasExpired = true, displayValue?: string, hasTd = true): void {
        expect(wrapper.find('td')).toHaveLength(hasTd ? 1 : 0);
        if (hasTd) {
            expect(wrapper.find('.expired-grid-cell')).toHaveLength(hasExpired ? 1 : 0);
        } else expect(wrapper.find('.expired-form-field')).toHaveLength(hasExpired ? 1 : 0);

        if (!displayValue) expect(wrapper.text()).toEqual('');
        else expect(wrapper.text()).toBe(displayValue);
    }

    test('no data', () => {
        const wrapper = mount(<ExpirationDateColumnRenderer data={null} />);
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('default', () => {
        const wrapper = mount(<ExpirationDateColumnRenderer {...DEFAULT_PROPS} />);
        validate(wrapper, true, '2022-02-12');
        wrapper.unmount();
    });

    test('not tablecell', () => {
        const wrapper = mount(<ExpirationDateColumnRenderer {...DEFAULT_PROPS} tableCell={false} />);
        validate(wrapper, true, '2022-02-12', false);
        wrapper.unmount();
    });

    test('has formattedValue and has displayValue', () => {
        const data = fromJS({
            value: '2022-02-12 11:58:54.385',
            formattedValue: '2022-02-12',
            displayValue: '2022-02-12 11:58',
        });
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, true, '2022-02-12');
        wrapper.unmount();
    });

    test('has formattedValue and has displayValue - not immutable map', () => {
        const data = {
            value: '2022-02-12 11:58:54.385',
            formattedValue: '2022-02-12',
            displayValue: '2022-02-12 11:58',
        };
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, true, '2022-02-12');
        wrapper.unmount();
    });

    test('no formattedValue and no displayValue', () => {
        const data = fromJS({ value: '2022-02-12 11:58:54.385' });
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, true, '2022-02-12 11:58:54.385');
        wrapper.unmount();
    });

    test('no formattedValue and no displayValue - not immutable map', () => {
        const data = { value: '2022-02-12 11:58:54.385' };
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, true, '2022-02-12 11:58:54.385');
        wrapper.unmount();
    });

    test('no formattedValue but with displayValue', () => {
        const data = fromJS({ value: '2022-02-12 11:58:54.385', displayValue: '2022-02-12 11:58' });
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, true, '2022-02-12 11:58');
        wrapper.unmount();
    });

    test('future date', () => {
        const data = fromJS({ value: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' });
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, false, '2222-02-12', true);
        wrapper.unmount();
    });

    test('future date - not immutable map', () => {
        const data = { value: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' };
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, false, '2222-02-12', true);
        wrapper.unmount();
    });

    test('future display date, but no value', () => {
        const data = fromJS({ displayValue: '2222-02-12 11:58:54.385', formattedValue: '2222-02-12' });
        const wrapper = mount(<ExpirationDateColumnRenderer data={data} />);
        validate(wrapper, false, '2222-02-12', true);
        wrapper.unmount();
    });
});
