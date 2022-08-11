import { mount } from 'enzyme';

import { LoadingSpinner } from '../base/LoadingSpinner';
import React from 'react';
import { getAssayRunDeleteMessage } from './utils';

describe('getAssayDeleteMessage', () => {
    test('loading', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getAssayRunDeleteMessage(undefined, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeTruthy();
    });

    test('cannot delete', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getAssayRunDeleteMessage(false, false)}</span>);
        expect(wrapper.find(LoadingSpinner).exists()).toBeFalsy();
        expect(wrapper.text()).toContain(
            'This assay run cannot be deleted because it has references in one or more active notebooks.'
        );
    });

    test('cannot delete with error', () => {
        LABKEY.moduleContext = {};
        const wrapper = mount(<span>{getAssayRunDeleteMessage(false, true)}</span>);
        expect(wrapper.text()).toContain(
            'This assay run cannot be deleted because there was a problem loading the delete confirmation data.'
        );
    });
});
