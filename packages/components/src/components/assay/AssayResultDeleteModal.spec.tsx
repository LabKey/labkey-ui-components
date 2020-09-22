import { mount } from 'enzyme';
import React from 'react';
import {AssayResultDeleteModal} from "./AssayResultDeleteModal";
import {SchemaQuery, SCHEMAS} from "../..";

describe('<AssayResultDeleteModal/>', () => {
    test('Show progress', () => {

        const schemaQuery = SchemaQuery.create(SCHEMAS.EXP_TABLES.ASSAY_RUNS.getSchema(), SCHEMAS.EXP_TABLES.ASSAY_RUNS.getQuery());

        const component = (
            <AssayResultDeleteModal
                onCancel={jest.fn()}
                afterDelete={jest.fn()}
                afterDeleteFailure={jest.fn()}
                schemaQuery={schemaQuery}
                selectedIds={["1"]}/>
        );
        const wrapper = mount(component);

        // Confirm modal
        expect(wrapper.childAt(0).childAt(0).text().indexOf('delete 1 assay result')).toBeGreaterThan(-1);

        // Progress
        expect(wrapper.childAt(1).prop('title')).toBe('Deleting 1 assay result');
    });
});
