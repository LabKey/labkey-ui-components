import { useServerContext } from '../base/ServerContext';
import { User } from '../base/models/User';
import { hasPremiumModule } from '../../app/utils';

export function shouldShowProductNavigation(user: User): boolean {
    const apiModuleContext = useServerContext()?.moduleContext.api;
    return hasPremiumModule() && (user.isAdmin || apiModuleContext?.applicationMenuDisplayMode?.toLowerCase() === "always");
}
