import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    Alert,
    capitalizeFirstChar,
    EntityDataType,
    getQueryGridModel,
    LoadingSpinner,
    naturalSort,
    Progress,
    queryGridInvalidate,
    QueryGridModel,
    resolveErrorMessage,
    SchemaQuery,
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
    onUpdate?: () => void
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
    isDirty: boolean
    submitting: boolean
    originalValues: List<string>
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
            isDirty: false,
            submitting: false,
            originalValues: List<string>(),
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

    getChildModel() {
        return getQueryGridModel(this.props.childModel.getId());
    }

    hasParents() : boolean {
        return !this.state.currentParents.isEmpty()
    }

    getInitialParentChoices(parentTypeOptions: List<IEntityTypeOption>) : List<EntityChoice> {
        let parentValuesByType = Map<string, EntityChoice>();

        const childModel = this.getChildModel();
        if (childModel && childModel.isLoaded) {
            const row = childModel.getRow();

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
                                    value: undefined
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
            currentParents: state.currentParents.set(index, {type: selectedOption, value: undefined, ids: []}),
            isDirty: true
        }));
    };

    onParentValueChange = (name: string, value: string | Array<any>, index: number) => {
        this.updateParentValue(value, index, true)
    };

    onInitialParentValue = (value: string, selectedValues: List<any>, index: number) => {
        this.updateParentValue(value, index, false);
    };

    updateParentValue(value: string | Array<any>, index: number, isDirty: boolean) {
        this.setState((state) => {
            let newChoice = state.currentParents.get(index);
            newChoice.value = Array.isArray(value) ? value.join(DELIMITER) : value;
            return {
                currentParents: state.currentParents.set(index, newChoice),
                isDirty
            }
        });
    }

    onCancel = () => {
        this.setState(() => ({editing: false}))
    };

    onSubmit = (values) => {
        if (!this.canSubmit())
            return;

        this.setState(() => ({submitting: true}));

        const { parentDataType, onUpdate } = this.props;
        const { currentParents } = this.state;
        const childModel = this.getChildModel();

        const queryData = childModel.getRow();
        const queryInfo = childModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;
        let updatedValues = {};
        currentParents.forEach((parentChoice) => {
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            if (parentChoice.value && parentChoice.value.length > 0) {
                updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.value;
            }
            else if (parentChoice.ids) { // use the original Ids
                updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.ids.join(DELIMITER);
            }
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
            this.setState(() => ({
                submitting: false,
                isDirty: false,
                editing: false
            }));

            currentParents.forEach((parentChoice) => {
                queryGridInvalidate(SchemaQuery.create(this.props.parentDataType.instanceSchemaName, parentChoice.type.label), true);
            });
            if (onUpdate) {
                onUpdate();
            }
        }).catch((error) => {
            console.error(error);
            this.setState(() => ({
                submitting: false,
                error: resolveErrorMessage(error, 'data', undefined, 'update')
            }));
        });
    };

    canSubmit() {
        // TODO this will change when we can actually delete parents entirely.
        return this.state.isDirty && this.state.currentParents.find((parent) => parent.value && parent.value.length > 0);
    }

    renderProgress() {
        const { submitting } = this.state;

        return (
            <Progress
                estimate={2000}
                modal={true}
                title={"Updating " + this.props.parentDataType.nounPlural}
                toggle={submitting}
            />
        )
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
            <div key={index}>
                {this.state.editing && <hr/>}
                <SingleParentEntityPanel
                    key={index}
                    parentDataType={parentDataType}
                    parentTypeOptions={this.state.parentTypeOptions}
                    parentTypeQueryName={choice.type.label}
                    parentLSIDs={choice.ids}
                    index={index}
                    editing={this.state.editing}
                    onChangeParentType={this.changeEntityType}
                    onChangeParentValue={this.onParentValueChange}
                    onInitialParentValue={this.onInitialParentValue}
                />
            </div>

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
                   editing={this.state.editing}
                   parentTypeOptions={this.state.parentTypeOptions}
                   parentDataType={parentDataType}
                   childNounSingular={childNounSingular}
                   index={0}
                   onChangeParentType={this.changeEntityType}
                   onChangeParentValue={this.onParentValueChange}
                   onInitialParentValue={this.onInitialParentValue}
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
        const { editing, error, loading } = this.state;

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
                <Panel bsStyle={editing ? "info" : "default"}>
                    <Panel.Heading>{heading}</Panel.Heading>
                    <Panel.Body>
                        {error && <Alert>{error}</Alert>}
                        <div className={'bottom-spacing'}><b>{capitalizeFirstChar(parentDataType.nounPlural)} for {childName}</b></div>
                        {loading ? <LoadingSpinner/> : this.renderParentData()}
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
                {this.renderProgress()}
            </>
        )
    }
}
