import React, { FC, memo } from 'react';
import { ICON_URL } from "../../../stories/mock"; // TODO fix me

interface ProductNavigationMenuProps {

}

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    return (
        <div className="product-navigation-container">
            <h3 className="product-navigation-header">
                <div className="navbar-icon-connector" /> {/*TODO fix me*/}
                Applications
            </h3>
            <ul className="product-navigation-listing">
                <ProductNavigationMenuItem iconUrl={ICON_URL} title="LabKey Server" subtitle="Current Project Name" />
                <ProductNavigationMenuItem iconUrl={ICON_URL} title="Biologics" subtitle="# Projects" />
                <ProductNavigationMenuItem iconUrl={ICON_URL} title="Sample Manager" subtitle="# Projects" />
            </ul>
            <div className="product-navigation-footer">
                <a href="https://www.labkey.com/products-services/" target="_blank" rel="noopener noreferrer">
                    More LabKey Solutions
                </a>
            </div>
        </div>
    );
});

interface ProductNavigationMenuItemProps {
    iconUrl: string;
    title: string;
    subtitle: string;
}

const ProductNavigationMenuItem: FC<ProductNavigationMenuItemProps> = memo(props => {
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
