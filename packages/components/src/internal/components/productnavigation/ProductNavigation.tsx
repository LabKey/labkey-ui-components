import React, { FC, memo, useCallback, useState } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { ProductNavigationMenu } from './ProductNavigationMenu';

export const ProductNavigation: FC = memo(() => {
    const [show, setShow] = useState<boolean>(false);
    const onCloseMenu = useCallback(() => setShow(false), [setShow]);
    const toggleMenu = useCallback(() => {
        setShow(current => !current);
    }, []);

    return (
        <DropdownButton
            id="product-navigation-button"
            className="navbar-icon-button-right"
            title={<i className="fa fa-th-large navbar-header-icon" />}
            onToggle={toggleMenu}
            open={show}
            noCaret
            pullRight
        >
            {show && <ProductNavigationMenu onCloseMenu={onCloseMenu} />}
        </DropdownButton>
    );
});
