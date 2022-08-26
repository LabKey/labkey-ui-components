import React, { FC, memo, useCallback, useEffect, useReducer } from 'react';

import { PermissionTypes } from '@labkey/api';
import { Button, Checkbox, FormControl } from 'react-bootstrap';

import { sampleManagerIsPrimaryApp } from '../../app/utils';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { loadNameExpressionOptions, saveNameExpressionOptions } from './actions';
import {RequiresPermission} from "../base/Permissions";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {LabelHelpTip} from "../base/LabelHelpTip";
import {ConfirmModal} from "../base/ConfirmModal";
import {Alert} from "../base/Alert";

const TITLE = 'ID/Name Settings';

interface NameIdSettingsProps {
    titleCls?: string;
}

export const NameIdSettings: FC<NameIdSettingsProps> = memo(props => {
    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <NameIdSettingsForm
                {...props}
                saveNameExpressionOptions={saveNameExpressionOptions}
                loadNameExpressionOptions={loadNameExpressionOptions}
            />
        </RequiresPermission>
    );
});

interface NameIdSettingsFormProps extends NameIdSettingsProps {
    loadNameExpressionOptions: () => Promise<{ prefix: string; allowUserSpecifiedNames: boolean }>;
    saveNameExpressionOptions: (key: string, value: string | boolean) => Promise<void>;
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

const initialState: State = {
    error: undefined,
    loading: true,
    prefix: '',
    savingPrefix: false,
    confirmModalOpen: false,
    allowUserSpecifiedNames: false,
    savingAllowUserSpecifiedNames: false,
};
export const NameIdSettingsForm: FC<NameIdSettingsFormProps> = props => {
    const { loadNameExpressionOptions, saveNameExpressionOptions, titleCls } = props;
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

    const initialize = async (): Promise<void> => {
        try {
            const payload = await loadNameExpressionOptions();
            setState({
                prefix: payload.prefix ?? '',
                allowUserSpecifiedNames: payload.allowUserSpecifiedNames,
                loading: false,
            });
        } catch (err) {
            setState({ error: err.exception, loading: false });
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    const displayError = (err): void => {
        setState({
            error: err.exception ?? 'Error saving setting',
            savingAllowUserSpecifiedNames: false,
        });
    };

    const saveAllowUserSpecifiedNames = useCallback(async () => {
        setState({ savingAllowUserSpecifiedNames: true });

        try {
            await saveNameExpressionOptions('allowUserSpecifiedNames', !allowUserSpecifiedNames);

            // Issue 44250: the sample type and data class queryInfo details for the name column will set the
            // setShownInInsertView based on this allowUserSpecifiedNames setting so we need to invalidate the cache
            // so that the updated information is retrieved for that table/query.
            invalidateFullQueryDetailsCache();

            setState({
                allowUserSpecifiedNames: !allowUserSpecifiedNames,
                savingAllowUserSpecifiedNames: false,
            });
        } catch (err) {
            displayError(err);
        }
    }, [allowUserSpecifiedNames, saveNameExpressionOptions]);

    const savePrefix = useCallback(async () => {
        setState({ savingPrefix: true });

        try {
            await saveNameExpressionOptions('prefix', prefix);
        } catch (err) {
            displayError(err);
        }
        setState({ savingPrefix: false, confirmModalOpen: false });
    }, [prefix, saveNameExpressionOptions]);

    const prefixOnChange = useCallback((evt: any) => {
        const val = evt.target.value;
        setState({ prefix: val });
    }, []);

    const openConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: true });
    }, []);

    const closeConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: false });
    }, []);

    return (
        <div className="name-id-settings-panel panel panel-default">
            {!titleCls && <div className="panel-heading">{TITLE}</div>}
            <div className="panel-body">
                {titleCls && <h4 className={titleCls}>{TITLE}</h4>}
                <div className="name-id-setting__setting-section">
                    <h5> User-defined IDs/Names </h5>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <form>
                            <Checkbox
                                onChange={saveAllowUserSpecifiedNames}
                                disabled={savingAllowUserSpecifiedNames}
                                checked={allowUserSpecifiedNames}
                            >
                                Allow users to create/import their own IDs/Names
                                <LabelHelpTip title="User Defined ID/Names">
                                    <p>
                                        When users are not permitted to create their own IDs/Names, the ID/Name field
                                        will be hidden during creation and update of rows, and when accessing the design
                                        of a new or existing Sample Type or{' '}
                                        {sampleManagerIsPrimaryApp() ? 'Source Type' : 'Data Class'}.
                                    </p>
                                    <p>
                                        Additionally, attempting to import data and update existing rows during file
                                        import will result in an error if a new ID/Name is encountered.
                                    </p>
                                </LabelHelpTip>
                            </Checkbox>
                        </form>
                    )}
                </div>

                <div className="name-id-setting__setting-section">
                    <h5> ID/Name Prefix </h5>
                    <div>
                        Enter a prefix to be applied to all Sample Types and{' '}
                        {sampleManagerIsPrimaryApp() ? 'Source Types' : 'Data Classes (e.g., CellLine, Construct)'}.
                        Prefixes generally are 2-3 characters long but will not be limited.
                    </div>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <>
                            <div className="name-id-setting__prefix">
                                <div className="name-id-setting__prefix-label"> Prefix: </div>

                                <div className="name-id-setting__prefix-field">
                                    <FormControl
                                        name="prefix"
                                        type="text"
                                        placeholder="Enter Prefix"
                                        onChange={prefixOnChange}
                                        value={prefix}
                                    />
                                </div>

                                <Button className="btn btn-success" onClick={openConfirmModal} disabled={savingPrefix}>
                                    Apply Prefix
                                </Button>
                            </div>
                            <div className="name-id-setting__prefix-example">
                                Example: {prefix}Blood-${'{'}GenId{'}'}
                            </div>

                            {confirmModalOpen && (
                                <ConfirmModal
                                    title="Apply Prefix?"
                                    onCancel={closeConfirmModal}
                                    onConfirm={savePrefix}
                                    confirmButtonText="Yes, Save and Apply Prefix"
                                    cancelButtonText="Cancel"
                                >
                                    <div>
                                        <p>
                                            This action will change the Naming Pattern for all new and existing Sample
                                            Types and {sampleManagerIsPrimaryApp() ? 'Source Types' : 'Data Classes'}.
                                            No existing IDs/Names will be affected. Are you sure you want to apply the
                                            prefix?
                                        </p>
                                    </div>
                                </ConfirmModal>
                            )}
                        </>
                    )}
                </div>

                {error !== undefined && <Alert className="name-id-setting__error">{error}</Alert>}
            </div>
        </div>
    );
};
