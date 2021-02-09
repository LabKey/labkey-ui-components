import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { List } from 'immutable';
import { ActionURL, getServerContext } from "@labkey/api";

import { Container } from '../base/models/Container';
import { ProductModel, ProductSectionModel } from './model';
import { ProductMenuModel } from "../navigation/model";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { AppURL, createProductUrl } from "../../url/AppURL";
import { FREEZER_MANAGER_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from "../../app/constants";

// special case so that we request the LKFM section with the LKSM product
const PRODUCT_ID_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: List.of(SAMPLE_MANAGER_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID),
};

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project } = props;
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

                modelSections.filter(modelSection => modelSection.key !== 'user')
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
            });
    }, [product]);

    return <ProductSectionsDrawerImpl sections={sections} />;
});

interface ProductSectionsDrawerImplProps {
    sections: ProductSectionModel[];
}

const ProductSectionsDrawerImpl: FC<ProductSectionsDrawerImplProps> = memo(props => {
    const { sections } = props;

    const navigate = useCallback((section) => {
        window.location.href = section.url;
    }, []);

    if (!sections) {
        return <LoadingSpinner wrapperClassName="loading-item" />;
    }

    return (
        <>
            {sections.map(section => {
                return (
                    <div key={section.key} className="project-item" onClick={() => navigate(section)}>
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
