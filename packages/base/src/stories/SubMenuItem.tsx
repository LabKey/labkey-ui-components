/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, number, select, text, withKnobs } from '@storybook/addon-knobs'

import './stories.css'
import { SubMenuItem } from "../components/menus/SubMenuItem";

let allItems = [
    {
        text: "first item"
    },
    {
        text: "second item",
    },
    {
        text: "third item"
    },
    {
        text: "fourth item"
    },
    {
        text: "fifth item"
    }
];

const filterGroup = "Filtering";
const disabledGroup = "Disabled Item";

storiesOf("SubMenuItem", module)
        .addDecorator(withKnobs)
        .add("with knobs", () => {
            const numItems = number("number of items", 2, {
                range: true,
                min: 0,
                max: allItems.length,
                step: 1
            });
            if (numItems > 1) {
                const disableItem = boolean("Disable second item?", false, disabledGroup);
                const disabledItemMsg = text("Disabled item text", undefined, disabledGroup);
                if (disableItem) {
                    allItems[1]['disabled'] = true;
                    allItems[1]['disabledOverlayPlacement'] = "bottom"; // using the default "right" will not show it in the storybook frame
                    if (disabledItemMsg) {
                        allItems[1]['disabledMsg'] = disabledItemMsg;
                    }
                }
            }

            return (
                <SubMenuItem
                    allowFilter={boolean("Allow option filtering?", true, filterGroup)}
                    disabled={boolean("Disabled?", false)}
                    filterPlaceholder={text("Filter placeholder text", "Filter...", filterGroup)}
                    icon={text("Font awesome icon name", undefined)}
                    items={allItems.slice(0, numItems)}
                    itemsCls={text("class name for items container", "well")}
                    minToFilter={number("Minimum item count for filtering", 4, {}, filterGroup)}
                    text={text("Text", "Item text")}
                />
            )
        });