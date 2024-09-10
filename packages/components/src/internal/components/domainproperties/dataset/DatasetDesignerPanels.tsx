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
import React, { FC, ReactNode } from 'react';

import { List } from 'immutable';

import { Domain } from '@labkey/api';

import { produce } from 'immer';

import { getDefaultAPIWrapper } from '../../../APIWrapper';
import { DomainPropertiesAPIWrapper } from '../APIWrapper';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DomainDesign, DomainField, DomainFieldIndexChange, IFieldChange } from '../models';

import { getDomainPanelStatus, handleDomainUpdates, saveDomain } from '../actions';
import DomainForm from '../DomainForm';

import { DOMAIN_FIELD_FULLY_LOCKED, DOMAIN_FIELD_NOT_LOCKED } from '../constants';

import ConfirmImportTypes from '../ConfirmImportTypes';

import { importData } from '../../../query/api';

import { buildURL } from '../../../url/AppURL';

import { resolveErrorMessage } from '../../../util/messaging';

import { Progress } from '../../base/Progress';

import { LoadingSpinner } from '../../base/LoadingSpinner';

import { DatasetColumnMappingPanel } from './DatasetColumnMappingPanel';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { DatasetModel } from './models';
import { getStudyTimepointLabel, StudyProperties, useStudyPropertiesContext } from './utils';

const KEY_FIELD_MAPPING_ERROR = 'Your Additional Key Field must not be one of the Column Mapping fields.';
const VISIT_DATE_MAPPING_ERROR = 'Your Visit Date Column must not be one of the Column Mapping fields.';
const ADDITIONAL_KEY_ERROR = 'You must select an Additional Key Field in the dataset properties panel.';

interface Props {
    api?: DomainPropertiesAPIWrapper;
    initModel?: DatasetModel;
    onCancel: () => void;
    onChange?: (model: DatasetModel) => void;
    onComplete: (model: DatasetModel) => void;
    saveBtnText?: string;
}

interface StudyPropertiesProp {
    studyProperties: StudyProperties;
}

interface State {
    file: File;
    importError: any;
    keyPropertyIndex?: number;
    model: DatasetModel;
    savedModel: DatasetModel;
    shouldImportData: boolean;
    visitDatePropertyIndex?: number;
}

// Exported for testing
export class DatasetDesignerPanelImpl extends React.PureComponent<
    Props & InjectedBaseDomainDesignerProps & StudyPropertiesProp,
    State
> {
    private _participantId: string;
    private _sequenceNum: string;

    static defaultProps = {
        api: getDefaultAPIWrapper().domain,
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps & StudyPropertiesProp) {
        super(props);

        this.state = {
            model: props.initModel || DatasetModel.create(null, {}),
            file: undefined,
            shouldImportData: false,
            savedModel: undefined,
            importError: undefined,
        };
    }

    componentDidMount(): void {
        const { model } = this.state;

        // setting initial indexes if these properties are already present and there are changes to them in
        // the domain form
        const keyPropertyIndex = this.findFieldIndexByName(model.domain, model.keyPropertyName);
        const visitDatePropertyIndex = this.findFieldIndexByName(model.domain, model.visitDatePropertyName);

        // disabling the phi level for initially selected additional key field
        if (model.keyPropertyName) {
            const updatedDomain = model.domain.merge({
                fields: model.domain.fields
                    .map((field, index) => {
                        return field.set('disablePhiLevel', field.name === model.keyPropertyName);
                    })
                    .toList(),
            }) as DomainDesign;

            const updatedModel = produce<DatasetModel>(model, draft => {
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

    findFieldIndexByName(domain: DomainDesign, fieldName: string): number {
        const index = domain.findFieldIndexByName(fieldName);
        return index > -1 ? index : undefined;
    }

    checkFieldsInColumnMapping(model: DatasetModel): string {
        let error: string;
        if (
            model.keyPropertyName &&
            (model.keyPropertyName === this._participantId || model.keyPropertyName === this._sequenceNum)
        ) {
            error = KEY_FIELD_MAPPING_ERROR;
        } else if (
            model.visitDatePropertyName &&
            (model.visitDatePropertyName === this._participantId || model.visitDatePropertyName === this._sequenceNum)
        ) {
            error = VISIT_DATE_MAPPING_ERROR;
        }
        return error;
    }

    onPropertiesChange = (model: DatasetModel) => {
        const { onChange } = this.props;
        const { file } = this.state;

        let updatedModel = model;
        if (file && (this._participantId || this._sequenceNum)) {
            const error = this.checkFieldsInColumnMapping(model);
            if (model.exception !== error) {
                updatedModel = produce<DatasetModel>(model, draft => {
                    draft.exception = error;
                });
            }
        }

        if (!model.hasValidAdditionalKey() && model.exception !== ADDITIONAL_KEY_ERROR) {
            updatedModel = produce<DatasetModel>(model, draft => {
                draft.exception = ADDITIONAL_KEY_ERROR;
            });
        }

        this.setState(
            () => ({ model: updatedModel }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    onIndexChange = (keyPropertyIndex?: number, visitDatePropertyIndex?: number): void => {
        this.setState(() => ({ keyPropertyIndex, visitDatePropertyIndex }));
    };

    onFinish = (): void => {
        const { setSubmitting, studyProperties } = this.props;
        const { model, shouldImportData } = this.state;
        const missingRequiredTimepointMapping = !model.demographicData && !this._sequenceNum;

        if (shouldImportData && (!this._participantId || missingRequiredTimepointMapping)) {
            this.setState(
                produce<State>(draft => {
                    draft.model.exception =
                        'You must select a column mapping field for ' +
                        studyProperties.SubjectNounPlural +
                        (missingRequiredTimepointMapping
                            ? ' and ' + getStudyTimepointLabel(studyProperties.TimepointType)
                            : '') +
                        ' in the fields panel.';
                }),
                () => {
                    setSubmitting(false);
                }
            );
            return;
        }

        if (this.checkFieldsInColumnMapping(model) || !model.hasValidAdditionalKey()) {
            return;
        }

        this.props.onFinish(model.isValid(), this.saveDomain);
    };

    onDomainChange = (
        domain: DomainDesign,
        dirty: boolean,
        rowIndexChanges: DomainFieldIndexChange[],
        changes?: List<IFieldChange>
    ): void => {
        const { onChange } = this.props;
        const { keyPropertyIndex, visitDatePropertyIndex } = this.state;

        if (changes) {
            this.setState(
                produce<State>(draft => {
                    Object.assign(draft.model.domain, handleDomainUpdates(draft.model.domain, changes));
                })
            );
            return;
        }

        this.setState(
            produce<State>(draft => {
                draft.model.domain = domain;

                // if we are back to the no fields state, reset the file related items
                if (domain.fields.size === 0) {
                    draft.file = undefined;
                    draft.shouldImportData = false;
                    this._participantId = undefined;
                    this._sequenceNum = undefined;
                }

                if (keyPropertyIndex !== undefined) {
                    // if the row was removed or reordered, update the keyPropertyIndex
                    // else if a different row was removed or reordered, refind out index by name
                    if (rowIndexChanges) {
                        rowIndexChanges.forEach(rowIndexChange => {
                            if (rowIndexChange.originalIndex === keyPropertyIndex) {
                                draft.keyPropertyIndex = rowIndexChange.newIndex;
                            } else {
                                draft.keyPropertyIndex = this.findFieldIndexByName(
                                    draft.model.domain,
                                    draft.model.keyPropertyName
                                );
                            }
                        });
                    }

                    // if row was removed, reset key property name
                    if (draft.keyPropertyIndex === undefined) {
                        draft.model.keyPropertyName = '';
                    } else {
                        // pick up any name changes to the selected field
                        draft.model.keyPropertyName = domain.fields.get(draft.keyPropertyIndex).name;
                    }
                }

                if (visitDatePropertyIndex !== undefined) {
                    // if the row was removed or reordered, update the visitDatePropertyIndex
                    if (rowIndexChanges) {
                        rowIndexChanges.forEach(rowIndexChange => {
                            if (rowIndexChange && rowIndexChange.originalIndex === visitDatePropertyIndex) {
                                draft.visitDatePropertyIndex = rowIndexChange.newIndex;
                            } else {
                                draft.visitDatePropertyIndex = this.findFieldIndexByName(
                                    draft.model.domain,
                                    draft.model.visitDatePropertyName
                                );
                            }
                        });
                    }

                    // if row was removed, reset visit date property name
                    if (draft.visitDatePropertyIndex === undefined) {
                        draft.model.visitDatePropertyName = undefined;
                    } else {
                        // pick up any name changes to the selected field
                        draft.model.visitDatePropertyName = domain.fields.get(draft.visitDatePropertyIndex).name;
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

    setFileImportData = (file: File, shouldImportData: boolean): void => {
        this.setState(state => ({
            file,
            shouldImportData: shouldImportData && !state.model.definitionIsShared,
        }));
    };

    onColumnMappingChange = (participantIdField?: string, timePointField?: string): void => {
        const { model } = this.state;

        this._participantId = participantIdField;
        this._sequenceNum = timePointField;

        // lock down these fields from domain
        const updatedDomain = model.domain.merge({
            fields: model.domain.fields
                .map((field: DomainField) => {
                    if (field.name === participantIdField || field.name === timePointField) {
                        return field.set('lockType', DOMAIN_FIELD_FULLY_LOCKED);
                    } else {
                        return field.set('lockType', DOMAIN_FIELD_NOT_LOCKED);
                    }
                })
                .toList(),
        }) as DomainDesign;

        this.setState(
            produce<State>(draft => {
                draft.model.domain = updatedDomain;
                draft.model.exception = this.checkFieldsInColumnMapping(draft.model);
            })
        );
    };

    renderColumnMappingSection = (): ReactNode => {
        const { model, file } = this.state;

        // only show this column mapping section in the file infer fields case when there is at least one field
        return (
            <>
                {file && model && model.domain.fields && model.domain.fields.size > 0 && (
                    <DatasetColumnMappingPanel
                        model={model}
                        onColumnMappingChange={this.onColumnMappingChange}
                        studyProperties={this.props.studyProperties}
                    />
                )}
            </>
        );
    };

    onImportErrorStayAndFix = (): void => {
        const { savedModel } = this.state;

        Domain.drop({
            schemaName: 'study',
            queryName: savedModel.name,
            failure: error => {
                this.setState(
                    produce<State>(draft => {
                        draft.model.exception = error;
                        draft.savedModel = undefined;
                        draft.importError = undefined;
                    })
                );
            },
            success: () => {
                this.setState(
                    produce<State>(draft => {
                        draft.savedModel = undefined;
                        draft.importError = undefined;
                    })
                );
            },
        });
    };

    onImportErrorContinue = (): void => {
        this.props.onComplete(this.state.savedModel);
    };

    handleFileImport(participantId, sequenceNum): void {
        const { setSubmitting } = this.props;
        const { file, savedModel } = this.state;

        importData({
            schemaName: 'study',
            queryName: savedModel.name,
            file,
            importUrl: buildURL('study', 'import', {
                name: savedModel.name,
                participantId,
                sequenceNum,
            }),
        })
            .then(response => {
                setSubmitting(false, () => {
                    this.props.onComplete(savedModel);
                });
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false, () => {
                    this.setState({
                        importError: error,
                    });
                });
            });
    }

    saveDomain = (): void => {
        const { setSubmitting, studyProperties } = this.props;
        const { model, shouldImportData } = this.state;
        const participantIdMapCol = this._participantId;
        const sequenceNumMapCol = this._sequenceNum;

        // filter out the selected column mapping files as those will be created in the base domain fields
        const updatedDomain = model.domain.merge({
            fields: model.domain.fields
                .filter(field => !this._participantId || field.name !== this._participantId)
                .filter(field => !this._sequenceNum || field.name !== this._sequenceNum)
                .toList(),
        }) as DomainDesign;

        // need to track the updated field index values for property values after the filter
        let keyPropIndex;
        let visitPropIndex;
        updatedDomain.fields.map((field, index) => {
            if (model.keyPropertyName && field.name === model.keyPropertyName) {
                keyPropIndex = index;
            }
            if (model.visitDatePropertyName && field.name === model.visitDatePropertyName) {
                visitPropIndex = index;
            }
        });

        saveDomain({
            domain: updatedDomain,
            kind: model.getDomainKind(studyProperties.TimepointType),
            options: model.getOptions(),
            name: model.name,
            includeWarnings: false,
            addRowIndexes: true,
            originalDomain: model.domain,
        })
            .then(response => {
                this.setState(
                    produce<State>(draftState => {
                        draftState.keyPropertyIndex = keyPropIndex;
                        draftState.visitDatePropertyIndex = visitPropIndex;
                        draftState.model.exception = undefined;

                        // the savedModel will be used for dropping the domain on file import failure or for onComplete
                        draftState.savedModel = produce<DatasetModel>(draftState.model, draftModel => {
                            draftModel.domain = response;
                        });
                    }),
                    () => {
                        // If we're importing Dataset file and not in a Dataspace study, import the file contents
                        if (shouldImportData) {
                            this.handleFileImport(participantIdMapCol, sequenceNumMapCol);
                        } else {
                            setSubmitting(false, () => {
                                this.props.onComplete(this.state.savedModel);
                            });
                        }
                    }
                );
            })
            .catch(response => {
                const exception = resolveErrorMessage(response);

                setSubmitting(false, () => {
                    this.setState(
                        produce<State>(draft => {
                            if (exception) {
                                draft.model.exception = exception;
                            } else {
                                // since the create case filters out the mapped columns, we don't replace the full
                                // model.domain with response but just update the domainException
                                draft.model.domain = draft.model.domain.merge({
                                    domainException: response.domainException,
                                }) as DomainDesign;
                                draft.model.exception = undefined;
                            }
                        })
                    );
                });
            });
    };

    render(): ReactNode {
        const {
            api,
            onTogglePanel,
            visitedPanels,
            submitting,
            onCancel,
            currentPanelIndex,
            firstState,
            validatePanel,
            saveBtnText,
            studyProperties,
        } = this.props;
        const { model, file, keyPropertyIndex, visitDatePropertyIndex, importError } = this.state;

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
            >
                <DatasetPropertiesPanel
                    initCollapsed={currentPanelIndex !== 0}
                    model={model}
                    keyPropertyIndex={keyPropertyIndex}
                    visitDatePropertyIndex={visitDatePropertyIndex}
                    onIndexChange={this.onIndexChange}
                    controlledCollapse
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
                    studyProperties={studyProperties}
                />
                <DomainForm
                    api={api}
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpNoun="dataset"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    fieldsAdditionalRenderer={this.renderColumnMappingSection}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.isFromLinkedSource(),
                        hideAddFieldsButton: model.isFromLinkedSource(),
                        hideImportData: model.definitionIsShared, // Shared (Dataspace) study does not have permission to import data. See study-importAction.validatePermission
                        retainReservedFields: true, // reserved fields are used for mapping the participant and visit columns.
                    }}
                />
                <Progress
                    modal
                    delay={1000}
                    estimate={file ? file.size * 0.005 : undefined}
                    title="Importing data from selected file..."
                    toggle={submitting && file !== undefined}
                />
                {importError !== undefined && (
                    <ConfirmImportTypes
                        designerType="dataset"
                        error={importError}
                        onConfirm={this.onImportErrorContinue}
                        onCancel={this.onImportErrorStayAndFix}
                    />
                )}
            </BaseDomainDesigner>
        );
    }
}

const DatasetDesignerPanelsWithProperties: FC<Props & InjectedBaseDomainDesignerProps> = props => {
    const studyProperties = useStudyPropertiesContext();
    if (!studyProperties) return <LoadingSpinner />;
    return <DatasetDesignerPanelImpl {...props} studyProperties={studyProperties} />;
};

export const DatasetDesignerPanels = withBaseDomainDesigner<Props>(DatasetDesignerPanelsWithProperties);
