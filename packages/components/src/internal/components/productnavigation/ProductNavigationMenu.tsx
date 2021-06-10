import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { getServerContext, Security } from '@labkey/api';

import { Alert, Container, LoadingSpinner, naturalSortByProperty, useServerContext } from '../../..';
import { LKS_PRODUCT_ID } from '../../app/constants';

import { hasPremiumModule } from '../../app/utils';

import { getContainerTabs, getRegisteredProducts } from './actions';
import { ADMIN_LOOK_AND_FEEL_URL, PRODUCT_SERVICES_URL } from './constants';
import { ContainerTabModel, ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';

interface ProductNavigationMenuProps {
    onCloseMenu?: () => void;
    disableLKSContainerLink?: boolean;
}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const { disableLKSContainerLink } = props;
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); // the array of products that have been registered for this LK server
    const [tabs, setTabs] = useState<ContainerTabModel[]>(); // the array of container tabs for the current LK container
    const [selectedProductId, setSelectedProductId] = useState<string>();
    const [homeVisible, setHomeVisible] = useState<boolean>(false); // is home project visible to this user.

    const onSelection = useCallback(
        (productId: string) => {
            setSelectedProductId(productId);
        },
        [setSelectedProductId]
    );

    useEffect(() => {
        getRegisteredProducts().then(setProducts).catch(setError);

        Security.getContainers({
            container: 'home',
            includeSubfolders: false,
            includeEffectivePermissions: false,
            success: data => {
                setHomeVisible(data.userPermissions !== 0);
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
            homeVisible={homeVisible}
            disableLKSContainerLink={disableLKSContainerLink}
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
    homeVisible: boolean;
    disableLKSContainerLink: boolean;
    tabs: ContainerTabModel[];
    selectedProductId: string;
    onSelection: (productId: string) => void;
}

// exported for jest testing
export const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const {
        error,
        products,
        homeVisible,
        disableLKSContainerLink,
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
    const { user } = getServerContext();
    const showMenuSettings = hasPremiumModule() && user.isRootAdmin;

    return (
        <div className={'product-navigation-container' + (showProductDrawer ? ' wider' : '')}>
            <ProductNavigationHeader
                productId={selectedProductId}
                onClick={() => onSelection(undefined)}
                title={selectedProduct?.productName}
            />
            <ul className="product-navigation-listing">
                {showProductDrawer && <ProductAppsDrawer {...props} onClick={onSelection} />}
                {showLKSDrawer && (
                    <ProductLKSDrawer
                        disableLKSContainerLink={disableLKSContainerLink}
                        showHome={homeVisible}
                        tabs={tabs}
                    />
                )}
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
                    {showMenuSettings && (
                        <div className="bottom-spacing-less">
                            <a href={ADMIN_LOOK_AND_FEEL_URL} target="_blank" rel="noopener noreferrer">
                                Menu Settings
                            </a>
                        </div>
                    )}
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
