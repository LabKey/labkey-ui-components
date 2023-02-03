import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import renderer from 'react-test-renderer';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { capitalizeFirstChar } from '../../util/utils';
import { TestTypeDataType } from '../../../test/data/constants';

import { FilterCard, GroupedFilterValues } from './FilterCards';
import { FieldFilter } from './models';

describe('FilterCard', () => {
    const capParentNoun = capitalizeFirstChar(TestTypeDataType.nounAsParentSingular);
    test('no schemaQuery', () => {
        const wrapper = mount(
            <FilterCard entityDataType={TestTypeDataType} onAdd={jest.fn} onDelete={jest.fn} onEdit={jest.fn} />
        );
        const header = wrapper.find('.filter-card__header');
        expect(header.prop('className')).toContain('without-secondary');
        expect(header.prop('className')).toContain(TestTypeDataType.filterCardHeaderClass);
        expect(header.text()).toContain(capParentNoun);
        expect(wrapper.find('.filter-card__card-content').exists()).toBeFalsy();
        const content = wrapper.find('.filter-card__empty-content');
        expect(content.exists()).toBeTruthy();
        expect(content.text().trim()).toBe('+');
        wrapper.unmount();
    });

    test('empty filters', () => {
        const wrapper = mount(
            <FilterCard
                dataTypeDisplayName="Parent"
                entityDataType={TestTypeDataType}
                schemaQuery={new SchemaQuery('testSample', 'parent')}
                filterArray={[]}
                onAdd={jest.fn}
                onEdit={jest.fn}
                onDelete={jest.fn}
            />
        );
        const header = wrapper.find('.filter-card__header');
        expect(header.prop('className').indexOf('without-secondary')).toBe(-1);
        expect(header.prop('className')).toContain(TestTypeDataType.filterCardHeaderClass);
        expect(header.find('.secondary-text').text()).toBe(capParentNoun);
        expect(header.find('.primary-text').text()).toBe('Parent');
        expect(header.find('.fa-pencil').exists()).toBeTruthy();
        expect(header.find('.fa-trash').exists()).toBeTruthy();

        expect(wrapper.find('.filter-card__empty-content').exists()).toBeFalsy();
        const content = wrapper.find('.filter-card__card-content');
        expect(content.exists()).toBeTruthy();
        expect(content.text().trim()).toBe('Showing all samples with Parent test parents');
        wrapper.unmount();
    });

    test('with filters', () => {
        const filter1 = {
            fieldKey: '1',
            fieldCaption: 'Field1',
            filter: Filter.create('IntField', 1),
            jsonType: 'int',
        } as FieldFilter;
        const filter2 = {
            fieldKey: '2',
            fieldCaption: 'Field2',
            filter: Filter.create('IntField2', 2),
            jsonType: 'int',
        } as FieldFilter;

        const wrapper = mount(
            <FilterCard
                entityDataType={TestTypeDataType}
                schemaQuery={new SchemaQuery('testSample', 'parent')}
                filterArray={[filter1, filter2]}
                onAdd={jest.fn}
                onEdit={jest.fn}
                onDelete={jest.fn}
            />
        );
        expect(wrapper.find('.filter-card__empty-content').exists()).toBeFalsy();

        const content = wrapper.find('.filter-card__card-content');
        expect(content.exists()).toBeTruthy();

        expect(content.find('.filter-display__row').length).toBe(2);
        expect(content.text()).toBe('Field11Field22');
        expect(content.find('.filter-row-divider').length).toBe(1);
        wrapper.unmount();
    });
});

describe('GroupedFilterValues', () => {
    test('no filter array', () => {
        const component = renderer.create(
            <GroupedFilterValues cardIndex={1} filterArray={null} onFilterValueExpand={jest.fn} />
        );
        expect(component.toJSON()).toBeNull();
    });

    function validateRow(rows: ReactWrapper, rowNum: number, labelText: string, valueText: string): void {
        const cols = rows.at(rowNum).find('td');
        expect(cols).toHaveLength(2);
        expect(cols.at(0).text()).toBe(labelText);
        expect(cols.at(1).text()).toBe(valueText);
    }

    test('one filter', () => {
        const wrapper = mount(
            <GroupedFilterValues
                cardIndex={1}
                onFilterValueExpand={jest.fn}
                filterArray={[
                    {
                        fieldKey: 'test',
                        fieldCaption: 'Test',
                        jsonType: 'string',
                        filter: Filter.create('test', 'a', Filter.Types.EQ),
                    },
                ]}
            />
        );
        const rows = wrapper.find('tr');
        expect(rows).toHaveLength(1);
        validateRow(rows, 0, 'Test', 'a');
    });

    test('one filter per field', () => {
        const wrapper = mount(
            <GroupedFilterValues
                cardIndex={1}
                onFilterValueExpand={jest.fn}
                filterArray={[
                    {
                        fieldKey: 'test',
                        fieldCaption: 'Test',
                        jsonType: 'string',
                        filter: Filter.create('test', 'a', Filter.Types.NEQ),
                    },
                    {
                        fieldKey: 'otherField',
                        fieldCaption: 'Other',
                        jsonType: 'string',
                        filter: Filter.create('otherField', 'b', Filter.Types.GT),
                    },
                ]}
            />
        );
        const rows = wrapper.find('tr');
        expect(rows).toHaveLength(2);
        validateRow(rows, 0, 'Test', '≠ a');
        validateRow(rows, 1, 'Other', '> b');
    });

    test('multiple filters per field', () => {
        const wrapper = mount(
            <GroupedFilterValues
                cardIndex={1}
                onFilterValueExpand={jest.fn}
                filterArray={[
                    {
                        fieldKey: 'test',
                        fieldCaption: 'Test',
                        jsonType: 'string',
                        filter: Filter.create('test', 'a', Filter.Types.GTE),
                    },
                    {
                        fieldKey: 'test',
                        fieldCaption: 'Test',
                        jsonType: 'string',
                        filter: Filter.create('test', 'zebra', Filter.Types.LTE),
                    },
                    {
                        fieldKey: 'otherField',
                        fieldCaption: 'Other',
                        jsonType: 'string',
                        filter: Filter.create('otherField', 'alice', Filter.Types.GT),
                    },
                    {
                        fieldKey: 'otherField',
                        fieldCaption: 'Other',
                        jsonType: 'string',
                        filter: Filter.create('otherField', 'jack;jill;bob', Filter.Types.IN),
                    },
                ]}
            />
        );
        const rows = wrapper.find('tr');
        expect(rows).toHaveLength(4);
        validateRow(rows, 0, 'Test', '≥ a');
        validateRow(rows, 1, 'and', '≤ zebra');
        validateRow(rows, 2, 'Other', '> alice');
        validateRow(rows, 3, 'and', 'jackjillbob');
    });
});
