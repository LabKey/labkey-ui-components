import React from 'react';
import { mount } from 'enzyme';

import { SCHEMAS } from '../../../index';
import { AssayResultDeleteModal } from './AssayResultDeleteModal';

describe('<AssayResultDeleteModal/>', () => {
    test('Show progress', () => {
        const wrapper = mount(
            <AssayResultDeleteModal
                afterDelete={jest.fn()}
                afterDeleteFailure={jest.fn()}
                onCancel={jest.fn()}
                schemaQuery={SCHEMAS.EXP_TABLES.ASSAY_RUNS}
                selectedIds={['1']}
            />
        );

        // Confirm modal
        expect(wrapper.childAt(0).childAt(0).text().indexOf('delete 1 assay result')).toBeGreaterThan(-1);

        // Progress
        expect(wrapper.childAt(1).prop('title')).toBe('Deleting 1 assay result');
    });
});
