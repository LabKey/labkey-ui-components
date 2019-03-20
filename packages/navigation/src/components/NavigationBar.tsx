import React from 'reactn'
import { ReactNode } from "react";
import { Map } from 'immutable'
import { Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'

import { ProductMenu } from "./ProductMenu";
import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";

import { User } from '@glass/models';
import { MenuSectionConfig } from "./ProductMenuSection";


interface NavigationBarProps {
    brand?: ReactNode,
    menuSectionConfigs?: Map<string, MenuSectionConfig>
    productId?: string,
    showSearchBox?: boolean,
    user?: User
}

export class NavigationBar extends React.Component<NavigationBarProps, any> {
    static defaultProps: {
        showSearchBox: false
    };

    render() {
        const { brand, menuSectionConfigs, productId, showSearchBox, user } = this.props;

        const productMenu = productId ? <ProductMenu sectionConfigs={menuSectionConfigs} productId={productId}/> : null;

        const searchBox = showSearchBox ? <SearchBox/> : null;
        const userMenu = user ? <UserMenu productId={productId} user={user}/> : null;

        return (
            <nav className="navbar navbar-container test-loc-nav-header">
                <span className="navbar-left">
                    <span className="navbar-item pull-left">
                        {brand}
                    </span>
                    <span className="navbar-item">
                        {productMenu}
                    </span>
                </span>
                <span className="navbar-right pull-right">
                    <span className="navbar-item">
                        {searchBox}
                    </span>
                    <span className="pull-right">
                        {userMenu}
                    </span>
                </span>
            </nav>
        )
    }

}