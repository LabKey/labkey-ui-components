import React, { Component, ReactNode } from 'react';
import { Button, Panel } from 'react-bootstrap';

import { List } from 'immutable';

import { AuditBehaviorTypes, Filter, Query } from '@labkey/api';

import { DetailPanelHeader } from '../internal/components/forms/detail/DetailPanelHeader';

import { getParentTypeDataForLineage } from '../internal/components/samples/actions';

import { DELIMITER } from '../internal/components/forms/constants';

import { SchemaQuery } from '../public/SchemaQuery';
import { QueryInfo } from '../public/QueryInfo';

import { selectRowsDeprecated, updateRows } from '../internal/query/api';
import { getActionErrorMessage, resolveErrorMessage } from '../internal/util/messaging';
import { capitalizeFirstChar, caseInsensitive } from '../internal/util/utils';
import { naturalSortByProperty } from '../public/sort';
import { Progress } from '../internal/components/base/Progress';
import { AddEntityButton } from '../internal/components/buttons/AddEntityButton';
import { Alert } from '../internal/components/base/Alert';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { ViewInfo } from '../internal/ViewInfo';

import { ParentEntityRequiredColumns } from '../internal/components/entities/constants';
import { getInitialParentChoices } from '../internal/components/entities/utils';
import { SingleParentEntityPanel } from './SingleParentEntityPanel';
import { EntityChoice, EntityDataType, IEntityTypeOption } from '../internal/components/entities/models';
import { parentValuesDiffer, getUpdatedRowForParentChanges } from './utils';

interface Props {
    auditBehavior?: AuditBehaviorTypes;
    canUpdate: boolean;
    cancelText?: string;
    childContainerPath?: string;
    childLSID?: string;
    childNounSingular: string;
    childSchemaQuery: SchemaQuery;
    containerFilter?: Query.ContainerFilter;
    editOnly?: boolean;
    hideButtons?: boolean;
    includePanelHeader?: boolean;
    onChangeParent?: (currentParents: List<EntityChoice>) => void;
    onEditToggle?: (editing: boolean) => void;
    onUpdate?: () => void;
    // Note: the first data type in the array will be used for labels, nouns, etc...
    parentDataTypes: EntityDataType[];
    submitText?: string;
    title?: string;
}

interface State {
    childData: Record<string, any>;
    childName: string;
    childQueryInfo: QueryInfo;
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
        includePanelHeader: true,
        title: 'Details',
        containerFilter: Query.containerFilter.currentPlusProjectAndShared,
    };

    state: Readonly<State> = {
        childData: undefined,
        childName: undefined,
        childQueryInfo: undefined,
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
        const { parentDataTypes, childContainerPath, childLSID, childSchemaQuery, containerFilter } = this.props;

        let childData: any;
        let childQueryInfo: QueryInfo;

        if (childLSID) {
            try {
                const { key, models, queries } = await selectRowsDeprecated({
                    columns: ParentEntityRequiredColumns.toArray(),
                    containerPath: childContainerPath,
                    filterArray: [Filter.create('LSID', childLSID)],
                    queryName: childSchemaQuery.queryName,
                    schemaName: childSchemaQuery.schemaName,
                    viewName: ViewInfo.DETAIL_NAME, // use the detail view because it won't be a filtered view that might exclude this entity.
                });

                const rows = models[key];
                childQueryInfo = queries[key];
                childData = rows[Object.keys(rows)[0]];
            } catch (e) {
                console.error(e);
                this.setState({
                    error: getActionErrorMessage('Unable to load parent data.', undefined, true),
                });
                return;
            }
        }

        let parentTypeOptions = List<IEntityTypeOption>();
        let originalParents = List<EntityChoice>();

        await Promise.all(
            parentDataTypes.map(async parentDataType => {
                try {
                    const typeData = await getParentTypeDataForLineage(
                        parentDataType,
                        childData ? [childData] : [],
                        childContainerPath,
                        containerFilter
                    );
                    parentTypeOptions = parentTypeOptions.concat(typeData.parentTypeOptions) as List<IEntityTypeOption>;
                    originalParents = originalParents.concat(
                        getInitialParentChoices(
                            typeData.parentTypeOptions,
                            parentDataType,
                            childData ?? [],
                            typeData.parentIdData
                        )
                    ) as List<EntityChoice>;
                } catch (reason) {
                    console.error(reason);
                    this.setState({
                        error: getActionErrorMessage(
                            'Unable to load ' + parentDataType.descriptionSingular + ' data.',
                            parentDataType.descriptionPlural,
                            true
                        ),
                    });
                }
            })
        );

        this.setState({
            childData,
            childName: caseInsensitive(childData, 'Name')?.value,
            childQueryInfo,
            currentParents: originalParents,
            loading: false,
            editing: this.props.editOnly,
            originalParents,
            parentTypeOptions: List<IEntityTypeOption>(
                parentTypeOptions.sort(naturalSortByProperty('label')).toArray()
            ),
        });
    };

    compactEditDisplay(): boolean {
        return !this.state.childName;
    }

    hasParents = (): boolean => {
        return this.state.currentParents && !this.state.currentParents.isEmpty();
    };

    toggleEdit = (): void => {
        this.props.onEditToggle?.(!this.state.editing);
        this.setState(state => ({ editing: !state.editing }));
    };

    changeEntityType = (fieldName: string, formValue: any, selectedOption: IEntityTypeOption, index): void => {
        const { onChangeParent } = this.props;
        this.setState(
            state => ({
                currentParents: state.currentParents.set(index, {
                    type: selectedOption,
                    value: undefined,
                    ids: undefined,
                }),
            }),
            () => {
                onChangeParent?.(this.state.currentParents);
            }
        );
    };

    onParentValueChange = (name: string, value: string | any[], index: number): void => {
        this.updateParentValue(value, index, false);
    };

    onInitialParentValue = (value: string, selectedValues: List<any>, index: number): void => {
        this.updateParentValue(value, index, true);
    };

    updateParentValue = (value: string | any[], index: number, updateOriginal: boolean): void => {
        const { onChangeParent } = this.props;
        this.setState(
            state => {
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
            },
            () => {
                onChangeParent?.(this.state.currentParents);
            }
        );
    };

    onCancel = (): void => {
        this.setState(
            state => ({
                currentParents: state.originalParents,
                editing: false,
                error: undefined,
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

        const { auditBehavior, childContainerPath, onUpdate } = this.props;
        const { childData, childQueryInfo, currentParents, originalParents } = this.state;

        const schemaQuery = childQueryInfo.schemaQuery;

        return updateRows({
            containerPath: childContainerPath,
            schemaQuery,
            rows: [getUpdatedRowForParentChanges(originalParents, currentParents, childData, childQueryInfo)],
            auditBehavior,
        })
            .then(() => {
                this.setState(
                    () => ({
                        submitting: false,
                        editing: false,
                        error: undefined,
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
        const { onChangeParent } = this.props;
        this.setState(
            state => ({ currentParents: state.currentParents.delete(index) }),
            () => {
                onChangeParent?.(this.state.currentParents);
            }
        );
    };

    renderParentData = (): ReactNode => {
        const { childContainerPath, parentDataTypes, childNounSingular, containerFilter } = this.props;
        const { editing } = this.state;

        if (this.hasParents()) {
            return this.state.currentParents
                .map((choice, index) => (
                    <div key={choice.type ? choice.type.label + '-' + index : 'unknown-' + index}>
                        {editing && (!this.compactEditDisplay() || index > 0) && <hr />}
                        <SingleParentEntityPanel
                            containerPath={childContainerPath}
                            parentDataType={choice.type?.entityDataType ?? parentDataTypes[0]}
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
                            containerFilter={containerFilter}
                        />
                    </div>
                ))
                .toArray();
        }

        return (
            <div>
                {editing && !this.compactEditDisplay() && <hr />}
                <SingleParentEntityPanel
                    editing={editing}
                    containerPath={childContainerPath}
                    parentTypeOptions={this.state.parentTypeOptions}
                    parentDataType={parentDataTypes[0]}
                    childNounSingular={childNounSingular}
                    index={0}
                    onChangeParentType={this.changeEntityType}
                    onChangeParentValue={this.onParentValueChange}
                    onInitialParentValue={this.onInitialParentValue}
                    containerFilter={containerFilter}
                />
            </div>
        );
    };

    onAddParent = (): void => {
        this.setState(state => {
            const toAdd = [{ type: undefined, value: undefined, ids: undefined }];
            // when there are no existing parents, the UI makes it look like there is one.
            // If you Add a parent from that empty state, the only thing that happens from the user's
            // perspective is you get an option to remove the type.  So, we add a second item here
            // and the UI will actually look like what a user might expect (two types dropdowns, both of which can be removed.)
            if (state.currentParents.size == 0) toAdd.push({ type: undefined, value: undefined, ids: undefined });
            return {
                currentParents: state.currentParents.push(...toAdd),
            };
        });
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
        const { cancelText, parentDataTypes, title, canUpdate, hideButtons, submitText, editOnly, includePanelHeader } =
            this.props;
        const { childName, editing, error, loading, submitting } = this.state;

        const parentDataType = parentDataTypes[0];

        return (
            <>
                <Panel bsStyle={editing && !editOnly ? 'info' : 'default'}>
                    {includePanelHeader && (
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
                    )}
                    <Panel.Body>
                        <Alert>{error}</Alert>
                        {childName && (
                            <div className="bottom-spacing">
                                <b>
                                    {capitalizeFirstChar(parentDataType.nounPlural)} for {childName}
                                </b>
                            </div>
                        )}
                        {loading ? <LoadingSpinner /> : this.renderParentData()}
                        {editing && this.renderAddParentButton()}
                    </Panel.Body>
                </Panel>
                {editing && !hideButtons && (
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
