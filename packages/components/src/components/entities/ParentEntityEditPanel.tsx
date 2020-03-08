import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    capitalizeFirstChar,
    EntityDataType,
    LoadingSpinner,
    QueryGridModel,
    QuerySelect,
    SchemaQuery,
    SelectInput
} from '../..';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';
import { getEntityTypeOptions } from './actions';
import { List, Map } from 'immutable';
import { IEntityTypeOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';


interface Props {
    childName: string
    childNounSingular: string
    childModel: QueryGridModel
    parentDataType: EntityDataType
    title: string
    cancelText: string
    submitText: string
}

interface State {
    editing: boolean
    canSubmit: boolean
    loading: boolean
    parentTypeOptions: List<any>
    entityType: IEntityTypeOption
    inputs: List<Map<string, any>>
    typeQueryNames: List<string>
}

export class ParentEntityEditPanel extends React.Component<Props, State> {

    static defaultProps = {
        cancelText: "Cancel",
        submitText: "Save",
    };

    constructor(props: Props) {
        super();

        this.state = {
            editing: false,
            canSubmit: false,
            loading: true,
            parentTypeOptions: undefined,
            entityType: undefined,
            inputs: List<Map<string, any>>(),
            typeQueryNames: List<string>(),
        };
    }

    componentWillMount() {
        this.init();
    }

    init()  {
        getEntityTypeOptions(this.props.parentDataType.typeListingSchemaQuery, this.props.parentDataType.instanceSchemaName)
            .then((optionsMap) => {
                const parentTypeOptions = optionsMap.get(this.props.parentDataType.typeListingSchemaQuery.queryName);
                // TODO this seems like the right place to do this to avoid doing it with each render, but
                // it currently won't happen except on first mount. so if a property updates this won't happen.
                const row = this.props.childModel.getRow();
                let updatedState : any = {
                    loading: false,
                    parentTypeOptions
                };
                if (row.size > 0) {
                    const { parentDataType } = this.props;
                    // for each parent in the model, extract the name and type and then create a QueryGrid with a single row
                    const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
                    const inputTypes: List<Map<string, any>> = row.get(parentDataType.inputTypeColumnName);
                    if (inputs && inputTypes) {
                        const typeQueryNames = inputTypes.map((type) => {
                            // I'm not sure when the type could have more than one value here, but 'value' is an array
                            const typeValue = type.getIn(['value', 0]);
                            const typeOption = parentTypeOptions.find((option) => option[parentDataType.inputTypeValueField] === typeValue);
                            return typeOption ? typeOption.query : undefined;
                        }).toList();
                        updatedState['inputs'] = inputs;
                        updatedState['typeQueryNames'] = typeQueryNames;
                    }
                }
                this.setState(() => (updatedState));
            }
        )
    }

    hasParents() : boolean {
        const row = this.props.childModel.getRow();
        if (!row || row.size === 0)
            return false;
        const { parentDataType } = this.props;
        const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
        return (inputs && inputs.size > 0);
    }

    handleClick = () => {
        this.setState((state) => ({editing: !state.editing}))
    };

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption): void => {
        this.setState(() => ({entityType: selectedOption}))
    };

    onParentValueChange = () => {

    };

    onCancel = () => {
        this.setState(() => ({editing: false}))
    };

    onSubmit = () => {

    };

    renderEditControls() {
        const { cancelText, submitText } = this.props;
        const { canSubmit } = this.state;

        return (
            <>
                <div className="pull-left bottom-spacing">
                    <Button
                        onClick={this.onCancel}>
                        {cancelText}
                    </Button>
                </div>
                <div className="btn-group pull-right">
                    <Button
                        bsStyle={"success"}
                        type="submit"
                        disabled={!canSubmit}
                        onClick={this.onSubmit}
                    >
                        {submitText}
                    </Button>
                </div>
            </>
        )
    }

    renderNewParentSection() {
        const { parentDataType } = this.props;
        const { entityType } = this.state;

        const parentSchemaQuery = entityType ? SchemaQuery.create(this.props.parentDataType.instanceSchemaName, entityType.label) : undefined;

        return (
            <>
                <SelectInput
                    formsy={false}
                    inputClass="col-sm-5"
                    label={parentDataType.typeNounSingular}
                    labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                    name="parentEntityType"
                    placeholder={'Select a ' + parentDataType.typeNounSingular + ' ...'}
                    onChange={this.changeEntityType}
                    options={this.state.parentTypeOptions.toArray()}
                    required
                    value={entityType ? entityType.label.toLowerCase() : undefined}
                />
                {entityType && (
                    <QuerySelect
                        componentId={entityType.value + "_value"}
                        containerClass="row"
                        disabled={entityType === undefined}
                        formsy={false}
                        label={parentDataType.nounSingular + " ID"}
                        inputClass="col-xs-6 test-loc-ingredient"
                        name={entityType.value + "_added"}
                        onQSChange={this.onParentValueChange}
                        preLoad
                        previewOptions
                        schemaQuery={parentSchemaQuery}
                        showLabel={true}
                        valueColumn="Name"
                    />
                )}
            </>
        )
    }

    renderSingleParentPanels() {
        const row = this.props.childModel.getRow();

        if (row.size > 0) {
            const { parentTypeOptions } = this.state;
            const { parentDataType } = this.props;
            // for each parent in the model, extract the name and type and then create a QueryGrid with a single row
            const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
            const inputTypes: List<Map<string, any>> = row.get(parentDataType.inputTypeColumnName);
            if (inputs && inputTypes) {
                const typeQueryNames = inputTypes.map((type) => {
                    // I'm not sure when the type could have more than one value here, but 'value' is an array
                    const typeValue = type.getIn(['value', 0]);
                    const typeOption = parentTypeOptions.find((option) => option[parentDataType.inputTypeValueField] === typeValue);
                    return typeOption ? typeOption.query : undefined;
                }).toList();
                return inputs.map((input, index) => (
                    <SingleParentEntityPanel
                        index={index}
                        parentDataType={parentDataType}
                        parentTypeQueryName={typeQueryNames.get(index)}
                        parentValue={input}
                    />
                )).toArray();
            }

        }
    }

    renderParentData() {
        const { parentDataType } = this.props;
        const lcPlural = parentDataType.nounPlural.toLowerCase();
        if (this.hasParents()) {
            return this.renderSingleParentPanels();
        }
        else {
            return (
                <>
                    No {lcPlural} currently defined.
                    Click the edit icon in the upper right to add {lcPlural}.
                </>
            )
        }
    }

    onAddParent = () => {

    };

    renderAddParentButton() {
        return (
            <AddEntityButton
                onClick={this.onAddParent} entity={this.props.parentDataType.nounSingular}
            />
        )
    }

    render() {
        const { parentDataType, title, childName } = this.props;
        const { editing, loading } = this.state;

        const heading = (
            <DetailPanelHeader
                useEditIcon={true}
                isEditable={!loading}
                canUpdate={true}
                editing={editing}
                title={title}
                onClickFn={this.handleClick}
            />
        );

        return (
            <Panel>
                <Panel.Heading>{heading}</Panel.Heading>
                <Panel.Body>
                    <div className={'bottom-spacing'}><b>{capitalizeFirstChar(parentDataType.nounPlural)} for {childName}</b></div>
                    {loading ? <LoadingSpinner/> :
                        editing ?
                        <>
                            {this.renderNewParentSection()}
                            {this.renderAddParentButton()}
                            {this.renderEditControls()}
                        </> :
                        <>
                            {this.renderParentData()}
                        </>
                    }
                </Panel.Body>
            </Panel>
        )
    }
}
