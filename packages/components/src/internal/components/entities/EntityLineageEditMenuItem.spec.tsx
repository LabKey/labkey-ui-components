import React from 'react'
import { mount } from 'enzyme';
import { EntityLineageEditMenuItem } from './EntityLineageEditMenuItem';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { MenuItem } from 'react-bootstrap';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

describe("EntityLineageEditMenuItem", () => {
   test("no query model", () => {
       const wrapper = mount(
           <EntityLineageEditMenuItem
               queryModel={undefined}
               childEntityDataType={SampleTypeDataType}
               parentNounPlural={"Goats"}
               parentNounSingular={"Goat"}
               parentEntityDataTypes={[SampleTypeDataType]}
            />
       );
       expect(wrapper.find(SelectionMenuItem)).toHaveLength(0);
       expect(wrapper.find(MenuItem)).toHaveLength(1);
       expect(wrapper.find(MenuItem).text()).toBe("Edit Goats for Selected Samples in Bulk")
   });

    test("with query model, no selections and default properties", () => {
        const wrapper = mount(
            <EntityLineageEditMenuItem
                parentNounPlural={"Cells"}
                childEntityDataType={DataClassDataType}
                parentNounSingular={"Cell"}
                parentEntityDataTypes={[]}
                queryModel={makeTestQueryModel(SchemaQuery.create("test", "q"))}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe("Edit Cells for Selected Data in Bulk");
    });

    test("multiple selections", () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create("test", "q"));
        queryModel.mutate({selections: new Set<string>(["1", "2"])})
        const wrapper = mount(
            <EntityLineageEditMenuItem
                parentNounPlural={"Cells"}
                childEntityDataType={SampleTypeDataType}
                parentNounSingular={"Cell"}
                parentEntityDataTypes={[]}
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
                parentNounPlural={"Cells"}
                childEntityDataType={SampleTypeDataType}
                parentNounSingular={"Cell"}
                parentEntityDataTypes={[]}
                queryModel={queryModel}
            />
        );
        expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
        expect(wrapper.find(SelectionMenuItem).text()).toBe("Edit Cells for Selected Sample in Bulk");
    });

   test("custom item text", () => {
       const wrapper = mount(
           <EntityLineageEditMenuItem
               parentNounPlural={"Cells"}
               childEntityDataType={DataClassDataType}
               parentNounSingular={"Cell"}
               parentEntityDataTypes={[]}
               itemText={"Update Lineage"}
               queryModel={makeTestQueryModel(SchemaQuery.create("test", "q"))}
           />
       );
       expect(wrapper.find(SelectionMenuItem)).toHaveLength(1);
       expect(wrapper.find(SelectionMenuItem).text()).toBe("Update Lineage");

   });

});
