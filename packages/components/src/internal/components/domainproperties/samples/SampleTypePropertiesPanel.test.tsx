/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { act } from '@testing-library/react';

import { fromJS, Map } from 'immutable';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { ENTITY_FORM_IDS } from '../entities/constants';
import { DomainDetails, DomainPanelStatus } from '../models';

import { getTestAPIWrapper } from '../../../APIWrapper';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeModel } from './models';

describe('SampleTypePropertiesPanel', () => {
    const BASE_PROPS = {
        api: getTestAPIWrapper(jest.fn),
        panelStatus: 'NONE' as DomainPanelStatus,
        validate: false,
        controlledCollapse: false,
        initCollapsed: false,
        collapsed: false,
        updateModel: jest.fn(),
        onAddParentAlias: jest.fn(),
        onRemoveParentAlias: jest.fn(),
        onParentAliasChange: jest.fn(),
        onAddUniqueIdField: jest.fn(),
        parentOptions: [],
    };

    const sampleTypeModel = SampleTypeModel.create({
        domainDesign: fromJS({ allowTimepointProperties: false }),
    } as DomainDetails);

    test('default props', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);
        });
        expect(container).toMatchSnapshot();
    });

    test('appPropertiesOnly', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <SampleTypePropertiesPanel {...BASE_PROPS} appPropertiesOnly model={sampleTypeModel} />
            );
        });
        expect(container).toMatchSnapshot();
    });

    test('Load existing SampleTypeModel', async () => {
        const nameExpVal = 'S-${genId}';
        const descVal = 'My sample type description.';
        const data = DomainDetails.create(
            fromJS({
                options: Map<string, any>({
                    rowId: 1,
                    nameExpression: nameExpVal,
                    description: descVal,
                }),
                domainKindName: 'SampleType',
                domainDesign: sampleTypeModel.get('domain'),
            })
        );

        await act(async () => {
            renderWithAppContext(<SampleTypePropertiesPanel {...BASE_PROPS} model={SampleTypeModel.create(data)} />);
        });

        // Name input should not be disabled
        expect(document.querySelector('input#' + ENTITY_FORM_IDS.NAME).getAttribute('disabled')).toBeNull();

        // Check initial input values
        expect(document.querySelector('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).getAttribute('value')).toBe(
            nameExpVal
        );
        expect(document.querySelector('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).textContent).toBe(descVal);

        // Add parent alias button should be visible
        expect(document.getElementsByClassName('container--addition-icon')).toHaveLength(1);

        // Link to Study fields should not be visible since allowTimepointProperties: false
        expect(document.querySelector('.domain-form-panel').textContent).not.toContain('Auto-Link Data to Study');
        expect(document.querySelector('.domain-form-panel').textContent).not.toContain('Linked Dataset Category');

        expect(document.getElementsByClassName('domain-no-wrap')).toHaveLength(3);
    });

    test('Load SampleTypeModel with readonly name', async () => {
        const data = DomainDetails.create(
            fromJS({
                options: Map<string, any>({
                    rowId: 1,
                }),
                domainKindName: 'SampleType',
                domainDesign: sampleTypeModel.get('domain'),
                nameReadOnly: true,
            })
        );

        await act(async () => {
            renderWithAppContext(<SampleTypePropertiesPanel {...BASE_PROPS} model={SampleTypeModel.create(data)} />);
        });

        // Name input should be disabled
        expect(document.querySelector('input#' + ENTITY_FORM_IDS.NAME).getAttribute('disabled')).toBe('');
    });

    test('include dataclass and use custom labels', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    model={sampleTypeModel}
                    parentOptions={[{ schema: 'exp.data' }]}
                    includeDataClasses
                    useSeparateDataClassesAliasMenu
                    sampleAliasCaption="Parent"
                    sampleTypeCaption="sample type"
                    dataClassAliasCaption="Source"
                    dataClassTypeCaption="source type"
                    dataClassParentageLabel="source"
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

    test('includeMetricUnitProperty', async () => {
        await act(async () => {
            renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    appPropertiesOnly
                    metricUnitProps={{ includeMetricUnitProperty: true }}
                    model={sampleTypeModel}
                />
            );
        });

        expect(document.getElementsByName('metricUnit')).toHaveLength(1);
    });

    test('metricUnitOptions', async () => {
        await act(async () => {
            renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    appPropertiesOnly
                    metricUnitProps={{
                        includeMetricUnitProperty: true,
                        metricUnitLabel: 'Stored Amount Display Unit',
                        metricUnitRequired: true,
                        metricUnitHelpMsg: 'Sample storage volume will be displayed using the selected metric unit.',
                        metricUnitOptions: [
                            { id: 'mL', label: 'ml' },
                            { id: 'L', label: 'L' },
                            { id: 'ug', label: 'ug' },
                            { id: 'g', label: 'g' },
                        ],
                    }}
                    model={sampleTypeModel}
                />
            );
        });

        expect(document.getElementsByClassName('sampleset-metric-unit-select-container')).toHaveLength(1);
    });

    test('showLinkToStudy', async () => {
        const sampleTypeModelWithTimepoint = SampleTypeModel.create({
            domainDesign: fromJS({ allowTimepointProperties: true }),
        } as DomainDetails);

        await act(async () => {
            renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    showLinkToStudy
                    appPropertiesOnly={false}
                    model={sampleTypeModelWithTimepoint}
                />
            );
        });

        // Currently appears only when 'allowTimepointProperties' is true and 'showLinkToStudy' is true
        expect(document.querySelector('.domain-form-panel').textContent).toContain('Auto-Link Data to Study');
        expect(document.querySelector('.domain-form-panel').textContent).toContain('Linked Dataset Category');
    });

    test('showLinkToStudy false', async () => {
        const sampleTypeModelWithTimepoint = SampleTypeModel.create({
            domainDesign: fromJS({ allowTimepointProperties: true }),
        } as DomainDetails);

        await act(async () => {
            renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    showLinkToStudy={false}
                    appPropertiesOnly={false}
                    model={sampleTypeModelWithTimepoint}
                />
            );
        });

        expect(document.querySelector('.domain-form-panel').textContent).not.toContain('Auto-Link Data to Study');
        expect(document.querySelector('.domain-form-panel').textContent).not.toContain('Linked Dataset Category');
    });

    test('community edition, no barcodes', async () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['api', 'core'],
            },
        };
        await act(async () => {
            renderWithAppContext(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);
        });

        expect(document.getElementsByClassName('uniqueid-alert').length).toBe(0);
        expect(document.getElementsByClassName('uniqueid-msg').length).toBe(0);
    });

    test('premium edition with barcodes', async () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['premium'],
            },
        };
        await act(async () => {
            renderWithAppContext(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);
        });

        expect(document.getElementsByClassName('uniqueid-msg').length).toBe(1);
    });

    test('with aliquot preview name', async () => {
        const data = DomainDetails.create(
            fromJS({
                options: Map<string, any>({
                    rowId: 1,
                    aliquotNameExpression: 'S-${${AliquotedFrom.:withCounter}}',
                }),
                domainKindName: 'SampleType',
                domainDesign: sampleTypeModel.get('domain'),
            })
        );

        await act(async () => {
            renderWithAppContext(
                <SampleTypePropertiesPanel
                    {...BASE_PROPS}
                    model={SampleTypeModel.create(data)}
                    appPropertiesOnly={false}
                    aliquotNamePatternProps={{
                        showAliquotNameExpression: true,
                    }}
                    namePreviews={[null, 'S-parentSample-1']}
                />
            );
        });

        const fields = document.getElementsByClassName('row margin-bottom');
        expect(fields).toHaveLength(5);
        const aliquotField = fields[4];
        expect(aliquotField.textContent).toEqual('Aliquot Naming Pattern');
    });
});
