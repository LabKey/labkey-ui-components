import React from 'react';
import { findDOMNode } from 'react-dom';

import classNames from 'classnames';

import { PARENT_ALIAS_HELPER_TEXT } from '../../constants';

import { IParentAlias, IParentOption } from '../entities/models';
import { SelectInput } from '../forms/input/SelectInput';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';

import { DomainFieldLabel } from './DomainFieldLabel';

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
        const { id, parentAlias, parentOptions, aliasCaption, parentTypeCaption, helpMsg } = this.props;
        if (!parentOptions) return null;

        const { alias, parentValue, ignoreAliasError, ignoreSelectError, isDupe } = parentAlias;
        const aliasBlank = !alias || alias.trim().length === 0;
        const parentValueBlank = !parentValue || !parentValue.value;

        return (
            <div className="row" key={id}>
                <div className="col-xs-2">
                    <DomainFieldLabel label={aliasCaption} required={true} helpTipBody={helpMsg} />
                </div>
                <div className={classNames('col-xs-3', { 'has-error': !ignoreAliasError && (aliasBlank || isDupe) })}>
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
                <div className={classNames('col-xs-5', { 'has-error': !ignoreSelectError && parentValueBlank })}>
                    <SelectInput
                        inputClass="import-alias--parent-select"
                        name="parentValue"
                        onChange={this.onSelectChange}
                        options={parentOptions}
                        placeholder={`Select a ${parentTypeCaption.toLowerCase()}...`}
                        value={parentValue?.value}
                        onFocus={this.onParentValueFocus}
                        onBlur={this.onParentValueBlur}
                    />
                </div>
                <div>
                    <RemoveEntityButton labelClass="entity-insert--remove-parent" onClick={this.removeParentAlias} />
                </div>
            </div>
        );
    }
}
