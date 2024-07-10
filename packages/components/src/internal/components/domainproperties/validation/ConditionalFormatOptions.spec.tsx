import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from '../utils';
import {
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_VALUE,
    DOMAIN_VALIDATOR_BOLD,
    DOMAIN_VALIDATOR_ITALIC,
    DOMAIN_VALIDATOR_STRIKETHROUGH,
} from '../constants';
import { INTEGER_TYPE, TEXT_TYPE } from '../PropDescType';

import conditionalFormat1 from '../../../../test/data/conditionalFormat1.json';
import conditionalFormat2 from '../../../../test/data/conditionalFormat2.json';

import { ConditionalFormatOptions } from './ConditionalFormatOptions';

describe('ConditionalFormatOptions', () => {
    test('Format 1 - expanded', () => {
        const validatorIndex = 0;
        const domainIndex = 1;

        const props = {
            validator: conditionalFormat1,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: true,
            dataType: INTEGER_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        const format = mount(<ConditionalFormatOptions {...props} />);

        let value = format.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('0');

        value = format.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('1');

        const bold = format.find({
            id: createFormInputId(DOMAIN_VALIDATOR_BOLD, domainIndex, validatorIndex),
            type: 'checkbox',
        });
        expect(bold.props().checked).toEqual(true);

        const italic = format.find({
            id: createFormInputId(DOMAIN_VALIDATOR_ITALIC, domainIndex, validatorIndex),
            type: 'checkbox',
        });
        expect(italic.props().checked).toEqual(false);

        const strike = format.find({
            id: createFormInputId(DOMAIN_VALIDATOR_STRIKETHROUGH, domainIndex, validatorIndex),
            type: 'checkbox',
        });
        expect(strike.props().checked).toEqual(false);

        const colorPreviews = format.find({ className: 'domain-color-preview' });
        expect(colorPreviews.length).toEqual(2);
        expect(colorPreviews.at(0).props().style).toEqual({ backgroundColor: '#FF6347' });
        expect(colorPreviews.at(1).props().style).toEqual({ backgroundColor: '#000080' });

        const textPreview = format.find({ id: 'domain-validator-preview-0' });
        expect(textPreview.at(0).props().style).toEqual({
            backgroundColor: '#000080',
            color: '#FF6347',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 'bold',
            textDecoration: '',
            width: '100px',
        });

        format.unmount();
    });

    test('Format 2 - collapsed', () => {
        const validatorIndex = 0;
        const domainIndex = 1;

        const props = {
            validator: conditionalFormat2,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: false,
            dataType: TEXT_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        const format = mount(<ConditionalFormatOptions {...props} />);

        const collapsed = format.find({ id: 'domain-condition-format-' + validatorIndex });
        expect(collapsed.children().text()).toEqual('Is Not Blank and Is Greater Than 5');
        format.unmount();
    });
});
