/*
 * Copyright (c) 2018 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, text, withKnobs } from '@storybook/addon-knobs'
import { List } from "immutable";

import './stories.css'

import { ProductMenuModel } from '../../../../navigation'
import { User } from '@glass/models'
import { NavigationBar } from '../../../../navigation'

storiesOf('NavigationBar', module)
    .addDecorator(withKnobs)
    .add('Without section data', () => {
        const isLoading = boolean('isLoading', true);
        const isLoaded = boolean('isLoaded', false);
        const isError = boolean('isError', false);
        const message = text('error message', 'There was an error loading the menu items.');
        const productId = "testProduct";
        let sections  = List().asMutable();

        // let sectionConfigs = Map<string, MenuSectionConfig>().asMutable();
        const model = new ProductMenuModel({
            isLoading: isLoading || !isError,
            isLoaded: isLoaded || isError,
            isError,
            message,
            productId,
        });
        const isSignedIn = boolean('isSignedIn', true);
        const isDevMode = boolean('devMode', true);
        const brandText = text('brand text', 'Logo');
        const brand = {brandText};

        return <NavigationBar
            brand={text('brand text', 'Logo')}
            projectName={text('projectName', 'Current Project')}
            menuSectionConfigs={undefined}
            model={model}
            showSearchBox={boolean('showSearchBox', true)}
            user={new User( {
                isSignedIn
            })}
        />
    });