/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { List } from 'immutable';
import renderer from 'react-test-renderer';
import { shallow } from 'enzyme';

import { MultiMenuButton } from './MultiMenuButton';

const menuKeys = List<string>(['first', 'second', 'third']);

describe('<MultiMenuButton />', () => {
    test('menu closed', () => {
        const tree = renderer
            .create(<MultiMenuButton menuKeys={menuKeys} renderMenuItem={menuKey => menuKey} title="My Menu" />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('menu open with current subMenu', () => {
        const menu = shallow(
            <MultiMenuButton
                menuKeys={menuKeys}
                currentSubMenuKey="first"
                renderMenuItem={(menuKey, menuChoice) => menuKey + (menuChoice ? ':' + menuChoice : '')}
                title="Test Open Menu"
            />
        );
        menu.setState({ opened: true });
        expect(menu).toMatchSnapshot();
    });

    test('menu open with current subMenu and choice', () => {
        const menu = shallow(
            <MultiMenuButton
                menuKeys={menuKeys}
                currentSubMenuKey="first"
                currentSubMenuChoice="test first"
                renderMenuItem={(menuKey, menuChoice) => menuKey + (menuChoice ? ':' + menuChoice : '')}
                title="Test Open Menu with SubMenu choice"
            />
        );
        menu.setState({ opened: true });
        expect(menu).toMatchSnapshot();
    });
});
