import { User } from '../base/models/User';
import { hasPremiumModule, resolveModuleContext } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';

export function shouldShowProductNavigation(user?: User, moduleContext?: ModuleContext): boolean {
    return (
        hasPremiumModule(moduleContext) &&
        (user?.isAdmin ||
            resolveModuleContext(moduleContext)?.api?.applicationMenuDisplayMode?.toLowerCase() === 'always')
    );
}
