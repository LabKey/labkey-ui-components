import React, { FC, memo } from 'react';

interface ProductAppMenuItemProps {
    iconUrl: string;
    title: string;
    subtitle: string;
    onClick: () => void;
}

export const ProductAppMenuItem: FC<ProductAppMenuItemProps> = memo(props => {
    const { iconUrl, title, subtitle, onClick } = props;

    return (
        <li onClick={onClick}>
            <div className="product-icon">
                <img src={iconUrl} height="40px" width="40px" />
            </div>
            <div className="nav-icon">
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
