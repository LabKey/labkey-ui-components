/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';

import { MenuSectionConfig } from '../components/navigation/ProductMenuSection';
import { MenuItemModel, MenuSectionModel, ProductMenuModel } from '../components/navigation/model';
import { NavigationBar } from '../components/navigation/NavigationBar';
import { User } from '../components/base/models/model';
import { AppURL } from '../url/AppURL';

import { ICON_URL } from './mock';
import './stories.scss';

const fruitTree = [
    'Apple',
    'Apricot',
    'Banana',
    'Lemon',
    'Lime',
    'Lychee',
    'Mango',
    'Orange',
    'Pineapple',
    'Plum',
    'Pear',
    'strawberry',
];

const vegetableGarden = [
    'Lettuce',
    'Tomato',
    'Spinach',
    'Corn',
    'Carrots',
    'Broccoli',
    'Cauliflower',
    'Beet',
    'Radish',
    'Beans',
    'Kale',
];

function makeMenuItems(nounPlural: string, options, menuItemLimit): List<MenuItemModel> {
    const items = List<MenuItemModel>().asMutable();
    for (let i = 0; i < menuItemLimit; i++) {
        items.push(
            new MenuItemModel({
                key: options[i].toLowerCase(),
                label: options[i],
                url: 'http://' + nounPlural.toLowerCase() + '/' + options[i].toLowerCase(),
            })
        );
    }
    return items.asImmutable();
}

storiesOf('NavigationBar', module)
    .addDecorator(withKnobs)
    .add('Without section data', () => {
        const isLoading = boolean('isLoading', true);
        const isLoaded = boolean('isLoaded', false);
        const isError = boolean('isError', false);
        const message = text('error message', 'There was an error loading the menu items.');
        const productIds = ['testProduct'];

        const model = new ProductMenuModel({
            isLoading: isLoading || !isError,
            isLoaded: isLoaded || isError,
            isError,
            message,
            productIds,
        });

        const brandIcon = text('brand icon', ICON_URL);
        const brandText = text('brand text', 'Logo');
        const brand = brandIcon ? <img src={brandIcon} height="38px" width="38px" /> : <b>{brandText}</b>;

        return (
            <NavigationBar
                brand={brand}
                projectName={text('projectName', 'Current Project')}
                menuSectionConfigs={undefined}
                model={model}
                showSearchBox={boolean('showSearchBox', true)}
                onSearch={(value: string) => console.log('Search term: ' + value)}
            />
        );
    })
    .add('With empty section', () => {
        const sections = List<MenuSectionModel>().asMutable();
        sections.push(
            new MenuSectionModel({
                label: 'Fruits',
                url: undefined,
                items: List<MenuItemModel>(),
                totalCount: 0,
                itemLimit: undefined,
                key: 'fruits',
            })
        );

        const model = new ProductMenuModel({
            isLoading: false,
            isLoaded: true,
            isError: false,
            productIds: ['emptySection'],
            sections,
        });

        const sectionConfigs = List<Map<string, MenuSectionConfig>>().asMutable();
        sectionConfigs.push(
            Map<string, MenuSectionConfig>().set(
                'fruits',
                new MenuSectionConfig({
                    emptyText: text('emptySectionText', 'We have no bananas'),
                    iconCls: text('iconClass', 'fas fa-user-circle'),
                    iconURL: text('iconURL', undefined),
                    emptyURL: boolean('showEmptyURL', true) ? AppURL.create('fruit', 'new') : undefined,
                    emptyURLText: text('emptyURLText', 'Define a new fruit'),
                    headerURL: boolean('showCustomHeaderURL', true)
                        ? AppURL.create('fruit', 'list').addParams({ sort: 'color' })
                        : undefined,
                })
            )
        );

        return <NavigationBar menuSectionConfigs={sectionConfigs} model={model} showSearchBox={false} />;
    })
    .add('With sections', () => {
        const fruitGroup = 'Fruit';
        const vegGroup = 'Vegetables';
        const userGroup = 'User';
        const sections = List<MenuSectionModel>().asMutable();
        const fruitMenuLimit = number(
            'Number of fruits in menu',
            4,
            {
                range: true,
                min: 0,
                max: fruitTree.length,
                step: 1,
            },
            fruitGroup
        );
        const totalFruitCount = number(
            'Total number of fruits',
            4,
            {
                range: true,
                min: 0,
                max: fruitTree.length,
                step: 1,
            },
            fruitGroup
        );
        sections.push(
            new MenuSectionModel({
                label: 'Fruits',
                url: undefined,
                items: makeMenuItems('fruits', fruitTree, fruitMenuLimit),
                totalCount: totalFruitCount,
                itemLimit: fruitMenuLimit,
                key: 'fruits',
            })
        );

        const vegMenuLimit = number(
            'Number of veggies in menu',
            2,
            {
                range: true,
                min: 0,
                max: vegetableGarden.length,
                step: 1,
            },
            vegGroup
        );
        const totalVegCount = number(
            'Total number of veggies',
            4,
            {
                range: true,
                min: 0,
                max: vegetableGarden.length,
                step: 1,
            },
            vegGroup
        );

        sections.push(
            new MenuSectionModel({
                label: 'Vegetables',
                items: makeMenuItems('vegetables', vegetableGarden, vegMenuLimit),
                totalCount: totalVegCount,
                itemLimit: vegMenuLimit,
                key: 'vegetables',
            })
        );
        sections.push(
            new MenuSectionModel({
                key: 'user',
                label: 'Your Items',
                items: List<MenuItemModel>([
                    new MenuItemModel({
                        key: 'cart',
                        label: 'Shopping Cart',
                    }),
                    new MenuItemModel({
                        key: 'profile',
                        requiresLogin: true,
                        label: 'Profile',
                    }),
                ]),
            })
        );

        const model = new ProductMenuModel({
            isLoading: false,
            isLoaded: true,
            isError: false,
            productIds: ['multipleSections'],
            sections,
        });

        const fruitsSectionConfigs = new MenuSectionConfig({
            iconCls: text('Fruit Section iconClass', undefined, fruitGroup),
            iconURL: text('Fruit Section iconURL', ICON_URL, fruitGroup),
            maxItemsPerColumn: number('Max Fruits per column', 2, {}, fruitGroup),
            maxColumns: number('Max Fruit columns', 1, {}, fruitGroup),
        });

        const vegetablesSectionConfigs = new MenuSectionConfig({
            iconCls: text('Veg Section iconClass', undefined, vegGroup),
            iconURL: text('Veg Section iconURL', ICON_URL, vegGroup),
            maxItemsPerColumn: number('Max veggies per column', 2, {}, vegGroup),
            maxColumns: number('Max veggie columns', 1, {}, vegGroup),
        });

        const userSectionConfigs = new MenuSectionConfig({
            iconCls: text('userIconClass', 'fas fa-user-circle', 'User'),
        });

        const threeColConfigs = List<Map<string, MenuSectionConfig>>().asMutable();
        threeColConfigs.push(Map<string, MenuSectionConfig>().set('fruits', fruitsSectionConfigs));
        threeColConfigs.push(Map<string, MenuSectionConfig>().set('vegetables', vegetablesSectionConfigs));
        threeColConfigs.push(Map<string, MenuSectionConfig>().set('user', userSectionConfigs));

        const twoColConfigs = List<Map<string, MenuSectionConfig>>().asMutable();
        twoColConfigs.push(Map<string, MenuSectionConfig>().set('fruits', fruitsSectionConfigs));
        const vegAndUserSectionConfig = Map<string, MenuSectionConfig>().asMutable();
        vegAndUserSectionConfig.set('vegetables', vegetablesSectionConfigs);
        vegAndUserSectionConfig.set('user', userSectionConfigs);
        twoColConfigs.push(vegAndUserSectionConfig);

        LABKEY['devMode'] = boolean('devMode', false, userGroup);
        const isSignedIn = boolean('User is signed in', true, userGroup);
        const user = new User({
            avatar: undefined,
            displayName: 'Test User',
            isSignedIn,
            isGuest: !isSignedIn,
        });
        return (
            <NavigationBar
                menuSectionConfigs={boolean('show 3 columns?', true) ? threeColConfigs : twoColConfigs}
                model={model}
                showSearchBox={false}
                user={user}
            />
        );
    });
