import React from 'react';
import { findDOMNode } from 'react-dom';

import classNames from 'classnames';

import { PARENT_ALIAS_HELPER_TEXT } from '../../constants';

import { IParentAlias, IParentOption } from '../entities/models';
import { SelectInput } from '../forms/input/SelectInput';
import { DeleteIcon } from '../base/DeleteIcon';

interface IParentAliasRow {
    aliasCaption: string;
    helpMsg: string;
    id: string;
    onAliasChange: (id: string, alias: string, newValue: any) => void;
    onRemove: (index: string) => void;
    parentAlias: IParentAlias;
    parentOptions?: IParentOption[];
    parentTypeCaption: string;
    updateDupeParentAliases?: (id: string) => void;
    hideRequiredCheck?: boolean;
}

export class ParentAliasRow extends React.Component<IParentAliasRow> {
    private nameInput: React.RefObject<HTMLInputElement>;

    static defaultProps = {
        aliasCaption: 'Parent Alias',
        parentTypeCaption: 'parent type',
        helpMsg: PARENT_ALIAS_HELPER_TEXT,
    };

    constructor(props) {
        super(props);
        this.nameInput = React.createRef();
    }

    componentDidMount(): void {
        const { parentAlias } = this.props;
        if (!(parentAlias && parentAlias.alias)) this.focusNameInput();
    }

    focusNameInput = () => {
        if (this.nameInput && this.nameInput.current) {
            const domEl = findDOMNode(this.nameInput.current) as HTMLInputElement;
            domEl.focus();
        }
    };

    onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } = e.target;
        this.props.onAliasChange(this.props.id, name, value);
    };

    onToggleRequired = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, checked } = e.target;
        this.props.onAliasChange(this.props.id, name, checked);
    };

    onSelectChange = (name: string, selectedValue: string, selectedOption: IParentOption): void => {
        // Issue 40149: on clear, need to retain the IParentOption with schema
        const { parentAlias } = this.props;
        let newValue = selectedOption;
        if (!selectedOption && parentAlias && parentAlias.parentValue) {
            newValue = { schema: parentAlias.parentValue.schema };
        }

        this.props.onAliasChange(this.props.id, name, newValue);
    };

    removeParentAlias = (): void => {
        const { id } = this.props;
        this.props.onRemove(id);
    };

    onAliasBlur = (): void => {
        this.props.updateDupeParentAliases(this.props.id);
    };

    // Issue 40149: update alias ignoreSelectError prop on both blur and focus
    onParentValueBlur = (): void => {
        this.props.onAliasChange(this.props.id, 'ignoreSelectError', false);
    };

    // Issue 40149: update alias ignoreSelectError prop on both blur and focus
    onParentValueFocus = (): void => {
        this.props.onAliasChange(this.props.id, 'ignoreSelectError', true);
    };

    render() {
        const { id, parentAlias, parentOptions, aliasCaption, parentTypeCaption, hideRequiredCheck } = this.props;
        if (!parentOptions) return null;

        const { alias, parentValue, ignoreAliasError, ignoreSelectError, isDupe, required } = parentAlias;
        const aliasBlank = !alias || alias.trim().length === 0;
        const parentValueBlank = !parentValue || !parentValue.value;
        return (
            <div className="row" key={id}>
                <div className="col-xs-2"></div>
                <div className="col-xs-10">
                    <div className="domain-field-alias--row domain-field-row domain-row-border-default">
                        <div
                            className={classNames('col-xs-4 domain-field-alias--input', {
                                'has-error': !ignoreSelectError && parentValueBlank,
                            })}
                        >
                            <SelectInput
                                containerClass=""
                                inputClass="import-alias--parent-select form-group"
                                name="parentValue"
                                onChange={this.onSelectChange}
                                options={parentOptions}
                                placeholder={`Select a ${parentTypeCaption.toLowerCase()}...`}
                                value={parentValue?.value}
                                onFocus={this.onParentValueFocus}
                                onBlur={this.onParentValueBlur}
                            />
                        </div>
                        <div
                            className={classNames('col-xs-4 domain-field-alias--input', {
                                'has-error': !ignoreAliasError && (aliasBlank || isDupe),
                            })}
                        >
                            <input
                                className="form-control"
                                ref={this.nameInput}
                                name="alias"
                                type="text"
                                placeholder={`Enter a ${aliasCaption.toLowerCase()} for import`}
                                defaultValue={alias} // Issue 50140: use defaultValue instead of value
                                onChange={this.onChange}
                                onBlur={this.onAliasBlur}
                            />
                        </div>
                        <div className="col-xs-4 domain-field-alias--input">
                            {!hideRequiredCheck &&
                                <input
                                    checked={required}
                                    disabled={false}
                                    name="required"
                                    onChange={this.onToggleRequired}
                                    type="checkbox"
                                />
                            }
                            <div className="pull-right">
                                <DeleteIcon
                                    id={id + '-delete'}
                                    title={'Remove ' + aliasCaption}
                                    iconCls="domain-field-delete-icon"
                                    onDelete={this.removeParentAlias}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
