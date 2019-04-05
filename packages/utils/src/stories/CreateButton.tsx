/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { List, Map } from 'immutable'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import './stories.css'

import { CreateButton } from "../components/menus/CreateButton";
import { CreationSubMenu } from "../components/menus/CreationSubMenu";
import { CreateMenuOption } from "../components/menus/CreationSubMenu";

const breakfastOptions = [
    {
        name: "Egg",
        pluralName: "Eggs",
        route: "egg"
    },
    {
        name: "Waffle",
        pluralName: "Waffles",
        route: "waffle"
    },
    {
        name: "Muffin",
        pluralName: "Muffins",
        route: "muffin"
    }
];


const lunchOptions = List<CreateMenuOption>([
    {
        name: "Sandwich",
        pluralName: "Sandwiches",
        route: "sandwich"
    },
    {
        name: "Soup",
        pluralName: "Soups",
        route: "soup"
    },
    {
        name: "Salad",
        pluralName: "Salads",
        route: "salad"
    }
]);

const dinnerOptions = List<CreateMenuOption>([
    {
        name: "Roast beast",
        pluralName: "Roast beasts",
        route: "roastbeast"
    },
    {
        name: "Curry",
        pluralName: "Curries",
        route: "curry"
    },
    {
        name: "Pasta",
        pluralName: "Pasta",
        route: "pasta"
    }
]);

const snackOptions = List<CreateMenuOption>([
    {
        name: "Chip",
        pluralName: "Chips",
        route: "chip"
    },
    {
        name: "Trail Mix",
        pluralName: "Trail Mix",
        route: "trailmix"
    },
    {
        name: "Fruit",
        pluralName: "Fruits",
        route: "fruit"
    }
]);


const menuMap = Map<string, List<CreateMenuOption>>({
    "Breakfast": breakfastOptions,
    "Lunch": lunchOptions,
    "Dinner": dinnerOptions,
    "Snack": snackOptions,
});

function renderMenuItem(key: string) {
    return <CreationSubMenu key={key} options={menuMap.get(key)} text={key} />
}

storiesOf("CreateButton", module)
    .addDecorator(withKnobs)
    .add("initial", () => {

        return <CreateButton menuKeys={List(menuMap.keySeq().toArray())} renderMenuItem={renderMenuItem}/>
    });