import { getServerContext } from '@labkey/api';

import { User } from '../base/models/User';
import { hasPremiumModule } from '../../app/utils';

export function shouldShowProductNavigation(user: User): boolean {
    const apiModuleContext = getServerContext()?.moduleContext.api;
    return (
        hasPremiumModule() && (user.isAdmin || apiModuleContext?.applicationMenuDisplayMode?.toLowerCase() === 'always')
    );
}
