/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Ajax, Utils } from '@labkey/api'

import { NotificationItemModel, NotificationItemProps } from './model'
import { buildURL } from "../../url/ActionURL";
import { addNotification } from "./global";


export type NotificationCreatable = string | NotificationItemProps | NotificationItemModel;

/**
 * Create a notification that can be displayed on pages within the application
 * @param creatable
 */
export function createNotification(creatable: NotificationCreatable) {
    let item: NotificationItemModel;
    if (Utils.isString(creatable)) {
       item = NotificationItemModel.create({
            message: creatable
        });
    }
    else if (!(creatable instanceof NotificationItemModel)) {
        item = NotificationItemModel.create(creatable as NotificationItemProps);
    }
    else
        item = creatable;


    if (item)
        addNotification(item)
}

/**
 * Used to notify the server that the trial banner has been dismissed
 */
export function setTrialBannerDismissSessionKey() : Promise<any> {

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('core', 'dismissCoreWarnings.api'),
            method: 'POST'
        })
    });
}