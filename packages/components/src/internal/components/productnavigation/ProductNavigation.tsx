import React, { FC, memo, useState } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { ProductNavigationMenu } from './ProductNavigationMenu';

export const ProductNavigation: FC = memo(() => {
    const [show, setShow] = useState<boolean>(false);

    return (
        <DropdownButton
            id="product-navigation-button"
            className="navbar-icon-button-right"
            title={<i className="fa fa-th-large navbar-header-icon" />}
            onToggle={() => setShow(!show)}
            open={show}
            noCaret={true}
            pullRight={true}
        >
            {show && <ProductNavigationMenu />}
        </DropdownButton>
    );
});
