import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { getServerContext, Security } from '@labkey/api';

import { Alert, Container, LoadingSpinner, naturalSortByProperty, useServerContext } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import { getContainerTabs, getRegisteredProducts } from './actions';
import { ADMIN_LOOK_AND_FEEL_URL, PRODUCT_SERVICES_URL } from './constants';
import { ContainerTabModel, ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';
import { hasPremiumModule } from '../../app/utils';

interface ProductNavigationMenuProps {
    onCloseMenu?: () => void;
}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); // the array of products that have been registered for this LK server
    const [projects, setProjects] = useState<Container[]>(); // the array of projects which the current user has access to on the LK server
    const [tabs, setTabs] = useState<ContainerTabModel[]>(); // the array of container tabs for the current LK container
    const [selectedProductId, setSelectedProductId] = useState<string>();

    const onSelection = useCallback(
        (productId: string) => {
            setSelectedProductId(productId);
        },
        [setSelectedProductId]
    );

    useEffect(() => {
        getRegisteredProducts().then(setProducts).catch(setError);

        // TODO replace with query about just the home directory?
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
            error={error}
            projects={projects}
            tabs={tabs}
            products={products?.sort(naturalSortByProperty('productName'))}
            onCloseMenu={props.onCloseMenu}
            selectedProductId={selectedProductId}
            onSelection={onSelection}
        />
    );
});

interface ProductNavigationMenuImplProps extends ProductNavigationMenuProps {
    error: string;
    products: ProductModel[];
    projects: Container[];
    tabs: ContainerTabModel[];
    selectedProductId: string;
    onSelection: (productId: string) => void;
}

// exported for jest testing
export const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const {
        error,
        products,
        projects,
        tabs,
        onCloseMenu,
        selectedProductId,
        onSelection,
    } = props;

    if (error) {
        return <Alert>{error}</Alert>;
    }

    if (!products || !tabs) {
        return <LoadingSpinner wrapperClassName="product-navigation-loading-item" />;
    }

    const selectedProduct = getSelectedProduct(products, selectedProductId);
    const selectedProject = selectedProduct ? new Container(getServerContext().container) : undefined;
    const showProductDrawer = selectedProductId === undefined;
    const showLKSDrawer = selectedProductId === LKS_PRODUCT_ID;
    const showSectionsDrawer = selectedProduct !== undefined;
    const { user } = useServerContext();
    const showMenuSettings = hasPremiumModule() && user.isAppAdmin();

    return (
        <div
            className={
                'product-navigation-container' +
                (showProductDrawer ? ' wider' : '')
            }
        >
            <ProductNavigationHeader
                productId={selectedProductId}
                onClick={() =>
                    onSelection(undefined)
                }
                title={selectedProduct?.productName}
            />
            <ul className="product-navigation-listing">
                {showProductDrawer && <ProductAppsDrawer {...props} onClick={onSelection} />}
                {showLKSDrawer && <ProductLKSDrawer projects={projects} tabs={tabs} />}
                {showSectionsDrawer && (
                    <ProductSectionsDrawer
                        product={selectedProduct}
                        project={selectedProject}
                        onCloseMenu={onCloseMenu}
                    />
                )}
            </ul>
            {selectedProductId === undefined && (
                <div className="product-navigation-footer">
                    {showMenuSettings &&
                        <div className="bottom-spacing-less">
                            <a href={ADMIN_LOOK_AND_FEEL_URL} target="_blank" rel="noopener noreferrer">
                                Menu Settings
                            </a>
                        </div>
                    }
                    <div>
                        <a href={PRODUCT_SERVICES_URL} target="_blank" rel="noopener noreferrer">
                            More LabKey Solutions
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
});

// exported for jest testing
export function getSelectedProduct(products: ProductModel[], productId: string): ProductModel {
    return products?.find(product => product.productId === productId);
}
