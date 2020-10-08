import React from 'react';
import { OrderedMap } from 'immutable';
import { mount } from 'enzyme';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';
import { TextInput } from '../forms/input/TextInput';
import { DatePickerInput } from '../forms/input/DatePickerInput';
import { CheckboxInput } from '../forms/input/CheckboxInput';
import { SelectInput } from '../forms/input/SelectInput';

import { QueryFormInputs } from '../forms/QueryFormInputs';
import { QueryColumn } from '../base/models/model';

import { AssayWizardModel } from './AssayWizardModel';
import { BatchPropertiesPanel } from './BatchPropertiesPanel';

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: null,
        },
    };
});

describe('<BatchPropertiesPanel/>', () => {
    test('model without batch domain fields', () => {
        const model = ASSAY_WIZARD_MODEL.set('batchColumns', OrderedMap<string, QueryColumn>()) as AssayWizardModel;
        const component = <BatchPropertiesPanel model={model} onChange={() => {}} />;

        const wrapper = mount(component);
        expect(wrapper.find('.panel')).toHaveLength(0);
        expect(wrapper.find(QueryFormInputs)).toHaveLength(0);
    });

    test('check form input types', () => {
        const component = <BatchPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={() => {}} />;

        const wrapper = mount(component);
        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find(QueryFormInputs)).toHaveLength(1);
        expect(wrapper.find(TextInput)).toHaveLength(3); // text, multi-line, integer, and decimal fields
        expect(wrapper.find(DatePickerInput)).toHaveLength(1);
        expect(wrapper.find(CheckboxInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(0);
    });
});
