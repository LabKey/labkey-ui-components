import React from 'react';
import { mount } from 'enzyme';
import { List } from 'immutable';

import {MenuItem, OverlayTrigger, Popover} from 'react-bootstrap';

import {DisabledMenuItem, QueryGridModel} from '../../..';

import { SelectionMenuItem } from './SelectionMenuItem';

describe('<DisabledMenuItem/>', () => {
    test('disabled menu item', () => {
        const text = "This is a menuitem";
        const pluralNoun = 'samples';
        const idPrefix = 'test-menu'
        let startJobMenuItem = <MenuItem disabled={true}>This is a menuitem</MenuItem>;
        let item = mount(<DisabledMenuItem idPrefix={idPrefix} pluralNoun={pluralNoun} item={startJobMenuItem} />);

        expect(item.find(MenuItem)).toHaveLength(1);
        expect(item.find(MenuItem).text()).toBe(text);
        expect(item.find('li').getDOMNode().getAttribute('class')).toBe('disabled');

        expect(item.find(OverlayTrigger)).toHaveLength(1);
        item.find('a').simulate("mouseover");
        expect(item.find('a').html().indexOf(`aria-describedby="${idPrefix}-disabled-warning"`) !== -1).toBe(true);
        expect(item.find('a').text()).toBe(text );

        item.unmount();

    })
});
