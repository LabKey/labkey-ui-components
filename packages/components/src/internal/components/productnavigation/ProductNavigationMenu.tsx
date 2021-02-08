import React, { FC, memo, PureComponent, ReactNode, useCallback, useState } from 'react';
import { Security } from '@labkey/api';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Container } from '../base/models/Container';
import { naturalSortByProperty } from '../../../public/sort';
import { getRegisteredProducts } from './actions';
import { ProductModel } from './model';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductProjectsDrawer } from './ProductProjectsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from "./ProductNavigationHeader";

export const LKS_PRODUCT_ID = 'LabKeyServer';

interface ProductNavigationMenuProps {}

interface State {
    error: string;
    /**
     * the array of products that have been registered for this LK server
     */
    products: ProductModel[];
    /**
     * the array of projects which the current user has access to on the LK server
     */
    projects: Container[];
}

export class ProductNavigationMenu extends PureComponent<ProductNavigationMenuProps> {
    state: Readonly<State> = {
        error: undefined,
        products: undefined,
        projects: undefined,
    };

    componentDidMount(): void {
        this.initProducts();
        this.initProjects();
    }

    initProducts(): void {
        getRegisteredProducts()
            .then(products => {
                this.setState(() => ({ products }));
            })
            .catch(error => {
                this.setState(() => ({
                    error, // TODO verify error message from the server
                    products: [],
                }));
            });
    }

    initProjects(): void {
        Security.getContainers({
            containerPath: '/', // use root container to get the projects
            includeSubfolders: false,
            includeEffectivePermissions: false,
            success: data => {
                this.setState(() => ({ projects: data.children.map(data => new Container(data)) }));
            },
            failure: errorInfo => {
                console.error(errorInfo);
                this.setState(() => ({
                    error: 'Error: unable to get project information.', // TODO verify error message from the server
                    projects: [],
                }));
            },
        });
    }

    render(): ReactNode {
        const { products, projects } = this.state;

        return (
            <ProductNavigationMenuImpl
                {...this.state}
                products={products?.sort(naturalSortByProperty('productName'))}
                productProjectMap={getProductProjectsMap(products, projects)}
            />
        );
    }
}

// TODO after the LKS item click, API call to get the container tab info

interface ProductNavigationMenuImplProps extends State {
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
        return <LoadingSpinner />;
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
                {selectedProductId === LKS_PRODUCT_ID && <ProductLKSDrawer />}
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
