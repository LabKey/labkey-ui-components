import { PermissionTypes } from '@labkey/api';

import { User } from './components/base/models/User';

export const TEST_USER_GUEST = new User({
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
    permissionsList: [PermissionTypes.Read],
});

export const TEST_USER_READER = new User({
    id: 1200,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'ReaderDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        PermissionTypes.Read,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.ReadNotebooks,
    ],
});

export const TEST_USER_AUTHOR = new User({
    id: 1300,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'AuthorDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [PermissionTypes.Read, PermissionTypes.Insert],
});

export const TEST_USER_EDITOR = new User({
    id: 1100,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'EditorDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.EditSharedView,
    ],
});

export const TEST_USER_EDITOR_WITHOUT_DELETE = new User({
    id: 1100,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'EditorDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        PermissionTypes.Read,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
    ],
});

export const TEST_USER_ASSAY_DESIGNER = new User({
    id: 1400,
    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,
    displayName: 'AssayDesignerDisplayName',
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [PermissionTypes.Read, PermissionTypes.DesignAssay],
});

export const TEST_USER_FOLDER_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'FolderAdminDisplayName',
    isAdmin: true,
    isAnalyst: true,
    isDeveloper: true,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: [
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignStorage,
        PermissionTypes.DesignAssay,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.Admin,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.CanSeeGroupDetails,
        PermissionTypes.CanSeeUserDetails,
    ],
});

export const TEST_USER_PROJECT_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'FolderAdminDisplayName',
    isAdmin: true,
    isAnalyst: true,
    isDeveloper: true,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: true,
    permissionsList: [
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignStorage,
        PermissionTypes.DesignAssay,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.Admin,
        PermissionTypes.AddUser,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.CanSeeGroupDetails,
        PermissionTypes.CanSeeUserDetails,
    ],
});

export const TEST_USER_SITE_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'AppAdminDisplayName',
    isAdmin: true,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: true,
    isSignedIn: true,
    isSystemAdmin: true,
    isTrusted: false,
    permissionsList: [
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignAssay,
        PermissionTypes.DesignStorage,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.Admin,
        PermissionTypes.UserManagement,
        PermissionTypes.ApplicationAdmin,
        PermissionTypes.AddUser,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.CanSeeGroupDetails,
        PermissionTypes.CanSeeUserDetails,
    ],
});

export const TEST_USER_APP_ADMIN = new User({
    id: 1005,
    canDelete: true,
    canDeleteOwn: true,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: true,
    displayName: 'AppAdminDisplayName',
    isAdmin: true,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: true,
    isSignedIn: true,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [
        PermissionTypes.Delete,
        PermissionTypes.Read,
        PermissionTypes.DesignDataClass,
        PermissionTypes.DesignSampleSet,
        PermissionTypes.DesignAssay,
        PermissionTypes.DesignStorage,
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.Admin,
        PermissionTypes.UserManagement,
        PermissionTypes.ApplicationAdmin,
        PermissionTypes.AddUser,
        PermissionTypes.ReadNotebooks,
        PermissionTypes.ReadDataClass,
        PermissionTypes.ReadAssay,
        PermissionTypes.ReadMedia,
        PermissionTypes.CanSeeGroupDetails,
        PermissionTypes.CanSeeUserDetails,
    ],
});

export const TEST_USER_STORAGE_DESIGNER = new User({
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
    permissionsList: [PermissionTypes.Read, PermissionTypes.DesignStorage],
});

export const TEST_USER_STORAGE_EDITOR = new User({
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
        PermissionTypes.Read,
        PermissionTypes.EditStorageData,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.ManagePicklists,
    ],
});

export const TEST_USER_WORKFLOW_EDITOR = new User({
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
        PermissionTypes.Read,
        PermissionTypes.ManageSampleWorkflows,
        PermissionTypes.SampleWorkflowDelete,
        PermissionTypes.ManagePicklists,
    ],
});

export const TEST_USER_QC_ANALYST = new User({
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
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,
    permissionsList: [PermissionTypes.QCAnalyst],
});
