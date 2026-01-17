import React from 'react';
import { fromJS, Map } from 'immutable';

import { render } from '@testing-library/react';

import { MultiValueRenderer } from './MultiValueRenderer';
import { QueryColumn } from '../../public/QueryColumn';
import {MULTI_CHOICE_RANGE_URI} from "../components/domainproperties/constants";

describe('MultiValueRenderer', () => {
    test('empty data', () => {
        render(<MultiValueRenderer data={undefined} />);
        expect(document.body.textContent).toBe('');

        render(<MultiValueRenderer data={null} />);
        expect(document.body.textContent).toBe('');

        render(<MultiValueRenderer data={Map()} />);
        expect(document.body.textContent).toBe('');
    });

    test('data shapes, value', () => {
        const data = fromJS({ 24: { value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('24');
    });

    test('data shapes, value, file column', () => {
        const data = fromJS({ 24: { value: 'a.txt', url: 'a.txt' } });
        render(<MultiValueRenderer col={new QueryColumn({ inputType: 'file' })} data={data} />);
        expect(document.body.textContent).toBe('a.txt');
        expect(document.querySelectorAll('.attachment-card')).toHaveLength(0);
    });

    test('data list, value, file column', () => {
        const data = fromJS([{ value: 'a.txt', url: 'a.txt' }]);
        render(<MultiValueRenderer col={new QueryColumn({ inputType: 'file' })} data={data} />);
        expect(document.body.textContent).toBe('a.txtDownload');
        expect(document.querySelectorAll('.attachment-card')).toHaveLength(1);
    });

    test('data shapes, displayValue', () => {
        const data = fromJS({ 24: { displayValue: 'Griffey', value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('Griffey');
    });

    test('data shapes, formattedValue', () => {
        const data = fromJS({ 24: { formattedValue: 'Ken Griffey Jr.', displayValue: 'Griffey', value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('Ken Griffey Jr.');
    });

    test('data with new line', () => {
        const data = fromJS({ 24: { value: 'first\nsecond\nthird' } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('first\nsecond\nthird');
    });

    test('multiple values', () => {
        const data = fromJS({
            11: { displayValue: 'Edgar', value: 11 },
            24: { formattedValue: 'Ken Griffey Jr.', value: 24 },
            51: { displayValue: 'Ichiro', url: 'https://www.mariners.com/ichiro', value: 51 },
        });
        render(<MultiValueRenderer data={data} />);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(3);
        expect(spans[0].textContent).toEqual('Edgar');
        expect(spans[1].textContent).toEqual(', Ken Griffey Jr.');
        expect(spans[2].textContent).toEqual(', Ichiro');

        const link = spans[2].querySelectorAll('a');
        expect(link).toHaveLength(1);
        expect(link[0].getAttribute('href')).toEqual('https://www.mariners.com/ichiro');
    });

    test('multiple values', () => {
        const data = fromJS({
            value: ['a', 'b', 'c']
        });
        const queryCol = new QueryColumn({ fieldKey: 'mv', name: 'mv', caption: 'MVTC', rangeURI: MULTI_CHOICE_RANGE_URI });
        render(<MultiValueRenderer data={data} col={queryCol}/>);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(3);
        expect(spans[0].textContent).toEqual('a');
        expect(spans[1].textContent).toEqual(', b');
        expect(spans[2].textContent).toEqual(', c');

        const link = spans[0].querySelectorAll('a');
        expect(link).toHaveLength(0);
    });

    test('multiple values, file column', () => {
        const data = fromJS({
            11: { value: 'a.txt', url: 'a.txt' },
            24: { value: 'b.txt', url: 'b.txt' },
            51: { value: 'c.txt', url: 'c.txt' },
        });
        render(<MultiValueRenderer col={new QueryColumn({ inputType: 'file' })} data={data} />);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(3);
        expect(spans[0].textContent).toEqual('a.txt');
        expect(spans[1].textContent).toEqual(', b.txt');
        expect(spans[2].textContent).toEqual(', c.txt');

        const link = spans[2].querySelectorAll('a');
        expect(link).toHaveLength(1);
        expect(link[0].getAttribute('href')).toEqual('c.txt');

        expect(document.querySelectorAll('.attachment-card')).toHaveLength(0);
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
        render(<MultiValueRenderer data={data} />);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(4);
        expect(spans[0].textContent).toEqual('Ken Griffey Jr.');
        expect(spans[1].textContent).toEqual(', 0');
        expect(spans[2].textContent).toEqual(', 4.444555');
        expect(spans[3].textContent).toEqual(', false');
        expect(document.querySelectorAll('a')).toHaveLength(0);
    });
});
