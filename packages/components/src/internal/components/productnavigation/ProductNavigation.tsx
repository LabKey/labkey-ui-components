import React, { FC, memo, useCallback, useState } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { ProductNavigationMenu } from './ProductNavigationMenu';

export const ProductNavigation: FC = memo(() => {
    const [show, setShow] = useState<boolean>(false);
    const onCloseMenu = useCallback(() => setShow(false), []);
    const toggleMenu = useCallback(() => {
        setShow(current => !current);
    }, []);

    // TODO: This should not be a DropdownButton, it is not rendering any MenuItems. We should consider Popover or
    //  something similar.
    return (
        <div className="navbar-item pull-right product-navigation-menu navbar-item__dropdown hidden-xs">
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
        </div>
    );
});
