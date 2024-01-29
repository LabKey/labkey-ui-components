import React, { ReactElement, FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';

import { SubMenuItem } from '../menus/SubMenuItem';

interface Props {
    asSubMenu?: boolean;
    id: string;
    items: ReactElement;
    text: string;
}

// TODO: We're explicitly not replacing this usage of DropdownButton with our internal version at this time, because we
//  also need to refactor SubMenuItem (and SubMenu) to use our internal components as well, but that is too disruptive
//  of a change at this time.
export const ResponsiveMenuButton: FC<Props> = memo(({ asSubMenu, id, items, text }) => {
    if (asSubMenu) {
        return (
            <SubMenuItem text={text} inline>
                {items}
            </SubMenuItem>
        );
    }

    return (
        <DropdownButton title={text} id={id} className="responsive-menu">
            {items}
        </DropdownButton>
    );
});
