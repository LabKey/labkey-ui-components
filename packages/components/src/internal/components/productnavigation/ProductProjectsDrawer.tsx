import React, { FC, memo } from 'react';

import { Container } from '../base/models/Container';
import { ProductModel } from './model';

interface ProductAppsDrawerProps {
    product: ProductModel;
    projects: Container[];
    onClick: (productId: string, project?: Container) => void;
}

export const ProductProjectsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, projects, onClick } = props;

    return (
        <>
            {projects.map(project => {
                return (
                    <div key={project.id} className="project-item" onClick={() => onClick(product.productId, project)}>
                        {project.title}
                        <i className="fa fa-chevron-right nav-icon" />
                    </div>
                );
            })}
        </>
    );
});
