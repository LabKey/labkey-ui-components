import React, { FC, memo } from 'react';
import { getServerContext, Utils } from '@labkey/api';
import { ICON_URL } from "../../../stories/mock"; // TODO fix me

import { ProductAppMenuItem } from './ProductAppMenuItem';
import { Container } from '../base/models/Container';
import { ProductModel } from './model';
import { LKS_PRODUCT_ID } from './ProductNavigationMenu';

interface ProductAppsDrawerProps {
    products: ProductModel[];
    projects: Container[];
    productProjectMap: {[key: string]: Container[]};
    onClick: (productId: string, project?: Container) => void;
}

export const ProductAppsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { products, projects, productProjectMap, onClick } = props;

    return (
        <>
            <ProductAppMenuItem
                key={LKS_PRODUCT_ID}
                iconUrl={ICON_URL}
                title="LabKey Server"
                subtitle={getServerContext().project.name}
                onClick={() => onClick(LKS_PRODUCT_ID)}
            />
            {products.map(product => {
                return (
                    <ProductAppMenuItem
                        key={product.productId}
                        iconUrl={ICON_URL}
                        title={product.productName}
                        subtitle={getProductSubtitle(productProjectMap[product.productId])}
                        onClick={() => onClick(product.productId)}
                    />
                );
            })}
        </>
    );
});

function getProductSubtitle(projects: Container[]): string {
    if (projects.length === 1) {
        return projects[0].title;
    }

    return Utils.pluralBasic(projects.length, 'Project');
}
