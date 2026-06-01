/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PropsWithChildren } from 'react';

import { DropdownButton, MenuHeader } from '../../dropdowns';

interface Props extends PropsWithChildren {
    asSubMenu?: boolean;
    className?: string;
    text: string;
}

export const ResponsiveMenuButton: FC<Props> = memo(({ asSubMenu, className, text, children }) => {
    if (asSubMenu) {
        return (
            <>
                <MenuHeader text={text} />
                {children}
            </>
        );
    }

    return (
        <DropdownButton className={className + ' responsive-menu'} title={text}>
            {children}
        </DropdownButton>
    );
});
ResponsiveMenuButton.displayName = 'ResponsiveMenuButton';
