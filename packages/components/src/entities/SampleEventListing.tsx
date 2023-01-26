import React from 'react';
import { Button, Row, Col, Panel, DropdownButton, MenuItem, Checkbox } from 'react-bootstrap';
import DatePicker from 'react-datepicker';

import { Security } from '@labkey/api';

import { UserSelectInput } from '../internal/components/forms/input/UserSelectInput';
import { Tip } from '../internal/components/base/Tip';
import { Alert } from '../internal/components/base/Alert';
import { exportTimelineGrid } from '../internal/components/samples/actions';
import { TimelineEventModel, TimelineGroupedEventInfo } from '../internal/components/auditlog/models';
import { ExpandableFilterToggle } from '../internal/components/base/ExpandableFilterToggle';
import { isAssayEnabled, isWorkflowEnabled } from '../internal/app/utils';
import { ASSAYS_KEY, SAMPLES_KEY, WORKFLOW_KEY } from '../internal/app/constants';
import { getDateFormat, filterDate } from '../internal/util/Date';
import { TimelineView } from '../internal/components/auditlog/TimelineView';

interface Props {
    events?: TimelineEventModel[];
    onEventSelection: (selectedEvent: TimelineEventModel) => any;
    sampleId: number;
    sampleName: string;
    selectedEvent?: TimelineEventModel;
    showUserLinks?: boolean;
}

interface State {
    filterCreatedBy?: number;
    filterEndDate?: any;
    filterExpanded?: boolean;
    filterStartDate?: any;
    filteredEvents?: TimelineEventModel[];
    hasDetailedEvents?: boolean;
    includeAssayEvent?: boolean;
    includeJobEvent?: boolean;
    includeSampleEvent?: boolean;
    includeStorageEvent: boolean;
    showRecentFirst?: boolean;
}

const defaultFilterState: State = {
    includeSampleEvent: false,
    includeAssayEvent: false,
    includeJobEvent: false,
    includeStorageEvent: false,
    filterStartDate: undefined,
    filterEndDate: undefined,
    filterCreatedBy: undefined,
    filteredEvents: undefined,
};

export class SampleEventListing extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            showRecentFirst: false,
            filterExpanded: false,
            hasDetailedEvents: props.events?.filter(e => e.rowId > 0).length > 0,
            ...defaultFilterState,
        };
    }

    static isJobEvent(event: TimelineEventModel): boolean {
        return event.eventType === 'workflow';
    }

    static isJobCompletionEvent(event: TimelineEventModel): boolean {
        return (
            SampleEventListing.isJobEvent(event) &&
            (event.summary === 'Completed job' || event.summary === 'Completed final task and job')
        );
    }

    static isStorageEvent(event: TimelineEventModel): boolean {
        return event.eventType === 'inventory';
    }

    static isStorageAddEvent(event: TimelineEventModel): boolean {
        return SampleEventListing.isStorageEvent(event) && event.summary === 'Item added to storage';
    }

    static isStorageDiscardEvent(event: TimelineEventModel): boolean {
        return SampleEventListing.isStorageEvent(event) && event.summary === 'Item discarded from storage';
    }

    static isAssayEvent(event: TimelineEventModel): boolean {
        return event.eventType === 'assays';
    }

    selectEvent = (selectedEvent: TimelineEventModel) => {
        this.props.onEventSelection(selectedEvent);
    };

    determineEntityConnectionInfo(): TimelineGroupedEventInfo[] {
        const { selectedEvent, events } = this.props;
        if (!selectedEvent) return null;

        if (SampleEventListing.isStorageEvent(selectedEvent)) return this.determineStorageStatus();
        else if (SampleEventListing.isJobEvent(selectedEvent)) return this.determineJobStatus();

        return null;
    }

    determineStorageStatus(): TimelineGroupedEventInfo[] {
        const { events } = this.props;

        const groups: TimelineGroupedEventInfo[] = [];
        let addEvent: TimelineEventModel;
        let lastEvent: TimelineEventModel;
        events.forEach(event => {
            if (SampleEventListing.isStorageEvent(event)) {
                if (!addEvent) addEvent = event;
                else lastEvent = event;

                if (SampleEventListing.isStorageDiscardEvent(event)) {
                    groups.push({
                        firstEvent: addEvent,
                        lastEvent,
                        isCompleted: true,
                    });
                    addEvent = undefined;
                    lastEvent = undefined;
                }
            }
        });

        if (addEvent) {
            groups.push({
                firstEvent: addEvent,
                lastEvent,
                isCompleted: lastEvent ? SampleEventListing.isStorageDiscardEvent(lastEvent) : false,
            });
        }

        return groups;
    }

    determineJobStatus(): TimelineGroupedEventInfo[] {
        const { selectedEvent, events } = this.props;
        if (!selectedEvent) return null;

        let jobInitEvent: TimelineEventModel;
        let jobLastEvent: TimelineEventModel;
        events.forEach(event => {
            if (SampleEventListing.isJobEvent(event) && event.isSameEntity(selectedEvent)) {
                if (!jobInitEvent) {
                    jobInitEvent = event;
                } else jobLastEvent = event;
            }
        });

        return [
            {
                firstEvent: jobInitEvent,
                lastEvent: jobLastEvent,
                isCompleted: jobLastEvent ? SampleEventListing.isJobCompletionEvent(jobLastEvent) : false,
            },
        ];
    }

    toggleFilterPanel = () => {
        this.setState(state => {
            return {
                filterExpanded: !state.filterExpanded,
            };
        });
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
        );
    }

    renderHeader() {
        const { sampleName } = this.props;
        const { hasDetailedEvents } = this.state;
        return (
            <div>
                <Row>
                    <Col xs={7} className="font-large timeline-title">
                        {`Event Timeline for ${sampleName}`}
                    </Col>
                    {hasDetailedEvents && (
                        <Col xs={5}>
                            <span className="pull-right">
                                {this.renderSorterDropdown()}
                                {this.renderExportBtn()}
                            </span>
                        </Col>
                    )}
                </Row>
                <hr />
            </div>
        );
    }

    setSort = (showRecentFirst: boolean) => {
        this.setState(() => ({ showRecentFirst }));
    };

    renderSorterDropdown() {
        const { showRecentFirst } = this.state;
        const selectedSortOption = showRecentFirst ? 'Show Recent first' : 'Show Oldest first';

        return (
            <DropdownButton
                id="job-tasks-comments-sort-btn"
                title={selectedSortOption}
                className="button-right-spacing"
            >
                <MenuItem key="oldest" onClick={() => this.setSort(false)} active={!showRecentFirst}>
                    Oldest first
                </MenuItem>
                <MenuItem key="recent" onClick={() => this.setSort(true)} active={showRecentFirst}>
                    Recent first
                </MenuItem>
            </DropdownButton>
        );
    }

    renderExportBtn() {
        return (
            <Tip caption="Export">
                <Button onClick={this.doExport}>
                    <i className="fa fa-download" />
                </Button>
            </Tip>
        );
    }

    doExport = () => {
        const { sampleId } = this.props;
        const { showRecentFirst } = this.state;

        const sampleEventIds: number[] = [];
        const assayEventIds: number[] = [];
        if (this.hasFilter()) {
            this.getFilteredEvents().forEach(event => {
                if (SampleEventListing.isAssayEvent(event)) assayEventIds.push(event.rowId);
                else sampleEventIds.push(event.rowId);
            });
        }

        exportTimelineGrid(sampleId, showRecentFirst, sampleEventIds, assayEventIds);
    };

    renderFilterPanel() {
        const { filterExpanded, hasDetailedEvents } = this.state;

        if (!hasDetailedEvents) {
            return null;
        }

        return (
            <div>
                {this.renderFilterToggle()}
                {filterExpanded && this.renderExpandedFilterPanel()}
                <hr />
            </div>
        );
    }

    onStartDateChange = date => {
        this.setState(() => ({
            filterStartDate: date,
        }));
    };

    onEndDateChange = date => {
        this.setState(() => ({
            filterEndDate: date,
        }));
    };

    onSelectChange = (name, formValue, data) => {
        const value = formValue === undefined && data ? data.id : formValue;
        const filter = {};
        filter[name] = value;
        this.setState(() => filter);
    };

    onEventTypeChange = event => {
        const filter = {};
        filter[event.target.name] = event.target.checked;
        this.setState(() => filter);
    };

    hasFilter = () => {
        const {
            includeSampleEvent,
            includeAssayEvent,
            includeJobEvent,
            includeStorageEvent,
            filterCreatedBy,
            filterStartDate,
            filterEndDate,
        } = this.state;
        return (
            includeSampleEvent ||
            includeAssayEvent ||
            includeJobEvent ||
            includeStorageEvent ||
            filterCreatedBy != undefined ||
            filterStartDate != undefined ||
            filterEndDate != undefined
        );
    };

    resetFilter = () => {
        this.setState(() => defaultFilterState);
    };

    renderExpandedFilterPanel() {
        const {
            includeSampleEvent,
            includeAssayEvent,
            includeJobEvent,
            includeStorageEvent,
            filterCreatedBy,
            filterStartDate,
            filterEndDate,
        } = this.state;

        return (
            <Row className="top-spacing">
                <Col xs={3}>
                    <div className="list__bold-text">Filter Events: </div>
                    <Checkbox checked={includeSampleEvent} onChange={this.onEventTypeChange} name="includeSampleEvent">
                        Sample Events
                    </Checkbox>
                    {isAssayEnabled() && (
                        <Checkbox
                            checked={includeAssayEvent}
                            onChange={this.onEventTypeChange}
                            name="includeAssayEvent"
                        >
                            Assay Events
                        </Checkbox>
                    )}
                    {isWorkflowEnabled() && (
                        <Checkbox checked={includeJobEvent} onChange={this.onEventTypeChange} name="includeJobEvent">
                            Job Events
                        </Checkbox>
                    )}
                    <Checkbox
                        checked={includeStorageEvent}
                        onChange={this.onEventTypeChange}
                        name="includeStorageEvent"
                    >
                        Storage Events
                    </Checkbox>
                </Col>
                <Col xs={6}>
                    <div className="list__bold-text">Filter By: </div>
                    <Row className="margin-top">
                        <Col className="bottom-spacing-less" xs={3}>
                            User:{' '}
                        </Col>
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
                        <Col className="bottom-spacing-less" xs={3}>
                            Date:{' '}
                        </Col>
                        <Col xs={4}>
                            <DatePicker
                                autoComplete="off"
                                className="form-control"
                                wrapperClassName="row"
                                selectsStart
                                isClearable
                                selected={filterStartDate}
                                startDate={filterStartDate}
                                endDate={filterEndDate}
                                name="startDate"
                                onChange={this.onStartDateChange}
                                placeholderText="From"
                                dateFormat={getDateFormat()}
                            />
                        </Col>
                        <Col xs={5}>
                            <Row>
                                <Col xs={3} />
                                <Col xs={9}>
                                    <DatePicker
                                        autoComplete="off"
                                        className="form-control"
                                        wrapperClassName="row"
                                        selectsEnd
                                        isClearable
                                        selected={filterEndDate}
                                        startDate={filterStartDate}
                                        endDate={filterEndDate}
                                        name="endDate"
                                        onChange={this.onEndDateChange}
                                        placeholderText="To"
                                        minDate={filterStartDate}
                                        dateFormat={getDateFormat()}
                                    />
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Col>
                <Col xs={3}>
                    <span className="pull-right timeline-filter-btn-group">
                        <Button bsStyle="default" disabled={!this.hasFilter()} onClick={this.resetFilter}>
                            Clear
                        </Button>
                        <span className="timeline-filter-btn-spacer" />
                        <Button className="timeline-filter-apply-btn" bsStyle="primary" onClick={this.doFilter}>
                            Apply
                        </Button>
                    </span>
                </Col>
            </Row>
        );
    }

    doFilter = () => {
        const { events, selectedEvent } = this.props;
        const {
            includeSampleEvent,
            includeAssayEvent,
            includeJobEvent,
            includeStorageEvent,
            filterCreatedBy,
            filterStartDate,
            filterEndDate,
        } = this.state;

        if (!this.hasFilter()) {
            this.setState(() => ({
                filteredEvents: events,
            }));
            return;
        }

        const includeAllEvents =
            (includeSampleEvent && includeAssayEvent && includeJobEvent && includeStorageEvent) ||
            (!includeSampleEvent && !includeAssayEvent && !includeJobEvent && !includeStorageEvent); // when no item is checked it's treated as no filter.
        const filterEventType = type => {
            if (includeAllEvents) return true;
            return (
                (type === SAMPLES_KEY && includeSampleEvent) ||
                (type === ASSAYS_KEY && includeAssayEvent) ||
                (type === WORKFLOW_KEY && includeJobEvent) ||
                (type === 'inventory' && includeStorageEvent)
            );
        };

        const filterUser = userId => {
            if (filterCreatedBy === undefined) return true;
            return filterCreatedBy === userId;
        };

        const filteredEvents = events.filter(event => {
            return (
                filterEventType(event.eventType) &&
                filterUser(event.eventUserId) &&
                filterDate(event.eventTimestamp, filterStartDate, filterEndDate)
            );
        });

        let isStaleSelection = false;
        if (selectedEvent) {
            isStaleSelection = true;
            filteredEvents.forEach(event => {
                if (event.rowId === selectedEvent.rowId && event.eventType === selectedEvent.eventType) {
                    isStaleSelection = false;
                }
            });
        }

        this.setState(
            () => ({
                filteredEvents,
            }),
            () => {
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
        const { showRecentFirst, hasDetailedEvents } = this.state;
        const filteredEvents = this.getFilteredEvents();
        if (filteredEvents.length === 0) return <Alert bsStyle="warning">No events match the filter criteria.</Alert>;

        const sortedEvents = [...filteredEvents].sort((a, b) => {
            return showRecentFirst ? b.eventTimestamp - a.eventTimestamp : a.eventTimestamp - b.eventTimestamp;
        });

        if (!hasDetailedEvents) return <Alert bsStyle="warning">No events available for this sample.</Alert>;

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
        );
    }

    render() {
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
