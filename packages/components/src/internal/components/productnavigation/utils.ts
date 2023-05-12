import { User } from '../base/models/User';
import { hasPremiumModule, isBiologicsEnabled, resolveModuleContext } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';

/**
 * Returns true for the LKB app or the LKSM app w/ premium module when the user isAdmin or the Look and Feel Setting
 * for applicationMenuDisplayMode is set to ALWAYS.
 */
export function shouldShowProductNavigation(user?: User, moduleContext?: ModuleContext): boolean {
    return (
        (isBiologicsEnabled(moduleContext) || hasPremiumModule(moduleContext)) &&
        (user?.isAdmin ||
            resolveModuleContext(moduleContext)?.api?.applicationMenuDisplayMode?.toLowerCase() === 'always')
    );
}
