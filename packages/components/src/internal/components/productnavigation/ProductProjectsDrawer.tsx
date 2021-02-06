import React, { FC, memo } from 'react';

import { Container } from '../base/models/Container';
import { ProductModel } from './model';

interface ProductAppsDrawerProps {
    product: ProductModel;
    projects: Container[];
}

export const ProductProjectsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, projects } = props;

    return (
        <>
            {projects.map(project => {
                return <li>{project.title} with chevron to select it</li>;
            })}
        </>
    );
});
