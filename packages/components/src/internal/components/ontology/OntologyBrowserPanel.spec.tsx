/** Tests describing the OntologyBrowser **/

import { mount } from 'enzyme';
import React from 'react';

import { initUnitTestMocks } from '../../testHelperMocks';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { OntologyBrowserPanel } from './OntologyBrowserPanel';

//TODO Lots todo...

beforeAll(() => {
    initUnitTestMocks();
});

describe('OntologyBrowserPanel', () => {
    test('Ontology id not provided', () => {
        const component = mount(<OntologyBrowserPanel />);

        expect(component.find(LoadingSpinner)).toHaveLength(1);
        component.unmount();
    });
});
