/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import { HeaderWrapper } from './components/HeaderWrapper'

import { NavigationBar } from './components/NavigationBar'
import { NavItem } from './components/NavItem'
import { MenuSectionConfig } from './components/ProductMenuSection'
import { ITab, SubNav } from './components/SubNav'
import { initNavigationState } from './global'
import { menuInit } from './actions'
import { ProductMenuModel } from './model'
// Import the scss file so it will be processed in the rollup scripts
import './theme/index.scss'

export {
    // actions
    initNavigationState,
    menuInit,

    // types
    MenuSectionConfig,
    ProductMenuModel,

    // components
    HeaderWrapper,
    ITab,
    NavItem,
    NavigationBar,
    SubNav
}