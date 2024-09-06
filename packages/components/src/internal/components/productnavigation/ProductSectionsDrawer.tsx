import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { FREEZERS_KEY, MEDIA_KEY, NOTEBOOKS_KEY, WORKFLOW_KEY } from '../../app/constants';

import { getAppProductIds } from '../../app/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { Alert } from '../base/Alert';

import { MenuSectionModel, ProductMenuModel } from '../navigation/model';

import { AppURL, createProductUrl } from '../../url/AppURL';

import { ProductModel, ProductSectionModel } from './models';
import { APPLICATION_NAVIGATION_METRIC, SECTION_KEYS_TO_SKIP } from './constants';
import { ProductClickableItem } from './ProductClickableItem';
import { ProductLKSDrawer } from './ProductLKSDrawer';

interface ProductAppsDrawerProps {
    api?: ComponentsAPIWrapper;
    onCloseMenu?: () => void;
    product: ProductModel;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { api = getDefaultAPIWrapper(), product } = props;
    const currentContainer = getServerContext().container;
    const [error, setError] = useState<string>();
    const [sections, setSections] = useState<ProductSectionModel[]>();

    const productIds = useMemo((): List<string> => {
        return getAppProductIds(product.productId);
    }, [product.productId]);

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            productIds,
        });

        model
            .getMenuSections()
            .then(modelSections => {
                setSections(parseProductMenuSectionResponse(modelSections, product, currentContainer.path));
            })
            .catch(error => {
                setError('Error: unable to load product sections.');
            });
    }, [product]);

    return <ProductSectionsDrawerImpl {...props} api={api} error={error} sections={sections} />;
});
ProductSectionsDrawer.displayName = 'ProductSectionsDrawer';

interface ProductSectionsDrawerImplProps extends ProductAppsDrawerProps {
    error: string;
    sections: ProductSectionModel[];
}

// exported for jest testing
export const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { api, sections, error, onCloseMenu, product } = props;

    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const navigate = useCallback((section: ProductSectionModel) => {
        api.query.incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, product.navigationMetric);
        onCloseMenu?.();
    }, []);

    if (error) {
        return <Alert className="error-item">{error}</Alert>;
    }

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {sections?.map(section => {
                return (
                    <ProductClickableItem
                        href={section.url.toString()}
                        key={section.key}
                        id={section.key}
                        onClick={() => navigate(section)}
                    >
                        {section.label}
                    </ProductClickableItem>
                );
            })}
        </div>
    );
});

// function below are exported for jest testing

export function getProductSectionUrl(productId: string, key: string, containerPath: string): string {
    // if the section is for the same product we are already in, then keep the urls as route changes
    if (productId.toLowerCase() === ActionURL.getController().toLowerCase()) {
        return AppURL.create(key).toHref();
    }

    return createProductUrl(productId, undefined, AppURL.create(key), containerPath).toString();
}

export function parseProductMenuSectionResponse(
    modelSections: List<MenuSectionModel>,
    product: ProductModel,
    projectPath: string
): ProductSectionModel[] {
    const menuSections = [
        new ProductSectionModel({
            key: 'home',
            label: 'Dashboard',
            url: getProductSectionUrl(product.productId, 'home', projectPath),
        }),
    ];

    modelSections
        .filter(modelSection => SECTION_KEYS_TO_SKIP.indexOf(modelSection.key) === -1)
        .forEach(modelSection => {
            menuSections.push(
                new ProductSectionModel({
                    key: modelSection.key,
                    label: modelSection.label,
                    url: getProductSectionUrl(modelSection.productId, modelSection.key, projectPath),
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
