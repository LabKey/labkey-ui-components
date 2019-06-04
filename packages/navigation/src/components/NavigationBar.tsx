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