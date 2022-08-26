import React, { ReactElement, FC, memo, useMemo, useState, useEffect } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

import { hasPermissions, User } from '../base/models/User';

interface ResponsiveMenuItem {
    button: ReactElement;
    perm: string;
}

interface Props {
    asSubMenu?: boolean;
    items: ResponsiveMenuItem[];
    subMenuWidth?: number;
    user: User;
}

export const ResponsiveMenuButtonGroup: FC<Props> = memo(props => {
    const { items, user, subMenuWidth = 1600, asSubMenu = true } = props;
    const [width, setWidth] = useState<number>(window.innerWidth);
    useEffect(() => {
        function handleResize() {
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });

    // bootstrap v3 doesn't support hidden-xl/visible-xl, so use the width=1600 check as a proxy
    const _asSubMenu = useMemo(() => asSubMenu && width < subMenuWidth, [asSubMenu, width, subMenuWidth]);

    const buttons = items.filter(item => hasPermissions(user, [item.perm], false)).map(item => item.button);

    if (buttons.length === 0) return null;

    return (
        <>
            {!_asSubMenu && buttons}
            {_asSubMenu && (
                <DropdownButton id="responsive-menu-button-group" title="More" className="responsive-menu">
                    {buttons.map((item, index) => {
                        return (
                            <React.Fragment key={index}>
                                {React.cloneElement(item, { asSubMenu: true })}
                                {index < buttons.length - 1 && <MenuItem divider />}
                            </React.Fragment>
                        );
                    })}
                </DropdownButton>
            )}
        </>
    );
});
