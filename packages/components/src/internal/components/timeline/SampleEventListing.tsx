import React from "react";
import { Button, Row, Col, Panel, DropdownButton, MenuItem, Checkbox } from 'react-bootstrap';
import DatePicker from "react-datepicker";

import { Security } from '@labkey/api';

import {UserSelectInput} from "../forms/input/UserSelectInput";
import {Tip} from "../base/Tip";
import {Alert} from "../base/Alert";
import {
    App,
    ExpandableFilterToggle,
    filterDate,
    TimelineEventModel,
    TimelineGroupedEventInfo,
    TimelineView
} from "../../../index";
import {exportTimelineGrid} from "../samples/actions";


interface Props {
    sampleId: number
    sampleName: string
    events?: TimelineEventModel[]
    onEventSelection: (selectedEvent: TimelineEventModel) => any
    selectedEvent?: TimelineEventModel
    showUserLinks?: boolean
}

interface State {
    showRecentFirst?: boolean
    filterExpanded?: boolean
    includeSampleEvent?: boolean,
    includeAssayEvent?: boolean,
    includeJobEvent?: boolean,
    includeStorageEvent: boolean,
    filterStartDate?: any
    filterEndDate?: any
    filterCreatedBy?: number,
    filteredEvents?: TimelineEventModel[]
}

const defaultFilterState : State = {
    includeSampleEvent: false,
    includeAssayEvent: false,
    includeJobEvent: false,
    includeStorageEvent: false,
    filterStartDate: undefined,
    filterEndDate: undefined,
    filterCreatedBy: undefined,
    filteredEvents: undefined
};

export class SampleEventListing extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            showRecentFirst: false,
            filterExpanded: false,
            ...defaultFilterState
        }
    }

    static isJobEvent(event: TimelineEventModel) : boolean {
        return event.eventType === 'workflow'
    }

    static isJobCompletionEvent(event: TimelineEventModel) : boolean {
        return SampleEventListing.isJobEvent(event) && (event.summary === 'Completed job' || event.summary ===  'Completed final task and job');
    }

    static isStorageEvent(event: TimelineEventModel) : boolean {
        return event.eventType === 'inventory'
    }

    static isStorageAddEvent(event: TimelineEventModel) : boolean {
        return SampleEventListing.isStorageEvent(event) && (event.summary === 'Item added to storage');
    }

    static isStorageDiscardEvent(event: TimelineEventModel) : boolean {
        return SampleEventListing.isStorageEvent(event) && (event.summary === 'Item discarded from storage');
    }

    static isAssayEvent(event: TimelineEventModel) : boolean {
        return event.eventType === 'assays'
    }

    selectEvent = (selectedEvent: TimelineEventModel) => {
        this.props.onEventSelection(selectedEvent);
    };

    determineEntityConnectionInfo() : TimelineGroupedEventInfo[] {
        const { selectedEvent, events } = this.props;
        if (!selectedEvent)
            return null;

        if (SampleEventListing.isStorageEvent(selectedEvent))
            return this.determineStorageStatus();
        else if (SampleEventListing.isJobEvent(selectedEvent))
            return this.determineJobStatus();

        return null;
    }

    determineStorageStatus(): TimelineGroupedEventInfo[] {
        const { events } = this.props;

        let groups : TimelineGroupedEventInfo[] = [];
        let addEvent: TimelineEventModel = undefined;
        let lastEvent: TimelineEventModel = undefined;
        events.forEach((event) => {
            if (SampleEventListing.isStorageEvent(event)) {
                if (!addEvent)
                    addEvent = event;
                else
                    lastEvent = event;

                if (SampleEventListing.isStorageDiscardEvent(event)) {
                    groups.push({
                        firstEvent: addEvent,
                        lastEvent: lastEvent,
                        isCompleted: true
                    })
                    addEvent = undefined;
                    lastEvent = undefined;
                }
            }
        });

        if (addEvent) {
            groups.push({
                firstEvent: addEvent,
                lastEvent: lastEvent,
                isCompleted: lastEvent ? SampleEventListing.isStorageDiscardEvent(lastEvent) : false
            })
        }

        return groups;
    };

    determineJobStatus(): TimelineGroupedEventInfo[] {
        const { selectedEvent, events } = this.props;
        if (!selectedEvent)
            return null;

        let jobInitEvent: TimelineEventModel = undefined;
        let jobLastEvent: TimelineEventModel = undefined;
        events.forEach((event) => {
            if (SampleEventListing.isJobEvent(event) && event.isSameEntity(selectedEvent)) {
                if (!jobInitEvent) {
                    jobInitEvent = event;
                }
                else
                    jobLastEvent = event;
            }
        });

        return [{
            firstEvent: jobInitEvent,
            lastEvent: jobLastEvent,
            isCompleted: jobLastEvent ? SampleEventListing.isJobCompletionEvent(jobLastEvent) : false
        }]
    };

    toggleFilterPanel = () => {
        this.setState((state)=> {
            return {
                filterExpanded: !state.filterExpanded
            }
        })
    };

    renderFilterToggle() {
        const { filterExpanded } = this.state;

        return (
            <ExpandableFilterToggle
                filterExpanded={filterExpanded}
                hasFilter={this.hasFilter()}
                toggleFilterPanel={this.toggleFilterPanel}
                resetFilter={this.resetFilter}
            />
        )
    }

    renderHeader() {
        const { sampleName } = this.props;
        return (
            <div>
                <Row>
                    <Col xs={7} className={'font-large timeline-title'}>
                        {`Event Timeline for ${sampleName}`}
                    </Col>
                    <Col xs={5}>
                        <span className={'pull-right'}>
                            {this.renderSorterDropdown()}
                            {this.renderExportBtn()}
                        </span>
                    </Col>
                </Row>
                <hr/>
            </div>
        )
    }

    setSort = (showRecentFirst: boolean) => {
        this.setState(() => ({showRecentFirst}));
    };

    renderSorterDropdown() {
        const { showRecentFirst } = this.state;
        const selectedSortOption = showRecentFirst ? 'Show Recent first' : 'Show Oldest first';

        return (
            <DropdownButton id={'job-tasks-comments-sort-btn'} title={selectedSortOption} className={'button-right-spacing'}>
                <MenuItem
                    key={'oldest'}
                    onClick={() => this.setSort(false)}
                    active={!showRecentFirst}
                >
                    {'Oldest first'}
                </MenuItem>
                <MenuItem
                    key={'recent'}
                    onClick={() => this.setSort(true)}
                    active={showRecentFirst}
                >
                    {'Recent first'}
                </MenuItem>
            </DropdownButton>
        );
    }

    renderExportBtn() {
        return (
            <Tip caption="Export">
                <Button onClick={this.doExport}><i className={'fa fa-download'}/></Button>
            </Tip>
        )
    }

    doExport = () => {
        const { sampleId} = this.props;
        const { showRecentFirst } = this.state;

        let sampleEventIds : number[] = [];
        let assayEventIds : number[] = [];
        if (this.hasFilter()) {
            this.getFilteredEvents().forEach(event => {
                if (SampleEventListing.isAssayEvent(event))
                    assayEventIds.push(event.rowId);
                else
                    sampleEventIds.push(event.rowId);
            });
        }

        exportTimelineGrid(sampleId, showRecentFirst, sampleEventIds, assayEventIds);
    };

    renderFilterPanel() {
        const { filterExpanded } = this.state;
        return (
            <div>
                {this.renderFilterToggle()}
                {filterExpanded && this.renderExpandedFilterPanel()}
                <hr/>
            </div>
        )
    }

    onStartDateChange = (date) => {
        this.setState(() => ({
                filterStartDate: date
            })
        );
    };

    onEndDateChange = (date) => {
        this.setState(() => ({
                filterEndDate: date
            })
        );
    };

    onSelectChange = (name, formValue, data) => {
        const value = formValue === undefined && data ? data.id : formValue;
        let filter = {};
        filter[name] = value;
        this.setState(() => (filter));
    };

    onEventTypeChange = (event) => {
        let filter = {};
        filter[event.target.name] = event.target.checked;
        this.setState(() => (filter))
    };

    hasFilter = () => {
        const { includeSampleEvent, includeAssayEvent, includeJobEvent, includeStorageEvent, filterCreatedBy, filterStartDate, filterEndDate } = this.state;
        return includeSampleEvent || includeAssayEvent || includeJobEvent || includeStorageEvent
            || filterCreatedBy != undefined || filterStartDate != undefined || filterEndDate != undefined;
    };

    resetFilter = () => {
        this.setState(() => (defaultFilterState))
    };

    renderExpandedFilterPanel() {
        const { includeSampleEvent, includeAssayEvent, includeJobEvent, includeStorageEvent, filterCreatedBy, filterStartDate, filterEndDate } = this.state;

        return (
            <Row className={'top-spacing'}>
                <Col xs={3}>
                    <div className={'list__bold-text'}>Filter Events: </div>
                    <Checkbox checked={includeSampleEvent} onChange={this.onEventTypeChange}
                              name={'includeSampleEvent'}>
                        Sample Events
                    </Checkbox>
                    <Checkbox checked={includeAssayEvent} onChange={this.onEventTypeChange}
                              name={'includeAssayEvent'}>
                        Assay Events
                    </Checkbox>
                    <Checkbox checked={includeJobEvent} onChange={this.onEventTypeChange}
                              name={'includeJobEvent'}>
                        Job Events
                    </Checkbox>
                    <Checkbox checked={includeStorageEvent} onChange={this.onEventTypeChange}
                              name={'includeStorageEvent'}>
                        Storage Events
                    </Checkbox>
                </Col>
                <Col xs={6}>
                    <div className={'list__bold-text'}>Filter By: </div>
                    <Row className={'margin-top'}>
                        <Col className={'bottom-spacing-less'} xs={3}>User: </Col>
                        <Col xs={9}>
                            <UserSelectInput
                                permissions={Security.effectivePermissions.read}
                                placeholder="Select User"
                                name="filterCreatedBy"
                                inputClass="timeline-filter-user-input"
                                containerClass="form-group row"
                                key="filterCreatedBy"
                                value={filterCreatedBy}
                                onChange={this.onSelectChange}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col className={'bottom-spacing-less'} xs={3}>Date: </Col>
                        <Col xs={4}>
                            <DatePicker
                                autoComplete={'off'}
                                className={'form-control'}
                                wrapperClassName={'row'}
                                selectsStart
                                isClearable
                                selected={filterStartDate}
                                startDate={filterStartDate}
                                endDate={filterEndDate}
                                name={'startDate'}
                                onChange={this.onStartDateChange}
                                placeholderText={'From'}
                                dateFormat={App.getDateFormat()}/>
                        </Col>
                        <Col xs={5}>
                            <Row>
                                <Col xs={3}/>
                                <Col xs={9}>
                                    <DatePicker
                                        autoComplete={'off'}
                                        className={'form-control'}
                                        wrapperClassName={'row'}
                                        selectsEnd
                                        isClearable
                                        selected={filterEndDate}
                                        startDate={filterStartDate}
                                        endDate={filterEndDate}
                                        name={'endDate'}
                                        onChange={this.onEndDateChange}
                                        placeholderText={'To'}
                                        minDate={filterStartDate}
                                        dateFormat={App.getDateFormat()}/>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col xs={3}>
                    <span className="pull-right timeline-filter-btn-group">
                        <Button
                            bsStyle="default"
                            disabled={!this.hasFilter()}
                            onClick={this.resetFilter}
                        >
                            Clear
                        </Button>
                        <span className="timeline-filter-btn-spacer"/>
                        <Button
                            className={'timeline-filter-apply-btn'}
                            bsStyle="primary"
                            onClick={this.doFilter}
                        >
                            Apply
                        </Button>
                    </span>
                </Col>

            </Row>
        )
    }

    doFilter = () => {
        const { events, selectedEvent } = this.props;
        const { includeSampleEvent, includeAssayEvent, includeJobEvent, includeStorageEvent, filterCreatedBy, filterStartDate, filterEndDate } = this.state;

        if (!this.hasFilter()){
            this.setState(() => ({
                    filteredEvents: events
                })
            );
            return;
        }

        const includeAllEvents = (includeSampleEvent && includeAssayEvent && includeJobEvent && includeStorageEvent)
            || (!includeSampleEvent && !includeAssayEvent && !includeJobEvent && !includeStorageEvent); //when no item is checked it's treated as no filter.
        const filterEventType = (type) => {
            if (includeAllEvents)
                return true;
            return (type === App.SAMPLES_KEY && includeSampleEvent)
                || (type === App.ASSAYS_KEY && includeAssayEvent)
                || (type === App.WORKFLOW_KEY && includeJobEvent)
                || (type === 'inventory' && includeStorageEvent);
        };

        const filterUser = (userId) => {
            if (filterCreatedBy === undefined)
                return true;
            return filterCreatedBy === userId;
        };

        const filteredEvents = events.filter((event) => {
            return filterEventType(event.eventType) && filterUser(event.eventUserId) && filterDate(event.eventTimestamp, filterStartDate, filterEndDate);
        });

        let isStaleSelection = false;
        if (selectedEvent) {
            isStaleSelection = true;
            filteredEvents.forEach(event => {
                if (event.rowId === selectedEvent.rowId && event.eventType === selectedEvent.eventType) {
                    isStaleSelection = false;
                    return;
                }
            })
        }

        this.setState(() => ({
                filteredEvents
            }), () => {
                if (isStaleSelection) {
                    this.selectEvent(undefined);
                }
            }
        );
    };

    getFilteredEvents() {
        const { events } = this.props;
        const { filteredEvents } = this.state;

        return filteredEvents === undefined ? events : filteredEvents;
    }

    renderTimelineGrid() {
        const { showRecentFirst } = this.state;
        const filteredEvents = this.getFilteredEvents();
        if (filteredEvents.length === 0)
            return <Alert bsStyle="warning">No events match this filter criteria</Alert>;

        const sortedEvents = [...filteredEvents].sort((a, b) => {
            return showRecentFirst ? b.eventTimestamp - a.eventTimestamp : a.eventTimestamp - b.eventTimestamp;
        });

        return (
            <Row>
                <Col lg={12} className="timeline-container">
                    <TimelineView
                        events={sortedEvents}
                        showRecentFirst={showRecentFirst}
                        onEventSelection={this.props.onEventSelection}
                        selectedEvent={this.props.selectedEvent}
                        showUserLinks={this.props.showUserLinks}
                        selectedEntityConnectionInfo={this.determineEntityConnectionInfo()}
                    />
                </Col>
            </Row>
        )
    }

    render () {
        return (
            <Panel>
                <Panel.Body>
                    {this.renderHeader()}
                    {this.renderFilterPanel()}
                    {this.renderTimelineGrid()}
                </Panel.Body>
            </Panel>
        );
    }
}
