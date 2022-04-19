import React from 'react';
import { mount } from 'enzyme';

import { SharedEntityTypeAdminConfirmModal } from './SharedEntityTypeAdminConfirmModal';
import { SampleTypeDataType } from './constants';

describe('SharedEntityTypeAdminConfirmModal', () => {
    test('isEdit true', () => {
        const sampleTypeName = 'sharedType';
        const wrapper = mount(
            <SharedEntityTypeAdminConfirmModal
                typeId={100}
                label={sampleTypeName}
                onCancel={jest.fn()}
                isEdit={true}
                entityDataType={SampleTypeDataType}
            />
        );
        expect(wrapper.find('ModalTitle').text()).toBe('You are about to leave the application. Continue?');
        expect(wrapper.find('.modal-body').text()).toBe(
            "Shared sample type '" + sampleTypeName + "' can only be modified in LabKey Server. Do you want to proceed?"
        );
        wrapper.unmount();
    });

    test('isEdit false', () => {
        const sampleTypeName = 'sharedType-1';
        const wrapper = mount(
            <SharedEntityTypeAdminConfirmModal
                typeId={100}
                label={sampleTypeName}
                onCancel={jest.fn()}
                isEdit={false}
                entityDataType={SampleTypeDataType}
            />
        );
        expect(wrapper.find('ModalTitle').text()).toBe('You are about to leave the application. Continue?');
        expect(wrapper.find('.modal-body').text()).toBe(
            "Shared sample type '" + sampleTypeName + "' can only be deleted in LabKey Server. Do you want to proceed?"
        );
        wrapper.unmount();
    });
});
