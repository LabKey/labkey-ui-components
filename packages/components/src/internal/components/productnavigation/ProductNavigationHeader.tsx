import React, { FC, memo, useCallback } from 'react';
import classNames from 'classnames';

import { LKS_PRODUCT_ID } from '../../app/constants';

interface ProductNavigationHeaderProps {
    title: string;
    productId: string;
    onClick: () => void;
}

export const ProductNavigationHeader: FC<ProductNavigationHeaderProps> = memo(props => {
    const { productId, title } = props;
    const contentCls = classNames('header-title', { clickable: !!productId });
    const onClick = useCallback(
        event => {
            // stopImmediatePropagation in order to prevent the document click handler from closing the menu
            event.nativeEvent.stopImmediatePropagation();
            props.onClick();
        },
        [props.onClick]
    );

    return (
        <h3 className="product-navigation-header navbar-menu-header">
            <div className="navbar-icon-connector" />
            <span className={contentCls} onClick={productId ? onClick : undefined}>
                {productId && <i className="back-icon fa fa-chevron-left" />}
                {title ? title : productId === LKS_PRODUCT_ID ? 'LabKey Server' : 'Applications'}
            </span>
        </h3>
    );
});
