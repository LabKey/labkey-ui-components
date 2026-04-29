import React from 'react';

import { fromJS } from 'immutable';

import { INT_RANGE_URI, STORAGE_UNIQUE_ID_CONCEPT_URI, STRING_RANGE_URI } from '../constants';

import { DomainDesign, DomainDetails } from '../models';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

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
        renderWithAppContext(<UniqueIdBanner model={newSampleTypeModel} isFieldsPanel={false} onAddField={jest.fn()} />);
        expect(document.querySelector('.uniqueid-msg')).toHaveTextContent(NEW_TYPE_NO_BARCODE_FIELDS_MSG);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
    });

    test('new in fields panel, no uniqueID fields', () => {
        renderWithAppContext(<UniqueIdBanner model={newSampleTypeModel} isFieldsPanel={true} onAddField={jest.fn()} />);
        expect(document.querySelector('.uniqueid-alert')).toHaveTextContent(ADD_NEW_UNIQUE_ID_MSG);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(1);
    });

    test('new, in properties panel, with one uniqueID field', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField],
            }),
        } as DomainDetails);
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.uniqueid-msg')).toHaveTextContent(
            'A Unique ID field for barcodes is defined: ' + uniqueIdField.name
        );
    });

    test('new, in properties panel, with two uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField, uniqueIdField2],
            }),
        } as DomainDetails);
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.uniqueid-msg')).toHaveTextContent(
            '2 Unique ID fields are defined: ' + uniqueIdField.name + ', ' + uniqueIdField2.name
        );
    });

    test('new, in fields panel, with uniqueID fields', () => {
        const sampleTypeModel = SampleTypeModel.create({
            domainDesign: DomainDesign.create({
                fields: [intField, uniqueIdField],
            }),
        } as DomainDetails);
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.uniqueid-msg')).toBeNull();
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
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelector('.uniqueid-alert')).toHaveTextContent(ADD_NEW_UNIQUE_ID_MSG);
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
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelector('.uniqueid-alert')).toHaveTextContent(ADD_NEW_UNIQUE_ID_MSG);
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
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={false} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.uniqueid-msg')).toHaveTextContent(
            '2 Unique ID fields are defined: ' + uniqueIdField.name + ', ' + uniqueIdField2.name
        );
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
        renderWithAppContext(<UniqueIdBanner model={sampleTypeModel} isFieldsPanel={true} onAddField={jest.fn()} />);
        expect(document.querySelectorAll('.uniqueid-alert')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.uniqueid-msg')).toBeNull();
    });
});
