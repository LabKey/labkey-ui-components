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
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';
import { fromJS, Map } from 'immutable';

import { ENTITY_FORM_IDS } from '../entities/constants';
import { DomainDetails, DomainPanelStatus } from '../models';

import { sleep } from '../../../test/testHelpers';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeModel } from './models';
import { UniqueIdBanner } from './UniqueIdBanner';
import { getTestAPIWrapper } from '../../../APIWrapper';

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

    test('default props', () => {
        const tree = renderer.create(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);

        expect(tree).toMatchSnapshot();
    });

    test('appPropertiesOnly', () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel {...BASE_PROPS} appPropertiesOnly model={sampleTypeModel} />
        );

        expect(tree).toMatchSnapshot();
    });

    test('nameExpressionInfoUrl', () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} nameExpressionInfoUrl="#anything" />
        );

        expect(tree).toMatchSnapshot();
    });

    test('Load existing SampleTypeModel', () => {
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

        const component = <SampleTypePropertiesPanel {...BASE_PROPS} model={SampleTypeModel.create(data)} />;

        const wrapper = mount(component);

        // Name input should not be disabled
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(1);
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME).prop('disabled')).toBeFalsy();

        // Check initial input values
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).props().value).toBe(nameExpVal);
        expect(wrapper.find('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).props().value).toBe(descVal);

        // Add parent alias button should be visible
        expect(wrapper.find('.container--addition-icon')).toHaveLength(1);

        // Link to Study fields should not be visible since allowTimepointProperties: false
        expect(wrapper.text()).not.toContain('Auto-Link Data to Study');
        expect(wrapper.text()).not.toContain('Linked Dataset Category');

        expect(wrapper.find(DomainFieldLabel)).toHaveLength(3);

        wrapper.unmount();
    });

    test('Load SampleTypeModel with readonly name', () => {
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

        const component = <SampleTypePropertiesPanel {...BASE_PROPS} model={SampleTypeModel.create(data)} />;

        const wrapper = mount(component);

        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(1);
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME).prop('disabled')).toBeTruthy();

        wrapper.unmount();
    });

    test('include dataclass and use custom labels', () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={sampleTypeModel}
                parentOptions={[{ schema: 'exp.data' }]}
                includeDataClasses
                useSeparateDataClassesAliasMenu
                sampleAliasCaption="Parent Alias"
                sampleTypeCaption="sample type"
                dataClassAliasCaption="Source Alias"
                dataClassTypeCaption="source type"
                dataClassParentageLabel="source"
            />
        );

        expect(tree).toMatchSnapshot();
    });

    test('includeMetricUnitProperty', () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                appPropertiesOnly
                metricUnitProps={{ includeMetricUnitProperty: true }}
                model={sampleTypeModel}
            />
        );

        expect(tree).toMatchSnapshot();
    });

    test('metricUnitOptions', () => {
        const tree = renderer.create(
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

        expect(tree).toMatchSnapshot();
    });

    test('Auto-Link Data to Study', async () => {
        const sampleTypeModelWithTimepoint = SampleTypeModel.create({
            domainDesign: fromJS({ allowTimepointProperties: true }),
        } as DomainDetails);
        const wrapper = mount(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                showLinkToStudy
                appPropertiesOnly={false}
                model={sampleTypeModelWithTimepoint}
            />
        );

        // Currently appears only when 'allowTimepointProperties' is true and 'showLinkToStudy' is true
        expect(wrapper.text()).toContain('Auto-Link Data to Study');
        expect(wrapper.text()).toContain('Linked Dataset Category');

        wrapper.setProps({ showLinkToStudy: false });
        expect(wrapper.text()).not.toContain('Auto-Link Data to Study');
        expect(wrapper.text()).not.toContain('Linked Dataset Category');

        wrapper.unmount();
    });

    test('community edition, no barcodes', async () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['api', 'core'],
            },
        };
        const wrapper = mount(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);

        await sleep();

        expect(wrapper.find(UniqueIdBanner)).toHaveLength(0);
        wrapper.unmount();
    });

    test('premium edition with barcodes', async () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['premium'],
            },
        };
        const wrapper = mount(<SampleTypePropertiesPanel {...BASE_PROPS} model={sampleTypeModel} />);

        await sleep();

        expect(wrapper.find(UniqueIdBanner)).toHaveLength(1);
        wrapper.unmount();
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

        const wrapper = mount(
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

        expect(wrapper.find(DomainFieldLabel)).toHaveLength(5);
        const aliquotField = wrapper.find(DomainFieldLabel).at(3);
        expect(aliquotField.text()).toEqual('Aliquot Naming Pattern');
        wrapper.unmount();
    });
});
