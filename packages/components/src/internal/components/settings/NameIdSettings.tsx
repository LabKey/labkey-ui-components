import React, { FC, useEffect, useReducer } from 'react';

import { Ajax, PermissionTypes, Utils } from '@labkey/api';
import { Button, Checkbox, FormControl } from 'react-bootstrap';

import {
    Alert,
    buildURL,
    ConfirmModal,
    handleRequestFailure,
    LabelHelpTip,
    LoadingSpinner,
    RequiresPermission,
    resolveErrorMessage,
} from '../../..';

class NameIdSettingsActions {
    save = (key: string, value: string | boolean): Promise<null> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('sampleManager', 'setNameExpressionOptions'),
                jsonData: { [key]: value },
                method: 'POST',
                success: Utils.getCallbackWrapper(response => resolve(response)),
                failure: handleRequestFailure(reject, 'Failed to save name expression options.'),
            });
        });
    };
    init = (): Promise<{ prefix: string; allowUserSpecifiedNames: boolean }> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: buildURL('sampleManager', 'getNameExpressionOptions'),
                success: Utils.getCallbackWrapper(response => resolve(response)),
                failure: handleRequestFailure(reject, 'Failed to get name expression options.'),
            });
        });
    };
}

interface State {
    error: string;
    loading: boolean;
    prefix: string;
    savingPrefix: boolean;
    allowUserSpecifiedNames: boolean;
    savingAllowUserSpecifiedNames: boolean;
    confirmModalOpen: boolean;
}

export const NameIdSettings: FC = () => {
    const initialState: State = {
        error: undefined,
        loading: true,
        prefix: '',
        savingPrefix: false,
        confirmModalOpen: false,
        allowUserSpecifiedNames: false,
        savingAllowUserSpecifiedNames: false,
    };
    const [state, setState] = useReducer(
        (currentState: State, newState: Partial<State>): State => ({ ...currentState, ...newState }),
        initialState
    );

    const {
        loading,
        savingAllowUserSpecifiedNames,
        allowUserSpecifiedNames,
        prefix,
        savingPrefix,
        confirmModalOpen,
        error,
    } = state;

    const api = new NameIdSettingsActions();

    useEffect(() => {
        api.init()
            .then(response => {
                setState({
                    prefix: response.prefix ?? '',
                    allowUserSpecifiedNames: response.allowUserSpecifiedNames,
                    loading: false,
                });
            })
            .catch(err => {
                setState({
                    error: resolveErrorMessage(err),
                    loading: false,
                });
            });
    }, []);

    const saveAllowUserSpecifiedNames = (): void => {
        setState({ savingAllowUserSpecifiedNames: true });
        api.save('allowUserSpecifiedNames', !allowUserSpecifiedNames)
            .then(() => {
                setState({
                    allowUserSpecifiedNames: !allowUserSpecifiedNames,
                    savingAllowUserSpecifiedNames: false,
                });
            })
            .catch(err => displayError(err));
    };

    const savePrefix = (): void => {
        setState({ savingPrefix: true });
        api.save('prefix', prefix)
            .then(() => {
                setState({ savingPrefix: false, confirmModalOpen: false });
            })
            .catch(err => displayError(err));
    };

    const displayError = (err): void => {
        setState({
            error: err.exception ?? 'Error saving setting',
            savingAllowUserSpecifiedNames: false,
        });
    };

    const onChange = (evt: any, stateAttr: string): void => {
        const val = evt.target.value;
        setState({ [stateAttr]: val });
    };

    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <div className="name-id-settings-panel panel">
                <div className="panel-body">
                    <h4 className="setting-panel-title">ID/Name Settings</h4>
                    <div className="setting-section">
                        <h5> User Defined ID/Names </h5>

                        {loading && <LoadingSpinner />}
                        {!loading && (
                            <form>
                                <Checkbox
                                    onChange={() => saveAllowUserSpecifiedNames()}
                                    disabled={savingAllowUserSpecifiedNames}
                                    checked={allowUserSpecifiedNames}
                                >
                                    Allow users to create/import their own IDs/Names
                                    <LabelHelpTip title="TBD">
                                        <p> TBD </p>
                                    </LabelHelpTip>
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

                        {loading && <LoadingSpinner />}
                        {!loading && (
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
                                        onClick={() => setState({ confirmModalOpen: true })}
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
                                        onCancel={() => setState({ confirmModalOpen: false })}
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
