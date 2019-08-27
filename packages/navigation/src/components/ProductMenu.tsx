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
import { Map, List } from 'immutable';
import { DropdownButton } from 'react-bootstrap'
import { LoadingSpinner } from '@glass/base'

import { MenuSectionModel, ProductMenuModel} from '../model'
import { MenuSectionConfig, ProductMenuSection } from './ProductMenuSection'


interface ProductMenuProps {
    model: ProductMenuModel
    sectionConfigs?: List<Map<string, MenuSectionConfig>>
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

    getSectionModel(key: string) : MenuSectionModel {
        return this.props.model.sections.find(section => section.key === key);
    }

    render() {
        const { model, sectionConfigs } = this.props;
        const { productId } = model;

        let containerCls = 'product-menu-content ';
        let menuSectionCls = 'menu-section col-' + sectionConfigs.size;
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
                        {sectionConfigs.map((sectionConfig, ind) => {
                            return (
                                <div key={ind} className={menuSectionCls}>
                                    {
                                        sectionConfig.entrySeq().map(([key, menuConfig]) => {
                                            return (
                                                <ProductMenuSection
                                                    key={key}
                                                    productId={productId}
                                                    section={this.getSectionModel(key)}
                                                    config={menuConfig}
                                                />
                                            );
                                        })
                                    }
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
