import React, { FC, useEffect, useState } from 'react';

import { Ajax, PermissionTypes, Utils } from '@labkey/api';
import { Button, Checkbox, FormControl, FormControlProps } from 'react-bootstrap';

import { Alert, ConfirmModal, LoadingSpinner, RequiresPermission } from '../../..';

interface State {
    error: string;
    loadingPrefix: boolean;
    prefix: string;
    savingPrefix: boolean;
    loadingAllowUserSpecifiedNames: boolean;
    allowUserSpecifiedNames: boolean;
    savingAllowUserSpecifiedNames: boolean;
    confirmModalOpen: boolean;
}

export const NameIdSettings: FC = () => {
    const [state, setState] = useState<State>({
        error: undefined,
        loadingPrefix: false, // true
        prefix: '',
        savingPrefix: false,
        confirmModalOpen: false,
        loadingAllowUserSpecifiedNames: false, // true
        allowUserSpecifiedNames: false,
        savingAllowUserSpecifiedNames: false,
    });
    const {
        loadingPrefix,
        savingAllowUserSpecifiedNames,
        allowUserSpecifiedNames,
        loadingAllowUserSpecifiedNames,
        prefix,
        savingPrefix,
        confirmModalOpen,
        error,
    } = state;

    useEffect(() => {
        // modularize? Pretty similar calls
        // // temp comment: set prefix
        // Ajax.request({
        //     url: 'getExpressionPrefix url',
        //     success: Utils.getCallbackWrapper(response => {
        //         setState(currentState => ({ ...currentState, prefix: response.data['dummyValue'], loadingPrefix: false }));
        //     }),
        //     failure: Utils.getCallbackWrapper(err => {
        //         setState(currentState => ({
        //             ...currentState,
        //             error: err.exception ?? 'Error loading setting',
        //             loadingPrefix: false,
        //         }));
        //     }),
        // });
        //
        // // temp comment: set allowUserSpecifiedNames
        // Ajax.request({
        //     url: 'allowUserSpecifiedNames url',
        //     success: Utils.getCallbackWrapper(response => {
        //         setState(currentState => ({ ...currentState, allowUserSpecifiedNames: response.data['dummyValue'], loadingAllowUserSpecifiedNames: false }));
        //     }),
        //     failure: Utils.getCallbackWrapper(err => {
        //         setState(currentState => ({
        //             ...currentState,
        //             error: err.exception ?? 'Error loading setting',
        //             loadingAllowUserSpecifiedNames: false,
        //         }));
        //     }),
        // });
    }, []);

    const saveAllowUserSpecifiedNames = (): void => {
        saveStateAttribute('savingAllowUserSpecifiedNames', true);
        // Ajax.request({
        //     url: 'setExpressionPrefix url',
        //     jsonData: { allowUserSpecifiedNames: !state.allowUserSpecifiedNames },
        //     method: 'POST',
        //     success: Utils.getCallbackWrapper(() => {
        //         setState(currentState => ({ ...currentState, allowUserSpecifiedNames: !state.allowUserSpecifiedNames, savingAllowUserSpecifiedNames: false }));
        //     }),
        //     failure: Utils.getCallbackWrapper(err => {
        //         console.error(err);
        //         setState(currentState => ({
        //             ...currentState,
        //             error: err.exception ?? 'Error saving setting',
        //             savingAllowUserSpecifiedNames: false,
        //         }));
        //     }),
        // });
    };

    const savePrefix = (): void => {
        saveStateAttribute('savingPrefix', true);
        // Ajax.request({
        //     url: 'savingPrefix url',
        //     jsonData: { prefix: prefix },
        //     method: 'POST',
        //     success: Utils.getCallbackWrapper(() => {
        //         setState(currentState => ({ ...currentState, savingPrefix: false }));
        //     }),
        //     failure: Utils.getCallbackWrapper(err => {
        //         console.error(err);
        //         setState(currentState => ({
        //             ...currentState,
        //             error: err.exception ?? 'Error saving setting',
        //             savingPrefix: false,
        //         }));
        //     }),
        // });
    };

    const saveStateAttribute = (attr: string, value: any): void => {
        setState(currentState => ({ ...currentState, [attr]: value }));
    };

    const onChange = (evt: any, stateAttr: string): void => {
        const val = evt.target.value;
        saveStateAttribute(stateAttr, val);
    };

    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <div className="name-id-settings-panel panel">
                <div className="panel-body">
                    <h4 className="setting-panel-title">ID/Name Settings</h4>
                    <div className="setting-section">
                        <h5> User Defined ID/Names </h5>

                        {loadingPrefix && <LoadingSpinner />}
                        {!loadingPrefix && (
                            <form>
                                <Checkbox
                                    onChange={saveAllowUserSpecifiedNames}
                                    disabled={savingAllowUserSpecifiedNames}
                                    checked={allowUserSpecifiedNames}
                                >
                                    Allow users to create/import their own IDs/Names
                                </Checkbox>
                            </form>
                        )}
                    </div>

                    <div className="setting-section">
                        <h5> ID/Name Prefix </h5>
                        <div>
                            Enter a Prefix to be applied to all new Sample Types, Data Classes (e.g. CellLine,
                            Construct), Notebooks, and Workflow Jobs. Prefixes generally are 2-3 characters long but
                            will not be limited. For example, if you provide the prefix "CL" your ID will look like
                            "CL123".
                        </div>

                        {loadingAllowUserSpecifiedNames && <LoadingSpinner />}
                        {!loadingAllowUserSpecifiedNames && (
                            <>
                                <div className="prefix">
                                    <div className="prefix-label"> Prefix: </div>

                                    <div className="prefix-field">
                                        <FormControl
                                            name="prefix"
                                            type="text"
                                            placeholder="Enter Prefix"
                                            onChange={evt => onChange(evt, 'prefix')}
                                            value={prefix}
                                        />
                                    </div>

                                    <Button
                                        className="btn btn-success"
                                        onClick={() => saveStateAttribute('confirmModalOpen', true)}
                                        disabled={savingPrefix}
                                    >
                                        Apply Prefix
                                    </Button>
                                </div>
                                <div className="prefix-example">
                                    Example: {prefix}-Blood-${'{'}GenId{'}'}
                                </div>

                                {confirmModalOpen && (
                                    <ConfirmModal
                                        title="Apply Prefix?"
                                        onCancel={() => saveStateAttribute('confirmModalOpen', false)}
                                        onConfirm={() => savePrefix()}
                                        confirmButtonText="Yes, Save and Apply Prefix"
                                        cancelButtonText="Cancel"
                                    >
                                        <div>
                                            <p>
                                                This action will change the Naming Pattern for all new and existing
                                                Sample Types and Data Classes. No existing IDs/Names will be affected.
                                                Are you sure you want to apply the prefix?
                                            </p>
                                        </div>
                                    </ConfirmModal>
                                )}
                            </>
                        )}
                    </div>

                    {error !== undefined && <Alert>{error}</Alert>}
                </div>
            </div>
        </RequiresPermission>
    );
};
