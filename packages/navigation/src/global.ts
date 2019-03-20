/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { getGlobal, setGlobal } from 'reactn'
import { ProductMenuModel } from './model';

const GLOBAL_STATE_PREFIX = 'Navigation_';

export function initNavigationState() {
    if (!getGlobal().Navigation_menu) {
        resetNavigationState();
    }
}

export function resetNavigationState() {
    setProductMenuModel(
       new ProductMenuModel()
    )
}

function getGlobalState(property: string) {
    if (!getGlobal()[GLOBAL_STATE_PREFIX + property]) {
        throw new Error('Must call initNavigationState before you can access anything from the global.' + GLOBAL_STATE_PREFIX + property + ' objects.');
    }

    return getGlobal()[GLOBAL_STATE_PREFIX + property];
}


function setProductMenuModel(menu: ProductMenuModel) {
    setGlobal( {
        Navigation_menu: menu
    });
}

export function ensureProductMenuModel(productId: string) : ProductMenuModel
{
    let menu = getGlobalState('menu');
    if (!menu)
    {
        menu = new ProductMenuModel({
            productId
        });
        setProductMenuModel(menu);
    }
    return menu;
}


export function removeProductMenuModel()
{
    setProductMenuModel(
        new ProductMenuModel()
    )
}

export function updateProductMenuModel(productId: string, updates: any, failIfNotFound: boolean = true) : ProductMenuModel
{
    if (failIfNotFound && !getGlobalState('menu'))
        throw new Error("Unable to find ProductMenu for productId: " + productId);
    let updatedModel = ensureProductMenuModel(productId).merge(updates) as ProductMenuModel;
    setProductMenuModel(updatedModel);
    return updatedModel;
}