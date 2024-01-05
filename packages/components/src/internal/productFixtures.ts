import {
    BIOLOGICS_APP_PROPERTIES,
    FREEZER_MANAGER_APP_PROPERTIES,
    ProductFeature,
    SAMPLE_MANAGER_APP_PROPERTIES,
} from './app/constants';

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
        productFeatures: [ProductFeature.Workflow, ProductFeature.ELN, ProductFeature.Assay, ProductFeature.ApiKeys],
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

export const TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT = {
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
        productFeatures: [
            ProductFeature.Workflow,
        ],
    },
}

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
        productFeatures: [ProductFeature.ApiKeys, ProductFeature.Assay],
    },
};

export const TEST_LIMS_STARTER_MODULE_CONTEXT = {
    biologics: {
        productId: BIOLOGICS_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [
            ProductFeature.Assay,
            ProductFeature.ELN,
            ProductFeature.FreezerManagement,
            ProductFeature.Projects,
            ProductFeature.SampleManagement,
            ProductFeature.Workflow,
            ProductFeature.ApiKeys,
        ],
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
};
