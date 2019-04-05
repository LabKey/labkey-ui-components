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
import { PageHeader } from "../components/PageHeader";

storiesOf("PageHeader", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {

        const hasChildren = boolean("Add content above title?", true);
        const children = hasChildren ? <Button href="#">Header action link</Button> : undefined;
        return (
            <PageHeader
                icon={text("Font-awesome icon name", "spinner fa-spin")}
                title={text("Title", "Loading...")}
                >
                {children}
            </PageHeader>
        )
    });