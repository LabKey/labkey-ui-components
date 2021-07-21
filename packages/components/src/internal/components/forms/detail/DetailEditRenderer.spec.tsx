import React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Map } from 'immutable';
import Formsy from 'formsy-react';
import { Checkbox, Input, Textarea } from 'formsy-react-components';

import {
    AliasRenderer,
    AppendUnits,
    QueryDateInput,
    DatePickerInput,
    FileColumnRenderer,
    FileInput,
    LabelColorRenderer,
    LabelOverlay,
    MultiValueRenderer,
    QueryColumn,
    QuerySelect,
} from '../../../..';

import { AssayRunReferenceRenderer } from '../../../renderers/AssayRunReferenceRenderer';
import { AliasInput } from '../input/AliasInput';

import { resolveDetailEditRenderer, resolveDetailRenderer, titleRenderer } from './DetailEditRenderer';

describe('titleRenderer', () => {
    test('editable', () => {
        const col = new QueryColumn({ caption: 'test', readOnly: false, userEditable: true, shownInUpdateView: true });
        const result = mount(<div>{titleRenderer(col)}</div>);
        expect(result.find('.field__un-editable')).toHaveLength(0);
        expect(result.find(LabelOverlay)).toHaveLength(1);
        expect(result.find(LabelOverlay).prop('column')).toBe(col);
        result.unmount();
    });

    test('not editable', () => {
        const col = new QueryColumn({ caption: 'test', readOnly: false, userEditable: true, shownInUpdateView: false });
        const result = mount(<div>{titleRenderer(col)}</div>);
        expect(result.find('.field__un-editable')).toHaveLength(1);
        expect(result.find('.field__un-editable').text()).toBe('test');
        expect(result.find(LabelOverlay)).toHaveLength(0);
        result.unmount();
    });
});

describe('resolveDetailEditRenderer', () => {
    function validate(wrapper: ReactWrapper, count: Record<string, number>): void {
        expect(wrapper.find('.field__un-editable')).toHaveLength(count['uneditable'] ?? 0);
        expect(wrapper.find(AliasInput)).toHaveLength(count['aliasinput'] ?? 0);
        expect(wrapper.find(QuerySelect)).toHaveLength(count['queryselect'] ?? 0);
        expect(wrapper.find(Textarea)).toHaveLength(count['textarea'] ?? 0);
        expect(wrapper.find(Checkbox)).toHaveLength(count['checkbox'] ?? 0);
        expect(wrapper.find(DatePickerInput)).toHaveLength(count['datepickerinput'] ?? 0);
        expect(wrapper.find(QueryDateInput)).toHaveLength(count['dateinput'] ?? 0);
        expect(wrapper.find(FileInput)).toHaveLength(count['fileinput'] ?? 0);
        expect(wrapper.find(Input)).toHaveLength(count['input'] ?? 0);
    }

    const default_props = {
        name: 'test',
        fieldKey: 'test',
        caption: 'test',
        readOnly: false,
        userEditable: true,
        shownInUpdateView: true,
    };

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

    test('default input', () => {
        const col = new QueryColumn({ ...default_props });
        const wrapper = mount(<Formsy>{resolveDetailEditRenderer(col)(Map())}</Formsy>);
        validate(wrapper, { input: 1 });
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

    test('bogus renderer', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: 'BogusRenderer' }))).toBeUndefined();
    });

    test('without detailRenderer prop', () => {
        expect(resolveDetailRenderer(new QueryColumn({ detailRenderer: undefined }))).toBeUndefined();
    });
});
