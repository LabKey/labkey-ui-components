import React, { Component, ReactNode } from 'react';
import { Button, Panel } from 'react-bootstrap';

import { List } from 'immutable';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    AddEntityButton,
    Alert,
    capitalizeFirstChar,
    EntityDataType,
    getActionErrorMessage,
    LoadingSpinner,
    Progress,
    QueryInfo,
    resolveErrorMessage,
    updateRows,
} from '../../..';
import { DetailPanelHeader } from '../forms/detail/DetailPanelHeader';

import { DELIMITER } from '../forms/input/SelectInput';

import { getEntityTypeOptions } from './actions';
import { EntityChoice, IEntityTypeOption } from './models';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';
import { getInitialParentChoices, getUpdatedRowForParentChanges, parentValuesDiffer } from './utils';

interface Props {
    auditBehavior?: AuditBehaviorTypes;
    cancelText?: string;
    canUpdate: boolean;
    childName: string;
    childNounSingular: string;
    childQueryInfo: QueryInfo;
    childData: Record<string, any>;
    onUpdate?: () => void;
    onEditToggle?: (editing: boolean) => void;
    parentDataTypes: EntityDataType[]; // Note: the first data type in the array will be used for labels, nouns, etc...
    submitText?: string;
    title: string;
}

interface State {
    currentParents: List<EntityChoice>;
    editing: boolean;
    error: ReactNode;
    loading: boolean;
    originalParents: List<EntityChoice>;
    originalValueLoaded: List<boolean>;
    parentTypeOptions: List<IEntityTypeOption>;
    submitting: boolean;
}

export class ParentEntityEditPanel extends Component<Props, State> {
    static defaultProps = {
        cancelText: 'Cancel',
        submitText: 'Save',
    };

    state: Readonly<State> = {
        currentParents: undefined,
        editing: false,
        error: undefined,
        loading: true,
        originalParents: undefined,
        originalValueLoaded: List<boolean>(),
        parentTypeOptions: undefined,
        submitting: false,
    };

    componentDidMount(): void {
        this.init();
    }

    init = async (): Promise<void> => {
        const { parentDataTypes, childData } = this.props;

        let parentTypeOptions = List<IEntityTypeOption>();
        let originalParents = List<EntityChoice>();

        await Promise.all(parentDataTypes.map(async (parentDataType) => {
            const {typeListingSchemaQuery} = parentDataType;
            try {
                const options = await getEntityTypeOptions(parentDataType);
                parentTypeOptions = parentTypeOptions.concat(options.get(typeListingSchemaQuery.queryName)) as List<
                    IEntityTypeOption
                    >;
                originalParents = originalParents.concat(
                    getInitialParentChoices(parentTypeOptions, parentDataType, childData)
                ) as List<EntityChoice>;
            } catch (reason) {
                this.setState({
                    error: getActionErrorMessage(
                        'Unable to load ' + parentDataType.descriptionSingular + ' data.',
                        parentDataType.descriptionPlural,
                        true
                    ),
                });
            }
        }));

        this.setState({
            currentParents: originalParents,
            loading: false,
            originalParents,
            parentTypeOptions,
        });
    };

    hasParents = (): boolean => {
        return this.state.currentParents && !this.state.currentParents.isEmpty();
    };

    toggleEdit = (): void => {
        this.props.onEditToggle?.(!this.state.editing);
        this.setState(state => ({ editing: !state.editing }));
    };

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void => {
        this.setState(state => ({
            currentParents: state.currentParents.set(index, {
                type: selectedOption,
                value: undefined,
                ids: undefined,
            }),
        }));
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
                editing: false,
                originalValueLoaded: List<boolean>(),
            }),
            () => {
                this.props.onEditToggle?.(false);
            }
        );
    };

    onSubmit = (): Promise<any> => {
        if (!this.canSubmit()) return;

        this.setState({ submitting: true });

        const { auditBehavior, onUpdate, childQueryInfo, childData } = this.props;
        const { currentParents, originalParents } = this.state;

        const schemaQuery = childQueryInfo.schemaQuery;

        return updateRows({
            schemaQuery,
            rows: [getUpdatedRowForParentChanges(originalParents, currentParents, childData, childQueryInfo)],
            auditBehavior,
        })
            .then(() => {
                this.setState(
                    () => ({
                        submitting: false,
                        editing: false,
                    }),
                    () => {
                        onUpdate?.();
                        this.props.onEditToggle?.(false);
                    }
                );
            })
            .catch(error => {
                this.setState({
                    error: resolveErrorMessage(error, 'data', undefined, 'update'),
                    submitting: false,
                });
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
                title={'Updating ' + this.props.parentDataTypes[0]?.nounPlural}
                toggle={parentCount > 2 && submitting}
            />
        );
    };

    getParentTypeOptions = (currentIndex: number): List<IEntityTypeOption> => {
        const { currentParents, parentTypeOptions } = this.state;
        // include the current parent type as a choice, but not the others already chosen
        const toRemove = currentParents
            .filter((parent, idx) => idx !== currentIndex && !!parent.type)
            .map(parent => parent.type.label)
            .toList();

        return parentTypeOptions.filter(option => !toRemove.contains(option.label)).toList();
    };

    onRemoveParentType = (index: number): void => {
        this.setState(state => ({ currentParents: state.currentParents.delete(index) }));
    };

    renderParentData = (): ReactNode => {
        const { parentDataTypes, childNounSingular } = this.props;
        const { editing } = this.state;

        if (this.hasParents()) {
            return this.state.currentParents
                .map((choice, index) => (
                    <div key={choice.type ? choice.type.label + '-' + index : 'unknown-' + index}>
                        {editing && <hr />}
                        <SingleParentEntityPanel
                            parentDataType={parentDataTypes[0]}
                            parentTypeOptions={this.getParentTypeOptions(index)}
                            parentEntityType={choice.type}
                            parentLSIDs={choice.ids}
                            index={index}
                            editing={editing}
                            chosenValue={choice.value}
                            onChangeParentType={this.changeEntityType}
                            onChangeParentValue={this.onParentValueChange}
                            onInitialParentValue={this.onInitialParentValue}
                            onRemoveParentType={this.onRemoveParentType}
                        />
                    </div>
                ))
                .toArray();
        }

        return (
            <div>
                <hr />
                <SingleParentEntityPanel
                    editing={editing}
                    parentTypeOptions={this.state.parentTypeOptions}
                    parentDataType={parentDataTypes[0]}
                    childNounSingular={childNounSingular}
                    index={0}
                    onChangeParentType={this.changeEntityType}
                    onChangeParentValue={this.onParentValueChange}
                    onInitialParentValue={this.onInitialParentValue}
                />
            </div>
        );
    };

    onAddParent = (): void => {
        this.setState(state => ({
            currentParents: state.currentParents.push({ type: undefined, value: undefined, ids: undefined }),
        }));
    };

    renderAddParentButton = (): ReactNode => {
        const { parentDataTypes } = this.props;
        const { currentParents, parentTypeOptions } = this.state;

        const parentDataType = parentDataTypes[0];

        if (!parentTypeOptions || parentTypeOptions.size === 0) {
            return null;
        }

        const disabled = parentTypeOptions.size <= currentParents.size;
        const title = disabled
            ? 'Only ' +
              parentTypeOptions.size +
              ' ' +
              (parentTypeOptions.size === 1 ? parentDataType.descriptionSingular : parentDataType.descriptionPlural) +
              ' available.'
            : undefined;

        return (
            <AddEntityButton
                containerClass="top-spacing"
                onClick={this.onAddParent}
                title={title}
                disabled={disabled}
                entity={parentDataType.nounSingular}
            />
        );
    };

    render() {
        const { cancelText, parentDataTypes, title, canUpdate, childName, submitText } = this.props;
        const { editing, error, loading, submitting } = this.state;

        const parentDataType = parentDataTypes[0];

        return (
            <>
                <Panel bsStyle={editing ? 'info' : 'default'}>
                    <Panel.Heading>
                        <DetailPanelHeader
                            canUpdate={canUpdate}
                            editing={editing}
                            isEditable={!loading && canUpdate}
                            onClickFn={this.toggleEdit}
                            title={title}
                            useEditIcon
                        />
                    </Panel.Heading>
                    <Panel.Body>
                        <Alert>{error}</Alert>
                        <div className="bottom-spacing">
                            <b>
                                {capitalizeFirstChar(parentDataType.nounPlural)} for {childName}
                            </b>
                        </div>
                        {loading ? <LoadingSpinner /> : this.renderParentData()}
                        {editing && this.renderAddParentButton()}
                    </Panel.Body>
                </Panel>
                {editing && (
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
                )}
                {editing && this.renderProgress()}
            </>
        );
    }
}
