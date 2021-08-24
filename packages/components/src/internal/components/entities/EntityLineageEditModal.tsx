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
    const [nonAliquots, setNonAliquots] = useState<Record<string, any>[]>(undefined);
    const [errorMessage, setErrorMessage] = useState(undefined);
    const [aliquots, setAliquots] = useState<Record<string, any>[]>(undefined);
    const [hasParentUpdates, setHasParentUpdates] = useState<boolean>(false);
    const [originalParents, setOriginalParents] = useState<List<EntityChoice>[]>()
    const lcParentNounPlural = parentNounPlural.toLowerCase();
    const [selectedParents, setSelectedParents] = useState<List<EntityChoice>>(List<EntityChoice>());

    useEffect(() => {
        getSelectedData(queryModel.schemaName, queryModel.queryName, [...queryModel.selections])
            .then(response => {
                const {data, dataIds} = response;
                const nonAliquots = [];
                const aliquots = [];
                const parents: List<EntityChoice>[] = [];
                data.forEach((d, key) => {
                    if (d.getIn(['IsAliquot', 'value'])) {
                        aliquots.push(d.toJS());
                    }
                    else {
                        const dataRecord = d.toJS();
                        nonAliquots.push(dataRecord);
                        // want to know
                        // (a) what parent types already have values so we can add those types in the form
                        // (b) if the values for the parents are the same so we can fill in those values
                        // (c) what current parents are so we can know whether an update has been made
                        // if we store a map from the input column to the common set of parents, or an empty array
                        // if the values are not the same we should be able to know these three things
                        // groups[0] = {'DataInputs/Labs': [123, 234]}}
                        const lcPrefixes = parentEntityDataTypes.map(dataType => dataType.insertColumnNamePrefix.toLowerCase());
                        // TODO get the original parents from the selection and store in the parents object
                    }
                });
                setOriginalParents(new Array<List<EntityChoice>>(nonAliquots.length));
                setNonAliquots(nonAliquots);
                setAliquots(aliquots);
            })
            .catch(reason => {
                console.error(reason)
                setErrorMessage("There was a problem retrieving the data for the selected " + childEntityDataType.nounPlural + ".  Please be sure the " + childEntityDataType.nounPlural + " are still valid.");
            })
    }, [])


    const onParentChange = useCallback((entityParents: List<EntityChoice>) => {
        setSelectedParents(entityParents);
        setHasParentUpdates(entityParents.size > 0);
    }, []);


    const onConfirm = useCallback(
        async () => {
            setSubmitting(true);
            const rows = [];
            nonAliquots.forEach((row, i) => {
                rows.push(getUpdatedRowForParentChanges(originalParents[i], selectedParents, row, queryModel.queryInfo));
            });

            try
            {
                await updateRows({
                    schemaQuery: queryModel.schemaQuery,
                    rows,
                    auditBehavior,
                });
                createNotification(`Successfully updated ${lcParentNounPlural} for ${nonAliquots.length} ${capitalizeFirstChar(getEntityNoun(childEntityDataType, nonAliquots.length))}`)
                onSuccess();
            } catch (e) {
                setSubmitting(false);
                setErrorMessage("There was a problem updating the " + lcParentNounPlural + "." + resolveErrorMessage(e));
            }
        },
        [selectedParents, auditBehavior, childEntityDataType, queryModel, nonAliquots]
    );

    if (!queryModel || !nonAliquots || !aliquots) {
        return null;
    }

    if (nonAliquots?.length === 0) {
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
                <Modal.Title>Edit {parentNounPlural} for {nonAliquots.length} Selected {capitalizeFirstChar(getEntityNoun(childEntityDataType, nonAliquots.length))}</Modal.Title>
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
                {(aliquots?.length > 0 && !submitting) && <Alert bsStyle={'info'}> {Utils.pluralize(aliquots.length, 'aliquot was', 'aliquots were')} among the selections. Lineage for aliquots cannot be changed.</Alert>}
                <Alert bsStyle={'danger'}>{errorMessage}</Alert>

                <Progress
                    modal={false}
                    estimate={(nonAliquots?.length ?? 10) * 10}
                    title={`Updating ${lcParentNounPlural} for ${nonAliquots?.length} ${getEntityNoun(childEntityDataType, nonAliquots?.length)}`}
                    toggle={submitting}
                />
                {!submitting &&
                    <ParentEntityEditPanel
                        auditBehavior={auditBehavior}
                        canUpdate={true}
                        childQueryInfo={queryModel.queryInfo}
                        childData={queryModel.getRow()}
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

                <Button bsClass={'btn btn-success'} onClick={onConfirm} disabled={submitting || !nonAliquots?.length || !hasParentUpdates}>
                    {submitting ? `Updating ${parentNounPlural} ...` : `Update ${parentNounPlural}`}
                </Button>
            </Modal.Footer>
        </Modal>
    );
});
