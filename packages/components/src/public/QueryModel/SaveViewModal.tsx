import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { PermissionTypes } from '@labkey/api';

import { WizardNavButtons } from '../../internal/components/buttons/WizardNavButtons';
import { ViewInfo } from '../../internal/ViewInfo';
import { Alert } from '../../internal/components/base/Alert';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { CUSTOM_VIEW, HelpLink } from '../../internal/util/helpLinks';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { isProductProjectsEnabled } from '../../internal/app/utils';
import { useServerContext } from '../../internal/components/base/ServerContext';

const MAX_VIEW_NAME_LENGTH = 200;

interface ViewNameInputProps {
    autoFocus?: boolean;
    defaultValue?: string;
    isDefaultView?: boolean;
    onBlur: (name: string, hasError: boolean) => void;
    placeholder?: string;
    view: ViewInfo;
    maxLength?: number;
}

export const ViewNameInput: FC<ViewNameInputProps> = memo(props => {
    const {
        autoFocus,
        defaultValue,
        placeholder,
        view,
        isDefaultView,
        onBlur,
        maxLength = MAX_VIEW_NAME_LENGTH,
    } = props;

    const [nameError, setNameError] = useState<boolean>(false);
    const [viewName, setViewName] = useState<string>(
        view?.isDefault || view?.hidden ? '' : view?.name
    );

    useEffect(() => {
        setNameError(!isDefaultView && viewName.length > maxLength)
    }, [isDefaultView, viewName]);

    const clearError = useCallback(() => {
        setNameError(false);
    }, [setNameError]);

    const onViewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setViewName(evt.target.value)
    }, []);

    const _onBlur = useCallback(() => {
        if (viewName.length > maxLength) {
            setNameError(true);
            onBlur(viewName, true);
        } else {
            onBlur(viewName, false);
        }
    }, [viewName])


    return (
        <>
            <input
                autoFocus={autoFocus}
                name="gridViewName"
                defaultValue={defaultValue}
                placeholder={placeholder ?? "Grid View Name"}
                className={"form-control" + (nameError ? " grid-view-name-error" : "") }
                value={viewName}
                onChange={onViewNameChange}
                onFocus={clearError}
                onBlur={_onBlur}
                disabled={isDefaultView}
                type="text"
            />
            {nameError && <span className="text-danger">Current length: {viewName.length}; maximum length: {maxLength}</span>}
        </>
    )
});

interface Props {
    currentView: ViewInfo;
    gridLabel: string;
    onCancel: () => void;
    onConfirmSave: (viewName, canInherit, replace, shared) => Promise<any>;
}

export const SaveViewModal: FC<Props> = memo(props => {
    const { onConfirmSave, currentView, onCancel, gridLabel } = props;

    const { user } = useServerContext();

    const [viewName, setViewName] = useState<string>(
        currentView?.isDefault || currentView?.hidden ? '' : currentView?.name
    );
    const [nameError, setNameError] = useState<boolean>(false);
    const [isDefaultView, setIsDefaultView] = useState<boolean>(user.hasAdminPermission() && currentView?.isDefault);
    const [canInherit, setCanInherit] = useState<boolean>(currentView?.inherit);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();

    const saveView = useCallback(async () => {
        if (!viewName && !isDefaultView) return;

        setErrorMessage(undefined);
        setIsSubmitting(true);

        try {
            const name = isDefaultView ? '' : viewName.trim();
            const isCurrentView = name?.toLowerCase() === currentView?.name?.toLowerCase();
            await onConfirmSave(name, canInherit, isCurrentView, isDefaultView);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [viewName, isDefaultView, canInherit]);

    const onViewNameChange = useCallback((name: string, hasError: boolean) => {
        setViewName(name);
        setNameError(hasError);
    }, []);

    const toggleDefaultView = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setIsDefaultView(evt.target.checked);
        setNameError(false);
    }, []);

    const toggleInherit = useCallback((evt: ChangeEvent<HTMLInputElement>) => setCanInherit(evt.target.checked), []);

    return (
        <Modal onHide={onCancel} show>
            <Modal.Header closeButton>
                <Modal.Title>Save Grid View</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Alert>{errorMessage}</Alert>
                <form onSubmit={saveView}>
                    <div className="form-group">
                        <div className="bottom-spacing">
                            Sort order and filters will be saved as part of custom grid views. Once saved, this view
                            will be available for all {gridLabel} grids throughout the application. Learn more about{' '}
                            <HelpLink topic={CUSTOM_VIEW}>custom grid views</HelpLink> in LabKey.
                        </div>
                        <div className="bottom-spacing">
                            <ViewNameInput onBlur={onViewNameChange} view={currentView} isDefaultView={isDefaultView} />
                        </div>
                        <RequiresPermission perms={PermissionTypes.Admin}>
                            {/* Only allow admins to create custom default views in app. Note this is different from LKS*/}
                            <div className="form-check bottom-spacing">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="setDefaultView"
                                    onChange={toggleDefaultView}
                                    checked={isDefaultView}
                                />
                                <span className="margin-left">Make default view for all users</span>
                            </div>
                        </RequiresPermission>
                        {isProductProjectsEnabled() && (
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="setInherit"
                                    onChange={toggleInherit}
                                    checked={canInherit}
                                />
                                <span className="margin-left">Make this grid view available in child folders</span>
                            </div>
                        )}
                    </div>
                </form>
            </Modal.Body>
            <Modal.Footer>
                <WizardNavButtons
                    cancel={onCancel}
                    cancelText="Cancel"
                    canFinish={(!!viewName && !nameError) || isDefaultView}
                    containerClassName=""
                    isFinishing={isSubmitting}
                    isFinishingText="Saving..."
                    finish
                    finishText="Save"
                    nextStep={saveView}
                />
            </Modal.Footer>
        </Modal>
    );
});
