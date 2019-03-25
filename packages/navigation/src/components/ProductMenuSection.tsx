import React from "reactn";
import { Record } from 'immutable';
import { DropdownButton, MenuItem } from 'react-bootstrap'
import { MenuSectionModel } from '../model';
import { AppURL, imageURL } from '@glass/utils';

export class MenuSectionConfig extends Record({
    emptyText: undefined,
    maxItemsPerColumn: 12,
    maxColumns: 1
}){
    emptyText: string;
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

    renderMenuItemsList(items, columnNumber: number = 1, totalColumns: number = 1, withOverflow: boolean = false)
    {
        const { config, section } = this.props;

        return (
            <ul className={'col-' + totalColumns} key={section.key + 'col-' + columnNumber}>
                {items.isEmpty() ?
                    config.emptyText && <li key="empty" className="empty-section">{config.emptyText}</li>
                    : items.map(item => {
                    if (item.url) {
                        let url = item.url instanceof AppURL ? item.url.toHref() : item.url;
                        return <li key={item.label}><a href={url} target={item.key === "docs" ? "_blank" : "_self"}>{item.label}</a></li>;
                    }
                    return <li key={item.label}>{item.label}</li>
                    })
                }
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
        const haveOverflow = section.totalCount > Math.min(section.items.size, config.maxColumns * config.maxItemsPerColumn); // totalCount may be larger than allItems.size
        let columnNum = 1;
        let startIndex = 0;
        let endIndex = Math.min(config.maxItemsPerColumn, allItems.size);
        let numColumns = Math.min(config.maxColumns, Math.ceil(allItems.size / config.maxItemsPerColumn));
        let columns = [
            this.renderMenuItemsList(allItems.slice(startIndex, endIndex), columnNum, numColumns, haveOverflow)
        ];
        while (endIndex < allItems.size && columnNum < config.maxColumns)
        {
            startIndex = endIndex;
            endIndex = Math.min(endIndex + config.maxItemsPerColumn, allItems.size);
            columnNum++;
            columns.push(this.renderMenuItemsList(allItems.slice(startIndex, endIndex), columnNum, numColumns, false));
        }
        if (haveOverflow) {
            columns.push(<span className="overflow-link" key="overflow"><a href={AppURL.create(section.key).toHref()}>See all {section.totalCount}</a></span>)
        }

        return (
            <>
                {header}
                {columns}
            </>
        );
    }
}