import { mount } from 'enzyme';
import React from 'react';

import { JsonType } from '../PropDescType';
import { createFormInputId } from '../actions';
import {
    DOMAIN_FIRST_FILTER_TYPE,
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_TYPE,
    DOMAIN_SECOND_FILTER_VALUE,
} from '../constants';

import { Filters, NO_FILTER_TYPE } from './Filters';

describe('Filters', () => {
    test('Empty Filters - string type', () => {
        const typeLabel1 = 'TypeLabel1';
        const valueLabel1 = 'ValueLabel1';
        const typeLabel2 = 'TypeLabel2';
        const valueLabel2 = 'ValueLabel2';
        const validatorIndex = 3;
        const domainIndex = 1;

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: false,
            type: 'string' as JsonType,
            firstFilterTypeLabel: typeLabel1,
            firstFilterValueLabel: valueLabel1,
            secondFilterTypeLabel: typeLabel2,
            secondFilterValueLabel: valueLabel2,
            onChange: jest.fn(),
        };

        const filters = mount(<Filters {...props} />);

        let label = filters.find({ id: 'domain-filter-type-label-1' });
        expect(label.length).toEqual(1);
        expect(label.text()).toEqual(typeLabel1);

        label = filters.find({ id: 'domain-filter-value-label-1' });
        expect(label.length).toEqual(1);
        expect(label.text()).toEqual(valueLabel1);

        label = filters.find({ id: 'domain-filter-type-label-2' });
        expect(label.length).toEqual(1);
        expect(label.text()).toEqual(typeLabel2);

        label = filters.find({ id: 'domain-filter-value-label-2' });
        expect(label.length).toEqual(1);
        expect(label.text()).toEqual(valueLabel2);

        const options = filters.find('option');
        expect(options.length).toEqual(39);

        let select = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_TYPE, domainIndex, validatorIndex) });
        expect(select.at(0).props().value).toEqual('eq');

        select = filters.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_TYPE, domainIndex, validatorIndex) });
        expect(select.at(0).props().value).toEqual('None');

        expect(filters).toMatchSnapshot();
        filters.unmount();
    });

    test('Test Expressions', () => {
        const validatorIndex = 1;
        const domainIndex = 1;
        const expression1 = 'format.column~isblank=';
        const expression2 = 'format.column~gt=0&format.column~lte=100';
        const expression3 = 'format.column~neqornull=-5&format.column~hasmvvalue=';
        const invalidExpression1 = 'format.column~gt=&format.column~lte=100';
        const invalidExpression2 = 'format.column~gt=0&format.column~lte=';
        const prefix = 'format.column';

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            type: 'int' as JsonType,
            prefix: 'format.column',
            expression: expression1,
            onChange: jest.fn(),
        };

        const filters = mount(<Filters {...props} />);

        const options = filters.find('option');
        expect(options.length).toEqual(31);

        // Expression1
        let select = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_TYPE, domainIndex, validatorIndex) });
        expect(select.at(0).props().value).toEqual('isblank');

        let value = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('');
        expect(value.at(0).props().disabled).toEqual(true);

        select = filters.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_TYPE, domainIndex, validatorIndex) });
        expect(select.at(0).props().value).toEqual('None');

        value = filters.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex) });
        expect(value.at(0).props().value).toEqual('');

        expect(Filters.describeExpression(expression1, prefix)).toEqual('Is Blank');
        expect(Filters.isValid(expression1, prefix)).toEqual(true);

        // Expression 2
        filters.setState({ filterSet: Filters.parseFilterString(expression2, prefix) }, () => {
            select = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_TYPE, domainIndex, validatorIndex) });
            expect(select.at(0).props().value).toEqual('gt');

            select = filters.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_TYPE, domainIndex, validatorIndex) });
            expect(select.at(0).props().value).toEqual('lte');

            value = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex) });
            expect(value.at(0).props().value).toEqual('0');
            expect(value.at(0).props().disabled).toEqual(false);

            value = filters.find({ id: createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex) });
            expect(value.at(0).props().value).toEqual('100');
            expect(value.at(0).props().disabled).toEqual(false);

            expect(Filters.describeExpression(expression2, prefix)).toEqual(
                'Is Greater Than 0 and Is Less Than or Equal To 100'
            );
            expect(Filters.isValid(expression2, prefix)).toEqual(true);

            // Expression 3
            filters.setState({ filterSet: Filters.parseFilterString(expression3, prefix) }, () => {
                select = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_TYPE, domainIndex, validatorIndex) });
                expect(select.at(0).props().value).toEqual('neqornull');

                select = filters.find({
                    id: createFormInputId(DOMAIN_SECOND_FILTER_TYPE, domainIndex, validatorIndex),
                });
                expect(select.at(0).props().value).toEqual('hasmvvalue');

                value = filters.find({ id: createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex) });
                expect(value.at(0).props().value).toEqual('-5');
                expect(value.at(0).props().disabled).toEqual(false);

                value = filters.find({
                    id: createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex),
                });
                expect(value.at(0).props().value).toEqual('');
                expect(value.at(0).props().disabled).toEqual(true);

                expect(Filters.describeExpression(expression3, prefix)).toEqual(
                    'Does Not Equal -5 and Has a missing value indicator'
                );
                expect(Filters.isValid(expression3, prefix)).toEqual(true);

                const expression4 = 'format.column~contains=a%2Bb'; // Issue 39191
                expect(Filters.describeExpression(expression4, prefix)).toEqual('Contains a+b');
                expect(Filters.isValid(expression4, prefix)).toEqual(true);

                expect(Filters.isValid(invalidExpression1, prefix)).toEqual(false);
                expect(Filters.isValid(invalidExpression2, prefix)).toEqual(false);

                expect(filters).toMatchSnapshot();
                filters.unmount();
            });
        });
    });

    test('Date Range', () => {
        const validatorIndex = 1;
        const domainIndex = 1;

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            type: 'date' as JsonType,
            range: true,
            onChange: jest.fn(),
        };

        const filters = mount(<Filters {...props} />);

        const options = filters.find('option');
        expect(options.length).toEqual(13);

        const dateValues = filters.find('input[type="date"]');
        expect(dateValues.length).toEqual(2);

        expect(filters).toMatchSnapshot();
        filters.unmount();
    });

    test('hasFilterType', () => {
        expect(Filters.hasFilterType(undefined)).toBeFalsy();
        expect(Filters.hasFilterType(null)).toBeFalsy();
        expect(Filters.hasFilterType('')).toBeFalsy();
        expect(Filters.hasFilterType(NO_FILTER_TYPE)).toBeFalsy();
        expect(Filters.hasFilterType('eq')).toBeTruthy();
    });
});
