import React from 'react';
import { List } from 'immutable';
import { ActionURL, Domain } from '@labkey/api';

import { importData, Progress, resolveErrorMessage } from '../../../..';

import { DomainDesign, DomainFieldIndexChange, IAppDomainHeader } from '../models';
import DomainForm from '../DomainForm';
import { getDomainPanelStatus, saveDomain } from '../actions';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { SetKeyFieldNamePanel } from './SetKeyFieldNamePanel';
import { ListModel } from './models';
import { ListPropertiesPanel } from './ListPropertiesPanel';
import {PropDescType} from "../PropDescType";
import ConfirmImportTypes from "../ConfirmImportTypes";

interface Props {
    initModel?: ListModel;
    onChange?: (model: ListModel) => void;
    onCancel: () => void;
    onComplete: (model: ListModel, fileImportError?: string) => void;
    useTheme?: boolean;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    successBsStyle?: string;
    saveBtnText?: string;
}

interface State {
    model: ListModel;
    file: File;
    shouldImportData: boolean;
    preSaveDomain: DomainDesign;
    importError: any;
}

class ListDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || ListModel.create({}),
            file: undefined,
            shouldImportData: false,
            preSaveDomain: undefined,
            importError: undefined,
        };
    }

    onPropertiesChange = (model: ListModel) => {
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

    onDomainChange = (domain: DomainDesign, dirty: boolean, rowIndexChange?: DomainFieldIndexChange) => {
        const { onChange } = this.props;
        const { model } = this.state;

        // Issue 40262: If we have a titleColumn selected and the name changes (not the row index), update the titleColumn
        let titleColumn = model.titleColumn;
        if (titleColumn && !rowIndexChange) {
            const index = model.domain.findFieldIndexByName(titleColumn);
            titleColumn = index > -1 ? domain.fields.get(index).name : undefined;
        }

        this.setState(
            state => ({
                model: state.model.merge({ domain, titleColumn }) as ListModel,
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(this.state.model);
                }

                this.setKeyTypeForModel();
            }
        );
    };

    setFileImportData = (file: File, shouldImportData: boolean) => {
        this.setState({ file, shouldImportData });
    };

    onImportErrorStayAndFix = () => {
        const { model } = this.state;

        this.setState({importError: undefined});
        const dropOptions = {
            schemaName: 'lists',
            queryName: model.name,
            failure: (error) => {
                const updatedModel = model.set('exception', error) as ListModel;
                this.setState({ model: updatedModel });
            },
            success: () => {
                this.setState((state) => ({
                    preSaveDomain: undefined,
                    model: model.merge({
                        domain: state.preSaveDomain,
                        exception: undefined
                }) as ListModel }));
            }
        };
        Domain.drop(dropOptions);
    }

    onImportErrorContinue = () => {
        this.props.onComplete(this.state.model);
    }

    handleFileImport() {
        const { setSubmitting } = this.props;
        const { file, model } = this.state;

        importData({
            schemaName: 'lists',
            queryName: model.name,
            file,
            importUrl: ActionURL.buildURL('list', 'UploadListItems', LABKEY.container.path, { name: model.name }),
        })
            .then(response => {
                setSubmitting(false, () => {
                    this.props.onComplete(model);
                });
            })
            .catch(error => {
                console.error(error);
                setSubmitting(false, () => {
                    this.setState({importError: error});
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
                // TODO this autoIncrement check doesn't seem to work for importing from JSON as the data type will just be INTEGER_TYPE and not AUTOINT_TYPE
                if (PropDescType.isAutoIncrement(pkField.dataType)) {
                    keyType = 'AutoIncrementInteger';
                } else if (PropDescType.isInteger(pkField.dataType.rangeURI)) {
                    keyType = 'Integer';
                } else if (PropDescType.isString(pkField.dataType.rangeURI)) {
                    keyType = 'Varchar';
                }

                this.onPropertiesChange(model.merge({ keyName, keyType }) as ListModel);
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

        this.setState((state) => ({ preSaveDomain: state.model.domain }), () => {
            saveDomain(model.domain, model.getDomainKind(), model.getOptions(), model.name)
                .then(response => {
                    let updatedModel = model.set('exception', undefined) as ListModel;
                    updatedModel = updatedModel.merge({ domain: response }) as ListModel;
                    this.setState(() => ({ model: updatedModel }));

                    // If we're importing List file data, import file contents
                    if (shouldImportData) {
                        this.handleFileImport();
                    } else {
                        setSubmitting(false, () => {
                            this.props.onComplete(updatedModel);
                        });
                    }
                })
                .catch(response => {
                    const exception = resolveErrorMessage(response);
                    const updatedModel = exception
                        ? (model.set('exception', exception) as ListModel)
                        : (model.merge({ domain: response, exception: undefined }) as ListModel);

                    setSubmitting(false, () => {
                        this.setState(() => ({ model: updatedModel }));
                    });
                });
        });
    };

    headerRenderer = (config: IAppDomainHeader) => {
        return <SetKeyFieldNamePanel model={this.state.model} onModelChange={this.onPropertiesChange} {...config} />;
    };

    render() {
        const {
            onCancel,
            useTheme,
            containerTop,
            successBsStyle,
            visitedPanels,
            currentPanelIndex,
            firstState,
            validatePanel,
            submitting,
            onTogglePanel,
            saveBtnText,
        } = this.props;
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
                successBsStyle={successBsStyle}
            >
                <ListPropertiesPanel
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    todoIconHelpMsg="This section does not contain any user-defined fields and requires a selection for the Key Field Name property."
                    helpNoun="list"
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
                    successBsStyle={successBsStyle}
                    appDomainHeaderRenderer={model.isNew() && model.domain.fields.size > 0 && this.headerRenderer}
                    allowImportExport={true}
                />
                <Progress
                    modal={true}
                    delay={1000}
                    estimate={file ? file.size * 0.005 : undefined}
                    title="Importing data from selected file..."
                    toggle={submitting && file !== undefined}
                />
                <ConfirmImportTypes
                    designerType="List"
                    show={importError !== undefined}
                    error={importError}
                    onConfirm={this.onImportErrorContinue}
                    onCancel={this.onImportErrorStayAndFix}
                />
            </BaseDomainDesigner>
        );
    }
}

export const ListDesignerPanels = withBaseDomainDesigner<Props>(ListDesignerPanelsImpl);
