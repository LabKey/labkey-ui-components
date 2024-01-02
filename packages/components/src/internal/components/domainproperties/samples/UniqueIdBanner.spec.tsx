import React from 'react';
import { mount } from 'enzyme';

import { fromJS } from 'immutable';

import { Alert } from '../../base/Alert';

import { INT_RANGE_URI, STORAGE_UNIQUE_ID_CONCEPT_URI, STRING_RANGE_URI } from '../constants';

import { DomainDesign, DomainDetails } from '../models';

import { ADD_NEW_UNIQUE_ID_MSG, NEW_TYPE_NO_BARCODE_FIELDS_MSG, UniqueIdBanner } from './UniqueIdBanner';
import { SampleTypeModel } from './models';

const newSampleTypeModel = SampleTypeModel.create();

const intField = {
    name: 'key',
    rangeURI: INT_RANGE_URI,
    propertyId: 1,
    propertyURI: 'test',
};

const stringField = {
    name: 'string',
    rangeURI: STRING_RANGE_URI,
    propertyId: 2,
    propertyURI: 'test',
};

const uniqueIdField = {
    name: 'barcode',
    rangeURI: STRING_RANGE_URI,
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
    propertyId: 3,
    propertyURI: 'test',
};

const uniqueIdField2 = {
    name: 'Other Barcode',
    rangeURI: STRING_RANGE_URI,
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
    propertyId: 3,
    propertyURI: 'test',
};

describe('UniqueIdBanner', () => {
    test('new, in properties panel, no uniqueID fields', () => {
        const wrapper = mount(<UniqueIdBanner model={newSampleTypeModel} isFieldsPanel={false} onAddField={jest.fn} />);
        expect(wrapper.text()).toBe(NEW_TYPE_NO_BARCODE_FIELDS_MSG);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        wrapper.unmount();
    });

    test('new in fields panel, no uniqueID fields', () => {
        const wrapper = mount(<UniqueIdBanner model={newSampleTypeModel} isFieldsPanel={true} onAddField={jest.fn} />);
        expect(wrapper.text()).toContain(ADD_NEW_UNIQUE_ID_MSG);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(1);
        wrapper.unmount();
    });

    test('new, in properties panel, with one uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.text()).toContain('A Unique ID field for barcodes is defined: ' + uniqueIdField.name);
        wrapper.unmount();
    });

    test('new, in properties panel, with two uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField, uniqueIdField2],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.text()).toContain(
            '2 Unique ID fields are defined: ' + uniqueIdField.name + ', ' + uniqueIdField2.name
        );
        wrapper.unmount();
    });

    test('new, in fields panel, with uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.text()).toHaveLength(0);
        wrapper.unmount();
    });

    test('not new, in properties panel, no uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            options: fromJS({
                rowId: 1,
            }),
            domainDesign: DomainDesign.create({
                fields: [intField, stringField],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.text()).toContain(ADD_NEW_UNIQUE_ID_MSG);
        wrapper.unmount();
    });

    test('not new, in fields panel, no uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            options: fromJS({
                rowId: 1,
            }),
            domainDesign: DomainDesign.create({
                fields: [intField, stringField],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(1);
        expect(wrapper.find('button')).toHaveLength(1);
        expect(wrapper.text()).toContain(ADD_NEW_UNIQUE_ID_MSG);
        wrapper.unmount();
    });

    test('not new, in properties panel, with uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            options: fromJS({
                rowId: 1,
            }),
            domainDesign: DomainDesign.create({
                fields: [intField, stringField, uniqueIdField, uniqueIdField2],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.text()).toContain(
            '2 Unique ID fields are defined: ' + uniqueIdField.name + ', ' + uniqueIdField2.name
        );

        wrapper.unmount();
    });

    test('not new, in fields panel, with uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            options: fromJS({
                rowId: 1,
            }),
            domainDesign: DomainDesign.create({
                fields: [intField, stringField, uniqueIdField, uniqueIdField2],
            }),
        } as DomainDetails);
        const wrapper = mount(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn} />);
        expect(wrapper.find(Alert)).toHaveLength(0);
        expect(wrapper.find('button')).toHaveLength(0);
        expect(wrapper.text()).toHaveLength(0);

        wrapper.unmount();
    });
});
