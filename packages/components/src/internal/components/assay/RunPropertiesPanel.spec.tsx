import React from 'react';
import { OrderedMap } from 'immutable';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { CheckboxInput } from '../forms/input/CheckboxInput';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryFormInputs } from '../forms/QueryFormInputs';
import { TextInput } from '../forms/input/TextInput';
import { DatePickerInput } from '../forms/input/DatePickerInput';
import { SelectInput } from '../forms/input/SelectInput';
import { Input, TextArea } from '../forms/input/FormsyReactComponents';

import { mountWithServerContext } from '../../test/enzymeTestHelpers';

import { RunPropertiesPanel } from './RunPropertiesPanel';
import { AssayWizardModel } from './AssayWizardModel';

describe('RunPropertiesPanel', () => {
    test('model without run domain fields', () => {
        const model = ASSAY_WIZARD_MODEL.set('runColumns', OrderedMap<string, QueryColumn>()) as AssayWizardModel;
        const wrapper = mountWithServerContext(<RunPropertiesPanel model={model} onChange={jest.fn} />);

        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find(Input)).toHaveLength(1); // assay id input always there for run props
        expect(wrapper.find(TextArea)).toHaveLength(1); // comments input always there for run props
        expect(wrapper.find(QueryFormInputs)).toHaveLength(0);
    });

    test('check form input types', () => {
        const wrapper = mountWithServerContext(<RunPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={jest.fn} />);

        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find(Input)).toHaveLength(4); // assay id plus 4 TextInputs
        expect(wrapper.find(TextArea)).toHaveLength(2); // comments plus one other multi-line text input
        expect(wrapper.find(QueryFormInputs)).toHaveLength(1);
        expect(wrapper.find(TextInput)).toHaveLength(3); // text, multi-line, integer, and decimal fields
        expect(wrapper.find(DatePickerInput)).toHaveLength(1);
        expect(wrapper.find(CheckboxInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(0);
    });
});
