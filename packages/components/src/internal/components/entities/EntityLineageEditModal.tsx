import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { AuditBehaviorTypes, Utils } from '@labkey/api';

import { Button, Modal } from 'react-bootstrap';

import { List } from 'immutable';

import {
    Alert,
    capitalizeFirstChar,
    caseInsensitive,
    createNotification,
    getOperationNotPermittedMessage,
    LoadingSpinner,
    Progress,
    QueryModel,
    resolveErrorMessage,
    SampleOperation,
    updateRows,
} from '../../..';

import { getOriginalParentsFromSampleLineage } from '../samples/actions';

import { IS_ALIQUOT_COL } from '../samples/constants';

import { EntityChoice, EntityDataType, OperationConfirmationData } from './models';
import { getEntityNoun, getUpdatedLineageRowsForBulkEdit } from './utils';

import { ParentEntityLineageColumns } from './constants';
import { ParentEntityEditPanel } from './ParentEntityEditPanel';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

interface Props {
    queryModel: QueryModel;
    onCancel: () => void;
    onSuccess: () => void;
    childEntityDataType: EntityDataType;
    auditBehavior?: AuditBehaviorTypes;
    parentEntityDataTypes: EntityDataType[];
    api?: ComponentsAPIWrapper;
}

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

    useEffect(() => {
        if (!queryModel) return;

        (async () => {
            try {
                const confirmationData = await api.samples.getSampleOperationConfirmationData(
                    SampleOperation.EditLineage,
                    queryModel.id
                );
                const sampleData = await api.samples.getSampleSelectionLineageData(
                    List.of(...queryModel.selections),
                    queryModel.queryName,
                    List.of('RowId', 'Name', 'LSID', IS_ALIQUOT_COL).concat(ParentEntityLineageColumns).toArray()
                );

                const { key, models } = sampleData;
                const allowedForUpdate = {};
                const aIds = [];
                Object.keys(models[key]).forEach(id => {
                    const d = models[key][id];
                    if (caseInsensitive(d, IS_ALIQUOT_COL)['value']) {
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

        // TODO: Configure "containerPath" for getOriginalParentsFromSampleLineage() call
        const { originalParents } = await getOriginalParentsFromSampleLineage(allowedForUpdate);
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
                        {numAliquots === statusData.totalCount && (
                            <>The {lcParentNounPlural} for aliquots cannot be changed. </>
                        )}
                        {aliquotsMsg}
                        {getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)}
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
                        {(numAliquots > 0 || statusData.notAllowed.length > 0) && !submitting && (
                            <Alert bsStyle="warning" className="has-aliquots-alert">
                                {aliquotsMsg}
                                {getOperationNotPermittedMessage(SampleOperation.EditLineage, statusData)}
                            </Alert>
                        )}
                        <Alert bsStyle="danger">{errorMessage}</Alert>

                        <Progress modal={false} estimate={numAllowed * 10} toggle={submitting} />
                        {!submitting && (
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
                        )}
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
