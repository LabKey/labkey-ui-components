import React from 'react';

import { AssayRunDeleteModal } from './AssayRunDeleteModal';
import { mountWithAppServerContext } from '../../testHelpers';

describe('<AssayRunDeleteModal/>', () => {
    test('Show progress', () => {
        const wrapper = mountWithAppServerContext(
            <AssayRunDeleteModal
                afterDelete={jest.fn()}
                afterDeleteFailure={jest.fn()}
                numToDelete={1}
                onCancel={jest.fn()}
            />
        );

        // Confirm modal
        expect(wrapper.childAt(0).childAt(0).text().indexOf('delete 1 assay run')).toBeGreaterThan(-1);

        // Progress
        expect(wrapper.childAt(1).prop('title')).toBe('Deleting 1 assay run');
    });
});
