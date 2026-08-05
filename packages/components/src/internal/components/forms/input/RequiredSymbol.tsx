/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, ReactNode } from 'react';

interface RequiredSymbolProps {
    required: boolean;
    symbol?: ReactNode;
}

export const RequiredSymbol: FC<RequiredSymbolProps> = memo(({ required, symbol = ' *' }) => {
    if (!required) return null;
    return <span className="required-symbol">{symbol}</span>;
});
RequiredSymbol.displayName = 'RequiredSymbol';
