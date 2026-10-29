/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback } from 'react';

import { useNavMenuState } from '../../useNavMenuState';

import { ProductNavigationMenu } from './ProductNavigationMenu';
import { Icon } from '../../Icon';

export const ProductNavigation: FC = memo(() => {
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const onCloseMenu = useCallback(() => setShow(false), [setShow]);
    const toggleMenu = useCallback(() => setShow(s => !s), [setShow]);

    return (
        <div className="navbar-dropdown product-navigation-menu">
            <button
                aria-expanded={show}
                aria-haspopup="true"
                className="navbar-button navbar-menu-button"
                onClick={toggleMenu}
                ref={toggleRef}
                role="button"
                type="button"
            >
                <Icon iconClass="fa fa-th-large navbar-header-icon" srText="Product Navigation" />
            </button>
            {show && <ProductNavigationMenu menuRef={menuRef} onCloseMenu={onCloseMenu} />}
        </div>
    );
});
ProductNavigation.displayName = 'ProductNavigation';
