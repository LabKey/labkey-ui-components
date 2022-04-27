import React, { ReactElement, FC, memo } from 'react';
import { DropdownButton } from 'react-bootstrap';
import { SubMenuItem } from '../menus/SubMenuItem';

interface Props {
    asSubMenu?: boolean;
    id: string;
    items: ReactElement;
    text: string;
}

export const ResponsiveMenuButton: FC<Props> = memo(props => {
    const { asSubMenu, id, items, text } = props;

    return (
        <>
            {!asSubMenu && (
                <DropdownButton title={text} id={id} className="responsive-menu">
                    {items}
                </DropdownButton>
            )}
            {asSubMenu && (
                <SubMenuItem text={text} inline>
                    {items}
                </SubMenuItem>
            )}
        </>
    );
});
