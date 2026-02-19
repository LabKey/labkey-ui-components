import React, { act } from 'react';
import { List } from 'immutable';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { DomainDesign, DomainPanelStatus } from '../models';

import { ProductFeature } from '../../../app/constants';

import { AssayPropertiesPanel } from './AssayPropertiesPanel';
import { AssayProtocolModel } from './models';

const SERVER_CONTEXT = {
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
    test('default properties', async () => {
        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel {...BASE_PROPS} model={EMPTY_MODEL} onChange={jest.fn()}/>
            );
        });

        expect(document.querySelector('#assay-design-name')).toBeInTheDocument();
        expect(document.querySelector('#assay-design-description')).toBeInTheDocument();

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(4);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Import Settings');
        expect(sectionLabel[3].textContent).toEqual('Plate Settings');
    });

    test('asPanel, helpTopic, and hideAdvancedProperties', async () => {
        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel
                    {...BASE_PROPS}
                    model={EMPTY_MODEL}
                    hideAdvancedProperties
                    helpTopic="customHelpTopic"
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.querySelector('#assay-design-name')).toBeInTheDocument();
        expect(document.querySelector('#assay-design-description')).toBeInTheDocument();

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(3);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Plate Settings');

        // Help link
        const help = document.querySelector('div.panel-body a');
        expect(help.textContent).toBe('Learn more about designing assays');
        expect(help.getAttribute('href')).toBe(
            'https://www.labkey.org/Documentation/wiki-page.view?referrer=inPage&name=customHelpTopic'
        );
    });

    test('without helpTopic', async () => {
        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel
                    {...BASE_PROPS}
                    model={EMPTY_MODEL}
                    helpTopic={null}
                    hideAdvancedProperties
                    onChange={jest.fn()}
                />
            );
        });

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(3);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Plate Settings');

        expect(document.querySelector('div.panel-body a')).toBeNull();
    });

    test('with initial model', async () => {
        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel
                    {...BASE_PROPS}
                    model={AssayProtocolModel.create({
                        protocolId: 1,
                        name: 'name should not be editable',
                        description: 'test description for this assay',
                        editableRuns: true,
                        editableResults: true,
                    })}
                    onChange={jest.fn()}
                />
            );
        });

        const readOnlyName = document.querySelectorAll('#assay-design-name');
        expect(readOnlyName).toHaveLength(1);
        expect(readOnlyName[0].hasAttribute('disabled')).toBeTruthy();
        expect(readOnlyName[0].getAttribute('value')).toEqual('name should not be editable');

        expect(document.querySelectorAll('input#assay-design-editableRuns')).toHaveLength(1);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(4);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Import Settings');
        expect(sectionLabel[3].textContent).toEqual('Plate Settings');
    });

    test('visible properties based on empty AssayProtocolModel', async () => {
        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel {...BASE_PROPS} model={EMPTY_MODEL} onChange={jest.fn()} />,
                { serverContext: SERVER_CONTEXT }
            );
        });

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(5);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Import Settings');
        expect(sectionLabel[3].textContent).toEqual('Plate Settings');
        expect(sectionLabel[4].textContent).toEqual('Link to Study Settings');
    });

    test('visible properties based on populated AssayProtocolModel', async () => {
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

        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel {...BASE_PROPS} model={model} onChange={jest.fn()} />,
                { serverContext: SERVER_CONTEXT }
            );
        });

        expect(document.querySelectorAll('input#assay-design-qcEnabled')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableRuns')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableResults')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedDetectionMethod')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedMetadataInputFormat')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-backgroundUpload')).toHaveLength(1);

        const transformScripts = document.querySelectorAll('div.module-transform-script');
        expect(transformScripts).toHaveLength(1);
        expect(transformScripts[0].textContent).toContain('validation.pl');

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(5);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Import Settings');
        expect(sectionLabel[3].textContent).toEqual('Plate Settings');
        expect(sectionLabel[4].textContent).toEqual('Link to Study Settings');
    });

    test('visible properties for hideAdvancedProperties based on populated AssayProtocolModel', async () => {
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

        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel
                    {...BASE_PROPS}
                    model={model}
                    onChange={jest.fn()}
                    hideAdvancedProperties
                />,
                { serverContext: SERVER_CONTEXT }
            );
        });

        expect(document.querySelectorAll('input#assay-design-editableRuns')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableResults')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedDetectionMethod')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedMetadataInputFormat')).toHaveLength(1);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(3);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Plate Settings');
    });

    test('visible properties for appPropertiesOnly based on populated AssayProtocolModel', async () => {
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

        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel {...BASE_PROPS} model={model} onChange={jest.fn()} appPropertiesOnly />,
                { serverContext: SERVER_CONTEXT }
            );
        });

        expect(document.querySelectorAll('input#assay-design-qcEnabled')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableRuns')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableResults')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedDetectionMethod')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedMetadataInputFormat')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-backgroundUpload')).toHaveLength(1);

        const transformScripts = document.querySelectorAll('div.module-transform-script');
        expect(transformScripts).toHaveLength(1);
        expect(transformScripts[0].textContent).toContain('validation.pl');

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(4);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
        expect(sectionLabel[2].textContent).toEqual('Import Settings');
        expect(sectionLabel[3].textContent).toEqual('Link to Study Settings');
    });

    test('visible properties for hideAdvancedProperties and appPropertiesOnly', async () => {
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

        await act(async () => {
            renderWithAppContext(
                <AssayPropertiesPanel
                    {...BASE_PROPS}
                    model={model}
                    onChange={jest.fn()}
                    hideAdvancedProperties
                    appPropertiesOnly
                />,
                { serverContext: SERVER_CONTEXT }
            );
        });
        //screen.logTestingPlaygroundURL();

        expect(document.querySelectorAll('input#assay-design-editableRuns')).toHaveLength(1);
        expect(document.querySelectorAll('input#assay-design-editableResults')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedDetectionMethod')).toHaveLength(1);
        expect(document.querySelectorAll('select#assay-design-selectedMetadataInputFormat')).toHaveLength(1);

        const transformScripts = document.querySelectorAll('div.module-transform-script');
        expect(transformScripts).toHaveLength(0);

        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(2);
        expect(sectionLabel[0].textContent).toEqual('Basic Properties');
        expect(sectionLabel[1].textContent).toEqual('Editing Settings');
    });
});
