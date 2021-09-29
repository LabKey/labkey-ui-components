import React, { ComponentType, FC, PureComponent } from 'react';

import { PermissionTypes } from '@labkey/api';

import { List } from 'immutable';

import {
    EntityDeleteModal,
    getStateModelId,
    GridPanel,
    ManageDropdownButton,
    QueryModel,
    RequiresPermission,
    SampleTypeDataType,
    SchemaQuery, SCHEMAS,
    SelectionMenuItem,
    User,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

import { getOmittedSampleTypeColumns } from './utils';
import { getSampleAliquotsQueryConfig } from './actions';

interface StorageButtonsComponentProps {
    afterStorageUpdate?: () => void;
    queryModel?: QueryModel;
    user: User;
}

type StorageButton = ComponentType<StorageButtonsComponentProps>;

interface AliquotGridButtonsProps {
    afterAction: () => void;
    onDelete: () => void;
    StorageButtonsComponent?: StorageButton;
    user: User;
}

const AliquotGridButtons: FC<AliquotGridButtonsProps & RequiresModelAndActions> = props => {
    const { afterAction, model, onDelete, StorageButtonsComponent, user } = props;

    return (
        <div className="btn-group">
            <RequiresPermission perms={PermissionTypes.Delete}>
                <ManageDropdownButton id="samplealiquotlisting">
                    <SelectionMenuItem
                        id="sample-aliquot-delete-menu-item"
                        text="Delete Aliquots"
                        onClick={onDelete}
                        queryModel={model}
                        nounPlural="aliquots"
                    />
                </ManageDropdownButton>

                {StorageButtonsComponent && (
                    <StorageButtonsComponent afterStorageUpdate={afterAction} queryModel={model} user={user} />
                )}
            </RequiresPermission>
        </div>
    );
};

interface Props {
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    storageButton?: StorageButton;
    user: User;
}

interface State {
    showConfirmDelete: boolean;
}

export class SampleAliquotsGridPanelImpl extends PureComponent<Props & InjectedQueryModels, State> {
    state: Readonly<State> = { showConfirmDelete: false };

    getQueryModel = (): QueryModel => {
        return Object.values(this.props.queryModels)[0];
    }

    afterAction = (): void => {
        const { actions, onSampleChangeInvalidate } = this.props;
        const model = this.getQueryModel();

        this.resetState();
        onSampleChangeInvalidate(model.schemaQuery);
        actions.loadModel(model.id, true);
    };

    onDelete = (): void => {
        if (this.hasSelection()) {
            this.setState({ showConfirmDelete: true });
        }
    };

    resetState = (): void => {
        if (this.hasSelection()) {
            this.setState({ showConfirmDelete: false });
        }
    };

    hasSelection(): boolean {
        return this.getQueryModel().hasSelections;
    }

    render() {
        const { actions, storageButton, user } = this.props;
        const queryModel = this.getQueryModel();

        return (
            <>
                <GridPanel
                    actions={actions}
                    ButtonsComponent={AliquotGridButtons}
                    buttonsComponentProps={{
                        afterAction: this.afterAction,
                        onDelete: this.onDelete,
                        StorageButtonsComponent: storageButton,
                        user,
                    }}
                    model={queryModel}
                    showViewMenu={false}
                />

                {this.state.showConfirmDelete && (
                    <EntityDeleteModal
                        afterDelete={this.afterAction}
                        entityDataType={SampleTypeDataType}
                        onCancel={this.resetState}
                        queryModel={queryModel}
                        useSelected
                        verb="deleted and removed from storage"
                    />
                )}
            </>
        );
    }
}

const SampleAliquotsGridPanelWithModel = withQueryModels<Props>(SampleAliquotsGridPanelImpl);

interface SampleAliquotsGridPanelProps extends Props {
    omitCols?: string[];
    rootLsid?: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    sampleLsid: string;
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { omitCols, sampleLsid, schemaQuery, rootLsid, user } = props;
    const id = getStateModelId('sample-aliquots', SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery()));

    const queryConfigs = {
        [id]: getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            List(getOmittedSampleTypeColumns(user, omitCols))
        ),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
