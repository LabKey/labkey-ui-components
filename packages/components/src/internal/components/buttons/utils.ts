import {List} from "immutable";
import {MenuOption, MenuSectionModel, naturalSort} from "../../..";

export function getMenuItemsForSection(section: MenuSectionModel, useOnClick: boolean, itemActionFn?: (menuSection: MenuSectionModel, key: string) => any, disabledMsg?: string, sampleItemActionFn?: (key: string) => any): List<MenuOption> {
    let items = List<MenuOption>();

    if (section) {
        section.items
            .sortBy(item => item.label, naturalSort)
            .forEach((item) => {
                const config : any = {
                    key: item.key,
                    name: item.label,
                    disabled: disabledMsg !== undefined,
                    disabledMsg
                };

                if (itemActionFn) {
                    config.href = useOnClick ? undefined : itemActionFn(section, item.key).toHref();
                    config.onClick = useOnClick && itemActionFn ? itemActionFn.bind(this, section, item.key) : undefined;
                }
                else if (sampleItemActionFn) {
                    config.href = useOnClick ? undefined : sampleItemActionFn(item.key);
                    config.onClick = useOnClick && sampleItemActionFn ? sampleItemActionFn.bind(this, item.key) : undefined;
                }
                items = items.push(config);
            });
    }

    return items;
}