import React, { ReactElement, FC, memo } from 'react';

import { DropdownButton, MenuHeader } from '../../dropdowns';

interface Props {
    className?: string;
    asSubMenu?: boolean;
    items: ReactElement; // TODO: convert to children
    text: string;
}

export const ResponsiveMenuButton: FC<Props> = memo(({ asSubMenu, className, items, text }) => {
    if (asSubMenu) {
        return (
            <>
                <MenuHeader text={text} />
                {items}
            </>
        );
    }

    return (
        <DropdownButton className={className + ' responsive-menu'} title={text}>
            {items}
        </DropdownButton>
    );
});
