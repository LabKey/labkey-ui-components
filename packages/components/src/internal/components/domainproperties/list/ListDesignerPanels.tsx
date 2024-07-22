import React, { ReactNode } from 'react';
import { List } from 'immutable';
import { Domain } from '@labkey/api';

import { DomainDesign, DomainFieldIndexChange, IAppDomainHeader } from '../models';
import DomainForm from '../DomainForm';
import { getDomainPanelStatus, saveDomain } from '../actions';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { AUTOINT_TYPE, PropDescType } from '../PropDescType';

import ConfirmImportTypes from '../ConfirmImportTypes';

import { importData } from '../../../query/api';
import { buildURL } from '../../../url/AppURL';
import { resolveErrorMessage } from '../../../util/messaging';
import { Progress } from '../../base/Progress';

import { AUTO_INT_CONCEPT_URI } from '../constants';

import { ComponentsAPIWrapper } from '../../../APIWrapper';

import { ListPropertiesPanel } from './ListPropertiesPanel';
import { ListModel } from './models';
import { SetKeyFieldNamePanel } from './SetKeyFieldNamePanel';

export interface ListDesignerPanelsProps {
    api?: ComponentsAPIWrapper;
    initModel?: ListModel;
    onCancel: () => void;
    onChange: (model: ListModel) => void;
    onComplete: (model: ListModel) => void;
    saveBtnText?: string;
}

interface State {
    file: File;
    importError: any;
    model: ListModel;
    savedModel: ListModel;
    shouldImportData: boolean;
}

// export for testing
export class ListDesignerPanelsImpl extends React.PureComponent<
    ListDesignerPanelsProps & InjectedBaseDomainDesignerProps,
    State
> {
    constructor(props: ListDesignerPanelsProps & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || ListModel.create({}),
            file: undefined,
            shouldImportData: false,
            savedModel: undefined,
            importError: undefined,
        };
    }

    onPropertiesChange = (model: ListModel): void => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model }),
            () => onChange(model)
        );
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean, rowIndexChanges?: DomainFieldIndexChange[]): void => {
        const { model } = this.state;

        // Issue 40262: If we have a titleColumn selected and the name changes (not the row index), update the titleColumn
        let titleColumn = model.titleColumn;
        if (titleColumn && !rowIndexChanges) {
            const index = model.domain.findFieldIndexByName(titleColumn);
            titleColumn = index > -1 ? domain.fields.get(index).name : undefined;
        }

        this.setState(
            state => ({
                model: state.model.merge({ domain, titleColumn }) as ListModel,
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (dirty) {
                    this.props.onChange(this.state.model);
                }

                this.setKeyTypeForModel();
            }
        );
    };

    setFileImportData = (file: File, shouldImportData: boolean) => {
        this.setState({ file, shouldImportData });
    };

    onImportErrorStayAndFix = (): void => {
        const { model, savedModel } = this.state;

        Domain.drop({
            schemaName: 'lists',
            queryName: savedModel.name,
            failure: error => {
                this.setState({
                    model: model.set('exception', error) as ListModel,
                    savedModel: undefined,
                    importError: undefined,
                });
            },
            success: () => {
                this.setState(() => ({
                    model: model.set('exception', undefined) as ListModel,
                    savedModel: undefined,
                    importError: undefined,
                }));
            },
        });
    };

    onImportErrorContinue = (): void => {
        this.props.onComplete(this.state.savedModel);
    };

    handleFileImport() {
        const { setSubmitting } = this.props;
        const { file, savedModel } = this.state;

        importData({
            schemaName: 'lists',
            queryName: savedModel.name,
            file,
            importUrl: buildURL('list', 'UploadListItems', {
                name: savedModel.name,
            }),
        })
            .then(() => {
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

    setKeyTypeForModel(): void {
        const { model } = this.state;

        if (!model.keyType) {
            const fields = model.domain.fields;
            const pkField = fields.find(i => i.isPrimaryKey);

            if (pkField) {
                const keyName = pkField.get('name');

                let keyType;
                let domain = model.domain;
                // Issue 41718: Domain Designer Field Imports should observe auto-increment fields
                if (pkField.conceptURI === AUTO_INT_CONCEPT_URI) {
                    keyType = 'AutoIncrementInteger';
                    const updatedFields = fields.map(f => (f.isPrimaryKey ? f.merge({ dataType: AUTOINT_TYPE }) : f));
                    domain = model.domain.set('fields', updatedFields) as DomainDesign;
                } else if (PropDescType.isAutoIncrement(pkField.dataType)) {
                    keyType = 'AutoIncrementInteger';
                } else if (PropDescType.isInteger(pkField.dataType.rangeURI)) {
                    keyType = 'Integer';
                } else if (PropDescType.isString(pkField.dataType.rangeURI)) {
                    keyType = 'Varchar';
                }

                this.onPropertiesChange(model.merge({ keyName, keyType, domain }) as ListModel);
            }
        }
    }

    onFinish = () => {
        const { setSubmitting } = this.props;
        const { model } = this.state;
        const isValid = model.isValid();

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            const exception = !model.hasValidKeyType()
                ? 'You must specify a key field for your list in the fields panel to continue.'
                : model.domain.getFirstFieldError();
            const updatedModel = model.set('exception', exception) as ListModel;
            setSubmitting(false, () => {
                this.setState(() => ({ model: updatedModel }));
            });
        }
    };

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model, shouldImportData } = this.state;

        saveDomain({ domain: model.domain, kind: model.getDomainKind(), options: model.getOptions(), name: model.name })
            .then(response => {
                const updatedModel = model.set('exception', undefined) as ListModel;
                this.setState(
                    () => ({
                        model: updatedModel,
                        // the savedModel will be used for dropping the domain on file import failure or for onComplete
                        savedModel: updatedModel.merge({ domain: response }) as ListModel,
                    }),
                    () => {
                        // If we're importing List file data, import file contents
                        if (shouldImportData) {
                            this.handleFileImport();
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

                // Issue 49113: Better handling for case where the only error is a form error
                if (!exception && response.domainException) {
                    response = response.setIn(
                        ['domainException', 'exception'],
                        resolveErrorMessage(response.domainException.exception)
                    );
                }

                const updatedModel = exception
                    ? (model.set('exception', exception) as ListModel)
                    : (model.merge({ domain: response, exception: undefined }) as ListModel);

                setSubmitting(false, () => {
                    this.setState(() => ({ model: updatedModel }));
                });
            });
    };

    headerRenderer = (config: IAppDomainHeader): ReactNode => {
        return <SetKeyFieldNamePanel model={this.state.model} onModelChange={this.onPropertiesChange} {...config} />;
    };

    toggleListPropertiesPanel = (collapsed, callback): void => {
        this.props.onTogglePanel(0, collapsed, callback);
    };

    toggleDomainForm = (collapsed, callback): void => {
        this.props.onTogglePanel(1, collapsed, callback);
    };

    render() {
        const { api, onCancel, visitedPanels, currentPanelIndex, firstState, validatePanel, submitting, saveBtnText } =
            this.props;
        const { model, file, importError } = this.state;

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
                <ListPropertiesPanel
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={this.toggleListPropertiesPanel}
                />
                <DomainForm
                    api={api?.domain}
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    todoIconHelpMsg="This section does not contain any user-defined fields and requires a selection for the Key Field Name property."
                    helpNoun="list"
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
                    onToggle={this.toggleDomainForm}
                    appDomainHeaderRenderer={model.isNew() && model.domain.fields.size > 0 && this.headerRenderer}
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
                        designerType="list"
                        error={importError}
                        onConfirm={this.onImportErrorContinue}
                        onCancel={this.onImportErrorStayAndFix}
                    />
                )}
            </BaseDomainDesigner>
        );
    }
}

export const ListDesignerPanels = withBaseDomainDesigner<ListDesignerPanelsProps>(ListDesignerPanelsImpl);
