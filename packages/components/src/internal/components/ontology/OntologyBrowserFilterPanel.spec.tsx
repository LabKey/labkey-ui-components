import React from 'react';

import { Filter } from '@labkey/api';
import { mount, ReactWrapper } from 'enzyme';

import { Alert } from '../base/Alert';
import { waitForLifecycle } from '../../testHelpers';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { OntologyBrowserFilterPanel } from './OntologyBrowserFilterPanel';
import { PathModel } from './models';

const DEFAULT_PROPS = {
    ontologyId: 'TestOntology',
    conceptSubtree: undefined,
    filterValue: undefined,
    filterType: undefined,
    onFilterChange: jest.fn,
};

jest.mock('./actions.ts', () => {
    // Require the original module to not be mocked...
    const originalModule = jest.requireActual('./actions.ts');
    return {
        ...originalModule,
        fetchPathModel: jest.fn().mockReturnValue({
            path: 'root',
            code: 'testroot',
            label: 'test root',
            hasChildren: false,
            children: undefined,
        } as PathModel),
    };
});

const EqStub = { getURLSuffix: () => 'eq' } as Filter.IFilterType;
const InSubtreeStub = { getURLSuffix: () => 'concept:insubtree' } as Filter.IFilterType;
const NotInSubtreeStub = { getURLSuffix: () => 'concept:notinsubtree' } as Filter.IFilterType;

describe('OntologyBrowserFilterPanel', () => {
    const validate = (wrapper: ReactWrapper): void => {
        expect(wrapper.find(Alert)).toHaveLength(2);
        expect(wrapper.find(Alert).first().text()).toBe('');
        expect(wrapper.find(OntologyBrowserPanel)).toHaveLength(1);
        expect(wrapper.find(OntologyBrowserPanel).prop('hideConceptInfo')).toBeTruthy();
    };

    test('default props', () => {
        const wrapper = mount(<OntologyBrowserFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper);

        wrapper.unmount();
    });

    // change filter value
    test('Concept filter value changed', async () => {
        const changeHandler = jest.fn();
        const props = {
            ...DEFAULT_PROPS,
            filterValue: 'Test:Code',
            filterType: EqStub,
            onFilterChange: changeHandler,
        };

        const wrapper = mount(<OntologyBrowserFilterPanel {...props} />);
        validate(wrapper);
        expect(changeHandler).toHaveBeenCalledTimes(0);

        await waitForLifecycle(wrapper.setProps({ filterValue: 'Mock:Code2' }));
        // Shouldn't call out to handler unless change is from the panel
        expect(changeHandler).toHaveBeenCalledTimes(0);
        expect(wrapper.find(OntologyBrowserPanel).prop('filters')).toHaveProperty('size', 1);

        // Multi valued filter
        await waitForLifecycle(wrapper.setProps({ filterValue: 'Mock:Code2;Mock:Code3;Mock:Code1' }));
        expect(changeHandler).toHaveBeenCalledTimes(0);
        expect(wrapper.find(OntologyBrowserPanel).prop('filters')).toHaveProperty('size', 3);
        expect(wrapper.find(OntologyBrowserPanel).prop('filters').get('Mock:Code3')).toHaveProperty(
            'code',
            'Mock:Code3'
        );

        // Path valued filter
        await waitForLifecycle(wrapper.setProps({ filterValue: 'Mock:Code2/Mock:Code3/Mock:Code1' }));
        expect(changeHandler).toHaveBeenCalledTimes(0);
        expect(wrapper.find(OntologyBrowserPanel).prop('filters')).toHaveProperty('size', 1);

        wrapper.unmount();
    });

    // change filter type
    test('Concept filter type changed', async () => {
        const changeHandler = jest.fn();
        const props = {
            ...DEFAULT_PROPS,
            filterValue: 'Test:Code',
            filterType: EqStub,
            onFilterChange: changeHandler,
        };

        const wrapper = mount(<OntologyBrowserFilterPanel {...props} />);
        validate(wrapper);
        expect(changeHandler).toHaveBeenCalledTimes(0);

        await waitForLifecycle(wrapper.setProps({ filterType: InSubtreeStub }));
        // Shouldn't call out to handler unless change is from the panel
        expect(changeHandler).toHaveBeenCalledTimes(0);

        // Multi valued filter
        await waitForLifecycle(wrapper.setProps({ filterType: NotInSubtreeStub }));
        expect(changeHandler).toHaveBeenCalledTimes(0);

        // Path valued filter
        await waitForLifecycle(wrapper.setProps({ filterType: EqStub }));
        expect(changeHandler).toHaveBeenCalledTimes(0);

        wrapper.unmount();
    });
});
