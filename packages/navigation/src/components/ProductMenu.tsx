import React from "reactn";
import { Map } from 'immutable';
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { menuInit } from '../actions';
import { ProductMenuModel } from '../model';
import { LoadingSpinner } from '@glass/utils';
import { MenuSectionConfig, ProductMenuSection } from "./ProductMenuSection";


interface ProductMenuProps {
    productId: string
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

    componentWillMount() {
        menuInit(this.props.productId)
    }

    // TODO can we make sure the menu refreshes when new items are added.
    // Within the application, we should be able to detect an addition of an assay or
    // sample set and trigger a reload at that point.  Listener structure?
    getModel() : ProductMenuModel {
        return this.global.Navigation_menu;
    }

    getWidth(menuModel: ProductMenuModel)
    {
        const { maxColumns } = this.props;

        let minColumnCount = menuModel.sections
            .reduce((count, section) => {
                    const config = this.getSectionConfig(section.key);
                    let maxSectionColumns = Math.floor(section.items.size / config.maxItemsPerColumn);
                    if (section.items.size % config.maxItemsPerColumn > 0)
                        maxSectionColumns++;
                    return count + Math.min(config.maxColumns, maxSectionColumns);
                },
                0);
        // want at least 3 columns, but no more than the maximum total number
        minColumnCount = Math.min(Math.max(minColumnCount, 3), maxColumns);
        return "col-" + minColumnCount;
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
        const { productId } = this.props;

        const menuModel = this.getModel();
        let containerCls = 'product-menu-content ' + this.getWidth(menuModel);
        let inside = <LoadingSpinner/>;

        if (menuModel && menuModel.isLoaded) {
            if (menuModel.isError) {
                containerCls += ' error';
                inside = <span>{menuModel.message}</span>
            }
            else
            {
                inside = (
                    <>
                        {menuModel.sections.map(section => {
                            return (
                                <div key={section.key} className="menu-section">
                                    <ProductMenuSection productId={productId} section={section} config={this.getSectionConfig(section.key)}/>
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
