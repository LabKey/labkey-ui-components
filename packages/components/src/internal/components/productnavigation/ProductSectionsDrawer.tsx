import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { List } from 'immutable';

import { Container } from '../base/models/Container';
import { ProductModel, ProductSectionModel } from './model';
import { ProductMenuModel } from "../navigation/model";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { AppURL, createProductUrl } from "../../url/AppURL";
import { FREEZER_MANAGER_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from "../../app/constants";

// special case so that we request the LKFM section with the LKSM product
const PRODUCT_ID_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID]: List.of(SAMPLE_MANAGER_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID),
};

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project } = props;
    const [sections, setSections] = useState<ProductSectionModel[]>();

    useEffect(() => {
        const model = new ProductMenuModel({
            currentProductId: product.productId,
            userMenuProductId: product.productId,
            productIds: PRODUCT_ID_MAP[product.productId] ?? List.of(product.productId),
        });

        model.getMenuSections()
            .then(modelSections => {
                const menuSections = [
                    new ProductSectionModel({
                        label: 'Dashboard',
                        url: createProductUrl(product.productId, undefined, '', project.path),
                    })
                ];

                modelSections.filter(modelSection => modelSection.key !== 'user')
                    .forEach(modelSection => {
                        menuSections.push(
                            new ProductSectionModel({
                                key: modelSection.key,
                                label: modelSection.label,
                                url: createProductUrl(modelSection.productId, undefined, AppURL.create(modelSection.key), project.path)
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
        return <LoadingSpinner />;
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
