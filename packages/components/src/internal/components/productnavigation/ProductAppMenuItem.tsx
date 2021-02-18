import React, { FC, memo, useCallback, useState } from 'react';

interface ProductAppMenuItemProps {
    iconUrl: string;
    iconUrlAlt?: string;
    title: string;
    subtitle: string;
    onClick: () => void;
}

export const ProductAppMenuItem: FC<ProductAppMenuItemProps> = memo(props => {
    const { iconUrl, iconUrlAlt, title, subtitle, onClick } = props;
    const [hovered, setHovered] = useState<boolean>(false);
    const toggleHover = useCallback((hover) => setHovered(hover), [setHovered]);

    return (
        <li
            className={hovered ? 'labkey-page-nav' : ''}
            onClick={onClick}
            onMouseEnter={() => toggleHover(true)}
            onMouseLeave={() => toggleHover(false)}
        >
            <div className="product-icon">
                <img src={iconUrl} alt="Product icon" className="icon-primary" height="40px" width="40px" />
                <img src={iconUrlAlt ?? iconUrl} alt="Alt Product icon" className="icon-alt" height="40px" width="40px" />
            </div>
            <div className="nav-icon"><i className="fa fa-chevron-right" /></div>
            <div className="product-title">{title}</div>
            <div className="product-subtitle">{subtitle}</div>
        </li>
    );
});
