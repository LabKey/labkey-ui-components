import { MenuSectionModel } from '../navigation/model';
import { MenuOption } from '../menus/SubMenu';
import { AppURL } from '../../url/AppURL';

export function getMenuItemForSectionKey(
    key: string,
    name: string,
    section: MenuSectionModel,
    useOnClick: boolean,
    itemActionFn?: (key: string, menuSection?: MenuSectionModel) => any,
    disabledMsg?: string
): MenuOption {
    const config: MenuOption = {
        key,
        name,
        disabled: disabledMsg !== undefined,
        disabledMsg,
    };

    if (itemActionFn) {
        let href = useOnClick ? undefined : itemActionFn(key, section);
        if (href instanceof AppURL) href = href.toHref();

        config.href = href;
        config.onClick = useOnClick && itemActionFn ? itemActionFn.bind(this, key, section) : undefined;
    }

    return config;
}
