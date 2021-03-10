import { Record } from 'immutable';

export class ChangePasswordModel extends Record({
    email: undefined,
    oldPassword: '',
    password: '',
    password2: '',
}) {
    declare email: string;
    declare oldPassword: string;
    declare password: string;
    declare password2: string;
}
