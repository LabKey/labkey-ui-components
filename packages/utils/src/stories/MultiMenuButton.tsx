/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { List, Map } from 'immutable'
import { storiesOf } from '@storybook/react'
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs'

import './stories.css'

import { MultiMenuButton } from "../components/menus/MultiMenuButton";
import { SubMenu } from "../components/menus/SubMenu";
import { MenuOption } from "../components/menus/SubMenu";

// Note that usually the route and name are not the same, but we use the same values
// here to make interaction easier.  The route is what is compared to the current choice.
const breakfastOptions = [
    {
        name: "Eggs",
        route: "Eggs"
    },
    {
        name: "Waffles",
        route: "Waffles"
    },
    {
        name: "Muffins",
        route: "Muffins"
    }
];


const lunchOptions = List<MenuOption>([
    {
        name: "Sandwich",
        route: "Sandwich"
    },
    {
        name: "Soup",
        route: "Soup"
    },
    {
        name: "Salad",
        route: "Salad"
    }
]);

const dinnerOptions = List<MenuOption>([
    {
        name: "Roast beast",
        route: "Roast beast"
    },
    {
        name: "Curry",
        route: "Curry"
    },
    {
        name: "Pasta",
        route: "Pasta"
    }
]);

const snackOptions = List<MenuOption>([
    {
        name: "Trail Mix",
        route: "Trail Mix"
    },
    {
        name: "Fruit",
        route: "Fruit"
    }
]);


const menuMap = Map<string, List<MenuOption>>({
    "Breakfast": breakfastOptions,
    "Lunch": lunchOptions,
    "Dinner": dinnerOptions,
    "Snack": snackOptions,
});

function renderMenuItem(key: string, currentMenuChoice: string) {
    return <SubMenu currentMenuChoice={currentMenuChoice} key={key} options={menuMap.get(key)} text={key} />
}

storiesOf("MultiMenuButton", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        let contextOptions = menuMap.keySeq().toArray();
        contextOptions.unshift("");
        const currentMenuChoice = text("Current sub-menu choice", undefined);
        const context = select("Current sub-menu", contextOptions, undefined);
        return <MultiMenuButton currentContextKey={context}
                                currentMenuChoice={currentMenuChoice}
                                title={text("Button title", "Prepare")}
                                menuKeys={List(menuMap.keySeq().toArray())}
                                renderMenuItem={renderMenuItem}/>
    });