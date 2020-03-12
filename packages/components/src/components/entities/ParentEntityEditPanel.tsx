import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    capitalizeFirstChar,
    EntityDataType,
    gridIdInvalidate,
    gridInvalidate,
    LoadingSpinner,
    naturalSort,
    QueryGridModel,
    resolveErrorMessage,
    updateRows
} from '../..';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';
import { getEntityTypeOptions } from './actions';
import { List, Map } from 'immutable';
import { EntityChoice, IEntityTypeOption } from './models';
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
                }));
            }
        )
    }

    hasParents() : boolean {
        return !this.state.currentParents.isEmpty()
    }

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
                                    ids: [],
                                    value: []
                                })
                            }
                            let updatedChoice = parentValuesByType.get(typeOption.query);
                            updatedChoice.ids.push(inputs.getIn([index, 'value']));
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

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void  => {
        this.setState((state) => ({
            currentParents: state.currentParents.set(index, {type: selectedOption, values: [], ids: []}),
            chosenValue: undefined
        }));
    };

    onParentValueChange = (name: string, value: string | Array<any>, index: number) => {
        this.setState((state) => {
                let newChoice = state.currentParents.get(index);
                newChoice.values =  Array.isArray(value) ? value : (value === undefined ? [] : [value]);
                return {
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
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.values.join(';');
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
            currentParents.forEach((parentChoice) => {
                gridIdInvalidate('parent-data-' + parentChoice.type.label);
            });
            this.setState(() => ({editing: false}));
        }).catch((error) => {
            console.error(error);
            this.setState(() => ({
                error: resolveErrorMessage(error, 'data', undefined, 'update')
            }));
        });
    };

    canSubmit() {
        return this.state.currentParents.find((parent) => parent.values.length > 0);
    }

    renderEditControls() {
        const { cancelText, submitText } = this.props;

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
                    disabled={!this.canSubmit()}
                    onClick={this.onSubmit}
                >
                    {submitText}
                </Button>
            </div>
        )
    }

    renderSingleParentPanels() {
        const { parentDataType } = this.props;

        return this.state.currentParents.map((choice, index) => (
            <>
                {this.state.editing && <hr/>}
                <SingleParentEntityPanel
                    key={choice.type.label}
                    parentDataType={parentDataType}
                    parentTypeOptions={this.state.parentTypeOptions}
                    parentTypeQueryName={choice.type.label}
                    parentLSIDs={choice.ids}
                    index={index}
                    editing={this.state.editing}
                    onChangeParentType={this.changeEntityType}
                    onChangeParentValue={this.onParentValueChange}
                />
            </>

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
                   index={0}
               />
            )
        }
    }

    onAddParent = () => {
        console.warn("Adding more parents not currently implemented.");
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
                        {loading ? <LoadingSpinner/> : this.renderParentData()}
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
            </>
        )
    }
}
