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
    onClick: (productId: string, project?: Container) => void;
}

export const ProductAppsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { products, onClick } = props;

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
                const imgSrc = PRODUCT_ID_IMG_SRC_MAP[product.productId.toLowerCase()];
                let iconUrl;
                let iconUrlAlt = DEFAULT_ICON_ALT_URL;
                if (product.disabled) {
                    iconUrl = imgSrc?.iconUrlDisabled ?? DEFAULT_ICON_URL;
                }
                else {
                    iconUrl = imgSrc?.iconUrl ?? DEFAULT_ICON_URL;
                    iconUrlAlt = imgSrc?.iconUrlAlt ?? DEFAULT_ICON_ALT_URL;
                }
                return (
                    <ProductAppMenuItem
                        key={product.productId}
                        disabled={product.disabled}
                        iconUrl={iconUrl}
                        iconUrlAlt={iconUrlAlt}
                        title={product.productName}
                        subtitle={product.disabled ? "Application not enabled in this location" : undefined }
                        onClick={() => onClick(product.productId)}
                    />
                );
            })}
        </>
    );
});
