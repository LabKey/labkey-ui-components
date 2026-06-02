/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import classNames from 'classnames';

import { MAX_EDITABLE_GRID_ROWS } from '../../constants';

export type PlacementType = 'top' | 'bottom' | 'both';

export interface AddRowsControlProps {
    addText?: string;
    disable?: boolean;
    initialCount?: number;
    invalidCountMsg?: string;
    maxCount?: number;
    maxTotalCount?: number;
    minCount?: number;
    nounPlural?: string;
    nounSingular?: string;
    onAdd: (count: number) => void;
    placement?: PlacementType;
    wrapperClass?: string;
    verbPastTense?: string;
}

interface AddRowsControlState {
    count?: number;
}

export class AddRowsControl extends React.Component<AddRowsControlProps, AddRowsControlState> {
    static defaultProps = {
        addText: 'Add',
        disable: false,
        initialCount: 1,
        maxCount: MAX_EDITABLE_GRID_ROWS,
        minCount: 1,
        nounPlural: 'rows',
        nounSingular: 'row',
        placement: 'bottom',
        verbPastTense: 'added',
    };

    private addCount: React.RefObject<any>;

    constructor(props: AddRowsControlProps) {
        super(props);

        this.state = {
            count: this.props.initialCount,
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
        return (
            (!this.props.minCount || count > this.props.minCount - 1) &&
            (!this.props.maxCount || count <= this.getMaxRowsToAdd())
        );
    }

    onAdd() {
        if (this.isValid(this.state.count)) {
            const numToAdd = this.state.count;
            this.setState(
                () => ({ count: this.props.minCount }),
                () => this.props.onAdd(numToAdd)
            );
        }
    }

    onBlur() {
        if (!this.isValid(this.state.count)) {
            this.setState({
                count: this.props.initialCount,
            });
        }
    }

    onChange(event) {
        let count = parseInt(event.target.value);

        if (isNaN(count)) {
            count = undefined;
        }

        this.setState({
            count,
        });
    }

    hasError(): boolean {
        const { count } = this.state;

        return count !== undefined && !this.isValid(count);
    }

    getMaxRowsToAdd() {
        const { maxCount, maxTotalCount } = this.props;
        return maxCount && maxTotalCount && maxCount > maxTotalCount ? maxTotalCount : maxCount;
    }

    render() {
        const {
            addText,
            disable,
            minCount,
            maxCount,
            maxTotalCount,
            nounPlural,
            nounSingular,
            placement,
            wrapperClass,
            invalidCountMsg,
            verbPastTense,
        } = this.props;
        const { count } = this.state;

        const title = addText + ' ' + (count === 1 ? nounSingular : nounPlural);
        const disabledMsg = invalidCountMsg ? invalidCountMsg : 'Maximum number of ' + nounPlural + ' reached.';
        const hasError = !disable && this.hasError();
        const wrapperClasses = classNames('editable-grid__controls', 'text-nowrap', wrapperClass, {
            'margin-top': placement === 'bottom',
            'has-error': hasError,
        });
        const maxToAdd = this.getMaxRowsToAdd();
        const errorMsg = `At most ${
            maxTotalCount?.toLocaleString() ?? maxCount?.toLocaleString()
        } ${nounPlural.toLowerCase()} can be ${verbPastTense.toLowerCase()} at once (${maxToAdd.toLocaleString()} remaining).`;

        return (
            <div className={wrapperClasses}>
                <span className="input-group input-group-align">
                    <input
                        aria-label="Number of rows to add"
                        className="form-control"
                        disabled={disable}
                        max={disable ? undefined : maxToAdd}
                        min={disable ? undefined : minCount}
                        name="addCount"
                        onBlur={this.onBlur}
                        onChange={this.onChange}
                        ref={this.addCount}
                        style={{ width: '65px' }}
                        type="number"
                        value={count ? count.toString() : undefined}
                    />
                    <span className="input-group-btn">
                        <button
                            className="btn btn-primary"
                            disabled={disable || this.hasError()}
                            onClick={this.onAdd}
                            title={disable ? disabledMsg : undefined}
                            type="button"
                        >
                            {title}
                        </button>
                    </span>
                </span>
                {hasError && count > 0 && (
                    <span className="text-danger pull-left add-control--error-message">
                        {invalidCountMsg ? invalidCountMsg : errorMsg}
                    </span>
                )}
            </div>
        );
    }
}
