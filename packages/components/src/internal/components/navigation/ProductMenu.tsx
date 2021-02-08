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
import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { List, Map } from 'immutable';
import { DropdownButton } from 'react-bootstrap';

import { LoadingSpinner } from '../../..';

import { MenuSectionModel, ProductMenuModel } from './model';
import { MenuSectionConfig, ProductMenuSection } from './ProductMenuSection';
import { blurActiveElement } from '../../util/utils';

interface ProductMenuProps {
    model: ProductMenuModel;
    sectionConfigs?: List<Map<string, MenuSectionConfig>>;
    maxColumns?: number;
}

export const ProductMenu: FC<ProductMenuProps> = memo(props => {
    const { model, sectionConfigs } = props;
    const [menuOpen, setMenuOpen] = useState(false);

    const getSectionModel = useCallback(
        (key: string): MenuSectionModel => model.sections.find(section => section.key === key),
        [model]
    );

    const toggleMenu = useCallback(() => {
        setMenuOpen(!menuOpen);
        blurActiveElement();
    }, [menuOpen, setMenuOpen]);

    let containerCls = 'product-menu-content ';
    let menuSectionCls = 'menu-section col-' + model.sections.size;
    let content: ReactNode = (
        <div className={menuSectionCls + ' menu-loading'}>
            <LoadingSpinner />
        </div>
    );

    if (model?.isLoaded) {
        if (model.isError) {
            containerCls += ' error';
            content = <span>{model.message}</span>;
        } else if (sectionConfigs) {
            menuSectionCls = 'menu-section col-' + sectionConfigs.size;

            content = sectionConfigs.map((sectionConfig, ind) => (
                <div key={ind} className={menuSectionCls}>
                    {sectionConfig.entrySeq().map(([key, menuConfig]) => (
                        <ProductMenuSection
                            key={key}
                            section={getSectionModel(key)}
                            config={menuConfig}
                            currentProductId={model.currentProductId}
                        />
                    ))}
                </div>
            ));
        } else {
            content = model.sections.map(section => (
                <div key={section.key} className={menuSectionCls}>
                    <ProductMenuSection
                        section={section}
                        config={new MenuSectionConfig()}
                        currentProductId={model.currentProductId}
                    />
                </div>
            ));
        }
    }

    return (
        <DropdownButton
            className="product-menu-button"
            id="product-menu"
            onToggle={toggleMenu}
            open={menuOpen}
            title="Menu"
        >
            <div className={containerCls} onClick={toggleMenu}>
                <div>
                    <div className="navbar-connector" />
                    {content}
                </div>
            </div>
        </DropdownButton>
    );
});
