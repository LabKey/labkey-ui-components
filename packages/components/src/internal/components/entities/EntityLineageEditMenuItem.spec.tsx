import React from 'react'
import { mount } from 'enzyme';
import { EntityLineageEditMenuItem } from './EntityLineageEditMenuItem';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { MenuItem } from 'react-bootstrap';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

describe("EntityLineageEditMenuItem", () => {
    const cellParentType = {...DataClassDataType, nounPlural: "Cells", nounSingular:" Cell"};

   test("no query model", () => {
       const wrapper = mount(
           <EntityLineageEditMenuItem
               queryModel={undefined}
               childEntityDataType={SampleTypeDataType}
               parentEntityDataTypes={[cellParentType]}
            />
       );
       expect(wrapper.find(SelectionMenuItem)).toHaveLength(0);
       expect(wrapper.find(MenuItem)).toHaveLength(1);
       expect(wrapper.find(MenuItem).text()).toBe("Edit Cells for Selected Samples in Bulk")
   });

    test("multiple selections", () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create("test", "q"));
        queryModel.mutate({selections: new Set<string>(["1", "2"])})
        const wrapper = mount(
            <EntityLineageEditMenuItem
                childEntityDataType={SampleTypeDataType}
                parentEntityDataTypes={[cellParentType]}
                queryModel={queryModel}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe("Edit Cells for Selected Samples in Bulk");
    });

    test("single selection", () => {
        let queryModel = makeTestQueryModel(SchemaQuery.create("test", "q"));
        queryModel = queryModel.mutate({selections: new Set<string>(["1"])})
        const wrapper = mount(
            <EntityLineageEditMenuItem
                childEntityDataType={SampleTypeDataType}
                parentEntityDataTypes={[cellParentType]}
                queryModel={queryModel}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe("Edit Cells for Selected Sample in Bulk");
    });

});
