import React, { FC, memo, useCallback, useEffect, useReducer } from 'react';

import { PermissionTypes } from '@labkey/api';
import { Checkbox, FormControl } from 'react-bootstrap';

import { biologicsIsPrimaryApp, sampleManagerIsPrimaryApp } from '../../app/utils';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { RequiresPermission } from '../base/Permissions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { useServerContext } from '../base/ServerContext';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { HelpLink } from '../../util/helpLinks';
import { SAMPLE_TYPE_NAME_EXPRESSION_TOPIC } from '../samples/constants';

import { Container } from '../base/models/Container';

import { loadNameExpressionOptions, saveNameExpressionOptions } from './actions';

const TITLE = 'ID/Name Settings';

interface NameIdSettingsFormProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    container: Container;
    isAppHome?: boolean;
    loadNameExpressionOptions: (
        containerPath?: string
    ) => Promise<{ allowUserSpecifiedNames: boolean; prefix: string }>;
    saveNameExpressionOptions: (key: string, value: string | boolean, containerPath?: string) => Promise<string[]>;
}

interface NameIdSettingsProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    container: Container;
    isAppHome?: boolean;
}

interface State {
    allowUserSpecifiedNames: boolean;
    api?: ComponentsAPIWrapper;
    confirmCounterModalOpen?: boolean;
    confirmModalOpen: boolean;
    error: string;
    hasPrefixChange?: boolean;
    hasRootSampleCountChange?: boolean;
    hasRootSamples?: boolean;
    hasSampleCountChange?: boolean;
    hasSamples?: boolean;
    isReset?: boolean;
    isRoot?: boolean;
    loadingCounters: boolean;
    loadingNamingOptions: boolean;
    newRootSampleCount?: number;
    newSampleCount?: number;
    prefix: string;
    prefixIneligibleSampleTypeNames: string[];
    rootSampleCount?: number;
    sampleCount?: number;
    savingAllowUserSpecifiedNames: boolean;
    savingPrefix: boolean;
    updatingCounter?: boolean;
}

const initialState: State = {
    error: undefined,
    loadingNamingOptions: true,
    loadingCounters: true,
    prefix: '',
    prefixIneligibleSampleTypeNames: [],
    savingPrefix: false,
    confirmModalOpen: false,
    allowUserSpecifiedNames: false,
    savingAllowUserSpecifiedNames: false,
    hasPrefixChange: false,
    hasSampleCountChange: false,
    hasRootSampleCountChange: false,
};

export const NameIdSettingsForm: FC<NameIdSettingsFormProps> = props => {
    const { api, loadNameExpressionOptions, saveNameExpressionOptions, setIsDirty, isAppHome, container } = props;
    const [state, setState] = useReducer(
        (currentState: State, newState: Partial<State>): State => ({ ...currentState, ...newState }),
        initialState
    );
    const { moduleContext } = useServerContext();

    const {
        loadingCounters,
        loadingNamingOptions,
        savingAllowUserSpecifiedNames,
        allowUserSpecifiedNames,
        prefix,
        prefixIneligibleSampleTypeNames,
        savingPrefix,
        confirmModalOpen,
        error,
        confirmCounterModalOpen,
        isRoot,
        isReset,
        updatingCounter,
        hasRootSamples,
        hasSamples,
        rootSampleCount,
        sampleCount,
        newSampleCount,
        newRootSampleCount,
        hasPrefixChange,
        hasSampleCountChange,
        hasRootSampleCountChange,
    } = state;

    const initializeNamingPattern = async (): Promise<void> => {
        try {
            const payload = await loadNameExpressionOptions(container.path);
            setState({
                prefix: payload.prefix ?? '',
                allowUserSpecifiedNames: payload.allowUserSpecifiedNames,
                loadingNamingOptions: false,
            });
        } catch (err) {
            setState({ error: err.exception, loadingNamingOptions: false });
        }
    };
    const initialize = async (): Promise<void> => {
        try {
            if (isAppHome) {
                const sampleCount = await api.samples.getSampleCounter('sampleCount'); // show the next value
                const rootSampleCount = await api.samples.getSampleCounter('rootSampleCount');
                let hasRootSamples = false,
                    hasSamples = false;
                if (sampleCount > 0) hasSamples = await api.samples.hasExistingSamples(false);
                if (rootSampleCount > 0) hasRootSamples = await api.samples.hasExistingSamples(true);

                setState({
                    loadingCounters: false,
                    sampleCount,
                    rootSampleCount,
                    newSampleCount: sampleCount,
                    newRootSampleCount: rootSampleCount,
                    hasSamples,
                    hasRootSamples,
                });
            }
        } catch (err) {
            setState({ error: err.exception, loadingCounters: false });
        }
    };

    useEffect(() => {
        initializeNamingPattern();
        initialize();
    }, [isAppHome, container]);

    const displayError = (err): void => {
        setState({
            error: err.exception ?? 'Error saving setting',
            savingAllowUserSpecifiedNames: false,
        });
    };

    const saveAllowUserSpecifiedNames = useCallback(async () => {
        setState({ savingAllowUserSpecifiedNames: true });

        try {
            await saveNameExpressionOptions('allowUserSpecifiedNames', !allowUserSpecifiedNames, container.path);

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
    }, [allowUserSpecifiedNames, saveNameExpressionOptions, container.path]);

    const savePrefix = useCallback(async () => {
        setState({ savingPrefix: true });
        let response: string[];

        try {
            response = await saveNameExpressionOptions('prefix', prefix, container.path);
        } catch (err) {
            displayError(err);
        }
        setState({
            savingPrefix: false,
            confirmModalOpen: false,
            hasPrefixChange: false,
            prefixIneligibleSampleTypeNames: response,
        });
        setIsDirty(false);
    }, [prefix, saveNameExpressionOptions, setIsDirty, container.path]);

    const prefixOnChange = useCallback(
        (evt: any) => {
            const val = evt.target.value;
            setState({ prefix: val, hasPrefixChange: true });
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

    const openSetCounterConfirmModal = useCallback((isRoot_: boolean, isReset_: boolean): void => {
        setState({ confirmCounterModalOpen: true, isReset: isReset_, isRoot: isRoot_ });
    }, []);

    const closeCounterConfirmModal = useCallback(() => {
        setState({ confirmCounterModalOpen: false });
    }, []);

    const setNewSampleCount = useCallback(
        (newValue: number, root?: boolean) => {
            if (root) {
                setState({ hasRootSampleCountChange: true, newRootSampleCount: newValue });
            } else {
                setState({ hasSampleCountChange: true, newSampleCount: newValue });
            }
            setIsDirty(true);
        },
        [setIsDirty]
    );

    const saveSampleCounter = useCallback(async () => {
        const newCount = isReset ? 0 : isRoot ? newRootSampleCount : newSampleCount;
        try {
            await api.samples.saveSampleCounter(newCount, isRoot ? 'rootSampleCount' : 'sampleCount');
            if (isRoot)
                setState({
                    rootSampleCount: newCount,
                    confirmCounterModalOpen: false,
                    newRootSampleCount: newCount,
                    error: undefined,
                    prefixIneligibleSampleTypeNames: [],
                    hasRootSampleCountChange: false,
                });
            else
                setState({
                    sampleCount: newCount,
                    confirmCounterModalOpen: false,
                    newSampleCount: newCount,
                    error: undefined,
                    prefixIneligibleSampleTypeNames: [],
                    hasSampleCountChange: false,
                });
            setIsDirty(false);
        } catch (error) {
            if (isRoot) {
                setState({
                    error,
                    confirmCounterModalOpen: false,
                    newRootSampleCount: rootSampleCount,
                });
            } else {
                setState({
                    error,
                    confirmCounterModalOpen: false,
                    newSampleCount: sampleCount,
                });
            }
        }
    }, [isRoot, isReset, newRootSampleCount, newSampleCount, setIsDirty, rootSampleCount, sampleCount]);

    return (
        <div className="name-id-settings-panel panel panel-default">
            <div className="panel-heading">{TITLE}</div>
            <div className="panel-body">
                {error !== undefined && <Alert className="name-id-setting__error">{error}</Alert>}
                {prefixIneligibleSampleTypeNames.length > 0 && (
                    <Alert bsStyle="success" className="name-id-setting__error">
                        Prefix updated. The following were ineligible and excluded:
                        <ul>{prefixIneligibleSampleTypeNames?.map(name => <li key={name}>{name}</li>)}</ul>
                    </Alert>
                )}
                <div className="name-id-setting__setting-section">
                    <div className="list__bold-text margin-bottom">User-defined IDs/Names</div>

                    {loadingNamingOptions && <LoadingSpinner />}
                    {!loadingNamingOptions && (
                        <form>
                            <Checkbox
                                onChange={saveAllowUserSpecifiedNames}
                                disabled={savingAllowUserSpecifiedNames}
                                checked={allowUserSpecifiedNames}
                            >
                                Allow users to create/import their own IDs/Names in this folder
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
                            Enter a prefix to use with every Naming Pattern when new IDs/Names are created in this
                            project. No existing IDs/Names will be changed.
                        </div>

                        {loadingNamingOptions && <LoadingSpinner />}
                        {!loadingNamingOptions && (
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

                                    <button
                                        className="btn btn-success"
                                        onClick={openConfirmModal}
                                        disabled={savingPrefix || !hasPrefixChange}
                                        type="button"
                                    >
                                        Apply Prefix
                                    </button>
                                </div>
                                <div className="name-id-setting__prefix-example">
                                    Example: {prefix}Blood-${'{'}GenId{'}'}
                                </div>

                                {confirmModalOpen && (
                                    <Modal
                                        confirmClass="btn-danger"
                                        title="Apply Prefix?"
                                        onCancel={closeConfirmModal}
                                        onConfirm={savePrefix}
                                        confirmText="Yes, Save and Apply Prefix"
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
                                    </Modal>
                                )}
                            </>
                        )}
                    </div>
                )}

                {isAppHome && (
                    <div className="sample-counter__setting-section margin-top">
                        <div className="list__bold-text margin-bottom">Naming Pattern Elements/Tokens</div>
                        <div>
                            The following tokens/counters are utilized in naming patterns for the application and all
                            projects. To modify a counter, simply enter a number greater than the current value and
                            click “Apply”. Please be aware that once a counter is changed, the action cannot be
                            reversed. For additional information regarding these tokens, you can refer to this{' '}
                            <HelpLink topic={SAMPLE_TYPE_NAME_EXPRESSION_TOPIC}>link</HelpLink>.
                        </div>

                        {loadingCounters && <LoadingSpinner />}
                        {!loadingCounters && (
                            <div>
                                <div className="row margin-top">
                                    <div className="col-sm-2">
                                        <div className="sample-counter__prefix-label">sampleCount</div>
                                    </div>
                                    <div className="col-sm-2">
                                        <FormControl
                                            className="update-samplecount-input "
                                            min={sampleCount}
                                            step={1}
                                            name="newSampleCount"
                                            onChange={(event: any) => setNewSampleCount(event?.target?.value, false)}
                                            type="number"
                                            value={newSampleCount}
                                            placeholder="Enter new sampleCount..."
                                        />
                                    </div>
                                    <div className="col-sm-8">
                                        <button
                                            className="btn btn-success sample-counter-btn"
                                            onClick={() => {
                                                openSetCounterConfirmModal(false, false);
                                            }}
                                            disabled={updatingCounter || !hasSampleCountChange}
                                            type="button"
                                        >
                                            Apply New sampleCount
                                        </button>
                                        {!hasSamples && sampleCount > 0 && (
                                            <button
                                                className="btn btn-success sample-counter-btn"
                                                onClick={() => {
                                                    openSetCounterConfirmModal(false, true);
                                                }}
                                                disabled={updatingCounter}
                                                type="button"
                                            >
                                                Reset sampleCount
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="row margin-top">
                                    <div className="col-sm-2">
                                        <div className="sample-counter__prefix-label">rootSampleCount</div>
                                    </div>
                                    <div className="col-sm-2">
                                        <FormControl
                                            className="update-samplecount-input "
                                            min={rootSampleCount}
                                            step={1}
                                            name="newRootSampleCount"
                                            onChange={(event: any) => setNewSampleCount(event?.target?.value, true)}
                                            type="number"
                                            value={newRootSampleCount}
                                            placeholder="Enter new rootSampleCount..."
                                        />
                                    </div>
                                    <div className="col-sm-8">
                                        <button
                                            className="btn btn-success sample-counter-btn"
                                            onClick={() => {
                                                openSetCounterConfirmModal(true, false);
                                            }}
                                            disabled={updatingCounter || !hasRootSampleCountChange}
                                            type="button"
                                        >
                                            Apply New rootSampleCount
                                        </button>
                                        {!hasRootSamples && rootSampleCount > 0 && (
                                            <button
                                                className="btn btn-success sample-counter-btn"
                                                onClick={() => {
                                                    openSetCounterConfirmModal(true, true);
                                                }}
                                                disabled={updatingCounter}
                                                type="button"
                                            >
                                                Reset rootSampleCount
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {confirmCounterModalOpen && (
                                    <Modal
                                        confirmClass="btn-danger"
                                        title={
                                            (isReset ? 'Reset ' : 'Update ') +
                                            (isRoot ? 'rootSampleCount' : 'sampleCount')
                                        }
                                        onCancel={closeCounterConfirmModal}
                                        onConfirm={saveSampleCounter}
                                        confirmText={'Yes, ' + (isReset ? 'Reset' : 'Update')}
                                    >
                                        <div>
                                            <p>
                                                This action will change the {isRoot ? 'rootSampleCount' : 'sampleCount'}{' '}
                                                from {isRoot ? rootSampleCount : sampleCount} to{' '}
                                                {isReset ? 0 : isRoot ? newRootSampleCount : newSampleCount} for the
                                                application and all projects. Are you sure you want to proceed? This
                                                action cannot be undone.
                                            </p>
                                        </div>
                                    </Modal>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

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

NameIdSettings.defaultProps = {
    api: getDefaultAPIWrapper(),
};
