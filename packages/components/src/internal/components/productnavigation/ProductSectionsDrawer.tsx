import React, { FC, memo } from 'react';

import { Container } from '../base/models/Container';
import { ProductModel } from './model';

interface ProductAppsDrawerProps {
    product: ProductModel;
    project: Container;
}

export const ProductSectionsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, project } = props;

    return (
        <>
            <li>{product.productName} sections for {project.title} go here</li>
        </>
    );
});
