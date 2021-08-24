import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AuditBehaviorTypes, Utils } from '@labkey/api';

import {
    Alert,
    capitalizeFirstChar, createNotification,
    DataClassDataType, getSelectedData,
    ParentEntityEditPanel,
    Progress,
    QueryModel, resolveErrorMessage,
    SampleTypeDataType, updateRows,
} from '../../..';
import { EntityChoice, EntityDataType } from './models';
import { Button, Modal } from 'react-bootstrap';
import { getEntityNoun, getUpdatedRowForParentChanges } from './utils';
import { List } from 'immutable';

interface Props {
    queryModel?: QueryModel;
    onCancel: () => void;
    onSuccess: () => void;
    childEntityDataType: EntityDataType;
    childName: string
    auditBehavior?: AuditBehaviorTypes;
    parentEntityDataTypes: EntityDataType[][];
}

export const EntityLineageEditModal: FC<Props> = memo(props => {
    const {
        auditBehavior,
        queryModel,
        onCancel,
        childEntityDataType,
        childName,
        onSuccess,
        parentEntityDataTypes,
    } = props;
    const [submitting, setSubmitting] = useState(false);
    const [nonAliquots, setNonAliquots] = useState<Record<string, any>[]>(undefined);
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [aliquots, setAliquots] = useState<Record<string, any>[]>(undefined);
    const [allCurrentParents, setAllCurrentParents] = useState<List<EntityChoice>[]>(Array(parentEntityDataTypes.length))
    const [hasParentUpdates, setHasParentUpdates] = useState<boolean>(false);

    useEffect(() => {
        getSelectedData(queryModel.schemaName, queryModel.queryName, [...queryModel.selections])
            .then(response => {
                const {data, dataIds} = response;
                const nonAliquots = []
                const aliquots = []
                data.forEach((d, key) => {
                    if (d.getIn(['IsAliquot', 'value'])) {
                        aliquots.push(d.toJS());
                    }
                    else {
                        nonAliquots.push(d.toJS());
                    }
                });
                setNonAliquots(nonAliquots);
                setAliquots(aliquots);
            })
            .catch(reason => {
                console.error(reason)
                setErrorMessage("There was a problem retrieving the data for the selected " + childEntityDataType.nounPlural + ".  Please be sure the " + childEntityDataType.nounPlural + " are still valid.");
            })
    }, [])


    const onParentChange = useCallback((index, entityParents: List<EntityChoice>) => {
        allCurrentParents[index] = entityParents;
        setHasParentUpdates(allCurrentParents?.find((entityParents) => entityParents?.find(parent => parent.value != undefined)) !== undefined);
    }, [allCurrentParents]);


    const onConfirm = useCallback(
        async () => {
            setSubmitting(true);
            let updatedParents = [];
            allCurrentParents.forEach((currentParents) => {
                updatedParents = updatedParents.concat(currentParents.toArray());
            });
            const rows = [];
            nonAliquots.forEach(row => {
                rows.push(getUpdatedRowForParentChanges(List<EntityChoice>(), List<EntityChoice>(updatedParents), row, queryModel.queryInfo));
            });

            try
            {
                await updateRows({
                    schemaQuery: queryModel.schemaQuery,
                    rows,
                    auditBehavior,
                });
                // setSubmitting(false);
                createNotification(`Successfully updated lineage for ${nonAliquots.length} ${capitalizeFirstChar(getEntityNoun(childEntityDataType, nonAliquots.length))}`)
                onSuccess();
            } catch (e) {
                setSubmitting(false);
                setErrorMessage("There was a problem updating the lineage." + resolveErrorMessage(e));
            }
        },
        [allCurrentParents, auditBehavior, childEntityDataType, queryModel, nonAliquots]
    );

    if (!queryModel || !nonAliquots || !aliquots) {
        return null;
    }

    let body;
    if (nonAliquots?.length === 0) {
        body = <Alert bsStyle={'info'}>The lineage for the selected {getEntityNoun(childEntityDataType, queryModel.selections.size)} cannot be changed.</Alert>
    }
    else {
        body = (
            <>
                {(aliquots?.length > 0 && !submitting) && <Alert bsStyle={'info'}> {Utils.pluralize(aliquots.length, 'aliquot was', 'aliquots were')} among the selections. Lineage for aliquots cannot be changed.</Alert>}
                <Alert bsStyle={'danger'}>{errorMessage}</Alert>
                <Progress
                    modal={false}
                    estimate={(nonAliquots?.length ?? 10) * 10}
                    title={`Updating lineage for ${nonAliquots?.length} ${getEntityNoun(childEntityDataType, nonAliquots?.length)}`}
                    toggle={submitting}
                />
                {!submitting &&
                <>
                    {parentEntityDataTypes.map((parentTypes, index) => {
                        return (
                            <ParentEntityEditPanel
                                auditBehavior={auditBehavior}
                                canUpdate={true}
                                childQueryInfo={queryModel.queryInfo}
                                childData={queryModel.getRow()}
                                parentDataTypes={parentTypes}
                                childName={undefined}
                                childNounSingular={childEntityDataType.nounSingular}
                                key={`parent-${parentTypes[0].nounSingular}-${queryModel.id}`}
                                onUpdate={onConfirm}
                                title="Details"
                                editOnly
                                hideButtons
                                includePanelHeader={false}
                                onChangeParent={(currentParents) => onParentChange(index, currentParents)}
                            />
                        )
                    })}
                </>
                }
            </>
        )
    }

    return (
        <Modal bsSize="large" show onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>Edit Lineage for {nonAliquots.length} Selected {capitalizeFirstChar(getEntityNoun(childEntityDataType, nonAliquots.length))}</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {body}
            </Modal.Body>

            <Modal.Footer>
                {onCancel && (
                    <Button className={"pull-left"} onClick={onCancel}>
                        Cancel
                    </Button>
                )}

                <Button bsClass={'btn btn-primary'} onClick={onConfirm} disabled={submitting || !nonAliquots?.length || !hasParentUpdates}>
                    {submitting ? 'Updating Lineage...' : 'Update Lineage'}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});
