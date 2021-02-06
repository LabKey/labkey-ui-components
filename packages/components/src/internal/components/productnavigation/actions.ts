import { Ajax, Utils, ActionURL } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { ProductModel } from './model';

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
