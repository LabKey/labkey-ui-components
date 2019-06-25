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
import * as React from "react";
import { Map } from 'immutable';
import { DropdownButton } from 'react-bootstrap'
import { LoadingSpinner } from '@glass/base'

import { ProductMenuModel } from '../model'
import { MenuSectionConfig, ProductMenuSection } from './ProductMenuSection'


interface ProductMenuProps {
    model: ProductMenuModel
    sectionConfigs?: Map<string, MenuSectionConfig>
    maxColumns?: number
}

export class ProductMenu extends React.Component<ProductMenuProps, any> {

    static defaultProps = {
        maxColumns: 5
    };

    constructor(props: ProductMenuProps) {
        super(props);

        this.toggleMenu = this.toggleMenu.bind(this);

        this.state = {
            menuOpen : false
        }
    }

    toggleMenu() {
        this.setState( {
            menuOpen: !this.state.menuOpen
        });
    }

    getSectionConfig(key: string) : MenuSectionConfig {
        const { sectionConfigs } = this.props;
        if (sectionConfigs && sectionConfigs.has(key)) {
            return sectionConfigs.get(key)
        }
        else {
            return new MenuSectionConfig();
        }
    }

    render() {
        const { model } = this.props;

        let containerCls = 'product-menu-content ';
        let menuSectionCls = 'menu-section col-' + model.sections.size;
        let inside = <div className={menuSectionCls + " menu-loading"}><LoadingSpinner/></div>;
        if (model && model.isLoaded) {
            if (model.isError) {
                containerCls += ' error';
                inside = <span>{model.message}</span>
            }
            else
            {
                inside = (
                    <>
                        {model.sections.map(section => {
                            return (
                                <div key={section.key} className={menuSectionCls}>
                                    <ProductMenuSection productId={model.productId} section={section} config={this.getSectionConfig(section.key)}/>
                                </div>
                            );
                        })}
                    </>
                );
            }
        }
        return (
            <DropdownButton
                    id="product-menu"
                    title="Menu"
                    open={this.state.menuOpen}
                    onToggle={this.toggleMenu}
                    rootCloseEvent="mousedown"
            >
                <div className={containerCls} onClick={this.toggleMenu}>
                {inside}
                </div>
            </DropdownButton>
        )
    }
}
