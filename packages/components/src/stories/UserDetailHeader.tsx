/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { Button } from 'react-bootstrap';
import { storiesOf } from '@storybook/react';
import { withKnobs, text } from '@storybook/addon-knobs';
import { Map, fromJS } from 'immutable';

import { UserDetailHeader, User } from '..';

import { ICON_URL } from './mock';
import './stories.scss';

storiesOf('UserDetailHeader', module)
    .addDecorator(withKnobs)
    .add('default props', () => {
        return (
            <UserDetailHeader
                title="Default User Title"
                user={new User({ avatar: ICON_URL, isAdmin: true })}
                userProperties={Map<string, any>()}
                dateFormat="yyyy-MM-dd"
            />
        );
    })
    .add('custom props', () => {
        return (
            <UserDetailHeader
                title={text('title', 'Custom User Title')}
                user={new User({ avatar: ICON_URL, isAdmin: true })}
                userProperties={fromJS({ lastlogin: '2019-12-02 01:02:03' })}
                description={text('description', 'Testing with custom description')}
                dateFormat={text('dateFormat', 'YYYY-MM')}
                renderButtons={() => {
                    return <Button className="pull-right">Test Button</Button>;
                }}
            />
        );
    });
