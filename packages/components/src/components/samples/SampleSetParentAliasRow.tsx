import React from 'react';
import { IParentAlias, IParentOption } from './models';
import { Col, FormControl, FormControlProps, Row } from 'react-bootstrap';

import { SelectInput } from '../forms/input/SelectInput';

import classNames from 'classnames';
import { PARENT_ALIAS_HELPER_TEXT } from '../../constants';
import { LabelOverlay } from '../forms/LabelOverlay';
import { RemoveEntityButton } from '../buttons/RemoveEntityButton';


interface IParentAliasRow {
    id: string
    parentAlias: IParentAlias
    parentOptions?: Array<IParentOption>
    onAliasChange: (id:string, alias:string, newValue: any) => void
    onRemove: (index: string) => void
}

export class SampleSetParentAliasRow extends React.Component<IParentAliasRow> {

    onChange = (e: React.ChangeEvent<FormControlProps>): void => {
        const { name, value } = e.target;
        this.props.onAliasChange(this.props.id, name, value);
    };

    onSelectChange = (name: string, selectedValue: string, selectedOption: IParentOption): void => {
        this.props.onAliasChange(this.props.id, name, selectedOption);
    };

    removeParentAlias = (): void => {
        const {id} = this.props;
        this.props.onRemove(id);
    };

    render() {
        const {id, parentAlias, parentOptions} = this.props;
        if (!parentOptions)
            return null;

        const {alias, parentValue} = parentAlias;

        const aliasBlank = !alias || alias.trim().length === 0;

        return (
            <Row key={id} >
                <Col xs={3}> {/* TODO:Error/validation styling on label {className={classNames('parent-alias-label', {'has-error': aliasBlank || !optionValue})}> */}
                    <LabelOverlay
                        label={'Parent Alias *'}
                        description={PARENT_ALIAS_HELPER_TEXT}
                        required={true}
                        canMouseOverTooltip={true}
                    />
                </Col>
                <Col xs={3} className={classNames({'has-error': aliasBlank})}>
                    <FormControl
                        name={"alias"}
                        type="text"
                        placeholder={'Enter an alias for import'}
                        value={alias}
                        onChange={this.onChange}
                    />
                </Col>
                <Col xs={5} className={classNames({'has-error': !parentValue})}>
                    <SelectInput
                        formsy={false}
                        inputClass={"sampleset-insert--parent-select"}
                        name={"parentValue"}
                        onChange={this.onSelectChange}
                        options={parentOptions}
                        placeholder={'Select a sample type...'}
                        value={parentValue ? parentValue.value : undefined }
                    />
                </Col>
                <Col>
                    <RemoveEntityButton
                        labelClass={'sample-insert--remove-parent'}
                        onClick={this.removeParentAlias}/>
                </Col>
            </Row>
        );
    }
}
