/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List } from 'immutable'
import { Ajax, Utils } from '@labkey/api'
import { IMenuSectionsResponse, MenuSectionModel } from './model'
import { buildURL } from '@glass/utils'
import { ensureProductMenuModel, updateProductMenuModel } from './global';


function getMenuSections(productId: string): Promise<IMenuSectionsResponse> {
    return new Promise((resolve, reject) =>  {

        return Ajax.request( {
            url: buildURL('product', 'menuSections.api'),
            method: 'GET',
            params: Object.assign({
                productId
            }),
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            })
        });
    })

}

function setError(productId: string, message: string) {
    updateProductMenuModel(productId, {
        isLoading: false,
        isLoaded: true,
        isError: true,
        message
    });
}

export function menuInit(productId: string) {
    let menu = ensureProductMenuModel(productId);

    if (!menu.isLoaded && !menu.isLoading) {
        updateProductMenuModel(productId, {isLoading: true});

        getMenuSections(productId)
            .then(response => {
                let sections = List<MenuSectionModel>().asMutable();
                response.forEach(sectionData => {
                    sections.push(MenuSectionModel.create(sectionData));
                });
                updateProductMenuModel(productId, {
                    isLoaded: true,
                    isLoading: false,
                    sections: sections
                });
            })
            .catch(reason => {
                console.error("Problem retrieving product menu data.", reason);
                setError(productId, 'Error in retrieving product menu data. Please contact your site administrator.');
            });
    }
}