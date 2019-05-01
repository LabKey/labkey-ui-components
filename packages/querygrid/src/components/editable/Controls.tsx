/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { Button } from 'react-bootstrap'
import classNames from 'classnames'

export interface AddRowsControlProps {
    disable?: boolean
    initialCount?: number
    maxCount?: number
    minCount?: number
    nounPlural?: string
    nounSingular?: string
    onAdd: Function
    placement?: 'top' | 'bottom' | 'both'
}

interface AddRowsControlState {
    count?: number
}

export class AddRowsControl extends React.Component<AddRowsControlProps, AddRowsControlState> {

    static defaultProps = {
        disable: false,
        initialCount: 1,
        maxCount: 100,
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

    render() {
        const { disable, maxCount, minCount, nounPlural, nounSingular } = this.props;
        const { count } = this.state;

        const hasError = count !== undefined && !this.isValid(count);
        const wrapperClasses = classNames('editable-grid__controls', 'form-group margin-top', {
            'has-error': hasError
        });

        return (
            <div className={wrapperClasses}>
                <span className="input-group">
                    <span className="input-group-btn">
                        <Button disabled={disable || hasError} onClick={this.onAdd}>Add</Button>
                    </span>
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