/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppProperties } from '../../app/models';
import { ModuleContext } from '../base/ServerContext';

import { getAppProductIds } from '../../app/utils';

import { MenuSectionModel, ProductMenuModel } from './model';
import { getUserMenuSection } from './actions';
import { getPrimaryAppProductId } from '../../app/products';

export interface NavigationAPIWrapper {
    initMenuModel: (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerId: string,
        containerPath?: string
    ) => Promise<ProductMenuModel>;
    loadUserMenu: (currentProductId: string, containerPath?: string) => Promise<MenuSectionModel>;
}

export class ServerNavigationAPIWrapper implements NavigationAPIWrapper {
    initMenuModel = async (
        appProperties: AppProperties,
        moduleContext: ModuleContext,
        containerId: string,
        containerPath?: string
    ): Promise<ProductMenuModel> => {
        const primaryProductId = getPrimaryAppProductId(moduleContext);
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

    loadUserMenu = async (currentProductId: string, containerPath?: string): Promise<MenuSectionModel> => {
        try {
            return await getUserMenuSection(currentProductId, containerPath);
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
