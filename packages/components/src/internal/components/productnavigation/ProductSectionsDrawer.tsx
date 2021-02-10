import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { Container, LoadingSpinner, AppURL, createProductUrl, ProductMenuModel, Alert } from '../../..';
import { FREEZER_MANAGER_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from '../../app/constants';

import { ProductModel, ProductSectionModel } from './model';

// special case so that we request the LKFM section with the LKSM product
const PRODUCT_ID_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: List.of(SAMPLE_MANAGER_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID),
};

// special case list of section keys to skip for this menu
const SECTION_KEYS_TO_SKIP = ['user', 'biologicsWorkflow'];

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project } = props;
    const [error, setError] = useState<string>();
    const [sections, setSections] = useState<ProductSectionModel[]>();
    const isSameContainer = useMemo(() => getServerContext().container.id === project.id, [project]);

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            userMenuProductId: product.productId,
            productIds: PRODUCT_ID_MAP[product.productId.toLowerCase()] ?? List.of(product.productId),
        });

        model.getMenuSections(0)
            .then(modelSections => {
                const menuSections = [
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

                setSections(menuSections);
            })
            .catch(error => {
                setError('Error: unable to load product sections.');
            });
    }, [product]);

    return <ProductSectionsDrawerImpl error={error} sections={sections} />;
});

interface ProductSectionsDrawerImplProps {
    error: string;
    sections: ProductSectionModel[];
}

const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { sections, error } = props;

    const navigate = useCallback((section: ProductSectionModel) => {
        window.location.href = section.url.toString();
    }, []);

    if (error) {
        return <Alert className="error-item">{error}</Alert>;
    }

    if (!sections) {
        return <LoadingSpinner wrapperClassName="loading-item" />;
    }

    return (
        <>
            {sections.map(section => {
                return (
                    <div key={section.key} className="clickable-item" onClick={() => navigate(section)}>
                        {section.label}
                    </div>
                );
            })}
        </>
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
