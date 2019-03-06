import React from 'reactn'
import { Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'

import { ProductMenu } from "./ProductMenu";
import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";
import { ReactNode } from "react";


interface NavigationBarProps {
    appLogo?: ReactNode
    productId?: string,
    showSearchBox?: boolean,
    showUserMenu?: boolean
}

export class NavigationBar extends React.Component<NavigationBarProps, any> {
    static defaultProps: {
        showSearchBox: false,
        showUserMenu: false
    };

    customRender() {
        const { appLogo, productId, showSearchBox, showUserMenu } = this.props;

        const productMenu = productId ? <ProductMenu productId={productId}/> : null;

        const searchBox = showSearchBox ? <SearchBox/> : null;
        const userMenu = showUserMenu ? <UserMenu/> : null;

        return (
            <nav className="navbar navbar-biologics--container test-loc-nav-header">
                <div className="col-sm-2">
                    {appLogo}
                </div>
                <div className="col-sm-6">
                    {productMenu}
                </div>
                <div className="col-sm-2">
                    {searchBox}
                </div>
                <div className="col-sm-2">
                    {userMenu}
                </div>
            </nav>
        )
    }

    render() {

        return (
            <>
                {this.customRender()}
            </>
        );
    }
}