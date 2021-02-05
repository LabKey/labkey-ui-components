import React, { FC, memo, useState } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { ProductNavigationMenu } from "./ProductNavigationMenu";

interface ProductNavigationProps {

}

export const ProductNavigation: FC<ProductNavigationProps> = memo(props => {
    const [show, setShow] = useState<boolean>(false);

    return (
        <DropdownButton
            id="product-navigation-button"
            className="navbar-icon-button-right"
            noCaret={true}
            title={<i className="fa fa-th-large navbar-header-icon"/>}
            open={show}
            onToggle={() => setShow(!show)}
            pullRight={true}
        >
            <ProductNavigationMenu/>
        </DropdownButton>
    );
});
