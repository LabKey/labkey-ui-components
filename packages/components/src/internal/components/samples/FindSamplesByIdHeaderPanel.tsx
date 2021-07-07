import { isLoading, LoadingState } from '../../../public/LoadingState';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import React, { FC, memo, useCallback, useState } from 'react';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Button } from 'react-bootstrap';
import { Alert } from '../base/Alert';
import { FindByIdsModal } from '../navigation/FindByIdsModal';
import { Section } from '../base/Section';
import { getFindIdCountsByTypeMessage } from './actions';

interface HeaderPanelProps {
    loadingState: LoadingState,
    listModel: QueryModel,
    missingIds: {[key: string]: string[]}
    onFindSamples: () => void,
    onClearSamples: () => void,
}

export const FindSamplesByIdHeaderPanel: FC<HeaderPanelProps> = memo((props) => {
    const [showFindModal, setShowFindModal] = useState<boolean>(false);
    const { loadingState, listModel, onFindSamples, onClearSamples, missingIds } = props;

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
                <span>Found {listModel.rowCount} samples matching {numIdsMsg}.</span>
            </div>
        );
    }

    let hasSamples = !listModel?.isLoading && listModel?.rowCount > 0;

    return (
        <Section title={"Find Samples in Bulk"} panelClassName={'find-samples-header-panel'}>
            {foundSamplesMsg}
            <SamplesNotFoundMsg missingIds={missingIds}/>
            <div className="bottom-spacing">
                <Button className="button-right-spacing" bsClass={'btn btn-default'} onClick={onAddMoreSamples}>
                    Add {hasSamples ? 'More' : ''} Samples
                </Button>
                <Button bsClass={'btn btn-default'} onClick={onClearSamples} disabled={!hasSamples}>
                    Reset
                </Button>
            </div>
            {hasSamples && (
                <Alert bsStyle={"info"}>
                    To save these samples as a group for later use, be sure to create or add to a picklist.
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

    let allIds = [];
    Object.values(missingIds).forEach(ids => {
        allIds = allIds.concat(ids);
    });

    if (allIds.length === 0)
        return null;

    return (
        <>
            <div className="bottom-spacing">
                <span className="find-samples-warning"><i className="fa fa-exclamation-circle"/> </span>
                <span>
                    Couldn't locate {allIds.length} samples{' '}
                    <a className="find-samples-warning-toggle" onClick={toggleShowIdAlert}>
                        {showIds ?
                            <>Hide <i className="fa fa-caret-down" aria-hidden="true"/></>:
                            <>Show all <i className="fa fa-caret-right" aria-hidden="true"/></>}
                    </a>
                </span>
            </div>
            {showIds && (
                <Alert bsStyle="warning">
                    {allIds.join(", ")}
                </Alert>
            )}
        </>
    )
});
