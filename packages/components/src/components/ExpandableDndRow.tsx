import React, { PureComponent } from 'react';
import { Collapse, Row } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical, faMinusSquare, faPlusSquare } from '@fortawesome/free-solid-svg-icons';

import { Draggable } from 'react-beautiful-dnd';

import { List } from 'immutable';

import { SEVERITY_LEVEL_ERROR } from './domainproperties/constants';

interface ExpandableDndRowProps {
    idPrefix?: string;
    index: number;
    isDragDisabled: boolean;
    expanded: boolean;
    dragging: boolean;
    fieldError?: 'Error' | 'Warning';
    // The hover highlighting on the row can interfere with modals causing them to re-render on mouseover. It is
    // recommended to set this when showing a modal.
    showingModal?: boolean;
    renderMainRow: () => any;
    renderExpandedSection: () => any;  // For best results here this should be in a Dom object with display: table-cell
    onExpand: (index?: number) => void;
    onCollapsed?: () => void;
    onCollapsing?: () => void;
}

interface ExpandableDndRowState {
    closing: boolean;
    hover: boolean;
}

export class ExpandableDndRow extends PureComponent<ExpandableDndRowProps, ExpandableDndRowState> {
    constructor(props) {
        super(props);

        this.state = {
            closing: false,
            hover: false,
        };
    }

    private HIGHLIGHT_BLUE = '#2980B9';
    private NOT_HIGHLIGHT_GRAY = '#999999';

    createId = (name: string): string => {
        const { idPrefix, index } = this.props;

        const prefix = idPrefix ? idPrefix : 'expandableDnd';

        return prefix + '-' + name + '-' + index;
    };

    getFieldErrorClass = (): string => {
        const { fieldError } = this.props;

        if (!fieldError) {
            return 'domain-row-border-default';
        } else if (fieldError === SEVERITY_LEVEL_ERROR) {
            return 'domain-row-border-error';
        } else {
            return 'domain-row-border-warning';
        }
    };

    getRowCssClasses = (expanded: boolean, closing: boolean, dragging: boolean): string => {
        let classes = List<string>();

        classes = classes.push('domain-field-row');

        if (!dragging) {
            classes = classes.push(this.getFieldErrorClass());
        } else {
            classes = classes.push('domain-row-border-dragging');
        }

        if (closing || expanded) {
            classes = classes.push('domain-row-expanded');
        }

        return classes.join(' ');
    };

    onMouseOver = (): void => {
        this.setState(() => ({ hover: true }));
    };

    onMouseOut = (): void => {
        this.setState(() => ({ hover: false }));
    };

    onExpand = (): void => {
        const { index, onExpand } = this.props;

        if (onExpand) {
            onExpand(index);
        }
    };

    onClosing = (): void => {
        const { onCollapsing } = this.props;

        this.setState(() => ({closing: true}), () => {
            if (onCollapsing) {
                onCollapsing();
            }
        })
    };

    onClosed = (): void => {
        const { onCollapsed } = this.props;
        const { closing } = this.state;

        this.setState(() => ({closing: false}), () => {
            if (onCollapsed) {
                onCollapsed();
            }
        })
    }

    render(): React.ReactNode {
        const {
            index,
            isDragDisabled,
            expanded,
            showingModal,
            dragging,
            renderMainRow,
            renderExpandedSection,
        } = this.props;
        const { closing, hover } = this.state;

        return (
            <Draggable draggableId={this.createId('drag')} index={index} isDragDisabled={isDragDisabled}>
                {provided => (
                    <div
                        className={this.getRowCssClasses(expanded, closing, dragging)}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        tabIndex={index}
                        onMouseEnter={showingModal ? undefined : this.onMouseOver}
                        onMouseLeave={showingModal ? undefined : this.onMouseOut}>
                        <Row key={this.createId('rowcontainer')} className="expandablednd-row-container">
                            <div className="expandablednd-row-handle" {...provided.dragHandleProps}>
                                <FontAwesomeIcon
                                    size="lg"
                                    color={!isDragDisabled && (dragging || hover || closing) ? this.HIGHLIGHT_BLUE : this.NOT_HIGHLIGHT_GRAY}
                                    icon={faGripVertical}
                                />
                            </div>
                            <div className="expandablednd-row-container-main">{renderMainRow()}</div>
                            <div
                                className="expandablednd-row-expand-icon"
                                id={this.createId('expand')}
                                onClick={this.onExpand}>
                                <FontAwesomeIcon
                                    size="lg"
                                    color={dragging || hover ? this.HIGHLIGHT_BLUE : this.NOT_HIGHLIGHT_GRAY}
                                    icon={expanded ? faMinusSquare : faPlusSquare}
                                />
                            </div>
                        </Row>
                        <Collapse in={expanded} onExited={this.onClosed} onExiting={this.onClosing}>
                            <div>
                                <div className="expandablednd-row-expanded-container">
                                    <div className="expandablednd-row-handle-expanded">&nbsp;</div>
                                    {renderExpandedSection()}
                                </div>
                            </div>
                        </Collapse>
                    </div>
                )}
            </Draggable>
        );
    }
}
