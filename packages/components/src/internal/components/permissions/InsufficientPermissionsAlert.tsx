/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';

import { Alert } from '../base/Alert';

const DEFAULT_MESSAGE = 'You do not have permissions for this action.';
export const InsufficientPermissionsAlert: FC<{ message?: string }> = ({ message = DEFAULT_MESSAGE }) => (
    <Alert className="wrong-perms-alert">{message}</Alert>
);
InsufficientPermissionsAlert.displayName = 'InsufficientPermissionsAlert';
