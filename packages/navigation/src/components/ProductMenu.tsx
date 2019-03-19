import React from "reactn";
import { Map, Record } from 'immutable';
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { menuInit } from '../actions';
import { MenuSectionModel, ProductMenuModel } from '../model';
import { AppURL, imageURL, LoadingSpinner } from '@glass/utils';

export class MenuSectionConfig extends Record({
    maxItemsPerColumn: 12,
    maxColumns: 1
}){
    maxItemsPerColumn: number;
    maxColumns: number;
}

interface ProductMenuProps {
    productId: string
    sectionConfigs?: Map<string, MenuSectionConfig>
}

export class ProductMenu extends React.Component<ProductMenuProps, any> {

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

    getWidthClass(menuModel: ProductMenuModel)
    {
        let minColumnCount = menuModel.sections
            .reduce((count, section) => {
                    const config = this.getSectionConfig(section.key);
                    let maxColumns = Math.floor(section.items.size / config.maxItemsPerColumn);
                    if (section.items.size % config.maxItemsPerColumn > 0)
                        maxColumns++;
                    return count + Math.min(config.maxColumns, maxColumns);
                },
                0);
        let widthClass = 'col-' + minColumnCount;
        if (minColumnCount >= 5)
            widthClass = 'col-max';
        return widthClass;
    }

    toggleMenu() {
        this.setState( {
            menuOpen: !this.state.menuOpen
        });
    }

    getSectionConfig(key: string) : MenuSectionConfig {
        const { sectionConfigs } = this.props;
        let layout;
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
        let containerCls = 'product-menu-content ' + this.getWidthClass(menuModel);
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

interface MenuSectionProps {
    productId: string
    section: MenuSectionModel
    config: MenuSectionConfig
}


export class ProductMenuSection extends React.Component<MenuSectionProps, any> {

    static defaultProps = {
        maxColumns: 1
    };

    renderMenuItemsList(items, columnNumber: number = 1, withOverflow: boolean = false)
    {
        const { section } = this.props;

        return (
            <ul key={section.key + 'col-' + columnNumber}>
                {items.map(item => {
                    if (item.url) {
                        let url = item.url instanceof AppURL ? item.url.toHref() : item.url;
                        return <li key={item.label}><a href={url} target={item.key === "docs" ? "_blank" : "_self"}>{item.label}</a></li>;
                    }
                    return <li key={item.label}>{item.label}</li>
                })}
                {withOverflow &&  <li className="overflow-link" key="overflow"><a href={AppURL.create(section.key).toHref()}>See all {section.totalCount}</a></li>}
            </ul>
        )
    }

    render() {
        const { config, productId, section } = this.props;
        let icon;
        if (section.key === 'user')
            icon = <span className="fas fa-user-circle" style={{
                        fontSize: "24px",
                        verticalAlign: "middle"
            }} />;
        else
            icon = (
                <img
                    alt={section.label + ' icon'}
                    className="menu-section-image"
                    src={imageURL(productId, section.key + '.svg')}
                    height="24px"
                    width="24px"
                />
            );
        let header = (
            <>
                <span className="menu-section-header">
                    {section.url ? <a href={AppURL.create(section.key).toHref()}>{icon}&nbsp;{section.label}</a> : <>{icon}&nbsp;{section.label}</>}
                </span>
                <hr/>
            </>
        );

        const allItems = section.items;
        const haveOverflow = section.totalCount > config.maxColumns * config.maxItemsPerColumn; // totalCount may be larger than allItems.size
        let columnNum = 1;
        let startIndex = 0;
        console.log(section, config);
        let endIndex = Math.min(config.maxItemsPerColumn, allItems.size);
        let columns = [
            this.renderMenuItemsList(allItems.slice(startIndex, endIndex),  columnNum, haveOverflow)
        ];
        while (endIndex < allItems.size && columnNum < config.maxColumns)
        {
            startIndex = endIndex;
            endIndex = Math.min(endIndex + config.maxItemsPerColumn, allItems.size);
            columnNum++;
            columns.push(this.renderMenuItemsList(allItems.slice(startIndex, endIndex),  columnNum, haveOverflow && columnNum == 1));
        }

        return (
            <>
                {header}
                {columns}
            </>
        );
    }
}