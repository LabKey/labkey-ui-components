import React, { ReactElement, FC, memo, useMemo, useState, useEffect } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';

interface Props {
    items: ReactElement[];
}

export const ResponsiveMenuButtonGroup: FC<Props> = memo(props => {
    const { items } = props;
    const [width, setWidth] = useState<number>(window.innerWidth);
    useEffect(() => {
        function handleResize() {
            setWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize);
    });

    // bootstrap v3 doesn't support hidden-xl/visible-xl, so use the width=1600 check as a proxy
    const asSubMenu = useMemo(() => width < 1600, [width]);

    return (
        <>
            {!asSubMenu && items}
            {asSubMenu && (
                <DropdownButton id="responsive-menu-button-group" title="More" className="responsive-menu">
                    {items.map((item, index) => {
                        return (
                            <>
                                {React.cloneElement(item, { asSubMenu: true })}
                                {index < items.length - 1 && <MenuItem divider />}
                            </>
                        );
                    })}
                </DropdownButton>
            )}
        </>
    );
});
