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
import { Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { text, boolean, withKnobs } from '@storybook/addon-knobs';
import { Domain } from '@labkey/api';

import { DomainDetails, SampleTypeDesigner } from '..';

import domainData from '../test/data/property-getDomain-sampleType.json';

function isValidParentOption(row: any, isDataClass: boolean): boolean {
    if (!isDataClass) return true;

    return row.getIn(['Category', 'value']) === 'sources';
}

storiesOf('SampleTypeDesigner', module)
    .addDecorator(withKnobs)
    .add('for create', () => {
        return (
            <SampleTypeDesigner
                appPropertiesOnly={boolean('appPropertiesOnly', true)}
                includeDataClasses={boolean('includeDataClasses', true)}
                useSeparateDataClassesAliasMenu={boolean('useSeparateDataClasses', true)}
                isValidParentOptionFn={isValidParentOption}
                sampleAliasCaption={text('sampleAliasCaption', undefined)}
                sampleTypeCaption={text('sampleTypeCaption', undefined)}
                dataClassAliasCaption={text('dataClassAliasCaption', undefined)}
                dataClassTypeCaption={text('dataClassTypeCaption', undefined)}
                dataClassParentageLabel={text('dataClassParentageLabel', undefined)}
                initModel={DomainDetails.create(
                    Map<string, any>({ domainDesign: { allowTimepointProperties: true } })
                )}
                onCancel={() => console.log('Cancel clicked')}
                onComplete={() => console.log('Create clicked')}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
                nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
                helpTopic={text('helpTopic', undefined)}
                metricUnitProps={{
                    includeMetricUnitProperty: boolean('includeMetricUnitProperty', true),
                    metricUnitLabel: text('metricUnitLabel', 'Display stored amount in'),
                    metricUnitRequired: boolean('metricUnitRequired', true),
                    metricUnitHelpMsg: text(
                        'metricUnitHelpMsg',
                        'Sample storage volume will be displayed using the selected metric unit.'
                    ),
                    metricUnitOptions: boolean('metricUnitOptions', true)
                        ? [
                              { id: 'mL', label: 'ml' },
                              { id: 'L', label: 'L' },
                              { id: 'ug', label: 'ug' },
                              { id: 'g', label: 'g' },
                          ]
                        : undefined,
                }}
            />
        );
    })
    .add('create with read-only name', () => {
        return (
            <SampleTypeDesigner
                initModel={DomainDetails.create(
                    Map<string, any>({
                        domainDesign: { name: "Can't Touch Me", allowTimepointProperties: true },
                        nameReadOnly: true,
                    })
                )}
                onCancel={() => console.log('Cancel clicked')}
                onComplete={() => console.log('Create clicked')}
                appPropertiesOnly={boolean('appPropertiesOnly', false)}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', 'https://wwDodomw.labkey.org')}
                nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
                helpTopic={text('helpTopic', undefined)}
            />
        );
    })
    .add('for update', () => {
        const design = DomainDetails.create(Map(domainData), Domain.KINDS.SAMPLE_TYPE);

        return (
            <SampleTypeDesigner
                initModel={design}
                onCancel={() => console.log('Cancel clicked')}
                onComplete={() => console.log('Create clicked')}
                appPropertiesOnly={boolean('appPropertiesOnly', false)}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
                nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
                headerText="Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data."
                helpTopic={text('helpTopic', undefined)}
            />
        );
    })
    .add('for update with sources', () => {
        const design = DomainDetails.create(Map(domainData), Domain.KINDS.SAMPLE_TYPE);

        return (
            <SampleTypeDesigner
                initModel={design}
                appPropertiesOnly={boolean('appPropertiesOnly', true)}
                includeDataClasses={boolean('includeDataClasses', true)}
                useSeparateDataClassesAliasMenu={boolean('useSeparateDataClassesAliasMenu', true)}
                isValidParentOptionFn={isValidParentOption}
                sampleAliasCaption="Parent Alias"
                sampleTypeCaption="sample type"
                dataClassAliasCaption="Source Alias"
                dataClassTypeCaption="source type"
                dataClassParentageLabel="source"
                onCancel={() => console.log('Cancel clicked')}
                onComplete={() => console.log('Create clicked')}
                nameExpressionInfoUrl={text('nameExpressionInfoUrl', undefined)}
                nameExpressionPlaceholder={text('nameExpressionPlaceholder', undefined)}
                headerText="Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data."
                helpTopic={text('helpTopic', undefined)}
            />
        );
    });
