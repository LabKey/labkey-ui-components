import React from 'react';
import { mount } from 'enzyme';

import { Collapse } from 'react-bootstrap';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { SystemFields } from './SystemFields';

describe('DataClassDesigner', () => {
    test('Default', () => {
        const wrapped = mount(<SystemFields systemFields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} />);
        expect(wrapped.find('tr')).toHaveLength(4);
    });

    test('Toggle', () => {
        const wrapped = mount(<SystemFields systemFields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} />);

        let collapsed = wrapped.find(Collapse).props().in;
        expect(collapsed).toBe(true);

        const header = wrapped.find('.domain-system-fields-header__icon');
        header.simulate('click');

        collapsed = wrapped.find(Collapse).props().in;
        expect(collapsed).toBe(false);
    });
});
