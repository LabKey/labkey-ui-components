import React from 'react';
import { mount } from 'enzyme';

import { Filter } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';
import { capitalizeFirstChar } from '../../util/utils';
import { TestTypeDataType } from '../../../test/data/constants';

import { FilterCard } from './FilterCards';
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
                schemaQuery={SchemaQuery.create('testSample', 'parent')}
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
                schemaQuery={SchemaQuery.create('testSample', 'parent')}
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
        expect(content.text()).toBe('Field1:1Field2:2');
        wrapper.unmount();
    });
});
