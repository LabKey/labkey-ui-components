import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import lineageSampleData from '../../../../test/data/experiment-lineage-runSteps.json';

import { LineageNode } from '../models';
import { LineageDataLink } from '../LineageDataLink';

import { DetailsList, DetailsListSteps } from './DetailsList';

describe('DetailsListSteps', () => {
    function validate(wrapper: ReactWrapper, stepCount: number): void {
        expect(wrapper.find(DetailsList)).toHaveLength(1);
        expect(wrapper.find('.lineage-sm-icon').hostNodes()).toHaveLength(stepCount);
        expect(wrapper.find('.lineage-sm-name').hostNodes()).toHaveLength(stepCount);
        expect(wrapper.find(LineageDataLink)).toHaveLength(stepCount);
    }

    test('not exp run', () => {
        const wrapper = mount(
            <DetailsListSteps
                node={LineageNode.create('abc:123', { expType: 'ProtocolApplication' })}
                onSelect={jest.fn}
            />
        );
        expect(wrapper.find(DetailsList)).toHaveLength(0);
        wrapper.unmount();
    });

    test('no run steps', () => {
        const wrapper = mount(
            <DetailsListSteps node={LineageNode.create('abc:123', { expType: 'ExperimentRun' })} onSelect={jest.fn} />
        );
        validate(wrapper, 0);
        wrapper.unmount();
    });

    test('with run steps', () => {
        const wrapper = mount(
            <DetailsListSteps
                node={LineageNode.create('abc:123', lineageSampleData.nodes[lineageSampleData.seed])}
                onSelect={jest.fn}
            />
        );
        validate(wrapper, 2);
        expect(wrapper.find('.lineage-sm-name').hostNodes().first().text()).toBe('RecordingOneStepOne');
        expect(wrapper.find('.lineage-sm-name').hostNodes().last().text()).toBe('RecordingOneStepTwo');
        wrapper.unmount();
    });
});
