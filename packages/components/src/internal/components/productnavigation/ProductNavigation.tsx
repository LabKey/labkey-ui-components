import React, { FC, memo, useCallback, useState } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { ProductNavigationMenu } from './ProductNavigationMenu';

export const ProductNavigation: FC = memo(() => {
    const [show, setShow] = useState<boolean>(false);
    const closeMenu = useCallback(() => setShow(false), [setShow]);

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
            {show && <ProductNavigationMenu closeMenu={closeMenu} />}
        </DropdownButton>
    );
});
