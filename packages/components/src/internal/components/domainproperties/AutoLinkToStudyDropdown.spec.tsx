import React from 'react';
import { mount } from 'enzyme';
import { List } from 'immutable';

import { Container, LoadingSpinner } from '../../..';
import getValidPublishTargetsJson from '../../../test/data/assay-getValidPublishTargets.json';

import { AutoLinkToStudyDropdown } from './AutoLinkToStudyDropdown';

const CONTAINERS = List(getValidPublishTargetsJson.containers.map(c => new Container(c)));
const BASE_PROPS = {
    value: '5B75A3A6-FAED-1035-9558-2CC2863E7240',
    autoLinkTarget: 'autoLinkTargetFormId',
    onChange: jest.fn,
};

describe('<AutoLinkToStudyDropdown/>', () => {
    test('default props', async () => {
        const wrapper = mount(<AutoLinkToStudyDropdown {...BASE_PROPS} containers={CONTAINERS} />);

        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find('option')).toHaveLength(8);
        wrapper.unmount();
    });

    test('loading', async () => {
        const wrapper = mount(<AutoLinkToStudyDropdown {...BASE_PROPS} containers={undefined} />);

        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
        expect(wrapper.find('option')).toHaveLength(0);
        wrapper.unmount();
    });
});
