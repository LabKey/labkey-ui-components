import React from "reactn";
import { Record } from 'immutable';
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { MenuSectionModel } from '../model';
import { AppURL, imageURL } from '@glass/utils';

export class MenuSectionConfig extends Record({
    maxItemsPerColumn: 12,
    maxColumns: 1
}){
    maxItemsPerColumn: number;
    maxColumns: number;
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
            icon = <span className="fas fa-user-circle menu-section-icon" />;
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
        const header = (
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