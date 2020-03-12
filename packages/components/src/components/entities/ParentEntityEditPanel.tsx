import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    capitalizeFirstChar,
    EntityDataType,
    gridInvalidate,
    LoadingSpinner,
    naturalSort,
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
import { EntityChoice, IEntityTypeOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';
import { DELIMITER } from '../forms/input/SelectInput';

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
    parentTypeOptions: List<IEntityTypeOption>
    chosenValue: string | Array<any>
    currentParents: List<EntityChoice>
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
            chosenValue: undefined,
            currentParents: undefined
        };
    }

    componentWillMount() {
        this.init();
    }

    init()  {
        getEntityTypeOptions(this.props.parentDataType.typeListingSchemaQuery, this.props.parentDataType.instanceSchemaName)
            .then((optionsMap) => {
                const parentTypeOptions = optionsMap.get(this.props.parentDataType.typeListingSchemaQuery.queryName);
                const currentParents = this.getInitialParentChoices(parentTypeOptions);
                this.setState(() => ({
                    loading: false,
                    parentTypeOptions,
                    currentParents,
                    canSubmit: !currentParents.isEmpty()
                }));
            }
        )
    }

    hasParents() : boolean {
        return !this.state.currentParents.isEmpty()
    }

    // IParentOption has query and schema along with label and value
    //   label, lsid, rowid, value, query, and schema (where label, value, and query are all the same, essentially)
    // IEntityTypeOption has lsid and rowId along with label and value
    //   label, value, lsid, rowId
    getInitialParentChoices(parentTypeOptions: List<IEntityTypeOption>) : List<EntityChoice> {
        let parentValuesByType = Map<string, EntityChoice>();

        if (this.props.childModel && this.props.childModel.isLoaded) {
            const row = this.props.childModel.getRow();

            if (row.size > 0) {
                const {parentDataType} = this.props;
                // for each parent in the model, extract the name and type and then create a QueryGrid with a single row
                const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
                const inputTypes: List<Map<string, any>> = row.get(parentDataType.inputTypeColumnName);
                if (inputs && inputTypes) {

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
                                parentValuesByType = parentValuesByType.set(typeOption.query, {
                                    type: typeOption,
                                    value: []
                                })
                            }
                            let updatedChoice = parentValuesByType.get(typeOption.query);
                            updatedChoice.value.push(inputs.getIn([index, 'value']));
                            parentValuesByType = parentValuesByType.set(typeOption.query, updatedChoice)
                        }
                    });
                }
            }
        }
        // having collected the values by type, create a list, sorted by the type label and return that.
        return parentValuesByType.sortBy(choice => choice.type.label, naturalSort).toList();
    }

    toggleEdit = () => {
        this.setState((state) => ({editing: !state.editing}))
    };

    changeEntityType(fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void  {
        this.setState((state) => ({
            currentParents: state.currentParents.set(index, {type: selectedOption, value: []}),
            canSubmit: false,
            chosenValue: undefined
        }));
    };

    onParentValueChange (name: string, value: string | Array<any>, index: number) {
        this.setState((state) => {
                let newChoice = state.currentParents.get(index);
                newChoice.value = Array.isArray(value) ? value : [value];
                return {
                    canSubmit: value !== undefined,
                    currentParents: state.currentParents.set(index, newChoice),
                    chosenValue: value
                };
            }
        )
    };

    onCancel = () => {
        this.setState(() => ({editing: false}))
    };

    onSubmit = (values) => {
        const { childModel, parentDataType } = this.props;
        const { currentParents } = this.state;

        const queryData = childModel.getRow();
        const queryInfo = childModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;
        let updatedValues = {};
        currentParents.forEach((parentChoice) => {
            // Label may seem wrong here as, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.value.join(';');
        });

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
            <div className="full-width bottom-spacing">
                <Button
                    className="pull-left"
                    onClick={this.onCancel}
                >
                    {cancelText}
                </Button>
                <Button
                    className="pull-right"
                    bsStyle={"success"}
                    type="submit"
                    disabled={!canSubmit}
                    onClick={this.onSubmit}
                >
                    {submitText}
                </Button>
            </div>
        )
    }

    // FIXME something not quite right here with the QuerySelect values. Using "Name" as the valueColumn
    // seems necessary to get distinct values in the QuerySelect, but using LSID seems necessary
    // to get the initial values to show up.
    renderParentSelection(entityChoice: EntityChoice, index: number) {
        const { parentDataType } = this.props;
        const typeName = entityChoice.type ? entityChoice.type.label : undefined;
        const parentSchemaQuery = typeName ? SchemaQuery.create(this.props.parentDataType.instanceSchemaName, typeName) : undefined;
        const lcTypeName = typeName ? typeName.toLowerCase() : undefined;

        return (
            <div className={'bottom-spacing'} key={lcTypeName}>
                <SelectInput
                    formsy={false}
                    inputClass="col-sm-6"
                    label={parentDataType.typeNounSingular}
                    labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                    name={"parentEntityType" + index}
                    placeholder={'Select a ' + parentDataType.typeNounSingular + ' ...'}
                    onChange={(fieldName, formName, selectedOption) => this.changeEntityType(fieldName, formName, selectedOption, index)}
                    options={this.state.parentTypeOptions.toArray()}
                    required
                    value={lcTypeName}
                />
                {lcTypeName && (
                    <QuerySelect
                        componentId={"parentEntityValue_" + lcTypeName} // important that this key off of the schemaQuery or it won't update when the SelectInput chages
                        containerClass="row"
                        disabled={lcTypeName === undefined}
                        formsy={false}
                        label={capitalizeFirstChar(parentDataType.nounSingular) + " ID"}
                        inputClass="col-sm-6"
                        labelClass="col-sm-3 col-xs-12 entity-insert--parent-label"
                        name={lcTypeName + "_value"}
                        onQSChange={(name: string, value: string | Array<any>) => this.onParentValueChange(name, value, index)}
                        preLoad
                        previewOptions
                        multiple
                        schemaQuery={parentSchemaQuery}
                        showLabel={true}
                        valueColumn="Name"
                        showLoading={false}
                        loadOnChange={false}
                        value={entityChoice.value.join(DELIMITER)}
                    />
                )}
            </div>
        )
    }

    renderEditableParents() {
        return this.state.currentParents.map((entityChoice, index) => {
            return this.renderParentSelection(entityChoice, index);
        }).toArray();
    }

    renderSingleParentPanels() {
        const { parentDataType } = this.props;

        return this.state.currentParents.map((choice, index) => (
            <SingleParentEntityPanel
                key={choice.type.label}
                parentDataType={parentDataType}
                parentTypeQueryName={choice.type.label}
                parentLSIDs={choice.value}
            />
        )).toArray();
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
        console.log("Adding more parents not currently implemented.");
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
                onClickFn={this.toggleEdit}
            />
        );

        return (
            <>
                <Panel>
                    <Panel.Heading>{heading}</Panel.Heading>
                    <Panel.Body>
                        <div className={'bottom-spacing'}><b>{capitalizeFirstChar(parentDataType.nounPlural)} for {childName}</b></div>
                        {loading ? <LoadingSpinner/> :
                            editing ?
                            <>
                                {this.renderEditableParents()}
                                {/*{this.renderAddParentButton()}*/}
                            </> :
                            <>
                                {this.renderParentData()}
                            </>
                        }
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
            </>
        )
    }
}
