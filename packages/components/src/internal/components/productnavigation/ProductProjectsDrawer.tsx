import React, { FC, memo, useEffect, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { Container, Alert, buildURL } from '../../..';

import { ProductModel } from './models';
import { LK_DOC_DEFAULT, PRODUCT_DOC_MAP } from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductAppsDrawerProps {
    product: ProductModel;
    projects: Container[];
    onClick: (productId: string, project?: Container) => void;
}

export const ProductProjectsDrawer: FC<ProductAppsDrawerProps> = memo(props => {
    const { product, projects, onClick } = props;
    const { user } = getServerContext();

    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {projects.map(project => {
                return (
                    <ProductClickableItem key={project.id} id={project.id} onClick={() => onClick(product.productId, project)}>
                        <div className="nav-icon"><i className="fa fa-chevron-right" /></div>
                        <div>{project.title}</div>
                    </ProductClickableItem>
                );
            })}
            {projects.length === 0 && (
                <div className="product-empty">
                    <Alert bsStyle="info">No available {product.productName} projects on this server.</Alert>
                    {user.isRootAdmin && (
                        <a className="start-project" href={buildURL('admin', 'createFolder', { folderType: product.productName }, { container: '/' })}>
                            Start a {product.productName} project
                        </a>
                    )}
                    <a className="learn-more" href={PRODUCT_DOC_MAP[product.productId.toLowerCase()] ?? LK_DOC_DEFAULT} target="_blank" rel="noopener noreferrer">
                        Learn more about {product.productName}
                    </a>
                </div>
            )}
        </div>
    );
});
