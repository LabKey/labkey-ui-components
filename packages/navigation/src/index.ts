/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import { HeaderWrapper } from './components/HeaderWrapper'

import { NavigationBar } from './components/NavigationBar'
import { NavItem } from './components/NavItem'
import { MenuSectionConfig, ProductMenu, ProductMenuSection } from './components/ProductMenu'
import { SearchBox } from './components/SearchBox'
import { SubNav } from './components/SubNav'
import { UserMenu } from './components/UserMenu'
import { initNavigationState } from './global'
import { menuInit } from './actions'

// Import the scss file so it will be processed in the rollup scripts
import './theme/index.scss'

export {
    // actions
    initNavigationState,
    menuInit,

    // types
    MenuSectionConfig,

    // components
    HeaderWrapper,
    NavItem,
    NavigationBar,
    ProductMenu,
    ProductMenuSection,
    SearchBox,
    SubNav,
    UserMenu,
}