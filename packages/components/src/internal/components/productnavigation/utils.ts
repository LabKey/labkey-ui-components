import { User } from '../base/models/User';
import { hasPremiumModule } from '../../app/utils';
import { getServerContext } from '@labkey/api';

export function shouldShowProductNavigation(user: User): boolean {
    const apiModuleContext = getServerContext()?.moduleContext.api;
    return hasPremiumModule() && (user.isAdmin || apiModuleContext?.applicationMenuDisplayMode?.toLowerCase() === "always");
}
