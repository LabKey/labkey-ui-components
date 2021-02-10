import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';

import { LoadingSpinner, Alert, Container, naturalSortByProperty } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import { getRegisteredProducts } from './actions';
import { ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductProjectsDrawer } from './ProductProjectsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';

export interface ProductNavigationMenuProps {}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); //the array of products that have been registered for this LK server
    const [projects, setProjects] = useState<Container[]>(); //the array of products that have been registered for this LK server

    useEffect(() => {
        getRegisteredProducts().then(setProducts).catch(setError);

        Security.getContainers({
            containerPath: '/', // use root container to get the projects
            includeSubfolders: false,
            includeEffectivePermissions: false,
            success: data => {
                setProjects(data.children.map(child => new Container(child)));
            },
            failure: errorInfo => {
                console.error(errorInfo);
                setError('Error: unable to get project information.');
            },
        });
    }, []);

    return (
        <ProductNavigationMenuImpl
            error={error}
            projects={projects}
            products={products?.sort(naturalSortByProperty('productName'))}
            productProjectMap={getProductProjectsMap(products, projects)}
        />
    );
});

interface ProductNavigationMenuImplProps {
    error: string;
    products: ProductModel[];
    projects: Container[];
    productProjectMap: { [key: string]: Container[] };
}

const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const { error, products, projects, productProjectMap } = props;
    const [selectedProductId, setSelectedProductId] = useState<string>();
    const [selectedProject, setSelectedProject] = useState<Container>();

    const onSelection = useCallback(
        (productId: string, project?: Container) => {
            if (project) {
                setSelectedProject(project);
            } else if (productId !== undefined && productProjectMap[productId]?.length === 1) {
                setSelectedProject(productProjectMap[productId][0]);
            } else {
                setSelectedProject(undefined);
            }

            setSelectedProductId(productId);
        },
        [setSelectedProductId, setSelectedProject, productProjectMap]
    );

    if (error) {
        return <Alert>{error}</Alert>;
    }

    if (!products || !projects) {
        return <LoadingSpinner wrapperClassName="loading-item" />;
    }

    const selectedProduct = getSelectedProduct(products, selectedProductId);
    const productProjects = selectedProduct ? productProjectMap[selectedProduct.productId] : undefined;
    const showSectionsDrawer = selectedProject !== undefined;
    const showProjectsDrawer = !selectedProject && productProjects?.length > 0;

    return (
        <div className="product-navigation-container">
            <h3 className="product-navigation-header navbar-menu-header">
                <div className="navbar-icon-connector" />
                <ProductNavigationHeader
                    title={selectedProject?.title || selectedProduct?.productName}
                    productId={selectedProductId}
                    onClick={() => onSelection(selectedProject && productProjects?.length > 1 ? selectedProductId : undefined)}
                />
            </h3>
            <ul className="product-navigation-listing">
                {selectedProductId === undefined && <ProductAppsDrawer {...props} onClick={onSelection} />}
                {selectedProductId === LKS_PRODUCT_ID && <ProductLKSDrawer projects={projects} />}
                {showProjectsDrawer && (
                    <ProductProjectsDrawer product={selectedProduct} projects={productProjects} onClick={onSelection} />
                )}
                {showSectionsDrawer && <ProductSectionsDrawer product={selectedProduct} project={selectedProject} />}
            </ul>
            {selectedProductId === undefined && (
                <div className="product-navigation-footer">
                    <a href="https://www.labkey.com/products-services/" target="_blank" rel="noopener noreferrer">
                        More LabKey Solutions
                    </a>
                </div>
            )}
        </div>
    );
});

function getSelectedProduct(products: ProductModel[], productId: string): ProductModel {
    return products?.find(product => product.productId === productId);
}

function getProductProjectsMap(products?: ProductModel[], projects?: Container[]): { [key: string]: Container[] } {
    const map = {};

    if (products && projects) {
        products.forEach(product => (map[product.productId] = []));
        for (const project of projects) {
            for (const product of products) {
                if (project.activeModules.indexOf(product.moduleName) > -1) {
                    map[product.productId].push(project);
                    break;
                }
            }
        }
    }

    return map;
}
