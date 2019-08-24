import * as React from "react";
import {IParentOption, ParentAlias} from "./models";
import {Col, FormControl, Row} from "react-bootstrap";
import {LabelOverlay} from "../..";
import { SelectInput } from "../forms/input/SelectInput";
import {RemoveEntityButton} from "@glass/base";


interface IParentAlias {
    id: string
    parentAlias: ParentAlias
    parentOptions?: Array<IParentOption>
    onAliasChange: (id:string, alias:string, newValue: string) => void
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

    onSelectChange(name, value) {
        this.props.onAliasChange(this.props.id, name, value);
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

        //TODO probably better to pass the option around instead of looking it up like this all the time
        const optionValue = parentOptions.find((opt)=> opt.value === parentValue);

        return (<Row key={id} >
            <Col xs={3}> {/*Label*/}
                <LabelOverlay
                    label={'Parent Alias *'}
                    labelClass={'sample-insert--parent-label'}
                    description='Column heading that indicates sample parentage during import'
                    required={true}
                />
            </Col>
            <Col xs={3} > {/*Alias*/}
                <FormControl
                    name={"alias"}
                    type="text"
                    placeholder={'Enter an Alias for import'}
                    value={alias}
                    onChange={this.onChange}
                />
            </Col>
            <Col xs={5}>
                <SelectInput
                    formsy={false}
                    inputClass="sampleset-insert--parent-select" //TODO: Not sure why this styles better?
                    name={"parentValue"}
                    onChange={this.onSelectChange}
                    options={parentOptions}
                    placeholder={'Select a Sample Set...'}
                    value={optionValue ? optionValue.value : undefined }
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
