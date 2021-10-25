import {mount, shallow} from "enzyme";
import React from "react";
import {StatusGrid, StatusGridImpl} from "./StatusGrid";
import {makeTestActions, makeTestQueryModel} from "../../../public/QueryModel/testUtils";
import {QueryInfo} from "../../../public/QueryInfo";
import {LoadingState} from "../../../public/LoadingState";
import {SchemaQuery} from "../../../public/SchemaQuery";
import {AssayStateModel} from "./models";
import {AssayDefinitionModel} from "../../AssayDefinitionModel";
import {fromJS} from "immutable";

const SQ = SchemaQuery.create('schema', 'query');

const modelLoadedWithRow = makeTestQueryModel(
    SQ,
    new QueryInfo(),
    { 1: { RowId: { value: 1 }, Name: { value: 'Name1' } } },
    ['1'],
    1
).mutate({ queryInfoLoadingState: LoadingState.LOADED, rowsLoadingState: LoadingState.LOADED });
const sampleModel = makeTestQueryModel(SQ);
const assayModel = new AssayStateModel({
    definitions: [
        new AssayDefinitionModel({ id: 17, name: 'First Assay', type: 'General', links: fromJS({ import: 'test1' }) }),
        new AssayDefinitionModel({ id: 41, name: 'NAb Assay', type: 'NAb', links: fromJS({ import: 'test2' }) }),
    ],
    definitionsLoadingState: LoadingState.LOADED,
});

const STATUS_GRID_PROPS = {
    excludedAssayProviders: [],
    assayTypes: undefined
}
const IMPL_PROPS = {
    // assayModel,
    // sampleModel: modelLoadedWithRow,
    // reloadAssays: jest.fn,
    // assayDefinition: undefined,
    // assayProtocol: undefined,
    // onTabChange: jest.fn,
    actions: makeTestActions(),
    queryModels: {'active': makeTestQueryModel(
            SchemaQuery.create('assay', 'AssayList')
        )},
};

describe('StatusGridImpl', () => {
    // Verify the tabbedGridPanel exists? Is there anything really to do here, since you're passing directly to the TabbedGridPanel?
    test('no assay models', () => {
        const wrapper = shallow(<StatusGridImpl {...IMPL_PROPS} />);

        console.log(wrapper.debug());
        wrapper.unmount();
    });

    // 1: If assayTypes exists, col filter on Type should be those in assayTypes
    test('StatusGrid assayTypes', () => {
        const wrapper = shallow(<StatusGrid {...STATUS_GRID_PROPS} />);

        console.log(wrapper.debug());
        wrapper.unmount();
    });

    // 2: If excludedAssayProviders exists, col filter on Type should be those not in excludedAssayProviders
    test('StatusGrid excludedAssayProviders', () => {
        const wrapper = shallow(<StatusGrid {...STATUS_GRID_PROPS} />);

        console.log(wrapper.debug());
        wrapper.unmount();
    });

    // 3: If both exist, only assayTypes is used
    test('StatusGrid assayTypes and excludedAssayProviders', () => {
        const wrapper = shallow(<StatusGrid {...STATUS_GRID_PROPS} />);

        console.log(wrapper.debug());
        wrapper.unmount();
    });

    // 4: If neither exist, no col filter on Type is used
    test('StatusGrid assayTypes nor excludedAssayProviders', () => {
        const wrapper = shallow(<StatusGrid {...STATUS_GRID_PROPS} />);

        console.log(wrapper.debug());
        wrapper.unmount();
    });
})
