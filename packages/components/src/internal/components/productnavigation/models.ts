import { immerable } from 'immer';

import { AppURL } from '../../..';
import { isProductNavigationEnabled } from '../../app/utils';

export class ProductModel {
    [immerable] = true;

    readonly moduleName: string;
    readonly sectionNames: string[];
    readonly documentationUrl: string;
    readonly productId: string;
    readonly productName: string;
    readonly documentationLabel: string;
    readonly disabled: boolean;

    constructor(values?: Partial<ProductModel>) {
        Object.assign(this, values, {disabled: !isProductNavigationEnabled(values?.productId)});
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
