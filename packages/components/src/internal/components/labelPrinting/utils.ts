import { User } from '../base/models/User';

export function userCanPrintLabels(user: User): boolean {
    return user && !user.isGuest;
}
