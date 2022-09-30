import React from 'react';

import { mount } from 'enzyme';

import { TEST_USER_EDITOR } from '../../userFixtures';
import { TestTypeDataType } from '../../../test/data/constants';
import { Section } from '../base/Section';

import { capitalizeFirstChar } from '../../util/utils';

import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { mountWithAppServerContext } from '../../testHelpers';

import { FilterCards } from './FilterCards';
import { SampleFinderHeaderButtons, SampleFinderSection } from './SampleFinderSection';

describe('SampleFinderSection', () => {
    LABKEY.moduleContext = {
        samplemanagement: {
            productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
        },
    };
    test('SampleFinderHeaderButtons', () => {
        const wrapper = mount(
            <SampleFinderHeaderButtons
                parentEntityDataTypes={[
                    TestTypeDataType,
                    {
                        ...TestTypeDataType,
                        typeListingSchemaQuery: SchemaQuery.create('TestClasses', 'query2'),
                        nounSingular: 'Other',
                        nounAsParentSingular: 'Other Parent',
                    },
                ]}
                onAddEntity={jest.fn}
                enabledEntityTypes={[TestTypeDataType.typeListingSchemaQuery.queryName, 'query2']}
            />
        );
        const buttons = wrapper.find('button');
        expect(buttons.length).toBe(2);
        expect(buttons.at(0).text()).toBe(
            ' ' + capitalizeFirstChar(TestTypeDataType.nounAsParentSingular) + ' Properties'
        );
        expect(buttons.at(0).prop('disabled')).toBe(false);
        expect(buttons.at(1).text()).toBe(' Other Parent Properties');
        expect(buttons.at(1).prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('SampleFinderHeaderButtons, nothing enabled', () => {
        const wrapper = mount(
            <SampleFinderHeaderButtons
                parentEntityDataTypes={[
                    TestTypeDataType,
                    {
                        ...TestTypeDataType,
                        typeListingSchemaQuery: SchemaQuery.create('TestClasses', 'query2'),
                        nounSingular: 'Other',
                        nounAsParentSingular: 'Other Parent',
                    },
                ]}
                onAddEntity={jest.fn}
                enabledEntityTypes={[]}
            />
        );
        const buttons = wrapper.find('button');
        expect(buttons.length).toBe(2);
        expect(buttons.at(0).text()).toBe(
            ' ' + capitalizeFirstChar(TestTypeDataType.nounAsParentSingular) + ' Properties'
        );
        expect(buttons.at(0).prop('disabled')).toBe(true);
        expect(buttons.at(1).text()).toBe(' Other Parent Properties');
        expect(buttons.at(1).prop('disabled')).toBe(true);
        wrapper.unmount();
    });
});
