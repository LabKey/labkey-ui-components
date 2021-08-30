import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { AuditBehaviorTypes, Utils } from '@labkey/api';

import {
    Alert,
    capitalizeFirstChar,
    caseInsensitive,
    createNotification,
    naturalSort,
    ParentEntityEditPanel,
    Progress,
    QueryModel,
    resolveErrorMessage,
    updateRows,
} from '../../..';
import { EntityChoice, EntityDataType } from './models';
import { Button, Modal } from 'react-bootstrap';
import { getEntityNoun } from './utils';
import { List } from 'immutable';
import { getOriginalParentsFromSampleLineage, getSampleSelectionLineageData } from '../samples/actions';
import { ParentEntityLineageColumns } from './constants';

interface Props {
    queryModel?: QueryModel;
    onCancel: () => void;
    onSuccess: () => void;
    childEntityDataType: EntityDataType;
    auditBehavior?: AuditBehaviorTypes;
    parentEntityDataTypes: EntityDataType[];
    parentNounPlural: string;
    parentNounSingular: string;
}

export const EntityLineageEditModal: FC<Props> = memo(props => {
    const {
        auditBehavior,
        queryModel,
        onCancel,
        childEntityDataType,
        onSuccess,
        parentEntityDataTypes,
        parentNounPlural,
        parentNounSingular,
    } = props;
    const [submitting, setSubmitting] = useState(false);
    const [numAliquots, setNumAliquots] = useState<number>(undefined);
    const [nonAliquots, setNonAliquots] = useState<Record<string, any>>(undefined);
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [hasParentUpdates, setHasParentUpdates] = useState<boolean>(false);
    const lcParentNounPlural = parentNounPlural.toLowerCase();
    const [selectedParents, setSelectedParents] = useState<List<EntityChoice>>(List<EntityChoice>());

    useEffect(() => {
        getSampleSelectionLineageData(List.of(...queryModel.selections), queryModel.queryName, List.of('RowId', 'Name', 'LSID', 'IsAliquot').concat(ParentEntityLineageColumns).toArray())
            .then(async response => {
                const { key, models } = response;
                const nonAliquots = {};
                let aliquotCount = 0;
                Object.keys(models[key]).forEach(id => {
                    const d = models[key][id];
                    if (caseInsensitive(d, 'IsAliquot')['value']) {
                        aliquotCount++;
                    } else {
                        nonAliquots[id] = d;
                    }
                });
                setNumAliquots(aliquotCount);
                setNonAliquots(nonAliquots);

            })
            .catch(error => {
                setErrorMessage(error);
            });
    }, [])


    const onParentChange = useCallback((entityParents: List<EntityChoice>) => {
        setSelectedParents(entityParents);
        setHasParentUpdates(entityParents.size > 0);
    }, []);

    const onConfirm = useCallback(
        async () => {
            setSubmitting(true);
            const rows = [];
            const { originalParents } = await getOriginalParentsFromSampleLineage(nonAliquots);
            Object.keys(nonAliquots).forEach((rowId) => {
                let updatedValues = {}
                let haveUpdate = false;

                // Find the types that are included and use those for change comparison.
                // Types that are not represented in the selected parents won't be changed.
                selectedParents.forEach(selected => {
                    let originalValue = null;
                    const possibleChange = originalParents[rowId].find(p => p.type.lsid == selected.type.lsid);
                    if (possibleChange) {
                        originalValue = possibleChange.gridValues.map(gridValue => gridValue.displayValue).sort(naturalSort).join(",");
                    }
                    const selValue = selected.value ? selected.value.split(",").sort(naturalSort).join(",") : null;
                    if (originalValue !== selValue) {
                        updatedValues[selected.type.entityDataType.insertColumnNamePrefix + selected.type.label] = selValue;
                        haveUpdate = true;
                    }
                });
                if (haveUpdate) {
                    queryModel.queryInfo.getPkCols().forEach(pkCol => {
                        const pkVal = nonAliquots[rowId][pkCol.fieldKey]?.['value'];

                        if (pkVal !== undefined && pkVal !== null) {
                            updatedValues[pkCol.fieldKey] = pkVal;
                        } else {
                            console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                        }
                    });
                    rows.push(updatedValues)
                }
            });

            if (rows.length > 0) {
                try {
                    await updateRows({
                        schemaQuery: queryModel.schemaQuery,
                        rows,
                        auditBehavior,
                    });
                    createNotification(`Successfully updated ${lcParentNounPlural} for ${rows.length} ${capitalizeFirstChar(getEntityNoun(childEntityDataType, rows.length))}`)
                    onSuccess();
                }
                catch (e) {
                    setSubmitting(false);
                    setErrorMessage("There was a problem updating the " + lcParentNounPlural + "." + resolveErrorMessage(e));
                }
            } else {
                createNotification(`No ${childEntityDataType.nounPlural} updated since no ${lcParentNounPlural} changed.`);
                onSuccess();
            }
        },
        [selectedParents, auditBehavior, childEntityDataType, queryModel, nonAliquots]
    );

    if (!queryModel || !nonAliquots) {
        return null;
    }

    const numNonAliquots = Object.keys(nonAliquots).length;

    if (numNonAliquots === 0) {
        return (
            <Modal show onHide={onCancel}>
                <Modal.Header closeButton>
                    <Modal.Title>Cannot Edit {parentNounPlural}</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div>The {lcParentNounPlural} for aliquots cannot be changed.</div>
                </Modal.Body>

                <Modal.Footer>
                    <Button bsClass={'btn btn-default'} onClick={onCancel} >
                        Dismiss
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }

    return (
        <Modal bsSize="large" show onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Edit {parentNounPlural} for {numNonAliquots} Selected {capitalizeFirstChar(getEntityNoun(childEntityDataType, numNonAliquots))}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <div className={"bottom-spacing"}>
                    <p>
                        Values provided here will <b>replace</b> the existing {lcParentNounPlural} of the chosen types for the selected {getEntityNoun(childEntityDataType, nonAliquots.length)}.
                        Remove {parentNounSingular} Types from the form below that you do not wish to change the value of.
                    </p>
                    <p>
                        To see details of the existing {lcParentNounPlural}, choose "Cancel" here then "Edit Selected {capitalizeFirstChar(childEntityDataType.nounPlural)} in Grid" from the "Manage" menu.
                    </p>
                </div>
                {(numAliquots > 0 && !submitting) && <Alert bsStyle={'info'}> {Utils.pluralize(numAliquots, 'aliquot was', 'aliquots were')} among the selections. Lineage for aliquots cannot be changed.</Alert>}
                <Alert bsStyle={'danger'}>{errorMessage}</Alert>

                <Progress
                    modal={false}
                    estimate={numNonAliquots  * 10}
                    toggle={submitting}
                />
                {!submitting &&
                    <ParentEntityEditPanel
                        auditBehavior={auditBehavior}
                        canUpdate={true}
                        childQueryInfo={queryModel.queryInfo}
                        childData={undefined}
                        parentDataTypes={parentEntityDataTypes}
                        childName={undefined}
                        childNounSingular={childEntityDataType.nounSingular}
                        key={`parent${parentNounPlural}-${queryModel.id}`}
                        onUpdate={onConfirm}
                        title="Details"
                        editOnly
                        hideButtons
                        submitText={'Update ' + parentNounPlural}
                        includePanelHeader={false}
                        onChangeParent={onParentChange}
                    />
                }
            </Modal.Body>

            <Modal.Footer>
                {onCancel && (
                    <Button className={"pull-left"} onClick={onCancel}>
                        Cancel
                    </Button>
                )}

                <Button bsClass={'btn btn-success'} onClick={onConfirm} disabled={submitting || !numNonAliquots || !hasParentUpdates}>
                    {submitting ? `Updating ${parentNounPlural} ...` : `Update ${parentNounPlural}`}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});

