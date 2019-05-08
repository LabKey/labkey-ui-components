/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Button, MenuItem, SplitButton } from 'react-bootstrap'
import classNames from 'classnames'
import { MAX_ADDED_EDITABLE_GRID_ROWS } from "../../constants";

export type PlacementType = 'top' | 'bottom' | 'both';

export interface AddRowsControlProps {
    disable?: boolean
    initialCount?: number
    maxCount?: number
    minCount?: number
    nounPlural?: string
    nounSingular?: string
    addText?: string
    onAdd: Function
    quickAddText?: string
    onQuickAdd?: Function
    placement?: PlacementType
}

interface AddRowsControlState {
    count?: number
}

export class AddRowsControl extends React.Component<AddRowsControlProps, AddRowsControlState> {

    static defaultProps = {
        addText: "Add",
        disable: false,
        initialCount: 1,
        maxCount: MAX_ADDED_EDITABLE_GRID_ROWS,
        minCount: 1,
        nounPlural: 'rows',
        nounSingular: 'row',
        placement: 'bottom'
    };

    private addCount: React.RefObject<any>;

    constructor(props: AddRowsControlProps) {
        super(props);

        this.state = {
            count: this.props.initialCount
        };

        this.getAddCount = this.getAddCount.bind(this);
        this.onAdd = this.onAdd.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onChange = this.onChange.bind(this);
        this.onQuickAdd = this.onQuickAdd.bind(this);

        this.addCount = React.createRef();
    }

    getAddCount(): number {
        if (this.addCount.current) {
            return parseInt(this.addCount.current.value);
        }
    }

    isValid(count: number): boolean {
        return count > this.props.minCount - 1 && count <= this.props.maxCount;
    }

    onAdd() {
        if (this.isValid(this.state.count)) {
            this.props.onAdd(this.state.count);
        }
    }

    onBlur() {
        if (!this.isValid(this.state.count)) {
            this.setState({
                count: this.props.initialCount
            });
        }
    }

    onChange(event) {
        let count = parseInt(event.target.value);

        if (isNaN(count)) {
            count = this.props.minCount;
        }

        this.setState({
            count
        });
    }

    hasError(): boolean {
        const { count } = this.state;

        return count !== undefined && !this.isValid(count);
    }

    onQuickAdd() {
        const { onQuickAdd } = this.props;
        if (onQuickAdd) {
            onQuickAdd(this.state.count);
        }
    }

    renderButton() {
        const { disable, quickAddText, onQuickAdd, addText } = this.props;

        return (
            <span className="input-group-btn">
                {quickAddText && onQuickAdd ?
                    <SplitButton
                        id="addRowsDropdown"
                        onClick={this.onAdd}
                        title={addText}>
                        <MenuItem onClick={this.onQuickAdd}>{quickAddText}</MenuItem>
                    </SplitButton> :
                    <Button disabled={disable || this.hasError()} onClick={this.onAdd}>{addText}</Button>
                }
            </span>
        )
    }
    render() {
        const { maxCount, minCount, nounPlural, nounSingular, placement } = this.props;
        const { count } = this.state;

        const hasError = this.hasError();
        const wrapperClasses = classNames('editable-grid__controls', 'form-group', {
            'margin-top': placement === 'bottom',
            'has-error': hasError
        });

        return (
            <div className={wrapperClasses}>
                <span className="input-group">
                    {this.renderButton()}
                    <input
                        className="form-control"
                        max={maxCount}
                        min={minCount}
                        name="addCount"
                        onBlur={this.onBlur}
                        onChange={this.onChange}
                        ref={this.addCount}
                        style={{width: '65px'}}
                        type="number"
                        value={count.toString()} />
                    <span style={{display: 'inline-block', padding: '6px 8px'}}>
                        {hasError ? <span className="text-danger">{`${minCount}-${maxCount} ${nounPlural}.`}</span> : (count === 1 ? nounSingular : nounPlural)}
                    </span>
                </span>
            </div>
        )
    }
}

interface RightClickToggleProps {
    bsRole?: any
    onClick?: any
}

export class RightClickToggle extends React.Component<RightClickToggleProps, any> {

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        if (e.button === 2 || e.buttons === 2) {
            e.preventDefault();
            this.props.onClick(e);
        }
    }

    render() {
        return (
            <div className="cellular-count-content" onClick={this.handleClick} onContextMenu={this.handleClick}>
                {this.props.children}
            </div>
        )
    }
}