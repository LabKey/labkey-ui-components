import React, { FC, memo } from 'react';
import { ICON_URL } from "../../../stories/mock"; // TODO fix me

import { ProductNavigationMenuItem } from "./ProductNavigationMenuItem";

interface ProductNavigationMenuProps {

}

// TODO api call to get the server modules to determine which products we have
// TODO api call to get the project count/list for each product
// TODO after the LKS item click, API call to get the container tab info

export const ProductNavigationMenu: FC<ProductNavigationMenuProps> = memo(props => {
    return (
        <div className="product-navigation-container">
            <h3 className="product-navigation-header navbar-menu-header">
                <div className="navbar-icon-connector" />
                Applications
            </h3>
            <ul className="product-navigation-listing">
                <ProductNavigationMenuItem iconUrl={ICON_URL} title="LabKey Server" subtitle="Current Project Name" />
                {/*TODO should the products have the "LabKey" prefix?*/}
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
