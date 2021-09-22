import React, { PureComponent } from 'react';

import { PermissionTypes } from '@labkey/api';

import {
    EntityDeleteModal,
    getSampleAliquotsQueryConfig,
    GridPanel,
    LoadingSpinner,
    ManageDropdownButton,
    QueryModel,
    RequiresPermission,
    SampleTypeDataType,
    SchemaQuery,
    SelectionMenuItem,
    User,
} from '../../../index';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { getOmittedSampleTypeColumns } from './utils';

interface Props {
    sampleLsid: string;
    schemaQuery: SchemaQuery;
    user: User;
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    rootLsid?: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    storageButton?: any; // TODO
    inventoryCols?: string[];
}

interface State {
    showConfirmDelete: boolean;
}

export class SampleAliquotsGridPanelImpl extends PureComponent<Props & InjectedQueryModels, State> {
    constructor(props) {
        super(props);
        this.state = {
            showConfirmDelete: false,
        };
    }

    componentDidMount() {
        const { sampleLsid, schemaQuery, actions, user, rootLsid, inventoryCols } = this.props;

        const queryConfig = getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            getOmittedSampleTypeColumns(user, inventoryCols)
        );
        // don't need to load the data here because that is done by default in the GridPanel.
        actions.addModel(queryConfig, false);
    }

    getQueryModel(): QueryModel {
        return Object.values(this.props.queryModels)[0];
    }

    afterAction = () => {
        const { actions, schemaQuery, onSampleChangeInvalidate } = this.props;
        this.resetState();
        onSampleChangeInvalidate(schemaQuery);
        const model = this.getQueryModel();
        actions.loadModel(model.id, true);
    };

    hideConfirm = () => {
        this.setState(() => ({ showConfirmDelete: false }));
    };

    onDelete = () => {
        if (this.hasSelection()) {
            this.setState(() => ({ showConfirmDelete: true }));
        }
    };

    resetState = () => {
        if (this.hasSelection()) {
            this.setState(() => ({ showConfirmDelete: false }));
        }
    };

    hasSelection() {
        return this.getQueryModel().selections?.size > 0;
    }

    renderButtons = () => {
        const queryModel = this.getQueryModel();
        const Node = this.props.storageButton;
        return (
            <div className="btn-group">
                <RequiresPermission perms={PermissionTypes.Delete}>
                    <ManageDropdownButton id="samplealiquotlisting">
                        <SelectionMenuItem
                            id="sample-aliquot-delete-menu-item"
                            text="Delete Aliquots"
                            onClick={() => this.onDelete()}
                            queryModel={queryModel}
                            nounPlural="aliquots"
                        />
                    </ManageDropdownButton>

                    {Node && (
                        <Node user={this.props.user} queryModel={queryModel} afterStorageUpdate={this.afterAction} />
                    )}
                </RequiresPermission>
            </div>
        );
    };

    renderDeleteModal() {
        const model = this.getQueryModel();

        if (!this.state.showConfirmDelete) return null;

        return (
            <EntityDeleteModal
                queryModel={model}
                useSelected={true}
                afterDelete={this.afterAction}
                onCancel={this.resetState}
                entityDataType={SampleTypeDataType}
                verb="deleted and removed from storage"
            />
        );
    }

    render() {
        const { actions } = this.props;

        const model = this.getQueryModel();

        if (!model) return <LoadingSpinner />;

        return (
            <>
                {this.state.showConfirmDelete && this.renderDeleteModal()}
                <GridPanel
                    actions={actions}
                    ButtonsComponent={() => this.renderButtons()}
                    buttonsComponentProps={{
                        canDelete: true,
                    }}
                    model={model}
                    showViewMenu={false}
                />
            </>
        );
    }
}

export const SampleAliquotsGridPanel = withQueryModels<Props>(SampleAliquotsGridPanelImpl);
