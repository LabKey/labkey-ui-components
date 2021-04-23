import React from 'react';
import { OntologyBrowserFilterPanel } from './OntologyBrowserFilterPanel';
import { Filter } from '@labkey/api';
import { mount, ReactWrapper } from 'enzyme';
import { OntologyBrowserPanel } from './OntologyBrowserPanel';
import { ConceptInformationTabs } from './ConceptInformationTabs';

const onFilterChange = jest.fn();

const DEFAULT_PROPS = {
    ontologyId: 'TestOntology',
    filterValue: undefined,
    filterType: undefined,
    onFilterChange: jest.fn,
};

describe('OntologyBrowserFilterPanel', () => {
    const validate = (wrapper: ReactWrapper) => {
        expect(wrapper.find(OntologyBrowserPanel)).toHaveLength(1);
        expect(wrapper.find(ConceptInformationTabs)).toHaveLength(0);
    };

    test('default props', () => {
        const wrapper = mount(<OntologyBrowserFilterPanel {...DEFAULT_PROPS} />);
        validate(wrapper);
    });


});
