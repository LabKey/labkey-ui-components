import { immerable } from 'immer';

import { AppURL } from '../../..';

export class ProductModel {
    [immerable] = true;

    readonly moduleName: string;
    readonly sectionNames: string[];
    readonly documentationUrl: string;
    readonly productId: string;
    readonly productName: string;
    readonly documentationLabel: string;

    constructor(values?: Partial<ProductModel>) {
        Object.assign(this, values);
    }
}

export class ProductSectionModel {
    [immerable] = true;

    readonly key: string;
    readonly label: string;
    readonly url: string | AppURL;

    constructor(values?: Partial<ProductSectionModel>) {
        Object.assign(this, values);
    }
}

export class ContainerTabModel {
    [immerable] = true;

    readonly id: string;
    readonly text: string;
    readonly href: string;
    readonly disabled: boolean;

    constructor(values?: Partial<ContainerTabModel>) {
        Object.assign(this, values);
    }
}
