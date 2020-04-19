/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { List, Map } from 'immutable';
import { storiesOf } from '@storybook/react';
import { select, text, withKnobs } from '@storybook/addon-knobs';

import './stories.scss';
import { MenuOption, SubMenu } from '../components/menus/SubMenu';
import { MultiMenuButton } from '../components/menus/MultiMenuButton';

// Note that usually the key and name are not the same, but we use the same values
// here to make interaction easier.  The key is what is compared to the current choice.
const breakfastOptions = [
    {
        name: 'Eggs',
        key: 'Eggs',
    },
    {
        name: 'Waffles',
        key: 'Waffles',
    },
    {
        name: 'Muffins',
        key: 'Muffins',
    },
];

const lunchOptions = List<MenuOption>([
    {
        name: 'Sandwich',
        key: 'Sandwich',
    },
    {
        name: 'Soup',
        key: 'Soup',
    },
    {
        name: 'Salad',
        key: 'Salad',
    },
]);

const dinnerOptions = List<MenuOption>([
    {
        name: 'Roast beast',
        key: 'Roast beast',
    },
    {
        name: 'Curry',
        key: 'Curry',
    },
    {
        name: 'Pasta',
        key: 'Pasta',
    },
]);

const snackOptions = List<MenuOption>([
    {
        name: 'Trail Mix',
        key: 'Trail Mix',
    },
    {
        name: 'Fruit',
        key: 'Fruit',
    },
]);

const menuMap = Map<string, List<MenuOption>>({
    Breakfast: breakfastOptions,
    Lunch: lunchOptions,
    Dinner: dinnerOptions,
    Snack: snackOptions,
});

function renderMenuItem(key: string, currentMenuChoice: string) {
    return <SubMenu currentMenuChoice={currentMenuChoice} key={key} options={menuMap.get(key)} text={key} />;
}

storiesOf('MultiMenuButton', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        const contextOptions = menuMap.keySeq().toArray();
        contextOptions.unshift('');
        const currentMenuChoice = text('Current sub-menu choice', undefined);
        const context = select('Current sub-menu', contextOptions, undefined);
        return (
            <MultiMenuButton
                currentSubMenuKey={context}
                currentSubMenuChoice={currentMenuChoice}
                title={text('Button title', 'Prepare')}
                menuKeys={List(menuMap.keySeq().toArray())}
                renderMenuItem={renderMenuItem}
            />
        );
    });
