import { List } from 'immutable';

import { AppURL, MenuOption, MenuSectionModel, naturalSort } from '../../..';

export function getMenuItemsForSection(
    section: MenuSectionModel,
    useOnClick: boolean,
    itemActionFn?: (key: string, menuSection?: MenuSectionModel) => any,
    disabledMsg?: string
): List<MenuOption> {
    let items = List<MenuOption>();

    if (section) {
        section.items
            .sortBy(item => item.label, naturalSort)
            .forEach(item => {
                const config: any = {
                    key: item.key,
                    name: item.label,
                    disabled: disabledMsg !== undefined,
                    disabledMsg,
                };

                if (itemActionFn) {
                    let href = useOnClick ? undefined : itemActionFn(item.key, section);
                    if (href instanceof AppURL) href = href.toHref();

                    config.href = href;
                    config.onClick =
                        useOnClick && itemActionFn ? itemActionFn.bind(this, item.key, section) : undefined;
                }

                items = items.push(config);
            });
    }

    return items;
}
