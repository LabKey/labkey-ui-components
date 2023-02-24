import React from 'react';
import { fromJS, Map } from 'immutable';
import { shallow } from 'enzyme';

import { MultiValueRenderer } from './MultiValueRenderer';

describe('MultiValueRenderer', () => {
    test('empty data', () => {
        expect(shallow(<MultiValueRenderer data={undefined} />).exists('div')).toBe(false);
        expect(shallow(<MultiValueRenderer data={null} />).exists('div')).toBe(false);
        expect(shallow(<MultiValueRenderer data={Map()} />).exists('div')).toBe(false);
    });

    test('data shapes', () => {
        let data = fromJS({ 24: { value: 24 } });
        expect(
            shallow(<MultiValueRenderer data={data} />)
                .find('span')
                .text()
        ).toBe('24');
        data = fromJS({ 24: { displayValue: 'Griffey', value: 24 } });
        expect(
            shallow(<MultiValueRenderer data={data} />)
                .find('span')
                .text()
        ).toBe('Griffey');
        data = fromJS({ 24: { formattedValue: 'Ken Griffey Jr.', displayValue: 'Griffey', value: 24 } });
        expect(
            shallow(<MultiValueRenderer data={data} />)
                .find('span')
                .text()
        ).toBe('Ken Griffey Jr.');
    });

    test('multiple values', () => {
        const data = fromJS({
            11: { displayValue: 'Edgar', value: 11 },
            24: { formattedValue: 'Ken Griffey Jr.', value: 24 },
            51: { displayValue: 'Ichiro', url: 'https://www.mariners.com/ichiro', value: 51 },
        });
        const wrapper = shallow(<MultiValueRenderer data={data} />);
        const spans = wrapper.find('span');
        expect(spans.length).toBe(3);
        expect(spans.at(0).text()).toEqual('Edgar');
        expect(spans.at(1).text()).toEqual(', Ken Griffey Jr.');
        expect(spans.at(2).text()).toEqual(', Ichiro');

        const link = spans.at(2).find('a');
        expect(link.exists()).toBe(true);
        expect(link.prop('href')).toEqual('https://www.mariners.com/ichiro');
    });

    test('non-Map values', () => {
        const data = Map({
            11: [],
            24: 'Ken Griffey Jr.',
            28: 0,
            44: 4.444555,
            51: false,
            99: undefined,
            101: null,
        });
        const wrapper = shallow(<MultiValueRenderer data={data} />);
        const spans = wrapper.find('span');
        expect(spans.length).toBe(4);
        expect(spans.at(0).text()).toEqual('Ken Griffey Jr.');
        expect(spans.at(1).text()).toEqual(', 0');
        expect(spans.at(2).text()).toEqual(', 4.444555');
        expect(spans.at(3).text()).toEqual(', false');
        expect(wrapper.find('a').exists()).toBe(false);
    });
});
