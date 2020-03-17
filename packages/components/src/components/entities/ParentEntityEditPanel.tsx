import React from 'reactn';
import { Button, Panel } from 'react-bootstrap';
import {
    AddEntityButton,
    Alert,
    capitalizeFirstChar,
    EntityDataType,
    getActionErrorMessage,
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
    cancelText?: string
    submitText?: string
}

interface State {
    editing: boolean
    error: React.ReactNode
    loading: boolean
    parentTypeOptions: List<IEntityTypeOption>
    isDirty: boolean
    submitting: boolean
    originalParents: List<EntityChoice>
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
            originalParents: undefined,
            currentParents: undefined
        };
    }

    componentWillMount() {
        this.init();
    }

    init()  {
        const { parentDataType } = this.props;
        const { typeListingSchemaQuery, instanceSchemaName, filterArray } = parentDataType;

        getEntityTypeOptions(typeListingSchemaQuery, instanceSchemaName, filterArray)
            .then((optionsMap) => {
                const parentTypeOptions = optionsMap.get(typeListingSchemaQuery.queryName);
                const currentParents = this.getInitialParentChoices(parentTypeOptions);
                this.setState(() => ({
                    loading: false,
                    parentTypeOptions,
                    originalParents: currentParents,
                    currentParents,
                }));
            }
        ).catch((reason) => {
            this.setState(() => ({
                error: getActionErrorMessage("Unable to load " + parentDataType.descriptionSingular + " data.", parentDataType.descriptionPlural, true)
            }))
        })
    }

    getChildModel() {
        return getQueryGridModel(this.props.childModel.getId());
    }

    hasParents() : boolean {
        return this.state.currentParents && !this.state.currentParents.isEmpty()
    }

    getInitialParentChoices(parentTypeOptions: List<IEntityTypeOption>) : List<EntityChoice> {
        let parentValuesByType = Map<string, EntityChoice>();

        const childModel = this.getChildModel();
        if (childModel && childModel.isLoaded) {
            const row = childModel.getRow();

            if (row.size > 0) {
                const {parentDataType} = this.props;
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
        this.setState((state) => {
            const updatedParents = state.currentParents.set(index, {type: selectedOption, value: undefined, ids: undefined});
            return {
                currentParents: updatedParents,
                isDirty: this.someParentHasValue(updatedParents)
            }
        });
    };

    onParentValueChange = (name: string, value: string | Array<any>, index: number) => {
        this.updateParentValue(value, index, true)
    };

    onInitialParentValue = (value: string, selectedValues: List<any>, index: number) => {
        this.updateParentValue(value, index, false);
    };

    updateParentValue(value: string | Array<any>, index: number, makeDirty: boolean) {
        this.setState((state) => {
            let newChoice = state.currentParents.get(index);
            newChoice.value = Array.isArray(value) ? value.join(DELIMITER) : value;
            return {
                currentParents: state.currentParents.set(index, newChoice),
                isDirty: state.isDirty || makeDirty
            }
        });
    }

    onCancel = () => {
        this.setState((state) => ({
            currentParents: state.originalParents,
            editing: false
        }))
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

            // clear out the original parents' grid data (which may no longer be represented in the current parents
            let cleared = [];
            this.state.originalParents.forEach((parentChoice) => {
                cleared.push(parentChoice.type.label);
                queryGridInvalidate(SchemaQuery.create(this.props.parentDataType.instanceSchemaName, parentChoice.type.label), true);
            });
            // also clear out the current parents' grid data if it hasn't already been cleared
            this.state.currentParents.forEach((parentChoice) => {
                if (cleared.indexOf(parentChoice.type.label) < 0) {
                    queryGridInvalidate(SchemaQuery.create(this.props.parentDataType.instanceSchemaName, parentChoice.type.label), true);
                }
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

    someParentHasValue(parents: List<EntityChoice>) : boolean {
        return parents.find((parent) => parent.value && parent.value.length > 0) !== undefined
    }

    canSubmit() {
        // TODO this will change when we can actually delete parents entirely.
        return this.state.isDirty && this.someParentHasValue(this.state.currentParents);
    }

    renderProgress() {
        const { submitting } = this.state;
        const parentCount = this.state.currentParents
            .reduce((count, parent) => {
                    const values = parent.value ? parent.value.split(",") : [];
                    return count + values.length;
                },
                0);
        return (
            <Progress
                estimate={parentCount * 200}
                modal={true}
                title={"Updating " + this.props.parentDataType.nounPlural}
                toggle={parentCount > 2 && submitting}
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


    getParentTypeOptions(currentIndex: number) : List<IEntityTypeOption> {
        const { currentParents, parentTypeOptions } = this.state;
        // include the current parent type as a choice, but not the others already chosen
        let toRemove = List<string>();
        currentParents.forEach((parent, index) => {
            if (index !== currentIndex && parent.type) {
                toRemove = toRemove.push(parent.type.label);
            }
        });
        return parentTypeOptions.filter((option) => (!toRemove.contains(option.label))).toList();
    }

    onRemoveParentType = (index: number) => {
        this.setState((state) => {
            return {
                currentParents: state.currentParents.delete(index),
                isDirty: true
            }
        });
    };

    renderSingleParentPanels() {
        const { parentDataType } = this.props;

        return this.state.currentParents.map((choice, index) => {
            let key = choice.type ? choice.type.label + '-' + index : 'unknown-' + index;
            return (
                <div key={key}>
                    {this.state.editing && <hr/>}
                    <SingleParentEntityPanel
                        key={key}
                        parentDataType={parentDataType}
                        parentTypeOptions={this.getParentTypeOptions(index)}
                        parentTypeQueryName={choice.type ? choice.type.label : undefined}
                        parentLSIDs={choice.ids}
                        index={index}
                        editing={this.state.editing}
                        chosenValue={choice.value}
                        onChangeParentType={this.changeEntityType}
                        onChangeParentValue={this.onParentValueChange}
                        onInitialParentValue={this.onInitialParentValue}
                        onRemoveParentType={this.onRemoveParentType}
                    />
                </div>
            )

        }).toArray();
    }

    renderParentData() {
        const { parentDataType, childNounSingular } = this.props;
        if (this.hasParents()) {
            return this.renderSingleParentPanels();
        }
        else {
            return (
                <div key={1}>
                    <hr/>
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
                </div>
            )
        }
    }

    onAddParent = () => {
        this.setState((state) => ({
            currentParents: state.currentParents.push({type: undefined, value: undefined, ids: undefined})
        }));
    };

    renderAddParentButton() {
        const { parentTypeOptions } = this.state;
        if (!parentTypeOptions || parentTypeOptions.size === 0)
            return null;
        else {
            const { parentDataType } = this.props;
            const { currentParents } = this.state;

            const disabled = parentTypeOptions.size <= currentParents.size;
            const title = disabled ? 'Only ' + parentTypeOptions.size + ' ' + (parentTypeOptions.size === 1 ? parentDataType.descriptionSingular : parentDataType.descriptionPlural) + ' available.' : undefined;

            return (
                <AddEntityButton
                    containerClass={'top-spacing'}
                    onClick={this.onAddParent}
                    title={title}
                    disabled={disabled}
                    entity={this.props.parentDataType.nounSingular}
                />
            )
        }

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
                        {editing && this.renderAddParentButton()}
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
                {editing && this.renderProgress()}
            </>
        )
    }
}
