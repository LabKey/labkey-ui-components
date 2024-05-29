import { List, fromJS, Map } from 'immutable';
import React from 'react';
import Formsy from 'formsy-react';
import { mount, ReactWrapper, shallow } from 'enzyme';

import { QueryColumn } from '../../../../public/QueryColumn';

import { LabelHelpTip } from '../../base/LabelHelpTip';

import { LabelOverlay } from '../LabelOverlay';
import { AliasInput } from '../input/AliasInput';
import { QuerySelect } from '../QuerySelect';
import { DatePickerInput } from '../input/DatePickerInput';
import { FileInput } from '../input/FileInput';
import { TextChoiceInput } from '../input/TextChoiceInput';
import { CheckboxInput } from '../input/CheckboxInput';
import { TextAreaInput } from '../input/TextAreaInput';
import { TextInput } from '../input/TextInput';
import { MultiValueRenderer } from '../../../renderers/MultiValueRenderer';
import { AliasRenderer } from '../../../renderers/AliasRenderer';
import { AppendUnits } from '../../../renderers/AppendUnits';
import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';
import { LabelColorRenderer } from '../../../renderers/LabelColorRenderer';
import { FileColumnRenderer } from '../../../renderers/FileColumnRenderer';

import { DetailDisplay, resolveDetailEditRenderer, resolveDetailRenderer, defaultTitleRenderer } from './DetailDisplay';
import { registerInputRenderers } from '../input/InputRenderFactory';

describe('DetailDisplay', () => {
    const namePatternCol = new QueryColumn({
        align: 'left',
        caption: 'Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'NameExpression',
        fieldKeyArray: ['NameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'textarea',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'NameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const aliquotNamePatternCol = new QueryColumn({
        align: 'left',
        caption: 'Aliquot Naming Pattern',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'AliquotNameExpression',
        fieldKeyArray: ['AliquotNameExpression'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'AliquotNameExpression',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Aliquot Naming Pattern',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    const metricCol = new QueryColumn({
        align: 'left',
        caption: 'Metric Unit',
        conceptURI: null,
        defaultValue: null,
        dimension: false,
        fieldKey: 'MetricUnit',
        fieldKeyArray: ['MetricUnit'],
        filterable: true,
        hidden: true,
        inputType: 'text',
        isKeyField: false,
        jsonType: 'string',
        measure: false,
        multiValue: false,
        name: 'MetricUnit',
        phiProtected: false,
        rangeURI: null,
        readOnly: false,
        required: false,
        shortCaption: 'Metric Unit',
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
        derivationDataScope: null,
    });

    test('with fieldHelpTexts', () => {
        const cols = List.of(namePatternCol, aliquotNamePatternCol, metricCol);

        const fieldHelpText = {
            nameexpression: 'Example name that will be generated from the current pattern: S-1001',
            aliquotnameexpression: 'Example aliquot name that will be generated from the current pattern: Sample112.1',
        };

        const data = [
            fromJS({
                NameExpression: {
                    value: 'S-${genId}',
                },
                AliquotNameExpression: {
                    value: '${${AliquotedFrom}.:withCounter}',
                },
                metricCol: {
                    value: 'mL',
                },
            }),
        ];

        const wrapper = mount(
            <DetailDisplay
                asPanel={true}
                editingMode={false}
                data={data}
                displayColumns={cols}
                fieldHelpTexts={fieldHelpText}
            />
        );

        expect(wrapper.find('tr')).toHaveLength(3);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(2);
    });
});

describe('defaultTitleRenderer', () => {
    test('editable', () => {
        const col = new QueryColumn({ caption: 'test', readOnly: false, userEditable: true, shownInUpdateView: true });
        const result = shallow(<div>{defaultTitleRenderer(col)}</div>);
        expect(result.find('span')).toHaveLength(0);
        expect(result.find(LabelOverlay)).toHaveLength(1);
        expect(result.find(LabelOverlay).prop('column')).toBe(col);
        result.unmount();
    });

    test('not editable', () => {
        const col = new QueryColumn({ caption: 'test', readOnly: false, userEditable: true, shownInUpdateView: false });
        const result = shallow(<div>{defaultTitleRenderer(col)}</div>);
        expect(result.find('span')).toHaveLength(1);
        expect(result.find('span').text()).toBe('test');
        expect(result.find(LabelOverlay)).toHaveLength(0);
        result.unmount();
    });
});

describe('resolveDetailEditRenderer', () => {
    function validate(wrapper: ReactWrapper, count: Record<string, number>): void {
        expect(wrapper.find('.field__un-editable')).toHaveLength(count['uneditable'] ?? 0);
        expect(wrapper.find(AliasInput)).toHaveLength(count['aliasinput'] ?? 0);
        expect(wrapper.find(QuerySelect)).toHaveLength(count['queryselect'] ?? 0);
        expect(wrapper.find(TextAreaInput)).toHaveLength(count['textarea'] ?? 0);
        expect(wrapper.find(CheckboxInput)).toHaveLength(count['checkbox'] ?? 0);
        expect(wrapper.find(DatePickerInput)).toHaveLength(count['datepickerinput'] ?? 0);
        expect(wrapper.find(FileInput)).toHaveLength(count['fileinput'] ?? 0);
        expect(wrapper.find(TextChoiceInput)).toHaveLength(count['textchoiceinput'] ?? 0);
        expect(wrapper.find(TextInput)).toHaveLength(count['input'] ?? 0);
    }

    const default_props = {
        name: 'test',
        fieldKey: 'test',
        caption: 'test',
        readOnly: false,
        userEditable: true,
        shownInUpdateView: true,
    };

    beforeAll(() => {
        registerInputRenderers();
    });

    test('not editable', () => {
        const col = new QueryColumn({ caption: 'test', readOnly: false, userEditable: true, shownInUpdateView: false });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { uneditable: 1 });
        wrapper.unmount();
    });

    test('inputRenderer', () => {
        const col = new QueryColumn({ ...default_props, inputRenderer: 'experimentalias' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { aliasinput: 1 });
        wrapper.unmount();
    });

    test('isPublicLookup, displayAsLookup = true', () => {
        const col = new QueryColumn({
            ...default_props,
            lookup: { isPublic: true },
            displayAsLookup: true,
        });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { queryselect: 1 });
        wrapper.unmount();
    });

    test('isPublicLookup, displayAsLookup = false', () => {
        const col = new QueryColumn({
            ...default_props,
            lookup: { isPublic: true },
            displayAsLookup: false,
        });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { input: 1 });
        wrapper.unmount();
    });

    test('inputType textarea', () => {
        const col = new QueryColumn({ ...default_props, inputType: 'textarea' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { textarea: 1 });
        wrapper.unmount();
    });

    test('inputType file, fileInputRenderer undefined', () => {
        const col = new QueryColumn({ ...default_props, inputType: 'file' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { uneditable: 1 });
        wrapper.unmount();
    });

    test('inputType file, fileInputRenderer defined', () => {
        const col = new QueryColumn({ ...default_props, inputType: 'file' });
        const wrapper = mount(
            <Formsy>
                {resolveDetailEditRenderer(col, undefined, (col, data) => (
                    <FileInput key={0} queryColumn={col} onChange={jest.fn} />
                ))(Map())}
            </Formsy>
        );
        validate(wrapper, { fileinput: 1 });
        wrapper.unmount();
    });

    test('jsonType boolean', () => {
        const col = new QueryColumn({ ...default_props, jsonType: 'boolean' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { checkbox: 1 });
        wrapper.unmount();
    });

    test('jsonType date', () => {
        const col = new QueryColumn({ ...default_props, jsonType: 'date' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { datepickerinput: 1 });
        wrapper.unmount();
    });

    test('jsonType time', () => {
        const col = new QueryColumn({ ...default_props, jsonType: 'time' });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { datepickerinput: 1 });
        wrapper.unmount();
    });

    test('default input', () => {
        const col = new QueryColumn({ ...default_props });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { input: 1 });
        wrapper.unmount();
    });

    test('validValues', () => {
        const col = new QueryColumn({ ...default_props, validValues: ['a', 'b', 'c'] });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { textchoiceinput: 1 });
        wrapper.unmount();
    });
});

describe('resolveDetailRenderer', () => {
    function validate(wrapper: ReactWrapper, count: Record<string, number>): void {
        expect(wrapper.find(MultiValueRenderer)).toHaveLength(count['multivaluedetailrenderer'] ?? 0);
        expect(wrapper.find(AliasRenderer)).toHaveLength(count['aliasrenderer'] ?? 0);
        expect(wrapper.find(AppendUnits)).toHaveLength(count['appendunits'] ?? 0);
        expect(wrapper.find(AssayRunReferenceRenderer)).toHaveLength(count['assayrunreference'] ?? 0);
        expect(wrapper.find(LabelColorRenderer)).toHaveLength(count['labelcolorrenderer'] ?? 0);
        expect(wrapper.find(FileColumnRenderer)).toHaveLength(count['filecolumnrenderer'] ?? 0);
    }

    test('multivaluedetailrenderer', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'MultiValueDetailRenderer' }))(Map())}</div>
        );
        validate(wrapper, { multivaluedetailrenderer: 1 });
        wrapper.unmount();
    });

    test('aliasrenderer', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AliasRenderer' }))(Map())}</div>
        );
        validate(wrapper, { aliasrenderer: 1 });
        wrapper.unmount();
    });

    test('appendunits', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AppendUnits' }))(Map())}</div>
        );
        validate(wrapper, { appendunits: 1 });
        wrapper.unmount();
    });

    test('assayrunreference', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'AssayRunReference' }))(Map())}</div>
        );
        validate(wrapper, { assayrunreference: 1 });
        wrapper.unmount();
    });

    test('labelcolorrenderer', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'LabelColorRenderer' }))(Map())}</div>
        );
        validate(wrapper, { labelcolorrenderer: 1 });
        wrapper.unmount();
    });

    test('filecolumnrenderer', () => {
        const wrapper = mount(
            <div>{resolveDetailRenderer(new QueryColumn({ detailRenderer: 'FileColumnRenderer' }))(Map())}</div>
        );
        validate(wrapper, { filecolumnrenderer: 1 });
        wrapper.unmount();
    });

    test('sampletypeimportaliasrenderer', () => {
        const wrapper = mount(
            <div>
                {resolveDetailRenderer(new QueryColumn({ detailRenderer: 'SampleTypeImportAliasRenderer' }))(Map())}
            </div>
        );
        validate(wrapper, { sampletypeimportaliasrenderer: 1 });
        wrapper.unmount();
    });

    test('sourcetypeimportaliasrenderer', () => {
        const wrapper = mount(
            <div>
                {resolveDetailRenderer(new QueryColumn({ detailRenderer: 'SourceTypeImportAliasRenderer' }))(Map())}
            </div>
        );
        validate(wrapper, { sourcetypeimportaliasrenderer: 1 });
        wrapper.unmount();
    });

    test('expirationdatecolumnrenderer', () => {
        const wrapper = mount(
            <div>
                {resolveDetailRenderer(new QueryColumn({ detailRenderer: 'ExpirationDateColumnRenderer' }))(Map())}
            </div>
        );
        validate(wrapper, { expirationdatecolumnrenderer: 1 });
        wrapper.unmount();
    });

    test('bogus renderer', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: 'BogusRenderer' }))).toBeUndefined();
    });

    test('without detailRenderer prop', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: undefined }))).toBeUndefined();
    });
});
