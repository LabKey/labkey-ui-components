import * as React from 'react';
import { Map, fromJS } from 'immutable';
import { storiesOf } from "@storybook/react";
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import { CreatedModified } from "@glass/base";

import { PageDetailHeader } from "../components/forms/PageDetailHeader";
import './stories.scss'

storiesOf('PageDetailHeader', module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        const createdRow = Map<string, any>(fromJS({
            Created: {
                formattedValue: "2019-05-15 19:45",
                value: "2019-05-15 19:45:40.593"
            },
            CreatedBy: {
                displayValue: "username",
                url: "#/q/core/siteusers/1001",
                value: 1001
            },
            Modified: {
                formattedValue: "2019-05-16 19:45",
                value: "2019-05-16 19:45:40.593"
            },
            ModifiedBy: {
                displayValue: "username2",
                url: "#/q/core/siteusers/1002",
                value: 1002
            }
        }));

        return (
            <PageDetailHeader
                user={null}
                iconUrl={'http://labkey.wpengine.com/wp-content/uploads/2015/12/cropped-LK-icon.png'}
                title={text('title', 'Page Detail Header')}
                subTitle={text('subtitle', 'With a subtitle')}
            >
                <CreatedModified row={createdRow}/>
            </PageDetailHeader>
        )
    });