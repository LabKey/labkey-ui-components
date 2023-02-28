import React, { FC, memo, useCallback, useEffect, useReducer } from 'react';

import { PermissionTypes } from '@labkey/api';
import { Button, Checkbox, FormControl } from 'react-bootstrap';

import { biologicsIsPrimaryApp, sampleManagerIsPrimaryApp } from '../../app/utils';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { RequiresPermission } from '../base/Permissions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { ConfirmModal } from '../base/ConfirmModal';
import { Alert } from '../base/Alert';

import { useServerContext } from '../base/ServerContext';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { loadNameExpressionOptions, saveNameExpressionOptions } from './actions';

const TITLE = 'ID/Name Settings';

interface NameIdSettingsFormProps extends InjectedRouteLeaveProps {
    loadNameExpressionOptions: () => Promise<{ allowUserSpecifiedNames: boolean; prefix: string }>;
    saveNameExpressionOptions: (key: string, value: string | boolean) => Promise<void>;
}

interface State {
    allowUserSpecifiedNames: boolean;
    confirmModalOpen: boolean;
    error: string;
    loading: boolean;
    prefix: string;
    savingAllowUserSpecifiedNames: boolean;
    savingPrefix: boolean;
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
    const { loadNameExpressionOptions, saveNameExpressionOptions, setIsDirty } = props;
    const [state, setState] = useReducer(
        (currentState: State, newState: Partial<State>): State => ({ ...currentState, ...newState }),
        initialState
    );
    const { moduleContext } = useServerContext();

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
        setIsDirty(false);
    }, [prefix, saveNameExpressionOptions, setIsDirty]);

    const prefixOnChange = useCallback(
        (evt: any) => {
            const val = evt.target.value;
            setState({ prefix: val });
            setIsDirty(true);
        },
        [setIsDirty]
    );

    const openConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: true });
    }, []);

    const closeConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: false });
    }, []);

    return (
        <div className="name-id-settings-panel panel panel-default">
            <div className="panel-heading">{TITLE}</div>
            <div className="panel-body">
                <div className="name-id-setting__setting-section">
                    <div className="list__bold-text margin-bottom">User-defined IDs/Names</div>

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
                                        {sampleManagerIsPrimaryApp(moduleContext) ? 'Source Type' : 'Data Class'}.
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

                {biologicsIsPrimaryApp(moduleContext) && (
                    <div className="name-id-setting__setting-section">
                        <div className="list__bold-text margin-bottom margin-top">ID/Name Prefix</div>
                        <div>
                            Enter a prefix to the Naming Pattern for all new Samples and{' '}
                            {sampleManagerIsPrimaryApp(moduleContext) ? 'Sources' : 'Data Classes'}. No existing
                            IDs/Names will be changed.
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

                                    <Button
                                        className="btn btn-success"
                                        onClick={openConfirmModal}
                                        disabled={savingPrefix}
                                    >
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
                                                This action will change the Naming Pattern for all new and existing
                                                Sample Types and{' '}
                                                {sampleManagerIsPrimaryApp(moduleContext)
                                                    ? 'Source Types'
                                                    : 'Data Classes'}
                                                . No existing IDs/Names will be affected but any new IDs/Names will have
                                                the prefix applied. Are you sure you want to apply the prefix?
                                            </p>
                                        </div>
                                    </ConfirmModal>
                                )}
                            </>
                        )}
                    </div>
                )}

                {error !== undefined && <Alert className="name-id-setting__error">{error}</Alert>}
            </div>
        </div>
    );
};

export const NameIdSettings: FC<InjectedRouteLeaveProps> = memo(props => {
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
