/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { LKS_PRODUCT_ID } from '../../app/products';

interface ProductNavigationHeaderProps {
    onClick: () => void;
    productId: string;
    title: string;
}

export const ProductNavigationHeader: FC<ProductNavigationHeaderProps> = memo(props => {
    const { onClick, productId, title } = props;
    const contentCls = classNames('header-title', { clickable: !!productId });
    const onClick_ = useCallback(
        event => {
            // stopImmediatePropagation in order to prevent the document click handler from closing the menu
            event.nativeEvent.stopImmediatePropagation();
            onClick();
        },
        [onClick]
    );

    return (
        <h3 className="product-navigation-header navbar-menu-header">
            <div className="navbar-menu-connector navbar-menu-connector--gray" />
            <span className={contentCls} onClick={productId ? onClick_ : undefined}>
                {productId && <i className="back-icon fa fa-chevron-left" />}
                {title ? title : productId === LKS_PRODUCT_ID ? 'LabKey Server' : 'Applications'}
            </span>
        </h3>
    );
});
ProductNavigationHeader.displayName = 'ProductNavigationHeader';
