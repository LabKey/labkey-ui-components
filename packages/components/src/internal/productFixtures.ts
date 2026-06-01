/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import {
    BIOLOGICS_APP_PROPERTIES,
    FREEZER_MANAGER_APP_PROPERTIES,
    LIMS_APP_PROPERTIES,
    ProductFeature,
    SAMPLE_MANAGER_APP_PROPERTIES,
} from './app/constants';
import { BIOLOGICS_PRODUCT_ID, LIMS_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from './app/products';

export const TEST_LK_LIMS_MODULE_CONTEXT = {
    api: {
        moduleNames: ['samplemanagement', 'inventory', 'assay', 'labbook'],
    },
    samplemanagement: {
        productId: LIMS_APP_PROPERTIES.productId,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [
            ProductFeature.Workflow,
            ProductFeature.ELN,
            ProductFeature.Assay,
            ProductFeature.ApiKeys,
            ProductFeature.CalculatedFields,
            ProductFeature.DataChangeCommentRequirement,
            ProductFeature.CustomImportTemplates,
            ProductFeature.AdvancedWorkflow,
        ],
        primaryApplicationId: LIMS_PRODUCT_ID,
    }
};

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
        productFeatures: [
            ProductFeature.Workflow,
            ProductFeature.ELN,
            ProductFeature.Assay,
            ProductFeature.ApiKeys,
            ProductFeature.CalculatedFields,
            ProductFeature.DataChangeCommentRequirement,
            ProductFeature.CustomImportTemplates,
        ],
        primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID,
    }
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
        primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID,
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
        productFeatures: [ProductFeature.Workflow],
        primaryApplicationId: SAMPLE_MANAGER_PRODUCT_ID,
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
        productFeatures: [ProductFeature.ApiKeys, ProductFeature.Assay],
    },
};

export const TEST_BIO_LIMS_STARTER_MODULE_CONTEXT = {
    biologics: {
        productId: BIOLOGICS_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [
            ProductFeature.Assay,
            ProductFeature.ELN,
            ProductFeature.FreezerManagement,
            ProductFeature.Folders,
            ProductFeature.SampleManagement,
            ProductFeature.Workflow,
            ProductFeature.ApiKeys,
            ProductFeature.CalculatedFields,
            ProductFeature.DataChangeCommentRequirement,
            ProductFeature.CustomImportTemplates,
            ProductFeature.ConditionalFormatting,
        ],
        primaryApplicationId: BIOLOGICS_PRODUCT_ID,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
};

export const TEST_BIO_LIMS_ENTERPRISE_MODULE_CONTEXT = {
    biologics: {
        productId: BIOLOGICS_APP_PROPERTIES.productId,
    },
    core: {
        productFeatures: [
            ProductFeature.Assay,
            ProductFeature.ELN,
            ProductFeature.FreezerManagement,
            ProductFeature.Folders,
            ProductFeature.SampleManagement,
            ProductFeature.Workflow,
            ProductFeature.ApiKeys,
            ProductFeature.CalculatedFields,
            ProductFeature.DataChangeCommentRequirement,
            ProductFeature.Media,
            ProductFeature.CustomImportTemplates,
            ProductFeature.ConditionalFormatting,
        ],
        primaryApplicationId: BIOLOGICS_PRODUCT_ID,
    },
    inventory: {
        productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
    },
    samplemanagement: {
        productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
    },
};
