import { immerable } from 'immer';

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
