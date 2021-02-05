import React, { FC, memo, PureComponent, ReactNode } from 'react';
import { Security, getServerContext, Utils } from '@labkey/api';
import { ICON_URL } from "../../../stories/mock"; // TODO fix me

import { ProductNavigationMenuItem } from "./ProductNavigationMenuItem";
import { LoadingSpinner } from "../base/LoadingSpinner";
import { Alert } from "../base/Alert";
import { Container } from "../base/models/Container";
import { getRegisteredProducts } from "./actions";
import { ProductModel } from "./model";
import { naturalSortByProperty } from "../../../public/sort";

interface ProductNavigationMenuProps {

}

interface State {
    error: string;
    products: ProductModel[];
    projects: Container[];
}

export class ProductNavigationMenu extends PureComponent<ProductNavigationMenuProps> {
    state: Readonly<State> = {
        error: undefined,
        products: undefined,
        projects: undefined,
    };

    componentDidMount(): void {
        this.initProducts();
        this.initProjects();
    }

    initProducts(): void {
        getRegisteredProducts()
            .then(products => {
                this.setState(() => ({ products }));
            })
            .catch(error => {
                this.setState(() => ({
                    error, // TODO verify error message from the server
                    products: [],
                }));
            });
    }

    initProjects(): void {
        Security.getContainers({
            containerPath: '/', // use root container to get the projects
            includeSubfolders: false,
            includeEffectivePermissions: false,
            success: data => {
                this.setState(() => ({ projects: data.children.map(data => new Container(data)) }));
            },
            failure: errorInfo => {
                console.error(errorInfo);
                this.setState(() => ({
                    error: 'Error: unable to get project information.',// TODO verify error message from the server
                    projects: [],
                }));
            },
        });
    }

    render(): ReactNode {
        return <ProductNavigationMenuImpl {...this.state} />;
    }
}

// TODO after the LKS item click, API call to get the container tab info

type ProductNavigationMenuImplProps = State;

const ProductNavigationMenuImpl: FC<ProductNavigationMenuImplProps> = memo(props => {
    const { error, products, projects } = props;

    if (error) {
        return <Alert>{error}</Alert>;
    }

    if (!products || !projects) {
        return <LoadingSpinner />;
    }

    const sortedProducts = products.sort(naturalSortByProperty('productName'));
    const productProjectMap = getProductProjectsMap(sortedProducts, projects);
    console.log(productProjectMap);

    return (
        <div className="product-navigation-container">
            <h3 className="product-navigation-header navbar-menu-header">
                <div className="navbar-icon-connector" />
                Applications
            </h3>
            <ul className="product-navigation-listing">
                <ProductNavigationMenuItem
                    iconUrl={ICON_URL}
                    title="LabKey Server"
                    subtitle={getServerContext().project.name}
                />
                {sortedProducts.map(product => {
                    return (
                        <ProductNavigationMenuItem
                            key={product.productId}
                            iconUrl={ICON_URL}
                            title={product.productName}
                            subtitle={Utils.pluralBasic(productProjectMap[product.productId].length, 'Project')}
                        />
                    );
                })}
            </ul>
            <div className="product-navigation-footer">
                <a href="https://www.labkey.com/products-services/" target="_blank" rel="noopener noreferrer">
                    More LabKey Solutions
                </a>
            </div>
        </div>
    );
});

function getProductProjectsMap(products: ProductModel[], projects: Container[]): {[key: string]: Container[]} {
    const map = {};
    products.forEach(product => map[product.productId] = []);

    for (const project of projects) {
        for (const product of products) {
            if (project.activeModules.indexOf(product.moduleName) > -1) {
                map[product.productId].push(project);
                break;
            }
        }
    }

    return map;
}
