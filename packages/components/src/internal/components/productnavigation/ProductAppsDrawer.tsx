import React, { FC, memo } from 'react';
import { getServerContext } from '@labkey/api';

import { Container, imageURL } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import { ProductAppMenuItem } from './ProductAppMenuItem';
import { ProductModel } from './models';
import { PRODUCT_ID_IMG_SRC_MAP } from './constants';

export const DEFAULT_ICON_URL = imageURL('_images', 'mobile-logo-seattle.svg');
export const DEFAULT_ICON_ALT_URL = imageURL('_images', 'mobile-logo-overcast.svg');

interface ProductAppsDrawerProps {
    products: ProductModel[];
    productProjectMap: Record<string, Container[]>;
    onClick: (productId: string, project?: Container) => void;
}

export const ProductAppsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { products, productProjectMap, onClick } = props;

    return (
        <>
            <ProductAppMenuItem
                key={LKS_PRODUCT_ID}
                iconUrl={DEFAULT_ICON_URL}
                iconUrlAlt={DEFAULT_ICON_ALT_URL}
                title="LabKey Server"
                subtitle={getServerContext().project?.title ?? 'Root'}
                onClick={() => onClick(LKS_PRODUCT_ID)}
            />
            {products.map(product => {
                return (
                    <ProductAppMenuItem
                        key={product.productId}
                        iconUrl={PRODUCT_ID_IMG_SRC_MAP[product.productId.toLowerCase()]?.iconUrl ?? DEFAULT_ICON_URL}
                        iconUrlAlt={
                            PRODUCT_ID_IMG_SRC_MAP[product.productId.toLowerCase()]?.iconUrlAlt ?? DEFAULT_ICON_ALT_URL
                        }
                        title={product.productName}
                        subtitle={getProductSubtitle(productProjectMap[product.productId])}
                        onClick={() => onClick(product.productId)}
                    />
                );
            })}
        </>
    );
});

// exported for jest testing
export function getProductSubtitle(projects: Container[]): string {
    if (projects?.length === 1) {
        return projects[0].title;
    }

    if (!projects || projects.length === 0) {
        return 'No Projects';
    }

    return projects.length + ' Projects';
}
