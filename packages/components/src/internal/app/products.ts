/*
 * Copyright (c) 2025-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
// Note: This whole file was created so we could avoid circular dependencies with AppURL please do not add any code
// that imports AppURL to this file, either directly (by adding an import to AppURL in this file) or indirectly (by
// adding imports which import AppURL).

import { ModuleContext, resolveModuleContext } from '../components/base/ServerContext';

// These ids should match what is used by the MenuProviders in the Java code, so we can avoid toLowerCase comparisons.
export const LKS_PRODUCT_ID = 'LabKeyServer';
export const BIOLOGICS_PRODUCT_ID = 'Biologics';
export const LIMS_PRODUCT_ID = 'LIMS';
export const SAMPLE_MANAGER_PRODUCT_ID = 'SampleManager';
export const FREEZER_MANAGER_PRODUCT_ID = 'FreezerManager';

export function isFreezerManagementEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.inventory !== undefined;
}

export function isBiologicsEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.biologics !== undefined;
}

export function isSampleManagerEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.samplemanagement !== undefined;
}

export function isPremiumApplication(moduleContext?: ModuleContext): boolean {
    const productId = getPrimaryAppProductId(moduleContext);
    return productId === BIOLOGICS_PRODUCT_ID || productId === SAMPLE_MANAGER_PRODUCT_ID || productId === LIMS_PRODUCT_ID;
}

export function biologicsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProductId(moduleContext) === BIOLOGICS_PRODUCT_ID;
}

export function limsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProductId(moduleContext) === LIMS_PRODUCT_ID;
}

export function isLIMSProduct(moduleContext?: ModuleContext): boolean {
    return biologicsIsPrimaryApp(moduleContext) || limsIsPrimaryApp(moduleContext);
}

export function getPrimaryAppProductId(moduleContext?: ModuleContext): string {
    return resolveModuleContext(moduleContext)?.core?.primaryApplicationId;
}

export function sampleManagerIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProductId(moduleContext) === SAMPLE_MANAGER_PRODUCT_ID;
}
