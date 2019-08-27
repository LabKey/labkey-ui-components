import * as React from "react";
import {IParentOption, ParentAlias} from "./models";
import {Col, FormControl, Row} from "react-bootstrap";
import {LabelOverlay} from "../..";
import { SelectInput } from "../forms/input/SelectInput";
import {RemoveEntityButton} from "@glass/base";
import classNames from "classnames";


interface IParentAlias {
    id: string
    parentAlias: ParentAlias
    parentOptions?: Array<IParentOption>
    onAliasChange: (id:string, alias:string, newValue: any) => void
    onRemove: (index: string) => void
}

export class SampleSetParentAliasRow extends React.Component<IParentAlias, ParentAlias> {

    constructor(props) {
        super(props);

        this.onChange = this.onChange.bind(this);
        this.onSelectChange = this.onSelectChange.bind(this);
        this.removeParentAlias = this.removeParentAlias.bind(this);
    }

    onChange(e) {
        this.props.onAliasChange(this.props.id, e.target.name, e.target.value);
    }

    onSelectChange(name: string, selectedValue: string, selectedOption: IParentOption) {
        this.props.onAliasChange(this.props.id, name, selectedOption);
    }

    removeParentAlias() {
        const {id} = this.props;
        this.props.onRemove(id);
    }

    render() {
        const {id, parentAlias, parentOptions} = this.props;
        if (!parentOptions)
            return [];

        const {alias, parentValue} = parentAlias;

        const aliasBlank = !alias || alias.trim().length === 0;

        return (<Row key={id} >
            <Col xs={3}> {/* TODO:Error/validation styling on label {className={classNames('parent-alias-label', {'has-error': aliasBlank || !optionValue})}> */}
                <LabelOverlay
                    label={'Parent Alias *'}
                    description='Column heading that indicates sample parentage during import'
                    required={true}
                />
            </Col>
            <Col xs={3} className={classNames({'has-error': aliasBlank})}>
                <FormControl
                    name={"alias"}
                    type="text"
                    placeholder={'Enter an Alias for import'}
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
                    placeholder={'Select a Sample Set...'}
                    value={parentValue ? parentValue.value : undefined }
                />
            </Col>
            <Col>
                <RemoveEntityButton
                    labelClass={'sample-insert--remove-parent'}
                    onClick={this.removeParentAlias}/>
            </Col>
        </Row>);
    }
}
