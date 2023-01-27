import React from 'react';
import { mount } from 'enzyme';
import { List, Map } from 'immutable';

import { Filter } from '@labkey/api';

import sampleSetAllFieldTypesQueryInfo from '../test/data/sampleSetAllFieldTypes-getQueryDetails.json';
import { TestTypeDataType } from '../test/data/constants';
import { waitForLifecycle } from '../internal/testHelpers';
import { QueryInfo } from '../public/QueryInfo';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { ChoicesListItem } from '../internal/components/base/ChoicesListItem';
import { SchemaQuery } from '../public/SchemaQuery';

import { getTestAPIWrapper } from '../internal/APIWrapper';
import { getQueryTestAPIWrapper } from '../internal/query/APIWrapper';

import { FilterProps } from '../internal/components/search/models';

import { EntityFieldFilterModal, EntityFieldFilterModalProps } from './EntityFieldFilterModal';

describe('EntityFieldFilterModal', () => {
    const sampleTypes = Map({
        SampleSets: List([
            {
                label: 'SampleType_01',
                lsid: 'urn:lsid:labkey.com:SampleSet.Folder-13:SampleType_01',
                rowId: 21,
                value: 'sampletype_01',
                query: 'SampleType_01',
                entityDataType: TestTypeDataType,
                isFromSharedContainer: false,
                schema: 'samples',
            },
            {
                label: 'SampleSetAllFieldTypes',
                lsid: 'urn:lsid:labkey.com:SampleSet.Folder-4:SampleSetAllFieldTypes',
                rowId: 18,
                value: 'samplesetallfieldtypes',
                query: 'samplesetallfieldtypes',
                entityDataType: TestTypeDataType,
                isFromSharedContainer: true,
                schema: 'samples',
            },
        ]),
    });

    const cards: FilterProps[] = [
        {
            entityDataType: TestTypeDataType,
            filterArray: [
                {
                    fieldKey: 'Integer',
                    fieldCaption: 'Integer',
                    filter: Filter.create('Integer', 1),
                    jsonType: 'int',
                },
                {
                    fieldKey: 'Boolean',
                    fieldCaption: 'Boolean',
                    filter: Filter.create('Boolean', true),
                    jsonType: 'boolean',
                },
            ],
            schemaQuery: SchemaQuery.create('TestSchema', 'samplesetallfieldtypes'),
            index: 1,
        },
    ];

    function defaultProps(): EntityFieldFilterModalProps {
        return {
            api: getTestAPIWrapper(jest.fn, {
                query: getQueryTestAPIWrapper(jest.fn, {
                    getEntityTypeOptions: jest.fn().mockResolvedValue(sampleTypes),
                    getQueryDetails: jest.fn().mockResolvedValue(QueryInfo.fromJSON(sampleSetAllFieldTypesQueryInfo)),
                }),
            }),
            entityDataType: TestTypeDataType,
            fieldKey: 'Integer',
            onCancel: jest.fn(),
            onFind: jest.fn(),
            queryName: 'samplesetallfieldtypes',
            skipDefaultViewCheck: true, // QueryInfo.fromJSON lacks views info
        };
    }

    function verifyOpeningCardWithFilters(wrapper, isQuerySelected?: boolean): void {
        const queriesContainer = wrapper.find('.filter-modal__col_queries');
        const queries = queriesContainer.find(ChoicesListItem);
        expect(queries.length).toBe(2);
        expect(queries.at(0).props().label).toBe('SampleSetAllFieldTypes');
        expect(queries.at(1).props().label).toBe('SampleType_01');
        expect(queries.at(0).find('.field_count_circle')).toHaveLength(1); // has filter indicator
        expect(queries.at(1).find('.field_count_circle')).toHaveLength(0); // no filter indicator
        expect(queries.at(0).find('.field_count_circle').text()).toEqual('2');
        expect(queries.at(0).props()['active']).toEqual(isQuerySelected);
    }

    function verifyOpenedFieldsPanel(wrapper, isFieldSelected?: boolean): void {
        const fieldCount = 14;

        const fieldsContainerBody = wrapper.find('.filter-modal__fields-col-content');
        const fields = fieldsContainerBody.find(ChoicesListItem);
        expect(fields.length).toBe(fieldCount);

        for (let i = 0; i < fieldCount; i++) {
            const fieldName = fields.at(i).text();
            let hasFieldFilter = false;
            if (fieldName === 'Integer' || fieldName === 'Boolean') hasFieldFilter = true;

            expect(fields.at(i).find('.field-modal__field_dot')).toHaveLength(hasFieldFilter ? 1 : 0); // has filter indicator

            if (fieldName === 'Integer') {
                expect(fields.at(i).props()['active']).toEqual(!!isFieldSelected);
            }
        }
    }

    test('no initial query selection, no existing filters', async () => {
        const wrapper = mount(<EntityFieldFilterModal {...defaultProps()} queryName={null} fieldKey={null} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        expect(wrapper.find('ModalTitle').text()).toBe('Select Sample Test Parent Properties');

        const queriesContainer = wrapper.find('.filter-modal__col_queries');
        const queriesContainerTitle = queriesContainer.find('.field-modal__col-title');

        const queriesContainerBody = queriesContainer.find('.field-modal__col-content');
        expect(queriesContainerTitle.text()).toBe('test Parents');
        const queries = queriesContainerBody.find(ChoicesListItem);
        expect(queries.length).toBe(2);
        expect(queries.at(0).props().label).toBe('SampleSetAllFieldTypes');
        expect(queries.at(1).props().label).toBe('SampleType_01');
        expect(queries.at(0).find('.component-right')).toHaveLength(0); // no filter indicator
        expect(queries.at(1).find('.component-right')).toHaveLength(0);

        const fieldsContainerTitle = wrapper.find('.filter-modal__col_fields').at(0);
        expect(fieldsContainerTitle.text()).toContain('Fields');
        const fieldsContainerEmptyBody = wrapper.find('.field-modal__empty-msg').at(0);
        expect(fieldsContainerEmptyBody.text()).toContain('Select a test parent.');

        const findButton = wrapper.find('button.btn-success');
        expect(findButton.props().disabled).toBeTruthy();

        wrapper.unmount();
    });

    test('no initial query selection, with existing filters', async () => {
        const wrapper = mount(
            <EntityFieldFilterModal {...defaultProps()} cards={cards} queryName={null} fieldKey={null} />
        );

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyOpeningCardWithFilters(wrapper, false);

        wrapper.unmount();
    });

    test('open card with filters, list all field types', async () => {
        const wrapper = mount(<EntityFieldFilterModal {...defaultProps()} cards={cards} fieldKey={null} />);

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyOpeningCardWithFilters(wrapper, true);

        verifyOpenedFieldsPanel(wrapper);

        expect(wrapper.find('.field-modal__empty-msg').text()).toContain('Select a field.'); // filter panel empty

        wrapper.unmount();
    });
});
