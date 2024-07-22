import { User } from '../base/models/User';
import { hasPremiumModule, isBiologicsEnabled, isLKSSupportEnabled, resolveModuleContext } from '../../app/utils';
import { ModuleContext } from '../base/ServerContext';

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
