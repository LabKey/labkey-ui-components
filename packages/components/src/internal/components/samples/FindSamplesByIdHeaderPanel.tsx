import { isLoading, LoadingState } from '../../../public/LoadingState';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Button } from 'react-bootstrap';
import { Alert } from '../base/Alert';
import { FindByIdsModal } from '../navigation/FindByIdsModal';
import { Section } from '../base/Section';
import { FIND_IDS_SESSION_STORAGE_KEY, SAMPLE_ID_FIND_FIELD, UNIQUE_ID_FIND_FIELD } from './constants';
import { Utils } from '@labkey/api';

interface HeaderPanelProps {
    loadingState: LoadingState,
    listModel: QueryModel,
    error?: ReactNode,
    missingIds: {[key: string]: string[]}
    onFindSamples: () => void,
    onClearSamples: () => void,
}

// exported for jest testing
export function getFindIdCountsByTypeMessage() : string {
    const findIds: string[] = JSON.parse(sessionStorage.getItem(FIND_IDS_SESSION_STORAGE_KEY))
    if (!findIds) {
        return undefined;
    }

    let numIdsMsg = '';
    const numSampleIds = findIds.filter(id => id.startsWith(SAMPLE_ID_FIND_FIELD.storageKeyPrefix)).length;
    const numUniqueIds = findIds.filter(id => id.startsWith(UNIQUE_ID_FIND_FIELD.storageKeyPrefix)).length;
    if (numSampleIds) {
        numIdsMsg += Utils.pluralize(numSampleIds, SAMPLE_ID_FIND_FIELD.nounSingular, SAMPLE_ID_FIND_FIELD.nounPlural);
    }
    if (numUniqueIds) {
        numIdsMsg += (numIdsMsg ? ' and ' : '') + Utils.pluralize(numUniqueIds, UNIQUE_ID_FIND_FIELD.nounSingular, UNIQUE_ID_FIND_FIELD.nounPlural);
    }
    return numIdsMsg;
}

export const FindSamplesByIdHeaderPanel: FC<HeaderPanelProps> = memo((props) => {
    const [showFindModal, setShowFindModal] = useState<boolean>(false);

    const { loadingState, listModel, onFindSamples, onClearSamples, missingIds, error } = props;

    const numIdsMsg = getFindIdCountsByTypeMessage();

    const onAddMoreSamples = useCallback(() => {
        setShowFindModal(true);
    }, []);

    const onCancelAdd = useCallback(() => {
        setShowFindModal(false)
    }, []);

    const onFind = useCallback(() => {
        setShowFindModal(false);
        onFindSamples();
    }, [onFindSamples]);

    let foundSamplesMsg;
    if (isLoading(loadingState) || (listModel?.isLoading && !listModel.queryInfoError)) {
        foundSamplesMsg = <div className="bottom-spacing"><LoadingSpinner/></div>
    }
    else if (!numIdsMsg || !listModel || listModel.queryInfoError) {
        foundSamplesMsg = null;
    }
    else {
        foundSamplesMsg = (
            <div className="bottom-spacing">
                <i className="fa fa-check-circle find-samples-success"/>{' '}
                <span id={"found-samples-message"}>Found {Utils.pluralize(listModel.rowCount, 'sample', 'samples')} matching {numIdsMsg}.</span>
            </div>
        );
    }

    const hasSamples = !listModel?.isLoading && listModel?.rowCount > 0;

    return (
        <Section title={"Find Samples in Bulk"} panelClassName={'find-samples-header-panel'}>
            <Alert>{error}</Alert>
            {foundSamplesMsg}
            <SamplesNotFoundMsg missingIds={missingIds}/>
            <div className="bottom-spacing">
                <Button className="button-right-spacing" bsClass={'btn btn-default'} onClick={onAddMoreSamples}>
                    Add {hasSamples ? 'More ' : ''}Samples
                </Button>
                <Button bsClass={'btn btn-default'} onClick={onClearSamples} disabled={!numIdsMsg}>
                    Reset
                </Button>
            </div>
            {hasSamples && (
                <Alert bsStyle={"info"}>
                    Work with the selected samples in the grid now or save them to a picklist for later use.
                </Alert>)
            }
            <FindByIdsModal
                show={showFindModal}
                onCancel={onCancelAdd}
                onFind={onFind}
                nounPlural="samples"
                addToExistingIds={true}
            />
        </Section>
    );
});

export const SamplesNotFoundMsg: FC<{missingIds: {[key: string]: string[]}}> = memo(({missingIds}) => {

    if (!missingIds)
        return null;

    const [showIds, setShowIds] = useState<boolean>(false);

    const toggleShowIdAlert = useCallback(() => {
        setShowIds(!showIds);
    }, [showIds]);

    let count = 0;
    Object.values(missingIds).forEach(ids => {
        count += ids.length;
    });

    if (count === 0)
        return null;

    return (
        <>
            <div className="bottom-spacing">
                <span className="find-samples-warning"><i className="fa fa-exclamation-circle"/> </span>
                <span>
                    Couldn't locate {Utils.pluralize(count, 'sample', 'samples')}{'. '}
                    <a className="find-samples-warning-toggle" onClick={toggleShowIdAlert}>
                        {showIds ?
                            <>Hide <i className="fa fa-caret-down" aria-hidden="true"/></>:
                            <>Show all <i className="fa fa-caret-right" aria-hidden="true"/></>}
                    </a>
                </span>
            </div>
            {showIds && (
                <Alert bsStyle="warning">
                    {Object.keys(missingIds).map((key, index) => {
                        if (missingIds[key].length > 0) {
                            return <p key={index}>{key + ": " + missingIds[key].join(", ")}</p>
                        }
                    })}
                </Alert>
            )}
        </>
    )
});
