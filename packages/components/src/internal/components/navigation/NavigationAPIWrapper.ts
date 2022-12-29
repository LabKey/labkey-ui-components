import { AppProperties } from '../../app/models';
import { ModuleContext } from '../base/ServerContext';

import { getAppProductIds, getPrimaryAppProperties } from '../../app/utils';

import { ProductMenuModel } from './model';

export interface NavigationAPIWrapper {
    initMenuModel: (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerId: string,
        containerPath?: string
    ) => Promise<ProductMenuModel>;
}

export class ServerNavigationAPIWrapper implements NavigationAPIWrapper {
    initMenuModel = async (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerId: string,
        containerPath?: string
    ): Promise<ProductMenuModel> => {
        const primaryProductId = getPrimaryAppProperties(moduleContext).productId;
        const menuModel = new ProductMenuModel({
            containerId,
            containerPath,
            currentProductId: appProperties?.productId ?? primaryProductId,
            userMenuProductId: primaryProductId,
            productIds: getAppProductIds(primaryProductId),
        });

        try {
            const sections = await menuModel.getMenuSections();
            return menuModel.setLoadedSections(sections);
        } catch (e) {
            console.error('Problem retrieving product menu data.', e);
            return menuModel.setError('Error in retrieving product menu data. Please contact your site administrator.');
        }
    };
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getNavigationTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<NavigationAPIWrapper> = {}
): NavigationAPIWrapper {
    return {
        initMenuModel: mockFn(),
        ...overrides,
    };
}
