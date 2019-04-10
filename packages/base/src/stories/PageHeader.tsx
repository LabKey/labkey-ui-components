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
import { createNotification } from "../components/notifications/actions";
import { NotificationItemModel, Persistence } from "../components/notifications/model";
import { notificationInit } from "../test/setupUtils";

notificationInit();

createNotification(new NotificationItemModel({
    message: "A sample notification",
    persistence: Persistence.LOGIN_SESSION
}));

storiesOf("PageHeader", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {

        const hasChildren = boolean("Add content above title?", true);
        const children = hasChildren ? <Button href="#">Header action link</Button> : undefined;
        const showNotifications = boolean("Show notifications?", false);

        return (
            <PageHeader
                iconCls={text("Icon class name", "fa fa-spinner fa-spin")}
                showNotifications={showNotifications}
                title={text("Title", "Loading...")}
                >
                {children}
            </PageHeader>
        )
    });