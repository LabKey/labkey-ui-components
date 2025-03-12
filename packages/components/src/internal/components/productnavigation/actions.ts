import { ActionURL } from '@labkey/api';

import { request, SuccessDataResponse } from '../../request';

import { ContainerTabModel, ProductModel } from './models';

export async function getRegisteredProducts(): Promise<ProductModel[]> {
    const response = await request<SuccessDataResponse<Array<Partial<ProductModel>>>>({
        url: ActionURL.buildURL('product', 'getRegisteredProducts.api'),
        method: 'POST',
        errorLogMsg: 'Failed to load registered products',
    });

    const models: ProductModel[] = [];
    response.data?.forEach(data => {
        models.push(new ProductModel(data));
    });

    return models;
}

export async function getContainerTabs(): Promise<ContainerTabModel[]> {
    const response = await request<SuccessDataResponse<Array<Partial<ContainerTabModel>>>>({
        url: ActionURL.buildURL('admin', 'getFolderTabs.api'),
        method: 'POST',
        errorLogMsg: 'Failed to load container tabs',
    });

    const models: ContainerTabModel[] = [];
    response.data?.forEach(data => {
        models.push(new ContainerTabModel(data));
    });

    return models;
}
