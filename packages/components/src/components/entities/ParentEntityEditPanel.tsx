import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    capitalizeFirstChar,
    EntityDataType, gridInvalidate,
    LoadingSpinner,
    QueryGridModel,
    QuerySelect,
    resolveErrorMessage,
    SchemaQuery,
    SelectInput,
    updateRows
} from '../..';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';
import { getEntityTypeOptions } from './actions';
import { List, Map } from 'immutable';
import { IEntityTypeOption, IParentOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';

interface Props {
    canUpdate: boolean
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
    error: React.ReactNode
    canSubmit: boolean
    loading: boolean
    parentTypeOptions: List<IParentOption>
    entityType: IEntityTypeOption
    entityValue: string | Array<any>
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
            error: undefined,
            canSubmit: false,
            loading: true,
            parentTypeOptions: undefined,
            entityType: undefined,
            entityValue: undefined,
        };
    }

    componentWillMount() {
        this.init();
    }

    init()  {
        getEntityTypeOptions(this.props.parentDataType.typeListingSchemaQuery, this.props.parentDataType.instanceSchemaName)
            .then((optionsMap) => {
                this.setState(() => ({
                    loading: false,
                    parentTypeOptions: optionsMap.get(this.props.parentDataType.typeListingSchemaQuery.queryName)
                }));
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
        this.setState(() => ({
            entityType: selectedOption,
            canSubmit: false,
            entityValue: undefined
        }))
    };

    onParentValueChange = (name: string, value: string | Array<any>) => {
        this.setState(() => ({
            canSubmit: value !== undefined,
            entityValue: value
        }))
    };

    onCancel = () => {
        this.setState(() => ({editing: false}))
    };

    onSubmit = (values) => {
        const { childModel, parentDataType } = this.props;

        const queryData = childModel.getRow();
        const queryInfo = childModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;
        let updatedValues = {};
        updatedValues['DataInputs/'+ this.state.entityType.value] = this.state.entityValue;

        queryInfo.getPkCols().forEach((pkCol) => {
            const pkVal = queryData.getIn([pkCol.fieldKey, 'value']);

            if (pkVal !== undefined && pkVal !== null) {
                updatedValues[pkCol.fieldKey] = pkVal;
            }
            else {
                console.warn('Unable to find value for pkCol \"' + pkCol.fieldKey + '\"');
            }
        });

        return updateRows({
            schemaQuery,
            rows: [updatedValues]
        }).then(() => {
            gridInvalidate(childModel); // TODO more invalidation required here
            this.setState(() => ({editing: false}));
        }).catch((error) => {
            console.error(error);
            this.setState(() => ({
                error: resolveErrorMessage(error, 'data', undefined, 'update')
            }));
        });
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

    // TODO initialize with current parent values.
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
                        clearable={false} // change to true (or remove) when we have support on the back end
                        componentId={entityType.value + "_value"}
                        containerClass="row"
                        disabled={entityType === undefined}
                        formsy={false}
                        label={capitalizeFirstChar(parentDataType.nounSingular) + " ID"}
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
                let parentValuesByType = Map<string, List<Map<string, any>>>();
                // group the inputs by parent type so we can show each in its own grid.
                inputTypes.forEach((typeMap, index) => {
                    // I'm not sure when the type could have more than one value here, but 'value' is an array
                    const typeValue = typeMap.getIn(['value', 0]);
                    const typeOption = parentTypeOptions.find((option) => option[parentDataType.inputTypeValueField] === typeValue);
                    if (!typeOption) {
                        console.warn("Unable to find parent type.", typeValue);
                    }
                    else {
                        if (!parentValuesByType.has(typeOption.query)) {
                            parentValuesByType = parentValuesByType.set(typeOption.query, List<Map<string, any>>())
                        }
                        parentValuesByType = parentValuesByType.set(typeOption.query, parentValuesByType.get(typeOption.query).push(inputs.get(index)))
                    }
                });
                return parentValuesByType.map((input, typeName) => (
                    <SingleParentEntityPanel
                        key={typeName}
                        parentDataType={parentDataType}
                        parentTypeQueryName={typeName}
                        parentValues={input}
                    />
                )).toArray();
            }

        }
    }

    renderParentData() {
        const { parentDataType, childNounSingular } = this.props;
        if (this.hasParents()) {
            return this.renderSingleParentPanels();
        }
        else {
            return (
               <SingleParentEntityPanel
                   parentDataType={parentDataType}
                   childNounSingular={childNounSingular}
               />
            )
        }
    }

    onAddParent = () => {
        console.log("Adding second parent not currently implemented.");
    };

    renderAddParentButton() {
        return (
            <AddEntityButton
                onClick={this.onAddParent} entity={this.props.parentDataType.nounSingular}
            />
        )
    }

    render() {
        const { parentDataType, title, canUpdate, childName } = this.props;
        const { editing, loading } = this.state;

        const heading = (
            <DetailPanelHeader
                useEditIcon={true}
                isEditable={!loading && canUpdate}
                canUpdate={canUpdate}
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
                            {/*{this.renderAddParentButton()}*/}
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
