import { mount } from 'enzyme';
import React from 'react';

import { PropertyValidator } from '../models';
import { INTEGER_TYPE } from '../PropDescType';
import { createFormInputId } from '../actions';
import {
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_VALUE,
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_NAME,
} from '../constants';
import propertyValidator from '../../../../test/data/propertyValidator-range.json';

import { RangeValidationOptions } from './RangeValidationOptions';

describe('RangeValidationOptions', () => {
    test('Range Validator - expanded', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'Range').get(0);

        const props = {
            validator: validatorModel,
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

        const validator = mount(<RangeValidationOptions {...props} />);

        let value = validator.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('0');

        value = validator.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('10');

        const name = validator.find({ id: createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex) });
        expect(name.at(0).props().value).toEqual('Test range validator');

        const description = validator.find({
            id: createFormInputId(DOMAIN_VALIDATOR_DESCRIPTION, domainIndex, validatorIndex),
        });
        expect(description.at(0).props().value).toEqual('This is a range validator');

        const errorMsg = validator.find({
            id: createFormInputId(DOMAIN_VALIDATOR_ERRORMESSAGE, domainIndex, validatorIndex),
        });
        expect(errorMsg.at(0).props().value).toEqual('Range validation failed');

        expect(RangeValidationOptions.isValid(validatorModel)).toEqual(true);

        expect(validator).toMatchSnapshot();
        validator.unmount();
    });

    test('Range Validator - collapsed', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'Range').get(0);

        const props = {
            validator: validatorModel,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: false,
            dataType: INTEGER_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        const validator = mount(<RangeValidationOptions {...props} />);

        const collapsed = validator.find(`#domain-range-validator-${validatorIndex} .domain-validator-collapse`);
        expect(collapsed.text()).toEqual('Test range validator: Is Greater Than 0 and Is Less Than 10');

        expect(validator).toMatchSnapshot();
        validator.unmount();
    });
});
