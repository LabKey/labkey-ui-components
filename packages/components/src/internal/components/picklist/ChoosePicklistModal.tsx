import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Tab, Tabs } from 'react-bootstrap';
import classNames from 'classnames';
import { PicklistModel } from './models';
import { formatDate, parseDate } from '../../util/Date';
import { User } from '../base/models/User';
import { Utils } from '@labkey/api';
import { Alert } from '../base/Alert';
import { addSamplesToPicklist, getPicklists } from './actions';
import { resolveErrorMessage } from '../../util/messaging';

interface PicklistListProps {
    activeItem: PicklistModel;
    emptyMessage: ReactNode;
    onSelect: (picklist) => void;
    showSharedIcon?: boolean
    items: PicklistModel[];
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

interface PicklistDetailsProps {
    picklist: PicklistModel;
}

const ItemDetails: FC<PicklistDetailsProps> = memo((props) => {
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

                <div className="choice-metadata-item">
                    <span className="choice-metadata-item__name">Last Modified:</span>
                    <span className="choice-metadata-item__value">{formatDate(parseDate(picklist.Created))}</span>
                </div>
            </div>

            <div className="choice-details__description">
                {picklist.Description}
            </div>

            <div className="top-spacing">
                Sample counts coming soon ....
            </div>
        </div>
    );
});


interface ChooseItemModalProps {
    onCancel: () => void;
    afterAddToPicklist: (item: PicklistModel, numAdded: number) => void;
    user: User;
    selectionKey: string;
    numSelected: number;
}

export const ChoosePicklistModal: FC<ChooseItemModalProps> = memo((props) => {
    const {onCancel, afterAddToPicklist, user, selectionKey, numSelected} = props;
    const [search, setSearch] = useState<string>('');
    const [error, setError] = useState<string>(undefined);
    const [items, setItems] = useState<PicklistModel[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);

    useEffect(() => {
        getPicklists()
            .then(picklists => {
                setItems(picklists);
            })
            .catch(reason => {
                setError('There was a problem retrieving the picklist data. ' + resolveErrorMessage(reason));
            });

    }, [getPicklists, setItems, setError]);

    const onSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value.trim().toLowerCase());
    }, []);
    const filteredItems = useMemo<PicklistModel[]>(() => {
        if (search.trim() !== '') {
            return items.filter(item => item.name.toLowerCase().indexOf(search) > -1);
        }

        return items;
    }, [search, items]);

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

    const [activeItem, setActiveItem] = useState<PicklistModel>(undefined);
    const onAddClicked = useCallback(async () => {
        setSubmitting(true);
        try {
            const insertResponse = await addSamplesToPicklist(activeItem.name, selectionKey);
            setError(undefined);
            setSubmitting(false);
            afterAddToPicklist(activeItem, insertResponse.rows.length);
        }
        catch (e) {
            setSubmitting(false);
            setError(resolveErrorMessage(e));
        }
    }, [activeItem, selectionKey, setSubmitting, setError]);
    const isSearching = !!(search);
    let myEmptyMessage = 'You do not have any picklists ';
    let teamEmptyMessage = 'There are no shared picklists  ';

    let suffix = '';
    if (isSearching) {
        suffix = ' matching your search';
    }
    suffix += ' to add ' + (numSelected === 1 ? 'this sample to.' : 'these samples to.');
    myEmptyMessage += suffix;
    teamEmptyMessage += suffix;

    return (
        <Modal show bsSize="large" onHide={close}>
            <Modal.Header>
                <Modal.Title>
                    Choose a Picklist
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Alert bsStyle="danger">{error}</Alert>
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

                        {activeItem !== undefined && <ItemDetails picklist={activeItem}/>}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <div className="pull-left">
                    <button type="button" className="btn btn-default" onClick={onCancel}>
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


