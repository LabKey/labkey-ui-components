import React from 'react';
import { mount } from 'enzyme';

import { SampleFinderSaveViewModal } from './SampleFinderSaveViewModal';

describe('SampleFinderSaveViewModal', () => {
    test('without current view', async () => {
        const wrapper = mount(<SampleFinderSaveViewModal cardsJson="" onCancel={jest.fn()} onSuccess={jest.fn()} />);

        expect(wrapper.find('ModalTitle').text()).toBe('Save Custom Search');
        expect(wrapper.find('input').prop('value')).toBeUndefined();

        wrapper.unmount();
    });

    test('with saved view', async () => {
        const wrapper = mount(
            <SampleFinderSaveViewModal
                cardsJson=""
                onCancel={jest.fn()}
                onSuccess={jest.fn()}
                currentView={{
                    reportId: 'db:293',
                    reportName: 'source2',
                    entityId: 'bb03cc46-b76e-103a-a843-0cff0bac6533',
                    isSession: false,
                }}
            />
        );

        expect(wrapper.find('ModalTitle').text()).toBe('Save Custom Search');
        expect(wrapper.find('input').prop('value')).toBe('source2');

        wrapper.unmount();
    });

    test('with session view', async () => {
        const wrapper = mount(
            <SampleFinderSaveViewModal
                cardsJson=""
                onCancel={jest.fn()}
                onSuccess={jest.fn()}
                currentView={{
                    reportName: 'searched today',
                    isSession: true,
                }}
            />
        );

        expect(wrapper.find('ModalTitle').text()).toBe('Save Custom Search');
        expect(wrapper.find('input').prop('value')).toBe('');

        wrapper.unmount();
    });

    test('with module view', async () => {
        const wrapper = mount(
            <SampleFinderSaveViewModal
                cardsJson=""
                onCancel={jest.fn()}
                onSuccess={jest.fn()}
                currentView={{
                    reportName: 'a built in report',
                    isModuleReport: true,
                }}
            />
        );

        expect(wrapper.find('ModalTitle').text()).toBe('Save Custom Search');
        expect(wrapper.find('input').prop('value')).toBe('');

        wrapper.unmount();
    });
});
