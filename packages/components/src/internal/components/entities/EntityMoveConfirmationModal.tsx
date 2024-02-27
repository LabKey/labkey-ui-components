import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';

import { Modal, ModalProps } from '../../Modal';
import { Alert } from '../base/Alert';
import { useServerContext } from '../base/ServerContext';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { resolveErrorMessage } from '../../util/messaging';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';
import { Container } from '../base/models/Container';

import { ProjectConfigurableDataType } from './models';
import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';

export interface EntityMoveConfirmationModalProps extends Omit<ModalProps, 'onConfirm'> {
    currentContainer?: Container;
    dataType?: ProjectConfigurableDataType;
    dataTypeRowId?: number;
    nounPlural: string;
    onConfirm: (targetContainer: string, targetName: string, userComment: string) => void;
}

export const EntityMoveConfirmationModal: FC<EntityMoveConfirmationModalProps> = memo(props => {
    const { children, onConfirm, nounPlural, currentContainer, dataType, dataTypeRowId, ...confirmModalProps } = props;
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [containerOptions, setContainerOptions] = useState<SelectInputOption[]>();
    const [selectedContainerOption, setSelectedContainerOption] = useState<SelectInputOption>();
    const [auditUserComment, setAuditUserComment] = useState<string>();
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const container_ = currentContainer ?? container;
    const hasValidUserComment = auditUserComment?.trim()?.length > 0;
    const { requiresUserComment } = useDataChangeCommentsRequired();

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    let folders = await api.folder.getProjects(container_, moduleContext, true, true, true);

                    const excludedFolders = await api.folder.getDataTypeExcludedProjects(dataType, dataTypeRowId);

                    // filter to folders that the user has InsertPermissions
                    folders = folders.filter(c => c.effectivePermissions.indexOf(Security.PermissionTypes.Insert) > -1);

                    // filter out the current container
                    folders = folders.filter(c => c.id !== container_.id);

                    // filter folder by exclusion
                    if (excludedFolders) {
                        folders = folders.filter(c => excludedFolders.indexOf(c.id) === -1);
                    }

                    setContainerOptions(
                        folders.map(f => ({
                            label: f.path === HOME_PATH ? HOME_TITLE : f.title,
                            value: f.path,
                            data: f,
                        }))
                    );
                } catch (e) {
                    setError(`Error: ${resolveErrorMessage(e)}`);
                } finally {
                    setLoading(LoadingState.LOADED);
                }
            })();
        },
        [
            /* on mount only */
        ]
    );

    const onConfirmCallback = useCallback(() => {
        if (selectedContainerOption) {
            onConfirm(selectedContainerOption.value, selectedContainerOption.label, auditUserComment);
        }
    }, [onConfirm, selectedContainerOption, auditUserComment]);

    const onContainerChange = useCallback(
        (fieldName: string, chosenType: string, selectedOption: SelectInputOption) => {
            setSelectedContainerOption(selectedOption);
        },
        []
    );

    const onCommentChange = useCallback(evt => {
        setAuditUserComment(evt.target.value);
    }, []);

    if (isLoading(loading)) {
        return (
            <Modal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
            >
                <LoadingSpinner msg="Loading target projects..." />
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
                cancelText="Dismiss"
            >
                <Alert>{error}</Alert>
            </Modal>
        );
    }

    if (containerOptions?.length === 0) {
        return (
            <Modal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
                cancelText="Dismiss"
            >
                You do not have permission to move {nounPlural} to any of the available projects.
            </Modal>
        );
    }

    return (
        <Modal
            {...confirmModalProps}
            onConfirm={onConfirmCallback}
            canConfirm={!!selectedContainerOption && (!requiresUserComment || hasValidUserComment)}
        >
            {children}
            <div className="top-spacing">
                <SelectInput
                    helpTipRenderer="NONE"
                    label="Move to"
                    onChange={onContainerChange}
                    options={containerOptions}
                    required
                />
            </div>
            <CommentTextArea actionName="Moving" onChange={onCommentChange} requiresUserComment={requiresUserComment} />
        </Modal>
    );
});
