import { User } from '../../components/base/models/model';


export const GUEST = new User({
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: true,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        "org.labkey.api.security.permissions.ReadPermission"
    ]
});

export const READER = new User({
    id: 1200,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        "org.labkey.api.security.permissions.ReadPermission"
    ]
});

export const AUTHOR = new User({
    id: 1300,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: true,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: [
        "org.labkey.api.security.permissions.ReadPermission",
        "org.labkey.api.security.permissions.InsertPermission"
    ]
});

export const EDITOR = new User({
    id: 1100,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    isAdmin: false,
    isAnalyst: true,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: [
        "org.labkey.api.security.permissions.DeletePermission",
        "org.labkey.api.security.permissions.ReadPermission",
        "org.labkey.api.security.permissions.DesignSampleSetPermission",
        "org.labkey.api.security.permissions.InsertPermission",
        "org.labkey.api.security.permissions.UpdatePermission"
    ]
});

export const ASSAYDESIGNER = new User({
    id: 1400,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        "org.labkey.api.security.permissions.ReadPermission",
        "org.labkey.api.assay.security.DesignAssayPermission"
    ]
});

export const ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    isAdmin: true,
    isAnalyst: true,
    isDeveloper: true,
    isGuest: false,
    isRootAdmin: true,
    isSignedIn: true,
    isSystemAdmin: true,
    isTrusted: true,
    permissionsList: [
        "org.labkey.api.security.permissions.DeletePermission",
        "org.labkey.api.security.permissions.ReadPermission",
        "org.labkey.api.security.permissions.DesignSampleSetPermission",
        "org.labkey.api.assay.security.DesignAssayPermission",
        "org.labkey.api.security.permissions.InsertPermission",
        "org.labkey.api.security.permissions.UpdatePermission"
    ]
});