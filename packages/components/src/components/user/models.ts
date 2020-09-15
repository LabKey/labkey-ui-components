import { Record } from 'immutable';

export class ChangePasswordModel extends Record({
    email: undefined,
    oldPassword: '',
    password: '',
    password2: '',
}) {
    email: string;
    oldPassword: string;
    password: string;
    password2: string;
}
