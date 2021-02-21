import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { Container, AppURL, createProductUrl, ProductMenuModel, Alert, MenuSectionModel } from '../../..';
import { FREEZERS_KEY, WORKFLOW_KEY } from '../../app/constants';

import { ProductModel, ProductSectionModel } from './models';
import { PRODUCT_ID_SECTION_QUERY_MAP, SECTION_KEYS_TO_SKIP } from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
    onCloseMenu?: () => void;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project, onCloseMenu } = props;
    const { container } = getServerContext();
    const [error, setError] = useState<string>();
    const [sections, setSections] = useState<ProductSectionModel[]>();
    const isSameContainer = useMemo(() => container.id === project?.id, [container, project]);

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            userMenuProductId: product.productId,
            productIds: PRODUCT_ID_SECTION_QUERY_MAP[product.productId.toLowerCase()] ?? List.of(product.productId),
        });

        model
            .getMenuSections(0)
            .then(modelSections => {
                setSections(parseProductMenuSectionResponse(modelSections, product, project, isSameContainer));
            })
            .catch(error => {
                setError('Error: unable to load product sections.');
            });
    }, [product]);

    return <ProductSectionsDrawerImpl error={error} sections={sections} onCloseMenu={onCloseMenu} />;
});

interface ProductSectionsDrawerImplProps {
    error: string;
    sections: ProductSectionModel[];
    onCloseMenu?: () => void;
}

// exported for jest testing
export const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { sections, error, onCloseMenu } = props;

    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const navigate = useCallback((section: ProductSectionModel) => {
        window.location.href = section.url.toString();
        onCloseMenu?.();
    }, []);

    if (error) {
        return <Alert className="error-item">{error}</Alert>;
    }

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {sections?.map(section => {
                return (
                    <ProductClickableItem key={section.key} id={section.key} onClick={() => navigate(section)}>
                        {section.label}
                    </ProductClickableItem>
                );
            })}
        </div>
    );
});

// function below are exported for jest testing

export function getProductSectionUrl(
    productId: string,
    key: string,
    containerPath: string,
    isSameContainer: boolean
): string {
    // if the selected project is the current container and the section is for the same product we are already in, then keep the urls as route changes
    if (isSameContainer && productId.toLowerCase() === ActionURL.getController().toLowerCase()) {
        return AppURL.create(key).toHref();
    }

    return createProductUrl(productId, undefined, AppURL.create(key), containerPath).toString();
}

export function parseProductMenuSectionResponse(
    modelSections: List<MenuSectionModel>,
    product: ProductModel,
    project: Container,
    isSameContainer: boolean
): ProductSectionModel[] {
    const menuSections = [
        new ProductSectionModel({
            key: 'home',
            label: 'Dashboard',
            url: getProductSectionUrl(product.productId, 'home', project.path, isSameContainer),
        }),
    ];

    modelSections
        .filter(modelSection => SECTION_KEYS_TO_SKIP.indexOf(modelSection.key) === -1)
        .forEach(modelSection => {
            menuSections.push(
                new ProductSectionModel({
                    key: modelSection.key,
                    label: modelSection.label,
                    url: getProductSectionUrl(modelSection.productId, modelSection.key, project.path, isSameContainer),
                })
            );
        });

    // special case to sort LKSM storage before workflow to match the mega menu display
    return menuSections.sort((a, b) => {
        if (a.key === FREEZERS_KEY && b.key === WORKFLOW_KEY) {
            return -1;
        }
        return 0;
    });
}
