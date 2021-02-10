import { immerable } from 'immer';

import { AppURL } from '../../..';

export class ProductModel {
    [immerable] = true;

    moduleName: string;
    sectionNames: string[];
    documentationUrl: string;
    productId: string;
    productName: string;
    documentationLabel: string;

    constructor(values?: Partial<ProductModel>) {
        Object.assign(this, values);
    }
}

export class ProductSectionModel {
    [immerable] = true;

    key: string;
    label: string;
    url: string | AppURL;

    constructor(values?: Partial<ProductSectionModel>) {
        Object.assign(this, values);
    }
}

export class ContainerTabModel {
    [immerable] = true;

    id: string;
    text: string;
    href: string;
    disabled: boolean;

    constructor(values?: Partial<ProductSectionModel>) {
        Object.assign(this, values);
    }
}
