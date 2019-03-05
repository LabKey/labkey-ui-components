import React from 'reactn'
import { Navbar, Nav, NavDropdown, Form, FormControl, Button } from 'react-bootstrap'
import { IndexLink } from 'react-router';
import { ProductMenu } from "./ProductMenu";
import { SearchBox } from "./SearchBox";
import { UserMenu } from "./UserMenu";
import { imageURL } from "@glass/utils";
import { ActionURL } from "@labkey/api";
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

    renderLogo() {
        const { appLogo } = this.props;

        return (
            <div className="header-logo">
                <IndexLink to="/" className="header-logo__link">
                    <img
                        className="header-logo__image"
                        src={imageURL('samplemanagement', 'samples.svg')}
                        srcSet={imageURL('samplemanagement', 'samples.svg')}
                        height="34px"
                        width="34px"
                    />
                </IndexLink>
            </div>
        )
    }

    renderLogNoRouter() {
        <div className="header-logo">
            <a href={ActionURL.getContextPath() + "/" + "sampleManagement-app.view"}>
                <img src={imageURL('samplemanagement', 'samples.svg')} height="34px" width="34px"/>
            </a>
        </div>
    }


    customRender() {
        const { appLogo, productId, showSearchBox, showUserMenu } = this.props;

        const productMenu = productId ? <ProductMenu productId={productId}/> : null;

        const searchBox = showSearchBox ? <SearchBox/> : null;
        const userMenu = showUserMenu ? <UserMenu/> : null;

        return (
            <nav className="navbar navbar-biologics--container test-loc-nav-header">
                Navigate here!
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

    bootstrapRender() {
        return (

            <Navbar bg="light" expand="lg">
                <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto">
                        <Nav.Link href="#home">Home</Nav.Link>
                        <Nav.Link href="#link">Link</Nav.Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                    <Form inline>
                        <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                        <Button variant="outline-success">Search</Button>
                    </Form>
                </Navbar.Collapse>
            </Navbar>
        );
    }
    render() {

        return (
            <>
                {this.customRender()}
            </>
        );
    }
}