import React, { FC, memo, useCallback } from 'react';

import { useNavMenuState } from '../../useNavMenuState';

import { ProductNavigationMenu } from './ProductNavigationMenu';

export const ProductNavigation: FC = memo(() => {
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const onCloseMenu = useCallback(() => setShow(false), []);
    const toggleMenu = useCallback(() => setShow(s => !s), []);
    return (
        <div className="navbar-item pull-right product-navigation-menu hidden-xs navbar-menu">
            <button
                aria-haspopup="true"
                aria-expanded={show}
                className="navbar-menu-button"
                onClick={toggleMenu}
                ref={toggleRef}
                role="button"
                type="button"
            >
                <span className="fa fa-th-large navbar-header-icon" />
            </button>

            {show && <ProductNavigationMenu onCloseMenu={onCloseMenu} menuRef={menuRef} />}
        </div>
    );
});
