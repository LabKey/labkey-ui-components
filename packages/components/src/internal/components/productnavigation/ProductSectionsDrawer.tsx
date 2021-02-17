import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { Container, AppURL, createProductUrl, ProductMenuModel, Alert } from '../../..';

import { ProductModel, ProductSectionModel } from './models';
import { PRODUCT_ID_SECTION_QUERY_MAP, SECTION_KEYS_TO_SKIP } from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
    closeMenu?: () => void;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project, closeMenu } = props;
    const [error, setError] = useState<string>();
    const [sections, setSections] = useState<ProductSectionModel[]>();
    const isSameContainer = useMemo(() => getServerContext().container.id === project?.id, [project]);

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            userMenuProductId: product.productId,
            productIds: PRODUCT_ID_SECTION_QUERY_MAP[product.productId.toLowerCase()] ?? List.of(product.productId),
        });

        model.getMenuSections(0)
            .then(modelSections => {
                let menuSections = [
                    new ProductSectionModel({
                        key: 'home',
                        label: 'Dashboard',
                        url: getProductSectionUrl(product.productId, 'home', project.path, isSameContainer),
                    })
                ];

                modelSections.filter(modelSection => SECTION_KEYS_TO_SKIP.indexOf(modelSection.key) === -1)
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
                menuSections = menuSections.sort((a, b) => {
                    if (a.key === 'freezers' && b.key === 'workflow') {
                        return -1;
                    }
                    return 0;
                });

                setSections(menuSections);
            })
            .catch(error => {
                setError('Error: unable to load product sections.');
            });
    }, [product]);

    return <ProductSectionsDrawerImpl error={error} sections={sections} closeMenu={closeMenu} />;
});

interface ProductSectionsDrawerImplProps {
    error: string;
    sections: ProductSectionModel[];
    closeMenu?: () => void;
}

const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { sections, error, closeMenu } = props;

    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const navigate = useCallback((section: ProductSectionModel) => {
        window.location.href = section.url.toString();
        closeMenu?.();
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

function getProductSectionUrl(productId: string, key: string, containerPath: string, isSameContainer: boolean): string {
    // if the selected project is the current container and the section is for the same product we are already in, then keep the urls as route changes
    let url;
    if (isSameContainer && productId.toLowerCase() === ActionURL.getController().toLowerCase()) {
        url = AppURL.create(key).toHref();
    } else {
        url = createProductUrl(productId, undefined, AppURL.create(key), containerPath);
    }

    return url;
}
