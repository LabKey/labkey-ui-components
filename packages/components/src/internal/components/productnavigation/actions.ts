import { Ajax, Utils, ActionURL } from '@labkey/api';

import { resolveErrorMessage } from '../../..';

import { ContainerTabModel, ProductModel } from './models';

export function getRegisteredProducts(): Promise<ProductModel[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('product', 'getRegisteredProducts.api'),
            method: 'POST',
            success: Utils.getCallbackWrapper(response => {
                resolve(response.map(data => new ProductModel(data)));
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}

export function getContainerTabs(): Promise<ContainerTabModel[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('admin', 'getFolderTabs.api'),
            method: 'POST',
            success: Utils.getCallbackWrapper(response => {
                resolve(response.map(data => new ContainerTabModel(data)));
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(resolveErrorMessage(response));
            }),
        });
    });
}
