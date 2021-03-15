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

import { sleep } from '../../../testHelpers';
import { initUnitTestMocks } from '../../../testHelperMocks';
import { ENTITY_FORM_IDS } from '../entities/constants';
import { DomainDesign, DomainDetails, DomainPanelStatus } from '../models';

import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { SampleTypeModel } from './models';

const BASE_PROPS = {
    panelStatus: 'NONE' as DomainPanelStatus,
    validate: false,
    useTheme: false,
    controlledCollapse: false,
    initCollapsed: false,
    collapsed: false,
};

beforeAll(() => {
    initUnitTestMocks();
});

const baseData = DomainDetails.create(
    fromJS({ domainDesign: DomainDesign.create({ allowTimepointProperties: false }) })
);
const sampleTypeModel = SampleTypeModel.create(baseData);

describe('<SampleTypePropertiesPanel/>', () => {
    test('default props', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={sampleTypeModel}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('appPropertiesOnly', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                appPropertiesOnly={true}
                model={sampleTypeModel}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('nameExpressionInfoUrl', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={sampleTypeModel}
                updateModel={jest.fn}
                nameExpressionInfoUrl="#anything"
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        await sleep();

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
                domainDesign: DomainDesign.create({ allowTimepointProperties: false }),
            })
        );

        const component = (
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={SampleTypeModel.create(data)}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        const wrapper = mount(component);

        // Name input should be visible but disabled
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME)).toHaveLength(1);
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME).prop('disabled')).toBeTruthy();

        // Check initial input values
        expect(wrapper.find('input#' + ENTITY_FORM_IDS.NAME_EXPRESSION).props().value).toBe(nameExpVal);
        expect(wrapper.find('textarea#' + ENTITY_FORM_IDS.DESCRIPTION).props().value).toBe(descVal);

        // Add parent alias button should be visible
        expect(wrapper.find('.container--addition-icon')).toHaveLength(1);

        wrapper.unmount();
    });

    test('include dataclass and use custom labels', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                model={sampleTypeModel}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[{ schema: 'exp.data' }]}
                includeDataClasses={true}
                useSeparateDataClassesAliasMenu={true}
                sampleAliasCaption="Parent Alias"
                sampleTypeCaption="sample type"
                dataClassAliasCaption="Source Alias"
                dataClassTypeCaption="source type"
                dataClassParentageLabel="source"
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('includeMetricUnitProperty', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                appPropertiesOnly={true}
                metricUnitProps={{ includeMetricUnitProperty: true }}
                model={sampleTypeModel}
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('metricUnitOptions', async () => {
        const tree = renderer.create(
            <SampleTypePropertiesPanel
                {...BASE_PROPS}
                appPropertiesOnly={true}
                metricUnitProps={{
                    includeMetricUnitProperty: true,
                    metricUnitLabel: 'Display stored amount in',
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
                updateModel={jest.fn}
                onAddParentAlias={jest.fn}
                onRemoveParentAlias={jest.fn}
                onParentAliasChange={jest.fn}
                parentOptions={[]}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });
});
