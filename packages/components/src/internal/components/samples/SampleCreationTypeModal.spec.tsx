import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Button, ModalBody, ModalTitle } from 'react-bootstrap';

import { getTestAPIWrapper } from '../../APIWrapper';

import { waitForLifecycle } from '../../testHelpers';

import { OperationConfirmationData } from '../entities/models';

import { Alert } from '../base/Alert';

import { SampleCreationTypeModal } from './SampleCreationTypeModal';
import { SampleCreationTypeOption } from './SampleCreationTypeOption';
import { ALIQUOT_CREATION, DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, SampleCreationType } from './models';

import { getSamplesTestAPIWrapper } from './APIWrapper';

describe('<SampleCreationTypeModal/>', () => {
    function validateOption(wrapper: ReactWrapper, selected: boolean, type: SampleCreationType) {
        expect(wrapper.prop('isSelected')).toBe(selected);
        expect((wrapper.prop('option') as any).type).toBe(type);
    }

    function validateLabel(wrapper, label: string) {
        const labels = wrapper.find('.creation-type-modal-label');
        expect(labels).toHaveLength(2);
        expect(labels.at(0).text()).toBe(label);
    }
    const allAllowedStatus = new OperationConfirmationData({
        allowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    const noneAllowedStatus = new OperationConfirmationData({
        notAllowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    const someAllowedStatus = new OperationConfirmationData({
        allowed: [
            {
                Name: 'T-3',
                RowId: 3,
            },
        ],
        notAllowed: [
            {
                Name: 'T-1',
                RowId: 1,
            },
            {
                Name: 'T-2',
                RowId: 2,
            },
        ],
    });

    test('single parent, no aliquots', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION]}
                parentCount={1}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () => Promise.resolve(allAllowedStatus),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('ModalTitle').text()).toBe('Create Samples from Selected Parent');
        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(0);
        validateLabel(wrapper, DERIVATIVE_CREATION.quantityLabel);
        wrapper.unmount();
    });

    test('single parent, with aliquots', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={1}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(allAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('ModalTitle').text()).toBe('Create Samples from Selected Parent');
        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(2);
        validateOption(options.at(0), true, SampleCreationType.Derivatives);
        validateOption(options.at(1), false, SampleCreationType.Aliquots);
        validateLabel(wrapper, DERIVATIVE_CREATION.quantityLabel);
        wrapper.unmount();
    });

    test('multiple parents, with aliquots', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(allAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);

        expect(wrapper.find('ModalTitle').text()).toBe('Create Samples from Selected Parents');
        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(3);
        validateOption(options.at(0), true, SampleCreationType.Derivatives);
        validateOption(options.at(1), false, SampleCreationType.PooledSamples);
        validateOption(options.at(2), false, SampleCreationType.Aliquots);
        wrapper.unmount();
    });

    test('aliquots selected', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(allAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);

        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(3);
        wrapper.setState({
            creationType: SampleCreationType.Aliquots,
        });
        validateLabel(wrapper, ALIQUOT_CREATION.quantityLabel);
        wrapper.unmount();
    });

    test('pooling selected', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(allAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        const options = wrapper.find(SampleCreationTypeOption);
        expect(options).toHaveLength(3);
        wrapper.setState({
            creationType: SampleCreationType.PooledSamples,
        });
        validateLabel(wrapper, POOLED_SAMPLE_CREATION.quantityLabel);
        wrapper.unmount();
    });

    test('none allowed', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(noneAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ModalTitle).text()).toBe('Cannot Create Samples from Selected Parents');
        expect(wrapper.find(ModalBody).text()).toBe(
            'All selected samples have a status that prevents updating of their lineage.'
        );
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(1);
        expect(buttons.at(0).text()).toBe('Dismiss');
        wrapper.unmount();
    });

    test('some allowed', async () => {
        const wrapper = mount(
            <SampleCreationTypeModal
                show={true}
                options={[DERIVATIVE_CREATION, POOLED_SAMPLE_CREATION, ALIQUOT_CREATION]}
                parentCount={4}
                showIcons={false}
                onCancel={jest.fn()}
                onSubmit={jest.fn()}
                api={getTestAPIWrapper(jest.fn, {
                    samples: getSamplesTestAPIWrapper(jest.fn, {
                        getSampleOperationConfirmationData: () =>
                            Promise.resolve(new OperationConfirmationData(someAllowedStatus)),
                    }),
                })}
            />
        );
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ModalTitle).text()).toBe('Create Samples from Selected Parents');
        expect(wrapper.find(Alert).text()).toBe(
            'The current status of 2 selected samples prevents updating of their lineage.'
        );
        const buttons = wrapper.find(Button);
        expect(buttons).toHaveLength(2);
        expect(buttons.at(0).text()).toBe('Cancel');
        expect(buttons.at(1).text()).toBe('Go to Sample Creation Grid');
        wrapper.unmount();
    });
});
