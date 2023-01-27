import { AppProperties } from '../../app/models';
import { ModuleContext } from '../base/ServerContext';

import { getAppProductIds, getPrimaryAppProperties } from '../../app/utils';

import { MenuSectionModel, ProductMenuModel } from './model';
import { getUserMenuSection } from './actions';

export interface NavigationAPIWrapper {
    initMenuModel: (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerId: string,
        containerPath?: string
    ) => Promise<ProductMenuModel>;
    loadUserMenu: (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerPath: string
    ) => Promise<MenuSectionModel>;
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

    loadUserMenu = async (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerPath: string,
    ): Promise<MenuSectionModel> => {
        const primaryProductId = getPrimaryAppProperties(moduleContext).productId;
        try {
            return await getUserMenuSection(appProperties?.productId ?? primaryProductId, containerPath);
        } catch (e) {
            return undefined;
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
        loadUserMenu: mockFn(),
        ...overrides,
    };
}
