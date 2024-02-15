import React, { FC, memo } from 'react';
import { getServerContext } from '@labkey/api';

import { LKS_PRODUCT_ID } from '../../app/constants';

import { imageURL } from '../../url/ActionURL';

import { ProductAppMenuItem } from './ProductAppMenuItem';
import { ProductModel } from './models';
import { PRODUCT_ID_IMG_SRC_MAP } from './constants';

export const DEFAULT_ICON_URL = imageURL('_images', 'mobile-logo-seattle.svg');
export const DEFAULT_ICON_ALT_URL = imageURL('_images', 'mobile-logo-overcast.svg');

interface ProductAppsDrawerProps {
    onClick: (productId: string) => void;
    products: ProductModel[];
}

export const ProductAppsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { products, onClick } = props;

    return (
        <>
            <ProductAppMenuItem
                key={LKS_PRODUCT_ID}
                iconUrl={DEFAULT_ICON_URL}
                iconUrlAlt={DEFAULT_ICON_ALT_URL}
                productId={LKS_PRODUCT_ID}
                title="LabKey Server"
                subtitle={getServerContext().project?.title ?? 'Root'}
                onClick={onClick}
            />
            {products.map(product => {
                const imgSrc = PRODUCT_ID_IMG_SRC_MAP[product.productId.toLowerCase()];
                let iconUrl = imgSrc?.iconUrl ?? DEFAULT_ICON_URL;
                let iconUrlAlt = imgSrc?.iconUrlAlt ?? DEFAULT_ICON_ALT_URL;
                if (product.disabled) {
                    iconUrl = imgSrc?.iconUrlDisabled ?? DEFAULT_ICON_URL;
                    iconUrlAlt = imgSrc?.iconUrlDisabled ?? DEFAULT_ICON_URL;
                }
                return (
                    <ProductAppMenuItem
                        key={product.productId}
                        disabled={product.disabled}
                        iconUrl={iconUrl}
                        iconUrlAlt={iconUrlAlt}
                        productId={product.productId}
                        title={product.productName}
                        subtitle={product.disabled ? 'Application not enabled in this location' : undefined}
                        onClick={onClick}
                    />
                );
            })}
        </>
    );
});
