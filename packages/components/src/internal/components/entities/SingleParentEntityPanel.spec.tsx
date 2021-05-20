import { List } from 'immutable';

import React from 'react';

import { mount } from 'enzyme';

import { initUnitTestMocks } from '../../testHelperMocks';

import { GridPanel, SelectInput } from '../../..';

import { IEntityTypeOption } from './models';
import { DataClassDataType } from './constants';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<SingleParentEntityPanel>', () => {
    const parentTypeOptions = List<IEntityTypeOption>([
        {
            label: 'Second Source',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Second+Source',
            rowId: 322,
            value: 'second source',
            query: 'Second Source',
            schema: 'exp.data',
        },
        {
            label: 'Source 1',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Source+1',
            rowId: 321,
            value: 'source 1',
            query: 'Source 1',
            schema: 'exp.data',
        },
        {
            label: 'Vendor 3',
            lsid: 'urn:lsid:labkey.com:DataClass.Folder-252:Vendor+3',
            rowId: 323,
            value: 'vendor 3',
            query: 'Vendor 3',
            schema: 'exp.data',
        },
    ]);

    test('empty state not editing', () => {
        const wrapper = mount(
            <SingleParentEntityPanel
                childNounSingular="Sample"
                parentDataTypes={[DataClassDataType]}
                parentLSIDs={undefined}
                parentTypeOptions={parentTypeOptions}
                parentTypeQueryName={undefined}
                index={0}
                editing={false}
            />
        );
        expect(wrapper.find(SelectInput)).toHaveLength(0);
        expect(wrapper).toMatchSnapshot();
    });

    test('empty state editing', () => {
        const wrapper = mount(
            <SingleParentEntityPanel
                childNounSingular="Sample"
                parentDataTypes={[DataClassDataType]}
                parentLSIDs={undefined}
                parentTypeOptions={parentTypeOptions}
                parentTypeQueryName={undefined}
                index={0}
                editing={true}
            />
        );
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper).toMatchSnapshot();
    });

    test('with data not editing', () => {
        const wrapper = mount(
            <SingleParentEntityPanel
                childNounSingular="Sample"
                parentDataTypes={[{ ...DataClassDataType, appUrlPrefixParts: ['sources'] }]}
                parentTypeQueryName="Second Source"
                parentLSIDs={['url:lsid:blah']}
                parentTypeOptions={parentTypeOptions}
                index={0}
                editing={false}
                onRemoveParentType={() => {
                    console.log('No really removing anything.');
                }}
            />
        );
        expect(wrapper.find(GridPanel)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(0);
        expect(wrapper).toMatchSnapshot();
    });
});
