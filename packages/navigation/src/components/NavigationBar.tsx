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
import * as React from 'react'
import { ReactNode } from "react";
import { Map } from 'immutable'
import { User } from '@glass/base'

import { ProductMenu } from "./ProductMenu";
import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";
import { MenuSectionConfig } from "./ProductMenuSection";
import { ProductMenuModel } from "../model";

interface NavigationBarProps {
    brand?: ReactNode
    projectName?: string
    menuSectionConfigs?: Map<string, MenuSectionConfig>
    model: ProductMenuModel
    showSearchBox: boolean
    onSearch?: (form: any) => any
    user?: User
}

export class NavigationBar extends React.Component<NavigationBarProps, any> {
    static defaultProps: {
        showSearchBox: false
    };

    render() {
        const { brand, menuSectionConfigs, model, projectName, showSearchBox, onSearch, user } = this.props;

        const productMenu = model ? <ProductMenu model={model} sectionConfigs={menuSectionConfigs}/> : null;

        const searchBox = showSearchBox ? <SearchBox onSearch={onSearch}/> : null;
        const userMenu = user ? <UserMenu model={model} user={user}/> : null;

        return (

            <nav className="navbar navbar-container test-loc-nav-header">
                <div className="container">
                    <span className="navbar-left">
                        <span className="navbar-item pull-left">
                            {brand}
                        </span>
                        <span className="navbar-item">
                            {productMenu}
                        </span>
                        {projectName && (
                            <span className="navbar-item">
                                <span className="project-name"><i className="fa fa-folder-open-o"/> {projectName} </span>
                            </span>
                        )}
                    </span>
                    <span className="navbar-right pull-right">
                        <span className="navbar-item">
                            {searchBox}
                        </span>
                        <span className="pull-right">
                            {userMenu}
                        </span>
                    </span>
                </div>
            </nav>

        )
    }

}