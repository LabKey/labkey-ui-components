import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AuditBehaviorTypes, Utils } from '@labkey/api';

import { Button, Modal } from 'react-bootstrap';

import { List } from 'immutable';

import { IS_ALIQUOT_COL, SampleOperation } from '../internal/components/samples/constants';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { capitalizeFirstChar, caseInsensitive } from '../internal/util/utils';
import { updateRows } from '../internal/query/api';
import { resolveErrorMessage } from '../internal/util/messaging';
import { getOperationNotPermittedMessage } from '../internal/components/samples/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { Alert } from '../internal/components/base/Alert';
import { Progress } from '../internal/components/base/Progress';

import { DataOperation, ParentEntityLineageColumns } from '../internal/components/entities/constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';
import { getEntityNoun, isSampleEntity } from '../internal/components/entities/utils';
import { EntityChoice, EntityDataType, OperationConfirmationData } from '../internal/components/entities/models';
import { getUpdatedLineageRowsForBulkEdit } from './utils';
import { getOriginalParentsFromLineage } from './actions';
import { setSnapshotSelections } from '../internal/actions';
import { isLoading, LoadingState } from '../public/LoadingState';

interface Props {
    api?: ComponentsAPIWrapper;
    auditBehavior?: AuditBehaviorTypes;
    childEntityDataType: EntityDataType;
    onCancel: () => void;
    onSuccess: () => void;
    parentEntityDataTypes: EntityDataType[];
    queryModel: QueryModel;
}

const restrictedDataOperationMsg = (
    confirmationData: OperationConfirmationData,
    entityDataType: EntityDataType
): string => {
    let notAllowedMsg = null;

    if (confirmationData) {
        if (confirmationData.totalCount === 0) {
            return null;
        }

        if (confirmationData.noneAllowed) {
            return `All selected ${entityDataType.nounPlural} have a status that prevents updating of their lineage.`;
        }

        const notAllowed = confirmationData.notAllowed;
        if (notAllowed?.length > 0) {
            notAllowedMsg = `The current status of ${notAllowed.length} selected ${
                notAllowed.length > 1 ? entityDataType.nounPlural : entityDataType.nounSingular
            }
            prevents updating of ${notAllowed.length > 1 ? 'their' : "it's"} lineage.`;
        }
    }

    return notAllowedMsg;
};

export const EntityLineageEditModal: FC<Props> = memo(props => {
    const { api, auditBehavior, queryModel, onCancel, childEntityDataType, onSuccess, parentEntityDataTypes } = props;
    const [submitting, setSubmitting] = useState(false);
    const [allowedForUpdate, setAllowedForUpdate] = useState<Record<string, any>>(undefined);
    const [aliquotIds, setAliquotIds] = useState<number[]>(undefined);
    const [errorMessage, setErrorMessage] = useState<string>(undefined);
    const [hasParentUpdates, setHasParentUpdates] = useState<boolean>(false);
    const parentNounPlural = parentEntityDataTypes[0].nounPlural;
    const parentNounSingular = parentEntityDataTypes[0].nounSingular;
    const lcParentNounPlural = parentNounPlural.toLowerCase();
    const [selectedParents, setSelectedParents] = useState<List<EntityChoice>>(List<EntityChoice>());
    const [statusData, setStatusData] = useState<OperationConfirmationData>(undefined);
    const [selectionsLoading, setSelectionsLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const { createNotification } = useNotificationsContext();
    const useSnapshotSelection = queryModel?.filterArray.length > 0;

    useEffect(() => {
        if (!queryModel) return;

        (async () => {
            try {
                let confirmationData;
                if (useSnapshotSelection) {
                    if (!queryModel.isLoadingSelections) {
                        await setSnapshotSelections(queryModel.id, [...queryModel.selections]);
                        setSelectionsLoading(LoadingState.LOADED);
                    }
                } else  {
                    setSelectionsLoading(LoadingState.LOADED);
                }
                if (!isLoading(selectionsLoading)) {
                    if (isSampleEntity(childEntityDataType)) {
                        confirmationData = await api.samples.getSampleOperationConfirmationData(
                            SampleOperation.EditLineage,
                            undefined,
                            queryModel.id,
                            useSnapshotSelection
                        );
                    } else {
                        confirmationData = await api.entity.getDataOperationConfirmationData(
                            DataOperation.EditLineage,
                            undefined,
                            queryModel.id,
                            useSnapshotSelection
                        );
                    }


                    // This API will retrieve lineage data for samples or dataclasses
                    const lineageData = await api.samples.getSelectionLineageData(
                        List.of(...queryModel.selections),
                        queryModel.schemaName,
                        queryModel.queryName,
                        queryModel.viewName,
                        List.of('RowId', 'Name', 'LSID', IS_ALIQUOT_COL).concat(ParentEntityLineageColumns).toArray()
                    );

                    const {key, models} = lineageData;
                    const allowedForUpdate = {};
                    const aIds = [];
                    Object.keys(models[key]).forEach(id => {
                        const d = models[key][id];
                        const isAliq = caseInsensitive(d, IS_ALIQUOT_COL);
                        if (isAliq && isAliq['value']) {
                            aIds.push(id);
                        } else {
                            if (confirmationData.isIdAllowed(id)) {
                                allowedForUpdate[id] = d;
                            }
                        }
                    });
                    setStatusData(confirmationData);
                    setAliquotIds(aIds);
                    setAllowedForUpdate(allowedForUpdate);
                }
            } catch (error) {
                if (errorMessage) setErrorMessage(errorMessage + ' ' + error);
                else setErrorMessage(error);
            }
        })();
    }, [useSnapshotSelection, selectionsLoading, queryModel]);

    const onParentChange = useCallback((entityParents: List<EntityChoice>) => {
        setSelectedParents(entityParents);
        setHasParentUpdates(entityParents.size > 0);
    }, []);

    const onConfirm = async (): Promise<void> => {
        setSubmitting(true);

        const { originalParents } = await getOriginalParentsFromLineage(allowedForUpdate, parentEntityDataTypes);
        const rows = getUpdatedLineageRowsForBulkEdit(
            allowedForUpdate,
            selectedParents,
            originalParents,
            queryModel.queryInfo
        );

        if (rows.length > 0) {
            try {
                await updateRows({
                    schemaQuery: queryModel.schemaQuery,
                    rows,
                    auditBehavior,
                });
                onSuccess();
                createNotification(
                    `Successfully updated ${lcParentNounPlural} for ${rows.length} ${capitalizeFirstChar(
                        getEntityNoun(childEntityDataType, rows.length)
                    )}.`
                );
            } catch (e) {
                setSubmitting(false);
                setErrorMessage(
                    'There was a problem updating the ' + lcParentNounPlural + '.' + resolveErrorMessage(e)
                );
            }
        } else {
            onSuccess();
            createNotification(`No ${childEntityDataType.nounPlural} updated since no ${lcParentNounPlural} changed.`);
        }
    };

    if (!queryModel || !statusData) {
        return null;
    }

    const numAllowed = allowedForUpdate ? Object.keys(allowedForUpdate).length : undefined;
    const numAliquots = aliquotIds?.length || 0;

    const aliquotsMsg =
        numAliquots > 0 && numAliquots < statusData.totalCount
            ? `${Utils.pluralize(
                  numAliquots,
                  'aliquot was',
                  'aliquots were'
              )} among the selections. Lineage for aliquots cannot be changed. `
            : undefined;

    if (numAllowed === 0) {
        return (
            <Modal show onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Cannot Edit {parentNounPlural}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div>
                        {isSampleEntity(childEntityDataType) ? (
                            <>
                                {numAliquots === statusData.totalCount && (
                                    <>The {lcParentNounPlural} for aliquots cannot be changed. </>
                                )}
                                {aliquotsMsg}
                                {getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)}
                            </>
                        ) : (
                            <>{restrictedDataOperationMsg(statusData, childEntityDataType)}</>
                        )}
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsClass="btn btn-default" onClick={onCancel}>
                        Dismiss
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }

    return (
        <Modal bsSize="large" show onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>
                    Edit {parentNounPlural} for {numAllowed ?? ''} Selected{' '}
                    {capitalizeFirstChar(getEntityNoun(childEntityDataType, numAllowed))}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {!numAllowed && <LoadingSpinner />}
                {numAllowed && (
                    <>
                        <div className="bottom-spacing">
                            <p>
                                Values provided here will <b>replace</b> the existing {lcParentNounPlural} of the chosen
                                types for the selected {getEntityNoun(childEntityDataType, numAllowed)}. Remove{' '}
                                {parentNounSingular} Types from the form below that you do not wish to change the value
                                of.
                            </p>
                            <p>
                                To see details of the existing {lcParentNounPlural}, choose "Cancel" here then "Edit
                                Selected {capitalizeFirstChar(childEntityDataType.nounPlural)} in Grid" from the
                                "Manage" menu.
                            </p>
                        </div>
                        {(numAliquots > 0 || statusData.notAllowed.length > 0) && (
                            <Alert bsStyle="warning" className="has-aliquots-alert">
                                {aliquotsMsg}
                                {isSampleEntity(childEntityDataType)
                                    ? getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)
                                    : restrictedDataOperationMsg(statusData, childEntityDataType)}
                            </Alert>
                        )}
                        <Alert bsStyle="danger">{errorMessage}</Alert>

                        <Progress modal={false} estimate={numAllowed * 10} toggle={submitting} />
                        <ParentEntityEditPanel
                            auditBehavior={auditBehavior}
                            canUpdate={true}
                            childSchemaQuery={queryModel.schemaQuery}
                            parentDataTypes={parentEntityDataTypes}
                            childNounSingular={childEntityDataType.nounSingular}
                            key={`parent${parentNounPlural}-${queryModel.id}`}
                            onUpdate={onConfirm}
                            editOnly
                            hideButtons
                            submitText={'Update ' + parentNounPlural}
                            includePanelHeader={false}
                            onChangeParent={onParentChange}
                        />
                    </>
                )}
            </Modal.Body>

            <Modal.Footer>
                {onCancel && (
                    <Button className="pull-left" onClick={onCancel}>
                        Cancel
                    </Button>
                )}

                <Button bsStyle="success" onClick={onConfirm} disabled={submitting || !numAllowed || !hasParentUpdates}>
                    {submitting ? `Updating ${parentNounPlural} ...` : `Update ${parentNounPlural}`}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

EntityLineageEditModal.defaultProps = {
    api: getDefaultAPIWrapper(),
};

EntityLineageEditModal.displayName = 'EntityLineageEditModal';
