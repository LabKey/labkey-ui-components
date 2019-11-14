import moment from 'moment'
import { Map, OrderedMap } from 'immutable'
import { Ajax , ActionURL, Utils } from '@labkey/api'
import { caseInsensitive, hasAllPermissions, PermissionTypes, SchemaQuery, User } from "@glass/base";

export function getUserPermissionsDisplay(user: User): Array<string> {
    let permissions = [];

    if (user.isAdmin) {
        permissions.push('Administrator');
    }
    else {
        if (hasAllPermissions(user, [PermissionTypes.DesignSampleSet])) {
            permissions.push('Sample Set Designer');
        }
        if (hasAllPermissions(user, [PermissionTypes.DesignAssay])) {
            permissions.push('Assay Designer');
        }
        permissions.push(user.canUpdate ? 'Editor' : (user.canInsert ? 'Author' : 'Reader'));
    }

    return permissions
}

export function getUserLastLogin(userProperties: Map<string, any>, dateFormat: string): string {
    const lastLogin = caseInsensitive(userProperties.toObject(), 'lastlogin');
    return lastLogin ? moment(lastLogin).format(dateFormat) : undefined;
}

export function getUserDetailsRowData(user: User, data: OrderedMap<string, any>, avatar: File): FormData {
    const formData = new FormData();
    const row = {UserId: user.id, ...data.toJS()};

    Object.keys(row).forEach((key) => {
        let value = row[key];

        // need to convert booleans to string for save
        if (value !== null && Utils.isBoolean(value)) {
            value = value.toString();
        }

        // need to remove email from the posted data since that is not an updatable value for this action
        if (key.toLowerCase() === 'email') {
            value = undefined;
        }

        if (value !== undefined) {
            formData.append(key, value);
        }
    });

    // add in the avatar file, if a new one was added (note that we do want to let through the value of "null" since
    // that is used to indicate to the server to delete the current avatar file)
    if (avatar !== undefined) {
        formData.append('Avatar', avatar);
    }

    return formData;
}

export function updateUserDetails(schemaQuery: SchemaQuery, data: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('user', 'updateUserDetails.view', LABKEY.container.path),
            method: 'POST',
            form: data,
            success: Utils.getCallbackWrapper(result => {
                resolve(result);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            })
        });
    });
}