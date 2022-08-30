import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { AuditBehaviorTypes, Utils } from '@labkey/api';

import { Button, Modal } from 'react-bootstrap';

import { List } from 'immutable';

import { getOriginalParentsFromLineage } from '../samples/actions';

import { IS_ALIQUOT_COL, SampleOperation } from '../samples/constants';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { useNotificationsContext } from '../notifications/NotificationsContext';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { capitalizeFirstChar, caseInsensitive } from '../../util/utils';
import { updateRows } from '../../query/api';
import { resolveErrorMessage } from '../../util/messaging';
import { getOperationNotPermittedMessage } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Progress } from '../base/Progress';

import { DataOperation, ParentEntityLineageColumns } from './constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';
import { getEntityNoun, getUpdatedLineageRowsForBulkEdit, isSampleEntity } from './utils';
import { EntityChoice, EntityDataType, OperationConfirmationData } from './models';

interface Props {
    api?: ComponentsAPIWrapper;
    auditBehavior?: AuditBehaviorTypes;
    childEntityDataType: EntityDataType;
    onCancel: () => void;
    onSuccess: () => void;
    parentEntityDataTypes: EntityDataType[];
    queryModel: QueryModel;
}

export const restrictedDataOperationMsg = (
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
    const { createNotification } = useNotificationsContext();

    useEffect(() => {
        if (!queryModel) return;

        (async () => {
            try {
                let confirmationData;
                if (isSampleEntity(childEntityDataType)) {
                    confirmationData = await api.samples.getSampleOperationConfirmationData(
                        SampleOperation.EditLineage,
                        queryModel.id
                    );
                } else {
                    confirmationData = await api.entity.getDataOperationConfirmationData(
                        DataOperation.EditLineage,
                        queryModel.id
                    );
                }

                // This API will retrieve lineage data for samples or dataclasses
                const lineageData = await api.samples.getSelectionLineageData(
                    List.of(...queryModel.selections),
                    queryModel.schemaName,
                    queryModel.queryName,
                    List.of('RowId', 'Name', 'LSID', IS_ALIQUOT_COL).concat(ParentEntityLineageColumns).toArray()
                );

                const { key, models } = lineageData;
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
            } catch (error) {
                if (errorMessage) setErrorMessage(errorMessage + ' ' + error);
                else setErrorMessage(error);
            }
        })();
    }, []);

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
