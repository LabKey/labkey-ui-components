import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import classNames from 'classnames';
import { Picklist } from './models';
import { formatDate, parseDate } from '../../util/Date';
import { User } from '../base/models/User';
import { Utils } from '@labkey/api';
import { Alert } from '../base/Alert';
import { addSamplesToPicklist, getPicklistCountsBySampleType, getPicklists, SampleTypeCount } from './actions';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ColorIcon } from '../base/ColorIcon';
import { createNotification } from '../notifications/actions';
import { AppURL } from '../../url/AppURL';
import { PICKLIST_KEY } from '../../app/constants';

interface PicklistListProps {
    activeItem: Picklist;
    emptyMessage: ReactNode;
    onSelect: (picklist) => void;
    showSharedIcon?: boolean
    items: Picklist[];
}

const PicklistList: FC<PicklistListProps> = memo((props) => {
    const {activeItem, emptyMessage, onSelect, showSharedIcon = false, items} = props;
    return (
        <div className="list-group choices-list">
            {items.map(item => (
                <button
                    className={classNames('list-group-item', {active: activeItem?.listId === item.listId})}
                    key={item.listId}
                    onClick={onSelect.bind(this, item)}
                    type="button"
                >
                    {showSharedIcon && item.isPublic() && (<span className="fa fa-users"/>)}
                    {item.name}
                </button>
            ))}
            {items.length === 0 && <p className="choices-list__empty-message">{emptyMessage}</p>}
        </div>
    );
});

interface PicklistItemsSummaryDisplayProps {
    countsByType: SampleTypeCount[]
}

interface PicklistItemsSummaryProps {
    picklist: Picklist
}

const PicklistItemsSummaryDisplay: FC<PicklistItemsSummaryDisplayProps & PicklistItemsSummaryProps> = memo((props) => {
    const {countsByType, picklist} = props;

    const summaryData = [];
    if (countsByType.length === 0) {
        if (picklist.ItemCount === 0) {
            summaryData.push(<div className="choices-detail__empty-message">This list is empty.</div>);
        } else {
            summaryData.push(<div>{picklist.ItemCount} samples</div>);
        }
    } else {
        countsByType.forEach(countData => {
            summaryData.push((
                <div className="row picklist-items__row">
                    <span className="col-md-1">
                        <ColorIcon useSmall={true} value={countData.LabelColor}/>
                    </span>
                    <span
                        className="col-md-5 picklist-items__sample-type choice-metadata-item__name">{countData.SampleType}</span>
                    <span className="col-md-4 picklist-items__item-count">{countData.ItemCount}</span>
                </div>
            ));
        });
    }

    return (
        <div>
            <div className={'picklist-items__header'}>Sample Counts</div>
            {summaryData}
        </div>
    );
});

const PicklistItemsSummary: FC<PicklistItemsSummaryProps> = memo((props) => {
    const {picklist} = props;
    const [countsByType, setCountsByType] = useState<SampleTypeCount[]>(undefined);
    const [loadingCounts, setLoadingCounts] = useState<boolean>(true);

    useEffect(() => {
        getPicklistCountsBySampleType(picklist.name)
            .then(counts => {
                setCountsByType(counts);
                setLoadingCounts(false);
            })
            .catch(reason => {
                setCountsByType([]);
                setLoadingCounts(false);
            });

    }, [picklist, getPicklistCountsBySampleType, setCountsByType, setLoadingCounts]);

    if (loadingCounts) {
        return <LoadingSpinner/>;
    }

    return <PicklistItemsSummaryDisplay {...props} countsByType={countsByType}/>;
});

interface PicklistDetailsProps {
    picklist: Picklist;
}

const PicklistDetails: FC<PicklistDetailsProps> = memo((props) => {
    const {picklist} = props;

    return (
        <div className="choice-details">
            <div className="choice-details__name">{picklist.name}</div>

            <div className="choice-details__metadata">
                {picklist.isPublic() && (
                    <div className="choice-metadata-item">
                        <span className="choice-metadata-item__name">Created by:</span>
                        <span className="choice-metadata-item__value">{picklist.CreatedByDisplay}</span>
                    </div>
                )}

                <div className="choice-metadata-item">
                    <span className="choice-metadata-item__name">Created:</span>
                    <span className="choice-metadata-item__value">{formatDate(parseDate(picklist.Created))}</span>
                </div>

            </div>

            <div className="choice-details__description">
                {picklist.Description}
            </div>

            <div className="top-spacing">
                <PicklistItemsSummary picklist={picklist}/>
            </div>
        </div>
    );
});


function createAddedToPicklistNotification(picklist: Picklist, numAdded: number, numSelected: number): void {
    let numAddedNotification;
    if (numAdded == 0) {
        numAddedNotification = 'No samples added';
    } else {
        numAddedNotification = 'Successfully added ' + Utils.pluralize(numAdded, 'sample', 'samples');
    }
    let numNotAddedNotification = null;
    if (numAdded < numSelected) {
        const notAdded = (numSelected - numAdded);
        numNotAddedNotification = ' ' + Utils.pluralize(notAdded, 'sample', 'samples');
        numNotAddedNotification += notAdded === 1 ? ' was ' : ' were ';
        numNotAddedNotification += 'already in the list.';
    }
    createNotification({
        message: () => {
            return (
                <>
                    {numAddedNotification} to picklist "<a
                    href={AppURL.create(PICKLIST_KEY, picklist.listId).toHref()}>{picklist.name}</a>".
                    {numNotAddedNotification}
                </>
            );
        },
        alertClass: numAdded === 0 ? 'info' : 'success'
    });
}

interface ChoosePicklistModalDisplayProps {
    picklists: Picklist[],
    picklistLoadError: ReactNode,
    loading: boolean
}

export const ChoosePicklistModalDisplay: FC<ChoosePicklistModalProps & ChoosePicklistModalDisplayProps> = memo((props) => {
    const {
        picklists,
        loading,
        picklistLoadError,
        onCancel,
        afterAddToPicklist,
        user,
        selectionKey,
        numSelected,
        sampleIds
    } = props;
    const [search, setSearch] = useState<string>('');
    const [error, setError] = useState<string>(undefined);
    const [submitting, setSubmitting] = useState<boolean>(false);


    const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value.trim().toLowerCase());
    }, []);

    const filteredItems = useMemo<Picklist[]>(() => {
        if (search.trim() !== '') {
            return picklists.filter(item => item.name.toLowerCase().indexOf(search) > -1);
        }

        return picklists;
    }, [search, picklists]);

    const [myItems, teamItems] = useMemo(() => {
        const mine = [];
        const team = [];

        filteredItems.forEach((item) => {
            if (item.isUserList(user)) {
                mine.push(item);
            }
            if (item.isPublic()) {
                team.push(item);
            }
        });

        return [mine, team];
    }, [filteredItems]);

    const [activeItem, setActiveItem] = useState<Picklist>(undefined);

    const onAddClicked = useCallback(async () => {
        setSubmitting(true);
        try {
            const insertResponse = await addSamplesToPicklist(activeItem.name, selectionKey, sampleIds);
            setError(undefined);
            setSubmitting(false);
            createAddedToPicklistNotification(activeItem, insertResponse.rows.length, numSelected ?? sampleIds.length);
            afterAddToPicklist();
        }
        catch (e) {
            setSubmitting(false);
            setError(resolveErrorMessage(e));
        }
    }, [activeItem, selectionKey, setSubmitting, setError, sampleIds]);

    const closeModal = useCallback(() => {
        onCancel(false);
    }, [onCancel]);

    const goToCreateNewList = useCallback(() => {
        onCancel(true);
    }, [onCancel]);

    const isSearching = !!(search);
    let myEmptyMessage: ReactNode = <LoadingSpinner/>;
    let teamEmptyMessage: ReactNode = <LoadingSpinner/>;

    if (!loading) {
        myEmptyMessage = 'You do not have any picklists ';
        teamEmptyMessage = 'There are no shared picklists  ';

        let suffix = '';
        if (isSearching) {
            suffix = ' matching your search';
        }
        suffix += ' to add ' + (numSelected === 1 ? 'this sample to.' : 'these samples to.');
        myEmptyMessage += suffix;
        teamEmptyMessage += suffix;
        let createNewList = null;
        if (!isSearching) {
            createNewList = <>Do you want to <a onClick={goToCreateNewList}>create a new one</a>?</>;
            myEmptyMessage = <>{myEmptyMessage} {createNewList}</>;
            teamEmptyMessage = <>{teamEmptyMessage} {createNewList}</>;
        }
    }

    return (
        <Modal show bsSize="large" onHide={close}>
            <Modal.Header>
                <Modal.Title>
                    Choose a Picklist
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert bsStyle="danger">{picklistLoadError ?? error}</Alert>
                <div className="row">
                    <div className={'col-md-12'}>
                        <Alert bsStyle="info">
                            Adding {Utils.pluralize(numSelected, 'sample', 'samples')} to selected picklist.
                        </Alert>
                    </div>
                </div>
                <div className="row">
                    <div className="col-md-6">
                        <input
                            autoFocus
                            className="form-control"
                            onChange={onSearchChange}
                            placeholder="Find a picklist"
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6">
                        <Tabs id="choose-items-tabs" className="choose-items-tabs" animation={false}>
                            <Tab eventKey={1} title="My Picklists">
                                <PicklistList
                                    activeItem={activeItem}
                                    emptyMessage={myEmptyMessage}
                                    onSelect={setActiveItem}
                                    showSharedIcon
                                    items={myItems}
                                />
                            </Tab>

                            <Tab eventKey={2} title="Team Picklists">
                                <PicklistList
                                    activeItem={activeItem}
                                    emptyMessage={teamEmptyMessage}
                                    onSelect={setActiveItem}
                                    items={teamItems}
                                />
                            </Tab>
                        </Tabs>
                    </div>

                    <div className="col-md-6">
                        {activeItem === undefined && (
                            <div className="choices-list__empty-message">Choose a picklist</div>
                        )}

                        {activeItem !== undefined && <PicklistDetails picklist={activeItem}/>}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={closeModal}>
                        Cancel
                    </button>
                </div>

                <div className="pull-right">
                    <button
                        type="button"
                        className="btn btn-success"
                        onClick={onAddClicked}
                        disabled={activeItem === undefined || submitting}
                    >
                        {submitting ? 'Adding to Picklist...' : 'Add to Picklist'}
                    </button>
                </div>
            </Modal.Footer>
        </Modal>
    );
});

interface ChoosePicklistModalProps {
    onCancel: (cancelToCreate?: boolean) => void;
    afterAddToPicklist: () => void;
    user: User;
    selectionKey?: string;
    numSelected?: number;
    sampleIds?: string[]
}

export const ChoosePicklistModal: FC<ChoosePicklistModalProps> = memo((props) => {
    const [error, setError] = useState<string>(undefined);
    const [items, setItems] = useState<Picklist[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getPicklists()
            .then(picklists => {
                setItems(picklists);
                setLoading(false);
            })
            .catch(reason => {
                setError('There was a problem retrieving the picklist data. ' + resolveErrorMessage(reason));
                setLoading(false);
            });

    }, [getPicklists, setItems, setError, setLoading]);

    return (
        <ChoosePicklistModalDisplay {...props} picklists={items} picklistLoadError={error} loading={loading}/>
    );
});


