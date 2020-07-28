import {mount, shallow} from 'enzyme';
import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { AssayRunDeleteConfirmModal } from './AssayRunDeleteConfirmModal';
import {AssayRunDeleteModal} from "./AssayRunDeleteModal";
import {QueryGridModel, QueryInfo, SCHEMAS} from "../..";
import sampleSet2QueryInfo from "../../test/data/sampleSet2-getQueryDetails.json";
import {List, Map} from "immutable";
import {act} from "react-test-renderer";



describe('<AssayRunDeleteModal/>', () => {
    test('Show progress', () => {
        const queryGridModel = new QueryGridModel({
            schema: SCHEMAS.EXP_TABLES.ASSAY_RUNS.getSchema(),
            query: SCHEMAS.EXP_TABLES.ASSAY_RUNS.getQuery(),
            id: 'delete-assayresults',
            editable: true,
            isLoaded: true,
            isLoading: false,
            isError: false,
            selectedIds: List<string>([1])
        });

        const component = <AssayRunDeleteModal
            onCancel={jest.fn()}
            afterDelete={jest.fn()}
            afterDeleteFailure={jest.fn()}
            beforeDelete={jest.fn()}
            useSelected={true}
            model={queryGridModel}
        />;
        const wrapper = mount(component);

        // Confirm modal
        expect(wrapper.childAt(0).childAt(0).text().indexOf('delete 1 assay run')).toBeGreaterThan(-1)

        // Progress
        expect(wrapper.childAt(1).prop('title')).toBe('Deleting 1 assay run');
    });


});
