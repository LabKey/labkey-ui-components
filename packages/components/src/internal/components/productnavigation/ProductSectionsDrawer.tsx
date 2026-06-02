/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { getServerContext } from '@labkey/api';

import { FREEZERS_KEY, MEDIA_KEY, NOTEBOOKS_KEY, WORKFLOW_KEY } from '../../app/constants';

import { getAppProductIds } from '../../app/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { Alert } from '../base/Alert';

import { MenuSectionModel, ProductMenuModel } from '../navigation/model';

import { AppURL } from '../../url/AppURL';

import { ProductModel, ProductSectionModel } from './models';
import { APPLICATION_NAVIGATION_METRIC, SECTION_KEYS_TO_SKIP } from './constants';
import { ProductNavigationItem } from './ProductNavigationItem';

export function parseProductMenuSectionResponse(
    modelSections: List<MenuSectionModel>,
    projectPath: string
): ProductSectionModel[] {
    const menuSections = [
        new ProductSectionModel({
            key: 'home',
            label: 'Dashboard',
            url: AppURL.create('home').setContainerPath(projectPath),
        }),
    ];

    modelSections
        .filter(modelSection => SECTION_KEYS_TO_SKIP.indexOf(modelSection.key) === -1)
        .forEach(modelSection => {
            menuSections.push(
                new ProductSectionModel({
                    key: modelSection.key,
                    label: modelSection.label,
                    url: AppURL.create(modelSection.key)
                        .setContainerPath(projectPath)
                        .setProductId(modelSection.productId),
                })
            );
        });

    // special case to sort storage before workflow, media, and notebooks to match the mega menu display for LKSM and LKB
    return menuSections.sort((a, b) => {
        if (a.key === FREEZERS_KEY && (b.key === WORKFLOW_KEY || b.key === MEDIA_KEY || b.key === NOTEBOOKS_KEY)) {
            return -1;
        }
        return 0;
    });
}

interface ProductAppsDrawerProps {
    api?: ComponentsAPIWrapper;
    onCloseMenu?: () => void;
    product: ProductModel;
}

interface ProductSectionsDrawerImplProps extends ProductAppsDrawerProps {
    error: string;
    sections: ProductSectionModel[];
}

// exported for jest testing
export const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { api, sections, error, onCloseMenu, product } = props;

    const onClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, product.navigationMetric);
        onCloseMenu?.();
    }, [api.query, onCloseMenu, product.navigationMetric]);

    if (error) {
        return <Alert className="error-item">{error}</Alert>;
    }

    return (
        <div className="product-navigation-drawer">
            {sections?.map(({ key, label, url }) => (
                <ProductNavigationItem url={url} key={key} id={key} onClick={onClick}>
                    {label}
                </ProductNavigationItem>
            ))}
        </div>
    );
});
ProductSectionsDrawerImpl.displayName = 'ProductSectionsDrawerImpl';

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { api = getDefaultAPIWrapper(), product } = props;
    const { container } = getServerContext(); // Note:
    const [error, setError] = useState<string>();
    const [sections, setSections] = useState<ProductSectionModel[]>();
    const productIds = useMemo((): List<string> => {
        return getAppProductIds(product.productId);
    }, [product.productId]);
    const load = useCallback(async () => {
        // TODO: very odd pattern to create a model just so we can use an API method and throw away the model. We should
        //  move getMenuSections to an APIWrapper.
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            productIds,
        });

        try {
            const modelSections = await model.getMenuSections();
            setSections(parseProductMenuSectionResponse(modelSections, container.path));
        } catch (e) {
            setError('Error: unable to load product sections.');
        }
    }, [container.path, product, productIds]);

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            productIds,
        });

        model
            .getMenuSections()
            .then(modelSections => {
                setSections(parseProductMenuSectionResponse(modelSections, container.path));
            })
            .catch(error => {
                setError('Error: unable to load product sections.');
            });
    }, [container.path, product, productIds]);

    return <ProductSectionsDrawerImpl {...props} api={api} error={error} sections={sections} />;
});
ProductSectionsDrawer.displayName = 'ProductSectionsDrawer';
