// Note: This whole file was created so we could avoid circular dependencies with AppURL please do not add any code
// that imports AppURL to this file, either directly (by adding an import to AppURL in this file) or indirectly (by
// adding imports which import AppURL).
import { getServerContext } from '@labkey/api';

import { ModuleContext, resolveModuleContext } from '../components/base/ServerContext';
import { Container } from '../components/base/models/Container';

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

export function isPremiumProductEnabled(moduleContext?: ModuleContext): boolean {
    return isSampleManagerEnabled(moduleContext) || isBiologicsEnabled(moduleContext);
}

export function isLIMSEnabled(moduleContext?: ModuleContext, container?: Container): boolean {
    // The check for folder type is not ideal here, but since the product is provided through the sampleManagement module
    // a simple module check isn't sufficient. Since the product configuration is global to the server, we have no good
    // way to know which URLs to construct in a particular container except by inspecting the folder type (at the moment).
    return isSampleManagerEnabled(moduleContext) && (container ?? getServerContext().container)?.folderType === 'LIMS';
}

export function getPrimaryAppProductId(moduleContext?: ModuleContext): string {
    if (isBiologicsEnabled(moduleContext)) return BIOLOGICS_PRODUCT_ID;
    if (isLIMSEnabled(moduleContext)) return LIMS_PRODUCT_ID;
    if (isSampleManagerEnabled(moduleContext)) return SAMPLE_MANAGER_PRODUCT_ID;
    if (isFreezerManagementEnabled(moduleContext)) return FREEZER_MANAGER_PRODUCT_ID;
    return undefined;
}
