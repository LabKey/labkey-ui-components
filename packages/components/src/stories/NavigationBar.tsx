/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';

import { MenuSectionConfig, MenuItemModel, MenuSectionModel, ProductMenuModel, NavigationBar, User, AppURL } from '..';

import { ICON_URL } from './mock';
import './stories.scss';
import { TEST_USER_READER } from "../test/data/users";
import {
    DONE_AND_READ,
    DONE_NOT_READ,
    IN_PROGRESS,
    markAllNotificationsRead,
    UNREAD_WITH_ERROR
} from '../test/data/notificationData';
import { ServerNotificationModel } from "../internal/components/notifications/model";

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

function makeMenuItems(nounPlural: string, options, menuItemLimit, hasActiveJob?: boolean): List<MenuItemModel> {
    const items = List<MenuItemModel>().asMutable();
    for (let i = 0; i < menuItemLimit; i++) {
        items.push(
            new MenuItemModel({
                key: options[i].toLowerCase(),
                label: options[i],
                hasActiveJob,
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
                user={TEST_USER_READER}
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
        const hasActiveJob = boolean('hasActiveJob', false, fruitGroup);
        sections.push(
            new MenuSectionModel({
                label: 'Fruits',
                url: undefined,
                items: makeMenuItems('fruits', fruitTree, fruitMenuLimit, hasActiveJob),
                totalCount: totalFruitCount,
                itemLimit: fruitMenuLimit,
                key: 'fruits'
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
            activeJobIconCls: text('active job icon', 'fa-spinner fa-pulse', fruitGroup)
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

        const serverActivity = hasActiveJob ? {
            data: [DONE_NOT_READ, DONE_AND_READ, IN_PROGRESS, UNREAD_WITH_ERROR],
            totalRows: 4,
            unreadCount: 2,
            inProgressCount: 1,
        } : {
            data: [DONE_NOT_READ, DONE_AND_READ, UNREAD_WITH_ERROR],
            totalRows: 3,
            unreadCount: 1,
            inProgressCount: 0,
        };
        const notificationConfig = {
            maxRows: 8,
            markAllNotificationsRead: markAllNotificationsRead,
            serverActivity: new ServerNotificationModel(serverActivity),
            onViewAll: () => {},
        }
        return (
            <NavigationBar
                menuSectionConfigs={boolean('show 3 columns?', true) ? threeColConfigs : twoColConfigs}
                model={model}
                showSearchBox={true}
                user={user}
                notificationsConfig={
                    boolean('Show notifications?', true) ? notificationConfig : undefined
                }
            />
        );
    });

// TODO