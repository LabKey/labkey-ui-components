import { mount } from 'enzyme';
import React from 'react';

import { ConfirmModal } from '../base/ConfirmModal';

import { AssayDesignDeleteConfirmModal } from './AssayDesignDeleteConfirmModal';

describe('<AssayDesignDeleteConfirmModal/>', () => {
    test('without name or runs', () => {
        const component = <AssayDesignDeleteConfirmModal onCancel={jest.fn()} onConfirm={jest.fn()} />;
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf('Assay Design will be permanently deleted')).toBeGreaterThan(-1);
    });

    test('with assay design name and multiple runs', () => {
        const assayDesignName = 'GPAT TEST';
        const numRuns = 5;
        const component = (
            <AssayDesignDeleteConfirmModal
                assayDesignName={assayDesignName}
                numRuns={numRuns}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
            />
        );
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf(`${assayDesignName} and its ${numRuns} runs will`)).toBeGreaterThan(-1);
    });

    test('with single runs', () => {
        const numRuns = 1;
        const component = (
            <AssayDesignDeleteConfirmModal numRuns={numRuns} onCancel={jest.fn()} onConfirm={jest.fn()} />
        );
        const wrapper = mount(component);
        const confirmModal = wrapper.find(ConfirmModal);
        expect(confirmModal.text().indexOf(`Assay Design and its ${numRuns} run will`)).toBeGreaterThan(-1);
    });
});
