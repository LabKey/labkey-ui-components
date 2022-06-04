import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';

import { PermissionTypes } from '@labkey/api';

import { WizardNavButtons } from '../../internal/components/buttons/WizardNavButtons';
import { ViewInfo } from '../../internal/ViewInfo';
import { Alert } from '../../internal/components/base/Alert';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { CUSTOM_VIEW, HelpLink } from '../../internal/util/helpLinks';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { isSubfolderDataEnabled } from '../../internal/app/utils';
import { useServerContext } from '../../internal/components/base/ServerContext';

export interface Props {
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

    const onViewNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setViewName(evt.target.value), []);

    const toggleDefaultView = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setIsDefaultView(evt.target.checked);
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
                            Sort order and filters are not saved as part of custom grid views. Once saved, this view
                            will be available for all {gridLabel} grids throughout the application. Learn more about{' '}
                            <HelpLink topic={CUSTOM_VIEW}>custom grid views</HelpLink> in LabKey.
                        </div>
                        <div className="bottom-spacing">
                            <input
                                name="gridViewName"
                                placeholder="Grid View Name"
                                className="form-control"
                                value={viewName}
                                onChange={onViewNameChange}
                                disabled={isDefaultView}
                                type="text"
                                width={50}
                            />
                        </div>
                        <RequiresPermission perms={PermissionTypes.Admin}>
                            {' '}
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
                        {isSubfolderDataEnabled() && (
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
                    canFinish={!!viewName || isDefaultView}
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
