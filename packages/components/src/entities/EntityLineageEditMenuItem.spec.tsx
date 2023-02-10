import React from 'react';
import { mount } from 'enzyme';

import { MenuItem } from 'react-bootstrap';

import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { makeTestQueryModel } from '../public/QueryModel/testUtils';
import { SchemaQuery } from '../public/SchemaQuery';

import { DataClassDataType, SampleTypeDataType } from '../internal/components/entities/constants';
import { EntityLineageEditMenuItem } from './EntityLineageEditMenuItem';

describe('EntityLineageEditMenuItem', () => {
    const cellParentType = { ...DataClassDataType, nounPlural: 'Cells', nounSingular: ' Cell' };

    test('no query model', () => {
        const wrapper = mount(
            <EntityLineageEditMenuItem
                queryModel={undefined}
                childEntityDataType={SampleTypeDataType}
                parentEntityDataTypes={[cellParentType]}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(0);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe('Edit Cells');
        wrapper.unmount();
    });

    test('multiple selections', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'q'));
        queryModel.mutate({ selections: new Set<string>(['1', '2']) });
        const wrapper = mount(
            <EntityLineageEditMenuItem
                childEntityDataType={SampleTypeDataType}
                parentEntityDataTypes={[cellParentType]}
                queryModel={queryModel}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe('Edit Cells');
        wrapper.unmount();
    });

    test('single selection', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'q'));
        queryModel = queryModel.mutate({ selections: new Set<string>(['1']) });
        const wrapper = mount(
            <EntityLineageEditMenuItem
                childEntityDataType={SampleTypeDataType}
                parentEntityDataTypes={[cellParentType]}
                queryModel={queryModel}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe('Edit Cells');
        wrapper.unmount();
    });
});
