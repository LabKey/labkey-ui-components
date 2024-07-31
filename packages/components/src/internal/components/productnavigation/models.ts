import { immerable } from 'immer';

import { isProductNavigationEnabled } from '../../app/utils';
import { BIOLOGICS_APP_PROPERTIES, LIMS_APP_PROPERTIES, SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { AppURL } from '../../url/AppURL';

import {
    APPLICATION_SECTION_METRIC,
    BIOLOGICS_SECTION_METRIC,
    LIMS_SECTION_METRIC,
    SAMPLE_MANAGER_SECTION_METRIC
} from './constants';

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
        Object.assign(this, values, { disabled: !isProductNavigationEnabled(values?.productId) });
    }

    get navigationMetric() {
        if (this.productId === LIMS_APP_PROPERTIES.productId) {
            return LIMS_SECTION_METRIC;
        } else if (this.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
            return SAMPLE_MANAGER_SECTION_METRIC;
        } else if (this.productId === BIOLOGICS_APP_PROPERTIES.productId) {
            return BIOLOGICS_SECTION_METRIC;
        } else {
            return APPLICATION_SECTION_METRIC;
        }
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
