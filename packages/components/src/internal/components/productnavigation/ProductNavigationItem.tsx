/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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

    // FIXME Do not use onMouseEnter or onMouseLeave.
    // They are only needed because this applies a new CSS class on hover.
    // Update to use a css :hover selector to apply the styling.
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
