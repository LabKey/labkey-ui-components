import React, { FC, memo, PropsWithChildren, useCallback, useState } from 'react';

import { AppLink } from '../../url/AppLink';
import { AppURL } from '../../url/AppURL';

interface ProductClickableItemProps extends PropsWithChildren {
    id: string;
    onClick: () => void;
    url: string | AppURL;
}

export const ProductNavigationItem: FC<ProductClickableItemProps> = memo(({ children, id, onClick, url }) => {
    const [hovered, setHovered] = useState<boolean>(false);
    const onEnter = useCallback(() => setHovered(true), [setHovered]);
    const onLeave = useCallback(() => setHovered(false), [setHovered]);

    return (
        <AppLink
            to={url}
            key={id}
            className={'clickable-item' + (hovered ? ' labkey-page-nav' : '')}
            onClick={onClick}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
        >
            {children}
        </AppLink>
    );
});
ProductNavigationItem.displayName = 'ProductClickableItem';
