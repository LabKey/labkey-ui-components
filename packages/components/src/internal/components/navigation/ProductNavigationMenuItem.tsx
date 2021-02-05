import React, { FC, memo } from 'react';

interface ProductNavigationMenuItemProps {
    iconUrl: string;
    title: string;
    subtitle: string;
}

export const ProductNavigationMenuItem: FC<ProductNavigationMenuItemProps> = memo(props => {
    const { iconUrl, title, subtitle } = props;

    return (
        <li>
            <div className="product-icon">
                <img src={iconUrl} height="40px" width="40px" />
            </div>
            <div className="product-nav-icon">
                <i className="fa fa-chevron-right" />
            </div>
            <div className="product-title">
                {title}
            </div>
            <div className="product-subtitle">
                {subtitle}
            </div>
        </li>
    );
});
