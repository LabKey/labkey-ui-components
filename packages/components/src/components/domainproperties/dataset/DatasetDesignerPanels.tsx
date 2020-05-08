/*
 * Copyright (c) 2020 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';

import { List } from 'immutable';

import { ActionURL, getServerContext } from '@labkey/api';

import produce, { Draft } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DomainDesign, DomainFieldIndexChange } from '../models';

import { getDomainPanelStatus, saveDomain } from '../actions';
import DomainForm from '../DomainForm';

import { importData, Progress, resolveErrorMessage } from '../../..';

import { DOMAIN_FIELD_FULLY_LOCKED, DOMAIN_FIELD_NOT_LOCKED } from '../constants';

import { DatasetColumnMappingPanel } from './DatasetColumnMappingPanel';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { DatasetModel } from './models';
import { getStudySubjectProp, getStudyTimepointLabel } from './actions';

interface Props {
    initModel?: DatasetModel;
    onChange?: (model: DatasetModel) => void;
    onCancel: () => void;
    onComplete: (model: DatasetModel, fileImportError?: string) => void;
    useTheme?: boolean;
    saveBtnText?: string;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    successBsStyle?: string;
}

interface State {
    model: DatasetModel;
    fileImportData: File;
    keyPropertyIndex?: number;
    visitDatePropertyIndex?: number;
}

export class DatasetDesignerPanelImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    private _participantId: string;
    private _sequenceNum: string;
    private _selectedKeyFieldName: string;
    private _selectedVisitDateName: string;

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || DatasetModel.create(null, {}),
            fileImportData: undefined,
        };
    }

    componentDidMount(): void {
        const { model } = this.state;

        // setting initial indexes if these properties are already present and there are changes to them in
        // the domain form
        let keyPropertyIndex;
        let visitDatePropertyIndex;
        model.domain.fields.map((field, index) => {
            if (model.keyPropertyName && field.name === model.keyPropertyName) {
                this._selectedKeyFieldName = model.keyPropertyName;
                keyPropertyIndex = index;
            }
            if (model.visitDatePropertyName && field.name === model.visitDatePropertyName) {
                this._selectedVisitDateName = model.visitDatePropertyName;
                visitDatePropertyIndex = index;
            }
        });

        // disabling the phi level for initially selected additional key field
        if (model.keyPropertyName) {
            const updatedDomain = model.domain.merge({
                fields: model.domain.fields
                    .map((field, index) => {
                        return field.set('disablePhiLevel', field.name === model.keyPropertyName);
                    })
                    .toList(),
            }) as DomainDesign;

            const updatedModel = produce(model, (draft: Draft<DatasetModel>) => {
                draft.domain = updatedDomain;
            });

            this.setState(() => ({
                keyPropertyIndex,
                visitDatePropertyIndex,
                model: updatedModel,
            }));
        } else {
            this.setState(() => ({
                keyPropertyIndex,
                visitDatePropertyIndex,
            }));
        }
    }

    onPropertiesChange = (model: DatasetModel) => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    onIndexChange = (keyPropertyIndex?: number, visitDatePropertyIndex?: number) => {
        this.setState(() => ({ keyPropertyIndex, visitDatePropertyIndex }));
    };

    onFinish = () => {
        const { model } = this.state;

        this.props.onFinish(model.isValid(), this.saveDomain);
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean, rowIndexChange: DomainFieldIndexChange) => {
        const { onChange } = this.props;
        const { keyPropertyIndex, visitDatePropertyIndex } = this.state;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.domain = domain;

                if (keyPropertyIndex !== undefined) {
                    // if the row was removed or reordered, update the keyPropertyIndex
                    if (rowIndexChange) {
                        if (rowIndexChange.newIndex === 0 || rowIndexChange.newIndex) {
                            domain.fields.map((field, index) => {
                                if (this._selectedKeyFieldName && field.name === this._selectedKeyFieldName) {
                                    draft.keyPropertyIndex = index;
                                }
                            });
                            draft.model.keyPropertyName = domain.fields.get(draft.keyPropertyIndex).name;
                        }
                        // if row was removed, reset key property name
                        else if (
                            rowIndexChange.newIndex === undefined &&
                            rowIndexChange.originalIndex === keyPropertyIndex
                        ) {
                            draft.model.keyPropertyName = '';
                            draft.keyPropertyIndex = undefined;
                        }
                    }
                    // pick up any name changes to the selected key field
                    if (draft.keyPropertyIndex !== undefined) {
                        this._selectedKeyFieldName = domain.fields.get(draft.keyPropertyIndex).name;
                    }
                }

                if (visitDatePropertyIndex !== undefined) {
                    // if the row was removed or reordered, update the visitDatePropertyIndex
                    if (rowIndexChange) {
                        if (rowIndexChange.newIndex === 0 || rowIndexChange.newIndex) {
                            domain.fields.map((field, index) => {
                                if (this._selectedVisitDateName && field.name === this._selectedVisitDateName) {
                                    draft.visitDatePropertyIndex = index;
                                }
                            });
                            draft.model.visitDatePropertyName = domain.fields.get(draft.visitDatePropertyIndex).name;
                        }
                        // if row was removed, reset visit date property name
                        else if (
                            rowIndexChange.newIndex === undefined &&
                            rowIndexChange.originalIndex === visitDatePropertyIndex
                        ) {
                            draft.model.visitDatePropertyName = '';
                            draft.visitDatePropertyIndex = undefined;
                        }
                    }
                    // pick up any name changes to the selected visit date field
                    if (draft.visitDatePropertyIndex !== undefined) {
                        this._selectedVisitDateName = domain.fields.get(draft.visitDatePropertyIndex).name;
                    }
                }
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(this.state.model);
                }
            }
        );
    };

    setFileImportData = fileImportData => {
        this.setState({ fileImportData });
    };

    onColumnMappingChange = (participantIdField?: string, timePointField?: string) => {
        const { model } = this.state;

        this._participantId = participantIdField;
        this._sequenceNum = timePointField;

        // lock down these fields from domain
        const updatedDomain = model.domain.merge({
            fields: model.domain.fields
                .map((field, index) => {
                    if (field.name === participantIdField || field.name === timePointField) {
                        return field.set('lockType', DOMAIN_FIELD_FULLY_LOCKED);
                    } else {
                        return field.set('lockType', DOMAIN_FIELD_NOT_LOCKED);
                    }
                })
                .toList(),
        }) as DomainDesign;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.domain = updatedDomain;
                draft.model.exception = undefined;
            })
        );
    };

    datasetColumnMapping = () => {
        const { model } = this.state;

        return (
            <>
                {model && model.domain.fields && model.domain.fields.size > 0 && (
                    <DatasetColumnMappingPanel
                        model={model}
                        onColumnMappingChange={this.onColumnMappingChange}
                        subjectColumnName={getStudySubjectProp('columnName')}
                        timepointType={getServerContext().moduleContext.study.timepointType}
                    />
                )}
            </>
        );
    };

    handleFileImport() {
        const { setSubmitting } = this.props;
        const { fileImportData, model } = this.state;
        const parameters = {
            name: model.name,
            participantId: this._participantId,
            sequenceNum: this._sequenceNum,
        };

        importData({
            schemaName: 'study',
            queryName: model.name,
            file: fileImportData,
            importUrl: ActionURL.buildURL('study', 'import', getServerContext().container.path, parameters),
        })
            .then(response => {
                setSubmitting(false, () => {
                    this.props.onComplete(model);
                });
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false, () => {
                    this.props.onComplete(model, resolveErrorMessage(error));
                });
            });
    }

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model, fileImportData } = this.state;

        let keyPropIndex;
        let visitPropIndex;

        if (this._participantId && this._sequenceNum) {
            // filter out these fields
            const updatedDomain = model.domain.merge({
                fields: model.domain.fields
                    .filter(field => field.name != this._participantId)
                    .filter(field => field.name != this._sequenceNum)
                    .toList(),
            }) as DomainDesign;

            updatedDomain.fields.map((field, index) => {
                if (model.keyPropertyName && field.name === model.keyPropertyName) {
                    keyPropIndex = index;
                }
                if (model.visitDatePropertyName && field.name === model.visitDatePropertyName) {
                    visitPropIndex = index;
                }
            });

            const updatedModel = produce(model, (draft: Draft<DatasetModel>) => {
                draft.domain = updatedDomain;
            });

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.keyPropertyIndex = keyPropIndex;
                    draft.visitDatePropertyIndex = visitPropIndex;
                }),
                () =>
                    saveDomain(
                        updatedModel.domain,
                        updatedModel.getDomainKind(),
                        updatedModel.getOptions(),
                        updatedModel.name
                    )
                        .then(response => {
                            this.setState(
                                produce((draft: Draft<State>) => {
                                    const updatedModel = draft.model;
                                    updatedModel.exception = undefined;
                                    updatedModel.domain = response;
                                }),
                                () => {
                                    // If we're importing Dataset file data, import file contents
                                    if (fileImportData) {
                                        this.handleFileImport();
                                    } else {
                                        const { model } = this.state;
                                        setSubmitting(false, () => {
                                            this.props.onComplete(model);
                                        });
                                    }
                                }
                            );
                        })
                        .catch(response => {
                            const exception = resolveErrorMessage(response);

                            setSubmitting(false, () => {
                                this.setState(
                                    produce((draft: Draft<State>) => {
                                        const updatedModel = draft.model;
                                        if (exception) {
                                            updatedModel.exception = exception;
                                        } else {
                                            updatedModel.exception = undefined;
                                            updatedModel.domain = response;
                                        }
                                    })
                                );
                            });
                        })
            );
        } else {
            this.setState(
                produce((draft: Draft<State>) => {
                    draft.model.exception =
                        'Must select ' +
                        getStudySubjectProp('nounPlural') +
                        ' and ' +
                        getStudyTimepointLabel() +
                        ' fields in column mapping';
                }),
                () => setSubmitting(false, () => {})
            );
        }
    };

    render() {
        const {
            useTheme,
            onTogglePanel,
            visitedPanels,
            submitting,
            onCancel,
            currentPanelIndex,
            firstState,
            validatePanel,
            containerTop,
            successBsStyle,
            saveBtnText,
        } = this.props;

        const { model, fileImportData, keyPropertyIndex, visitDatePropertyIndex } = this.state;

        return (
            <BaseDomainDesigner
                name={model.name}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
                successBsStyle={successBsStyle}
            >
                <DatasetPropertiesPanel
                    initCollapsed={currentPanelIndex !== 0}
                    model={model}
                    keyPropertyIndex={keyPropertyIndex}
                    visitDatePropertyIndex={visitDatePropertyIndex}
                    onIndexChange={this.onIndexChange}
                    controlledCollapse={true}
                    useTheme={useTheme}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    onChange={this.onPropertiesChange}
                    successBsStyle={successBsStyle}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpNoun="dataset"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    importDataChildRenderer={this.datasetColumnMapping}
                    successBsStyle={successBsStyle}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.isFromAssay(),
                        showAddFieldsButton: !model.isFromAssay(),
                        hideImportData: model.definitionIsShared, // Shared (Dataspace) study does not have permission to import data. See study-importAction.validatePermission
                    }}
                />
                <Progress
                    modal={true}
                    delay={1000}
                    estimate={fileImportData ? fileImportData.size * 0.005 : undefined}
                    title="Importing data from selected file..."
                    toggle={submitting && fileImportData !== undefined}
                />
            </BaseDomainDesigner>
        );
    }
}

export const DatasetDesignerPanels = withBaseDomainDesigner<Props>(DatasetDesignerPanelImpl);
