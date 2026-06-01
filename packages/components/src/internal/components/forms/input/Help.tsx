/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PropsWithChildren } from 'react';

export const Help: FC<PropsWithChildren> = ({ children }) => {
    if (!children) return null;
    return <small className="form-text text-muted">{children}</small>;
};
Help.displayName = 'Help';
