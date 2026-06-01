/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext, PermissionTypes } from '@labkey/api';

import classNames from 'classnames';

import { LKS_PRODUCT_ID } from '../../app/products';
import { hasPremiumModule } from '../../app/utils';

import { naturalSortByProperty } from '../../../public/sort';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { resolveErrorMessage } from '../../util/messaging';

import { fetchContainers } from '../permissions/actions';

import { getContainerTabs, getRegisteredProducts } from './actions';
import { ADMIN_LOOK_AND_FEEL_URL, PRODUCT_SERVICES_URL } from './constants';
import { ContainerTabModel, ProductModel } from './models';
import { ProductAppsDrawer } from './ProductAppsDrawer';
import { ProductSectionsDrawer } from './ProductSectionsDrawer';
import { ProductLKSDrawer } from './ProductLKSDrawer';
import { ProductNavigationHeader } from './ProductNavigationHeader';

// exported for jest testing
export function getSelectedProduct(products: ProductModel[], productId: string): ProductModel {
    return products?.find(product => product.productId === productId);
}

interface ProductNavigationMenuProps {
    disableLKSContainerLink?: boolean;
    menuRef: MutableRefObject<HTMLDivElement>;
    onCloseMenu?: () => void;
}

interface ProductNavigationMenuImplProps extends ProductNavigationMenuProps {
    disableLKSContainerLink: boolean;
    error: string;
    homeVisible: boolean;
    onSelection: (productId: string) => void;
    products: ProductModel[];
    selectedProductId: string;
    tabs: ContainerTabModel[];
}

export const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const { error, products, homeVisible, disableLKSContainerLink, tabs, onCloseMenu, selectedProductId, onSelection } =
        props;

    const selectedProduct = getSelectedProduct(products, selectedProductId);
    const showProductDrawer = selectedProductId === undefined;
    const showLKSDrawer = selectedProductId === LKS_PRODUCT_ID;
    const showSectionsDrawer = selectedProduct !== undefined;
    const { user } = getServerContext();
    const showMenuSettings = useMemo(() => {
        return hasPremiumModule() && user.isRootAdmin;
    }, [user]);
    const className = classNames('product-navigation-container', 'navbar-menu__content', { wider: showProductDrawer });
    const onHeaderClick = useCallback(() => onSelection(undefined), [onSelection]);
    const loading = !products || !tabs;

    return (
        <div className={className} ref={props.menuRef}>
            <ProductNavigationHeader
                productId={selectedProductId}
                onClick={onHeaderClick}
                title={selectedProduct?.productName}
            />

            {loading && <LoadingSpinner wrapperClassName="product-navigation-loading-item" />}

            {error && <Alert>{error}</Alert>}

            {!loading && !error && (
                <ul className="product-navigation-listing">
                    {showProductDrawer && <ProductAppsDrawer products={products} onClick={onSelection} />}
                    {showLKSDrawer && (
                        <ProductLKSDrawer
                            disableLKSContainerLink={disableLKSContainerLink}
                            showHome={homeVisible}
                            tabs={tabs}
                        />
                    )}
                    {showSectionsDrawer && (
                        <ProductSectionsDrawer product={selectedProduct} onCloseMenu={onCloseMenu} />
                    )}
                </ul>
            )}

            {selectedProductId === undefined && (
                <div className="product-navigation-footer">
                    {showMenuSettings && (
                        <div className="bottom-padding-less">
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
ProductNavigationMenuImpl.displayName = 'ProductNavigationMenuImpl';

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    const { disableLKSContainerLink } = props;
    const { homeContainer } = getServerContext();
    const [error, setError] = useState<string>();
    const [products, setProducts] = useState<ProductModel[]>(); // the array of products that have been registered for this LK server
    const [tabs, setTabs] = useState<ContainerTabModel[]>(); // the array of container tabs for the current LK container
    const [selectedProductId, setSelectedProductId] = useState<string>();
    const [homeVisible, setHomeVisible] = useState<boolean>(false); // is home project visible to this user.

    const onSelection = useCallback((productId: string) => {
        setSelectedProductId(productId);
    }, []);

    useEffect(() => {
        getRegisteredProducts()
            .then(setProducts)
            .catch(e => {
                setError(resolveErrorMessage(e));
            });

        fetchContainers({
            container: homeContainer,
            includeEffectivePermissions: true,
            includeSubfolders: false,
        })
            .then(containers => {
                setHomeVisible(containers[0]?.effectivePermissions?.indexOf(PermissionTypes.Read) > -1);
            })
            .catch(() => {
                setError('Error: unable to get LabKey folder information.');
            });

        getContainerTabs()
            .then(setTabs)
            .catch(e => {
                setError(resolveErrorMessage(e));
            });
    }, []);

    return (
        <ProductNavigationMenuImpl
            disableLKSContainerLink={disableLKSContainerLink}
            error={error}
            homeVisible={homeVisible}
            onCloseMenu={props.onCloseMenu}
            onSelection={onSelection}
            menuRef={props.menuRef}
            products={products?.sort(naturalSortByProperty('productName'))}
            selectedProductId={selectedProductId}
            tabs={tabs}
        />
    );
});
ProductNavigationMenu.displayName = 'ProductNavigationMenu';
