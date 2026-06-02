/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo } from 'react';

interface Props {
    msg?: React.ReactNode;
    wrapperClassName?: string;
}

export const LoadingSpinner: FC<Props> = memo(({ msg = 'Loading...', wrapperClassName = '' }) => (
    <span className={wrapperClassName}>
        <i aria-hidden="true" className="fa fa-spinner fa-pulse" /> {msg}
    </span>
));
LoadingSpinner.displayName = 'LoadingSpinner';
