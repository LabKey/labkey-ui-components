/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { User } from '../base/models/User';
import { isLKSSupportEnabled } from '../../app/utils';
import { ModuleContext, resolveModuleContext } from '../base/ServerContext';

/**
 * Returns true for the LKB app or for other apps w/ premium module when the user isAdmin or the Look and Feel Setting
 * for applicationMenuDisplayMode is set to ALWAYS.
 */
export function shouldShowProductNavigation(user?: User, moduleContext?: ModuleContext): boolean {
    return (
        isLKSSupportEnabled(moduleContext) &&
        (user?.isAdmin ||
            resolveModuleContext(moduleContext)?.api?.applicationMenuDisplayMode?.toLowerCase() === 'always')
    );
}
