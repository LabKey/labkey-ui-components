/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { Button } from 'react-bootstrap'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'

import './stories.css'
import { Page } from "..";

storiesOf("Page", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        const hasChildren = boolean("Has child elements?", true);
        const children = hasChildren ? [
            <Button href="#">Button 1</Button>,
            <div>A div element</div>
        ]: undefined;
        return (
            <Page
                notFound={boolean('Page not found?', false)}
                hasHeader={boolean('Page has its own header?', false)}
            >
                {children}
            </Page>
        )
    });