/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Ajax, Utils } from '@labkey/api';

import { buildURL } from '../../url/ActionURL';

import { NotificationItemModel, NotificationItemProps } from './model';
import { addNotification } from './global';

export type NotificationCreatable = string | NotificationItemProps | NotificationItemModel;

/**
 * Create a notification that can be displayed on pages within the application
 * @param creatable
 */
export function createNotification(creatable: NotificationCreatable) {
    let item: NotificationItemModel;
    if (Utils.isString(creatable)) {
        item = NotificationItemModel.create({
            message: creatable,
        });
    } else if (!(creatable instanceof NotificationItemModel)) {
        item = NotificationItemModel.create(creatable as NotificationItemProps);
    } else item = creatable;

    if (item) addNotification(item);
}

/**
 * Used to notify the server that the trial banner has been dismissed
 */
export function setTrialBannerDismissSessionKey(): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('core', 'dismissWarnings.api'),
            method: 'POST',
        });
    });
}
