/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { createRef, KeyboardEvent, ReactNode, RefObject } from 'react';
import ReactN from 'reactn';
import classNames from 'classnames';
import { List } from 'immutable';

import { initLookup, modifyCell, searchLookup } from '../../actions';
import { cancelEvent } from '../../events';
import { LookupStore, ValueDescriptor } from '../../models';
import { KEYS, LOOKUP_DEFAULT_SIZE, MODIFICATION_TYPES, SELECTION_TYPES } from '../../constants';
import { QueryColumn } from '../../..';
import { GlobalAppState } from '../../global';

import { EDITABLE_GRID_CONTAINER_CLS } from './constants';

const emptyList = List<ValueDescriptor>();

export interface LookupCellProps {
    col: QueryColumn;
    colIdx: number;
    disabled?: boolean;
    modelId: string;
    rowIdx: number;
    select: (modelId: string, colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean) => any;
    values: List<ValueDescriptor>;
    onCellModify?: () => any;
    filteredLookupValues?: List<string>;
    filteredLookupKeys?: List<any>;
}

interface LookupCellState {
    activeOptionIdx?: number;
    token?: string;
}

export class LookupCell extends ReactN.Component<LookupCellProps, LookupCellState, GlobalAppState> {
    private blurTO: number;
    private changeTO: number;
    private inputEl: RefObject<HTMLInputElement>;
    private menuEl: RefObject<HTMLDivElement>;
    private wrapperEl: RefObject<HTMLDivElement>;

    constructor(props: LookupCellProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        this.inputEl = createRef<HTMLInputElement>();
        this.menuEl = createRef<HTMLInputElement>();
        this.wrapperEl = createRef<HTMLInputElement>();

        this.state = {
            activeOptionIdx: -1,
            token: undefined,
        };
    }

    componentDidMount(): void {
        const { col, filteredLookupValues, filteredLookupKeys } = this.props;
        initLookup(col, LOOKUP_DEFAULT_SIZE, filteredLookupValues, filteredLookupKeys);

        try {
            this.getContainerElement()?.addEventListener('scroll', this.onContainerScroll);
            document.addEventListener('scroll', this.onContainerScroll);
            this.onContainerScroll();
        } catch (e) {
            console.error('Failed to attach listeners for LookupCell scrolling.', e);
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps: LookupCellProps): void {
        if (this.state.token && this.getOptions(nextProps).size === 1) {
            this.setState({
                activeOptionIdx: 0,
            });
        }
    }

    componentWillUnmount(): void {
        try {
            this.getContainerElement()?.removeEventListener('scroll', this.onContainerScroll);
            document.removeEventListener('scroll', this.onContainerScroll);
        } catch (e) {
            console.error('Failed to detach listeners for LookupCell scrolling.', e);
        }
    }

    cancelBlur = (): void => {
        clearTimeout(this.blurTO);
    };

    clearInput = (): void => {
        if (this.inputEl && this.inputEl.current) {
            this.inputEl.current.value = '';
        }

        this.resetLookup();

        this.setState({
            activeOptionIdx: -1,
            token: undefined,
        });
    };

    // As a part of the fix for #43051 the LookupCell needs to be able to attach scroll event listeners
    // to the grid container which is declared in EditableGrid. Handing down a React.RefObject would be preferred,
    // however, this caused sluggish performance for the grid as this "container ref" was constantly updating and needs
    // to be passed in as a prop to all Cells. In lieu of the ref approach this uses a DOM selector to located the
    // nearest container element as designated by a CSS class.
    getContainerElement = (): Element => {
        return this.wrapperEl.current?.closest(`.${EDITABLE_GRID_CONTAINER_CLS}`);
    };

    focusInput = (): void => {
        this.cancelBlur();
        if (this.inputEl && this.inputEl.current) {
            this.inputEl.current.focus();
        }
    };

    hasInputValue(): boolean {
        const { token } = this.state;
        return token !== undefined && token !== '';
    }

    highlight = (index: number): void => {
        if (index >= -1 && index < this.getOptions(this.props).size) {
            this.setState({
                activeOptionIdx: index,
            });
        }
    };

    isMultiValue = (): boolean => {
        return this.props.col.isJunctionLookup();
    };

    onContainerScroll = (): void => {
        // Issue 43051: LookupCell menu manually updated to account for scrolled grid container
        if (this.menuEl.current && this.wrapperEl.current) {
            const rect = this.wrapperEl.current.getBoundingClientRect();
            this.menuEl.current.style.left = `${rect.left + window.scrollX}px`;
            this.menuEl.current.style.top = `${rect.bottom}px`;
        }
    };

    onInputBlur = (): void => {
        this.blurTO = window.setTimeout(() => {
            const { colIdx, modelId, rowIdx } = this.props;
            this.props.select(modelId, colIdx, rowIdx);
            this.resetLookup();
        }, 200);
    };

    onInputChange = (): void => {
        clearTimeout(this.changeTO);
        this.changeTO = window.setTimeout(() => {
            let token;

            if (this.inputEl && this.inputEl.current) {
                token = this.inputEl.current.value;
            }

            this.searchLookup(token);

            this.setState({
                activeOptionIdx: -1,
                token,
            });
        }, 350);
    };

    onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
        const { colIdx, modelId, rowIdx, values, onCellModify } = this.props;
        const { activeOptionIdx } = this.state;
        const options = this.getOptions(this.props);

        switch (event.keyCode) {
            case KEYS.Backspace:
                if (!this.hasInputValue() && values !== undefined && values.size) {
                    modifyCell(modelId, colIdx, rowIdx, values.last(), MODIFICATION_TYPES.REMOVE);
                    if (onCellModify) onCellModify();
                }
                break;
            case KEYS.Enter:
                if (this.state.activeOptionIdx > -1) {
                    this.onItemClick(options.get(activeOptionIdx));
                } else {
                    this.clearInput();
                    this.props.select(modelId, colIdx, rowIdx + 1);
                }
                break;
            case KEYS.Escape:
                this.clearInput();
                this.props.select(modelId, colIdx, rowIdx, undefined, true);
                break;
            case KEYS.UpArrow:
                this.highlight(activeOptionIdx - 1);
                cancelEvent(event);
                break;
            case KEYS.DownArrow:
                this.highlight(activeOptionIdx + 1);
                cancelEvent(event);
                break;
        }
    };

    onItemClick = (vd: ValueDescriptor): void => {
        const { col, colIdx, modelId, rowIdx, onCellModify } = this.props;

        modifyCell(
            modelId,
            colIdx,
            rowIdx,
            vd,
            col.isJunctionLookup() ? MODIFICATION_TYPES.ADD : MODIFICATION_TYPES.REPLACE
        );
        if (onCellModify) onCellModify();
        this.clearInput();

        if (!this.isMultiValue()) {
            this.props.select(modelId, colIdx, rowIdx);
            return;
        }

        this.focusInput();
    };

    onItemRemove = (vd: ValueDescriptor): void => {
        const { modelId, colIdx, rowIdx, onCellModify } = this.props;
        modifyCell(modelId, colIdx, rowIdx, vd, MODIFICATION_TYPES.REMOVE);
        if (onCellModify) onCellModify();

        this.focusInput();
    };

    resetLookup = (): void => {
        this.searchLookup(undefined);
    };

    searchLookup = (token: string): void => {
        searchLookup(
            this.props.col,
            LOOKUP_DEFAULT_SIZE,
            token,
            this.props.filteredLookupValues,
            this.props.filteredLookupKeys
        );
    };

    renderOptions(): ReactNode {
        const store = this.getStore();

        if (!store) {
            return <a className="disabled list-group-item">Loading...</a>;
        }

        const options = this.getOptions(this.props);

        return options
            .slice(0, 10)
            .reduce(
                (list, vd, idx) =>
                    list.push(
                        <a
                            className={classNames('list-group-item', { active: this.state.activeOptionIdx === idx })}
                            key={idx}
                            onClick={this.onItemClick.bind(this, vd)}
                        >
                            {vd.display}
                        </a>
                    ),
                List<ReactNode>()
            )
            .push(
                <a className="disabled list-group-item" key="resultmatcher">
                    <i>
                        {!store.isLoaded
                            ? 'Loading...'
                            : store.matchCount - (store.descriptors.size - options.size) + ' matching results'}
                    </i>
                </a>
            )
            .toArray();
    }

    renderValue(): ReactNode {
        const { values } = this.props;

        return (
            <div>
                {values
                    .filter(vd => vd.raw !== undefined)
                    .map((vd, i) => (
                        <span
                            className="btn btn-primary btn-sm"
                            key={i}
                            onClick={this.onItemRemove.bind(this, vd)}
                            style={{ marginRight: '2px', padding: '1px 5px' }}
                        >
                            {vd.display}
                            &nbsp;
                            <i className="fa fa-close" />
                        </span>
                    ))
                    .toArray()}
            </div>
        );
    }

    getStore(): LookupStore {
        const { col } = this.props;

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lookups.get(LookupStore.key(col));
    }

    getOptions(props: LookupCellProps): List<ValueDescriptor> {
        const { values } = props;
        const store = this.getStore();

        if (store) {
            return store.descriptors
                .filter(vd => {
                    return !(values && values.some(v => v.raw === vd.raw && vd.display === vd.display));
                })
                .toList();
        }

        return emptyList;
    }

    render(): ReactNode {
        return (
            <div className="cell-lookup" ref={this.wrapperEl}>
                {this.renderValue()}
                <input
                    autoFocus
                    className="cell-lookup-input"
                    disabled={this.props.disabled}
                    onBlur={this.onInputBlur}
                    onChange={this.onInputChange}
                    onKeyDown={this.onInputKeyDown}
                    ref={this.inputEl}
                    type="text"
                />
                <div className="cell-lookup-menu" ref={this.menuEl}>{this.renderOptions()}</div>
            </div>
        );
    }
}
