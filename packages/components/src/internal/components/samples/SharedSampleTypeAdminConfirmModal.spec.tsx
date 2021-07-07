import React from 'react';
import { mount } from 'enzyme';

import { SharedSampleTypeAdminConfirmModal } from './SharedSampleTypeAdminConfirmModal';

describe('<SharedSampleTypeAdminConfirmModal/>', () => {
    test('isEdit true', () => {
        const sampleTypeName = 'sharedType';
        const wrapper = mount(
            <SharedSampleTypeAdminConfirmModal
                sampleTypeId={100}
                sampleTypeLabel={sampleTypeName}
                onCancel={jest.fn()}
                isEdit={true}
            />
        );
        expect(wrapper.find('ModalTitle').text()).toBe('You are about to leave the application, continue?');
        expect(wrapper.find('.modal-body').text()).toBe(
            "Shared sample type '" + sampleTypeName + "' can only be modified in LabKey Server. Do you want to proceed?"
        );
        wrapper.unmount();
    });

    test('isEdit false', () => {
        const sampleTypeName = 'sharedType-1';
        const wrapper = mount(
            <SharedSampleTypeAdminConfirmModal
                sampleTypeId={100}
                sampleTypeLabel={sampleTypeName}
                onCancel={jest.fn()}
                isEdit={false}
            />
        );
        expect(wrapper.find('ModalTitle').text()).toBe('You are about to leave the application, continue?');
        expect(wrapper.find('.modal-body').text()).toBe(
            "Shared sample type '" + sampleTypeName + "' can only be deleted in LabKey Server. Do you want to proceed?"
        );
        wrapper.unmount();
    });
});
