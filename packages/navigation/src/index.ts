/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HeaderWrapper } from './components/HeaderWrapper'

import { NavigationBar } from './components/NavigationBar'
import { NavItem } from './components/NavItem'
import { MenuSectionConfig } from './components/ProductMenuSection'
import { ITab, SubNav } from './components/SubNav'
import { Breadcrumb } from './components/Breadcrumb'
import { BreadcrumbCreate } from './components/BreadcrumbCreate'
import { MenuSectionModel, MenuItemModel, ProductMenuModel } from './model'

// Import the scss file so it will be processed in the rollup scripts
import './theme/index.scss'

export {
    // actions

    // types
    MenuSectionConfig,
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,

    // components
    HeaderWrapper,
    ITab,
    NavItem,
    NavigationBar,
    SubNav,
    Breadcrumb,
    BreadcrumbCreate
}