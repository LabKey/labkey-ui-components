import React, { ReactNode } from 'react';
import ReactN from 'reactn';
import { Button, Panel } from 'react-bootstrap';

import { List } from 'immutable';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    AddEntityButton,
    Alert,
    capitalizeFirstChar,
    EntityDataType,
    getActionErrorMessage,
    getQueryGridModel,
    gridIdInvalidate,
    LoadingSpinner,
    Progress,
    QueryGridModel,
    resolveErrorMessage,
    updateRows,
} from '../../../index';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';

import { DELIMITER } from '../forms/input/SelectInput';

import { getEntityTypeOptions } from './actions';
import { EntityChoice, IEntityTypeOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';

import {
    getInitialParentChoices,
    getParentGridPrefix,
    getUpdatedRowForParentChanges,
    parentValuesDiffer,
} from './utils';

interface Props {
    canUpdate: boolean;
    childName: string;
    childNounSingular: string;
    childModel: QueryGridModel;
    onUpdate?: () => void;
    onEditToggle?: (editing: boolean) => any;
    parentDataType: EntityDataType;
    title: string;
    cancelText?: string;
    submitText?: string;
    auditBehavior?: AuditBehaviorTypes;
}

interface State {
    editing: boolean;
    error: ReactNode;
    loading: boolean;
    parentTypeOptions: List<IEntityTypeOption>;
    submitting: boolean;
    originalParents: List<EntityChoice>;
    currentParents: List<EntityChoice>;
    originalValueLoaded: List<boolean>;
}

export class ParentEntityEditPanel extends ReactN.Component<Props, State> {
    static defaultProps = {
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    constructor() {
        super();

        this.state = {
            editing: false,
            error: undefined,
            loading: true,
            parentTypeOptions: undefined,
            submitting: false,
            originalParents: undefined,
            currentParents: undefined,
            originalValueLoaded: List<boolean>(),
        };
    }

    UNSAFE_componentWillMount(): void {
        this.init();
    }

    componentWillUnmount() {
        gridIdInvalidate(getParentGridPrefix(this.props.parentDataType), true);
    }

    init = (): void => {
        const { parentDataType } = this.props;
        const { typeListingSchemaQuery } = parentDataType;

        getEntityTypeOptions(parentDataType)
            .then(optionsMap => {
                const parentTypeOptions = optionsMap.get(typeListingSchemaQuery.queryName);
                const originalParents = getInitialParentChoices(
                    parentTypeOptions,
                    parentDataType,
                    this.getChildModel()
                );
                const currentParents = originalParents.reduce((list, parent) => {
                    return list.push({ ...parent });
                }, List<EntityChoice>());

                this.setState(() => ({
                    loading: false,
                    parentTypeOptions,
                    originalParents,
                    currentParents,
                }));
            })
            .catch(reason => {
                this.setState(() => ({
                    error: getActionErrorMessage(
                        'Unable to load ' + parentDataType.descriptionSingular + ' data.',
                        parentDataType.descriptionPlural,
                        true
                    ),
                }));
            });
    };

    getChildModel = (): QueryGridModel => {
        return getQueryGridModel(this.props.childModel.getId());
    };

    hasParents = (): boolean => {
        return this.state.currentParents && !this.state.currentParents.isEmpty();
    };

    toggleEdit = (): void => {
        if (this.props.onEditToggle) {
            this.props.onEditToggle(!this.state.editing);
        }
        this.setState(state => ({ editing: !state.editing }));
    };

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void => {
        this.setState(state => {
            const updatedParents = state.currentParents.set(index, {
                type: selectedOption,
                value: undefined,
                ids: undefined,
            });
            return {
                currentParents: updatedParents,
            };
        });
    };

    onParentValueChange = (name: string, value: string | any[], index: number): void => {
        this.updateParentValue(value, index, false);
    };

    onInitialParentValue = (value: string, selectedValues: List<any>, index: number): void => {
        this.updateParentValue(value, index, true);
    };

    updateParentValue = (value: string | any[], index: number, updateOriginal: boolean): void => {
        this.setState(state => {
            const newChoice = state.currentParents.get(index);
            newChoice.value = Array.isArray(value) ? value.join(DELIMITER) : value;
            return {
                currentParents: state.currentParents.set(index, newChoice),
                originalParents:
                    updateOriginal && state.originalParents.has(index) && !state.originalValueLoaded.get(index)
                        ? state.originalParents.set(index, { ...newChoice })
                        : state.originalParents,
                originalValueLoaded: state.originalParents.has(index)
                    ? state.originalValueLoaded.set(index, true)
                    : state.originalValueLoaded,
            };
        });
    };

    onCancel = (): void => {
        this.setState(
            state => ({
                currentParents: state.originalParents,
                originalValueLoaded: List<boolean>(),
                editing: false,
            }),
            () => {
                if (this.props.onEditToggle) {
                    this.props.onEditToggle(false);
                }
            }
        );
    };

    onSubmit = (): Promise<any> => {
        if (!this.canSubmit()) return;

        this.setState(() => ({ submitting: true }));

        const { auditBehavior, parentDataType, onUpdate } = this.props;
        const { currentParents, originalParents } = this.state;
        const childModel = this.getChildModel();

        const queryInfo = childModel.queryInfo;
        const schemaQuery = queryInfo.schemaQuery;

        return updateRows({
            schemaQuery,
            rows: [getUpdatedRowForParentChanges(parentDataType, originalParents, currentParents, childModel)],
            auditBehavior,
        })
            .then(() => {
                this.setState(
                    () => ({
                        submitting: false,
                        editing: false,
                    }),
                    () => {
                        gridIdInvalidate(getParentGridPrefix(this.props.parentDataType), true);

                        if (onUpdate) {
                            onUpdate();
                        }
                        if (this.props.onEditToggle) {
                            this.props.onEditToggle(false);
                        }
                    }
                );
            })
            .catch(error => {
                console.error(error);
                this.setState(() => ({
                    submitting: false,
                    error: resolveErrorMessage(error, 'data', undefined, 'update'),
                }));
            });
    };

    canSubmit = (): boolean => {
        return parentValuesDiffer(this.state.originalParents, this.state.currentParents);
    };

    renderProgress = (): ReactNode => {
        const { submitting } = this.state;
        const parentCount = this.state.currentParents.reduce((count, parent) => {
            const values = parent.value ? parent.value.split(',') : [];
            return count + values.length;
        }, 0);
        return (
            <Progress
                estimate={parentCount * 200}
                modal={true}
                title={'Updating ' + this.props.parentDataType.nounPlural}
                toggle={parentCount > 2 && submitting}
            />
        );
    };

    renderEditControls = (): ReactNode => {
        const { cancelText, submitText } = this.props;
        const { submitting } = this.state;

        return (
            <div className="full-width bottom-spacing">
                <Button className="pull-left" onClick={this.onCancel}>
                    {cancelText}
                </Button>
                <Button
                    className="pull-right"
                    bsStyle="success"
                    type="submit"
                    disabled={submitting || !this.canSubmit()}
                    onClick={this.onSubmit}
                >
                    {submitText}
                </Button>
            </div>
        );
    };

    getParentTypeOptions = (currentIndex: number): List<IEntityTypeOption> => {
        const { currentParents, parentTypeOptions } = this.state;
        // include the current parent type as a choice, but not the others already chosen
        let toRemove = List<string>();
        currentParents.forEach((parent, index) => {
            if (index !== currentIndex && parent.type) {
                toRemove = toRemove.push(parent.type.label);
            }
        });
        return parentTypeOptions.filter(option => !toRemove.contains(option.label)).toList();
    };

    onRemoveParentType = (index: number): void => {
        this.setState(state => {
            return {
                currentParents: state.currentParents.delete(index),
            };
        });
    };

    renderSingleParentPanels = (): ReactNode => {
        const { parentDataType } = this.props;

        return this.state.currentParents
            .map((choice, index) => {
                const key = choice.type ? choice.type.label + '-' + index : 'unknown-' + index;
                return (
                    <div key={key}>
                        {this.state.editing && <hr />}
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
                );
            })
            .toArray();
    };

    renderParentData = (): ReactNode => {
        const { parentDataType, childNounSingular } = this.props;
        if (this.hasParents()) {
            return this.renderSingleParentPanels();
        } else {
            return (
                <div key={1}>
                    <hr />
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
            );
        }
    };

    onAddParent = (): void => {
        this.setState(state => ({
            currentParents: state.currentParents.push({ type: undefined, value: undefined, ids: undefined }),
        }));
    };

    renderAddParentButton = (): ReactNode => {
        const { parentTypeOptions } = this.state;
        if (!parentTypeOptions || parentTypeOptions.size === 0) return null;
        else {
            const { parentDataType } = this.props;
            const { currentParents } = this.state;

            const disabled = parentTypeOptions.size <= currentParents.size;
            const title = disabled
                ? 'Only ' +
                  parentTypeOptions.size +
                  ' ' +
                  (parentTypeOptions.size === 1
                      ? parentDataType.descriptionSingular
                      : parentDataType.descriptionPlural) +
                  ' available.'
                : undefined;

            return (
                <AddEntityButton
                    containerClass="top-spacing"
                    onClick={this.onAddParent}
                    title={title}
                    disabled={disabled}
                    entity={this.props.parentDataType.nounSingular}
                />
            );
        }
    };

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
                <Panel bsStyle={editing ? 'info' : 'default'}>
                    <Panel.Heading>{heading}</Panel.Heading>
                    <Panel.Body>
                        {error && <Alert>{error}</Alert>}
                        <div className="bottom-spacing">
                            <b>
                                {capitalizeFirstChar(parentDataType.nounPlural)} for {childName}
                            </b>
                        </div>
                        {loading ? <LoadingSpinner /> : this.renderParentData()}
                        {editing && this.renderAddParentButton()}
                    </Panel.Body>
                </Panel>
                {editing && this.renderEditControls()}
                {editing && this.renderProgress()}
            </>
        );
    }
}
