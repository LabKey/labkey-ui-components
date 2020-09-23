import React from 'react';
import { mount } from 'enzyme';

import { AssayRunDeleteModal } from './AssayRunDeleteModal';

describe('<AssayRunDeleteModal/>', () => {
    test('Show progress', () => {
        const wrapper = mount(
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
