import * as React from "react";
import {Col, Collapse, Panel, Row} from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faGripVertical, faMinusSquare, faPlusSquare} from '@fortawesome/free-solid-svg-icons';

import '../theme/index.scss';
import { LabelHelpTip } from "./base/LabelHelpTip";
import {createFormInputId} from "./domainproperties/actions";
import {Draggable} from "react-beautiful-dnd";
import {DomainFieldError} from "./domainproperties/models";

import { List, Map } from 'immutable';
import {
    DOMAIN_FIELD_EXPAND,
    HIGHLIGHT_BLUE,
    NOT_HIGHLIGHT_GRAY,
    SEVERITY_LEVEL_ERROR
} from "./domainproperties/constants";
import {AdvancedSettings} from "./domainproperties/AdvancedSettings";
import {DomainRowExpandedOptions} from "./domainproperties/DomainRowExpandedOptions";

interface ExpandableDndRowProps {
    idPrefix?: string
    index: number
    isDragDisabled: boolean
    expanded: boolean
    dragging: boolean
    fieldError?: 'Error' | 'Warning'
    showingModal?: boolean  // The hover highlighting on the row can interfere with modals. It is recommended to set this when showing a modal.
    renderMainRow: () => any
    renderExpandedSection: () => any
    onExpand: (index?: number) => void
    onCollapsed?: () => void
    onCollapsing?: () => void
}

interface ExpandableDndRowState {
    closing: boolean
    hover: boolean
    isDragDisabled: boolean
}

export class ExpandableDndRow extends React.PureComponent<ExpandableDndRowProps, ExpandableDndRowState> {

    constructor(props) {
        super(props);

        this.state = {
            closing: false,
            hover: false,
            isDragDisabled: props.isDragDisabled
        };
    }

    createId = (name: string) => {
        const { idPrefix, index } = this.props;

        const prefix = idPrefix ? idPrefix : 'expandableDnd';

        return prefix + '-' + name + '-' + index;
    }

    getFieldErrorClass = (): string => {
        const { fieldError } = this.props;

        if (!fieldError) {
            return 'domain-row-border-default'
        }
        else if (fieldError === SEVERITY_LEVEL_ERROR) {
            return 'domain-row-border-error'
        }
        else {
            return 'domain-row-border-warning';
        }
    };

    getRowCssClasses = (expanded: boolean, closing: boolean, dragging: boolean): string => {
        let classes = List<string>().asMutable();

        classes.push('domain-field-row');

        if (!dragging) {
            classes.push(this.getFieldErrorClass());
        }
        else {
            classes.push('domain-row-border-dragging');
        }

        if (closing || expanded) {
            classes.push('domain-row-expanded');
        }

        return classes.join(' ');
    };

    onMouseOver = (): any => {
        this.setState(() => ({hover: true}))
    };

    onMouseOut = (): any => {
        this.setState(() => ({hover: false}))
    };

    onExpand = (): any => {
        const { index, onExpand } = this.props;

        if (onExpand) {
            onExpand(index);
        }
    };

    renderHandle() {
        const { dragging } = this.props;
        const { isDragDisabled, hover, closing } = this.state;

        return (
            <FontAwesomeIcon size='lg' color={!isDragDisabled && (dragging || hover || closing) ? HIGHLIGHT_BLUE : NOT_HIGHLIGHT_GRAY} icon={faGripVertical}/>
        )
    }

    renderExpanded() {
        const { renderExpandedSection } = this.props;

        return (
            <div className='expandablednd-row-expanded-container'>
                <div className='expandablednd-row-handle-expanded'>&nbsp;</div>
                {renderExpandedSection()}
            </div>
        )
    }

    render() {
        const { index, isDragDisabled, expanded, showingModal, dragging, renderMainRow, renderExpandedSection, onCollapsed, onCollapsing } = this.props;
        const { closing, hover } = this.state;

        return(
            <Draggable draggableId={this.createId("drag")} index={index} isDragDisabled={isDragDisabled}>
                {(provided) => (
                    <div className={this.getRowCssClasses(expanded, closing, dragging)}
                         {...provided.draggableProps}
                         ref={provided.innerRef}
                         tabIndex={index}
                         onMouseEnter={showingModal ? undefined : this.onMouseOver}
                         onMouseLeave={showingModal ? undefined : this.onMouseOut}
                    >

                        <Row key={this.createId("rowcontainer")} className={'expandablednd-row-container'}>

                            <div className='expandablednd-row-handle' {...provided.dragHandleProps}>
                                {this.renderHandle()}
                            </div>
                            <div className='expandablednd-row-container-main'>
                                {renderMainRow()}
                            </div>
                            <div className="expandablednd-row-expand-icon" id={this.createId('expand')} onClick={this.onExpand}>
                                <FontAwesomeIcon size='lg' color={(dragging || hover) ? HIGHLIGHT_BLUE : NOT_HIGHLIGHT_GRAY}
                                                 icon={expanded ? faMinusSquare : faPlusSquare}/>
                            </div>
                        </Row>
                        <Collapse in={expanded} onExited={onCollapsed} onExiting={onCollapsing}>
                            <div>
                                {this.renderExpanded()}
                            </div>
                        </Collapse>
                    </div>
                )}
            </Draggable>
        )
    }
}
