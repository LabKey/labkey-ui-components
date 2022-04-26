import React, { ReactElement, FC, memo, useMemo, useState, useEffect } from 'react';
import { DropdownButton } from 'react-bootstrap';

interface Props {
    items: ReactElement[];
}

export const ResponsiveMenuButtonGroup: FC<Props> = memo(props => {
    const { items } = props;
    // const [width, setWidth] = useState<number>(window.innerWidth);
    // useEffect(() => {
    //     function handleResize() {
    //         setWidth(window.innerWidth);
    //     }
    //     window.addEventListener('resize', handleResize)
    //     return () => window.removeEventListener('resize', handleResize);
    // });

    // TODO for now, we will just always use the "More" submenu button, but in the future something like:
    // const asSubMenu = useMemo(() => width < 1500, [width]);
    const asSubMenu = true;

    return (
        <>
            {!asSubMenu && items}
            {asSubMenu && (
                <DropdownButton id="responsive-menu-button-group" title="More" className="responsive-menu">
                    {items.map(item => React.cloneElement(item, { asSubMenu: true }))}
                </DropdownButton>
            )}
        </>
    );
});
