import { FREEZER_MANAGER_APP_PROPERTIES, ProductFeature, SAMPLE_MANAGER_APP_PROPERTIES } from './app/constants';

export const TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT = {
    api: {
        moduleNames: ['samplemanagement', 'inventory', 'assay', 'labbook'],
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [ProductFeature.Workflow, ProductFeature.ELN, ProductFeature.Assay],
    },
};

export const TEST_LKSM_STARTER_MODULE_CONTEXT = {
    api: {
        moduleNames: ['samplemanagement', 'inventory'],
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [],
    },
};

export const TEST_LKS_STARTER_MODULE_CONTEXT = {
    api: {
        moduleNames: ['samplemanagement', 'inventory', 'assay', 'premium'],
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [ProductFeature.Assay],
    },
};
