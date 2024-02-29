import React from 'react';
import { List } from 'immutable';

import { DomainDesign, DomainPanelStatus } from '../models';

import { mountWithServerContext } from '../../../test/enzymeTestHelpers';

import { ProductFeature } from '../../../app/constants';

import { AssayPropertiesPanel } from './AssayPropertiesPanel';
import { AssayProtocolModel } from './models';

import {
    AutoLinkDataInput,
    AutoLinkCategoryInput,
    BackgroundUploadInput,
    DescriptionInput,
    DetectionMethodsInput,
    EditableResultsInput,
    EditableRunsInput,
    MetadataInputFormatsInput,
    ModuleProvidedScriptsInput,
    NameInput,
    PlateMetadataInput,
    PlateTemplatesInput,
    QCStatesInput,
    SaveScriptDataInput,
    TransformScriptsInput,
} from './AssayPropertiesInput';

const SERVER_CONTEXT = {
    // isAssayQCEnabled(moduleContext) === true
    moduleContext: {
        api: { moduleNames: ['assay', 'premium', 'study'] },
        core: { productFeatures: [ProductFeature.Assay, ProductFeature.AssayQC] },
    },
};

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

const EMPTY_MODEL = AssayProtocolModel.create({
    providerName: 'General',
    domains: List([
        DomainDesign.create({ name: 'Batch Fields' }),
        DomainDesign.create({ name: 'Run Fields' }),
        DomainDesign.create({ name: 'Data Fields' }),
    ]),
});

describe('AssayPropertiesPanel', () => {
    test('default properties', () => {
        const form = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={EMPTY_MODEL} onChange={jest.fn} />
        );

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('asPanel, helpTopic, and hideAdvancedProperties', () => {
        const form = mountWithServerContext(
            <AssayPropertiesPanel
                {...BASE_PROPS}
                model={EMPTY_MODEL}
                asPanel={false}
                hideAdvancedProperties
                helpTopic="defineAssaySchema"
                onChange={jest.fn}
            />
        );

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('without helpTopic', () => {
        const form = mountWithServerContext(
            <AssayPropertiesPanel
                {...BASE_PROPS}
                model={EMPTY_MODEL}
                helpTopic={null}
                hideAdvancedProperties
                onChange={jest.fn}
            />
        );

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('panelCls, initCollapsed, and markComplete', () => {
        const form = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={EMPTY_MODEL} initCollapsed onChange={jest.fn} />
        );

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('with initial model', () => {
        const form = mountWithServerContext(
            <AssayPropertiesPanel
                {...BASE_PROPS}
                model={AssayProtocolModel.create({
                    protocolId: 1,
                    name: 'name should not be editable',
                    description: 'test description for this assay',
                    editableRuns: true,
                    editableResults: true,
                })}
                onChange={jest.fn}
            />
        );

        expect(form).toMatchSnapshot();
        form.unmount();
    });

    test('visible properties based on empty AssayProtocolModel', () => {
        const wrapper = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={EMPTY_MODEL} onChange={jest.fn} />,
            SERVER_CONTEXT
        );

        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find(QCStatesInput)).toHaveLength(0);
        expect(wrapper.find(PlateMetadataInput)).toHaveLength(0);
        expect(wrapper.find(PlateTemplatesInput)).toHaveLength(0);
        expect(wrapper.find(DetectionMethodsInput)).toHaveLength(0);
        expect(wrapper.find(MetadataInputFormatsInput)).toHaveLength(0);
        expect(wrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(wrapper.find(EditableResultsInput)).toHaveLength(0);
        expect(wrapper.find(BackgroundUploadInput)).toHaveLength(0);
        expect(wrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(wrapper.find(SaveScriptDataInput)).toHaveLength(0);
        expect(wrapper.find(ModuleProvidedScriptsInput)).toHaveLength(0);
        expect(wrapper.find(AutoLinkDataInput)).toHaveLength(1);
        expect(wrapper.find(AutoLinkCategoryInput)).toHaveLength(1);
        wrapper.unmount();
    });

    test('visible properties based on populated AssayProtocolModel', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowPlateMetadata: true,
            allowQCStates: true,
            allowTransformationScript: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: { test1: 'abc' },
            availablePlateTemplates: ['d', 'e', 'f'],
            moduleTransformScripts: ['validation.pl'],
        });

        const wrapper = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={model} onChange={jest.fn} />,
            SERVER_CONTEXT
        );

        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find(PlateMetadataInput)).toHaveLength(1);
        expect(wrapper.find(QCStatesInput)).toHaveLength(1);
        expect(wrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(wrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(wrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(wrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(wrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(wrapper.find(BackgroundUploadInput)).toHaveLength(1);
        expect(wrapper.find(TransformScriptsInput)).toHaveLength(1);
        expect(wrapper.find(SaveScriptDataInput)).toHaveLength(1);
        expect(wrapper.find(ModuleProvidedScriptsInput)).toHaveLength(1);
        expect(wrapper.find(AutoLinkDataInput)).toHaveLength(1);
        expect(wrapper.find(AutoLinkCategoryInput)).toHaveLength(1);
        wrapper.unmount();
    });

    test('visible properties for hideAdvancedProperties based on populated AssayProtocolModel', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowPlateMetadata: true,
            allowQCStates: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: { test1: 'abc' },
            availablePlateTemplates: ['d', 'e', 'f'],
            moduleTransformScripts: ['validation.pl'],
        });

        const wrapper = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={model} onChange={jest.fn} hideAdvancedProperties />,
            SERVER_CONTEXT
        );
        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find(PlateMetadataInput)).toHaveLength(1);
        expect(wrapper.find(QCStatesInput)).toHaveLength(0);
        expect(wrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(wrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(wrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(wrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(wrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(wrapper.find(BackgroundUploadInput)).toHaveLength(0);
        expect(wrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(wrapper.find(SaveScriptDataInput)).toHaveLength(0);
        expect(wrapper.find(ModuleProvidedScriptsInput)).toHaveLength(0);
        expect(wrapper.find(AutoLinkDataInput)).toHaveLength(0);
        expect(wrapper.find(AutoLinkCategoryInput)).toHaveLength(0);
        wrapper.unmount();
    });

    test('visible properties for appPropertiesOnly based on populated AssayProtocolModel', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowPlateMetadata: true,
            allowQCStates: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: { test1: 'abc' },
            availablePlateTemplates: ['d', 'e', 'f'],
            moduleTransformScripts: ['validation.pl'],
        });

        const wrapper = mountWithServerContext(
            <AssayPropertiesPanel {...BASE_PROPS} model={model} onChange={jest.fn} appPropertiesOnly />,
            SERVER_CONTEXT
        );
        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find(PlateMetadataInput)).toHaveLength(0);
        expect(wrapper.find(QCStatesInput)).toHaveLength(1);
        expect(wrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(wrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(wrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(wrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(wrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(wrapper.find(BackgroundUploadInput)).toHaveLength(1);
        expect(wrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(wrapper.find(SaveScriptDataInput)).toHaveLength(0);
        expect(wrapper.find(ModuleProvidedScriptsInput)).toHaveLength(1);
        expect(wrapper.find(AutoLinkDataInput)).toHaveLength(1);
        expect(wrapper.find(AutoLinkCategoryInput)).toHaveLength(1);
        wrapper.unmount();
    });

    test('visible properties for hideAdvancedProperties and appPropertiesOnly', () => {
        const model = AssayProtocolModel.create({
            allowBackgroundUpload: true,
            allowEditableResults: true,
            allowPlateMetadata: true,
            allowQCStates: true,
            availableDetectionMethods: ['a', 'b', 'c'],
            availableMetadataInputFormats: { test1: 'abc' },
            availablePlateTemplates: ['d', 'e', 'f'],
            moduleTransformScripts: ['validation.pl'],
        });

        const wrapper = mountWithServerContext(
            <AssayPropertiesPanel
                {...BASE_PROPS}
                model={model}
                onChange={jest.fn}
                hideAdvancedProperties
                appPropertiesOnly
            />,
            SERVER_CONTEXT
        );
        expect(wrapper.find(NameInput)).toHaveLength(1);
        expect(wrapper.find(DescriptionInput)).toHaveLength(1);
        expect(wrapper.find(PlateMetadataInput)).toHaveLength(0);
        expect(wrapper.find(QCStatesInput)).toHaveLength(0);
        expect(wrapper.find(PlateTemplatesInput)).toHaveLength(1);
        expect(wrapper.find(DetectionMethodsInput)).toHaveLength(1);
        expect(wrapper.find(MetadataInputFormatsInput)).toHaveLength(1);
        expect(wrapper.find(EditableRunsInput)).toHaveLength(1);
        expect(wrapper.find(EditableResultsInput)).toHaveLength(1);
        expect(wrapper.find(BackgroundUploadInput)).toHaveLength(0);
        expect(wrapper.find(TransformScriptsInput)).toHaveLength(0);
        expect(wrapper.find(SaveScriptDataInput)).toHaveLength(0);
        expect(wrapper.find(ModuleProvidedScriptsInput)).toHaveLength(0);
        expect(wrapper.find(AutoLinkDataInput)).toHaveLength(0);
        expect(wrapper.find(AutoLinkCategoryInput)).toHaveLength(0);
        wrapper.unmount();
    });
});
