import React, { FC, memo } from 'react';

import { Container, Alert, buildURL } from '../../..';

import { ProductModel } from './models';
import { LK_DOC_DEFAULT, PRODUCT_DOC_MAP } from "./constants";
import { getServerContext } from "@labkey/api";

interface ProductAppsDrawerProps {
    product: ProductModel;
    projects: Container[];
    onClick: (productId: string, project?: Container) => void;
}

export const ProductProjectsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, projects, onClick } = props;
    const { user } = getServerContext();

    return (
        <>
            {projects.map(project => {
                return (
                    <div key={project.id} className="clickable-item" onClick={() => onClick(product.productId, project)}>
                        {project.title}
                        <i className="fa fa-chevron-right nav-icon" />
                    </div>
                );
            })}
            {projects.length === 0 && (
                <div className="product-empty">
                    <Alert bsStyle="info">No available {product.productName} projects on this server.</Alert>
                    {user.isRootAdmin && (
                        <a className="start-project" href={buildURL('admin', 'createFolder')}>
                            Start a {product.productName} project
                        </a>
                    )}
                    <a className="learn-more" href={PRODUCT_DOC_MAP[product.productId.toLowerCase()] ?? LK_DOC_DEFAULT} target="_blank" rel="noopener noreferrer">
                        Learn more about {product.productName}
                    </a>
                </div>
            )}
        </>
    );
});
