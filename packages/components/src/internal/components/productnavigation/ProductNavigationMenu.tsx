import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';

import { LoadingSpinner, Alert, Container, naturalSortByProperty } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import { getRegisteredProducts, getContainerTabs } from './actions';
import { ContainerTabModel, ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductProjectsDrawer } from './ProductProjectsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';

interface ProductNavigationMenuProps {
    onCloseMenu?: () => void;
}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); //the array of products that have been registered for this LK server
    const [projects, setProjects] = useState<Container[]>(); //the array of projects which the current user has access to on the LK server
    const [tabs, setTabs] = useState<ContainerTabModel[]>(); //the array of container tabs for the current LK container

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
                setError('Error: unable to get LabKey folder information.');
            },
        });

        getContainerTabs().then(setTabs).catch(setError);
    }, []);

    return (
        <ProductNavigationMenuImpl
            {...props}
            error={error}
            projects={projects}
            tabs={tabs}
            products={products?.sort(naturalSortByProperty('productName'))}
            productProjectMap={getProductProjectsMap(products, projects)}
        />
    );
});

interface ProductNavigationMenuImplProps extends ProductNavigationMenuProps {
    error: string;
    products: ProductModel[];
    projects: Container[];
    productProjectMap: { [key: string]: Container[] };
    tabs: ContainerTabModel[];
}

const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const { error, products, projects, productProjectMap, tabs, onCloseMenu } = props;
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

    if (!products || !projects || !tabs) {
        return <LoadingSpinner wrapperClassName="product-navigation-loading-item" />;
    }

    const selectedProduct = getSelectedProduct(products, selectedProductId);
    const productProjects = selectedProduct ? productProjectMap[selectedProduct.productId] : undefined;
    const showProductDrawer = selectedProductId === undefined;
    const showLKSDrawer = selectedProductId === LKS_PRODUCT_ID;
    const showSectionsDrawer = selectedProject !== undefined;
    const showProjectsDrawer = !selectedProject && selectedProduct !== undefined;

    return (
        <div className={'product-navigation-container' + (showProductDrawer || (showProjectsDrawer && productProjects.length === 0) ? ' wider' : '')}>
            <h3 className="product-navigation-header navbar-menu-header">
                <div className="navbar-icon-connector" />
                <ProductNavigationHeader
                    title={selectedProject?.title || selectedProduct?.productName}
                    productId={selectedProductId}
                    onClick={() => onSelection(selectedProject && productProjects?.length > 1 ? selectedProductId : undefined)}
                />
            </h3>
            <ul className="product-navigation-listing">
                {showProductDrawer && <ProductAppsDrawer {...props} onClick={onSelection} />}
                {showLKSDrawer && <ProductLKSDrawer projects={projects} tabs={tabs} />}
                {showProjectsDrawer && (
                    <ProductProjectsDrawer product={selectedProduct} projects={productProjects} onClick={onSelection} />
                )}
                {showSectionsDrawer && <ProductSectionsDrawer product={selectedProduct} project={selectedProject} onCloseMenu={onCloseMenu} />}
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
