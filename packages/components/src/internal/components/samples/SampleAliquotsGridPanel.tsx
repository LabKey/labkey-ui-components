import React, { ComponentType, FC, PureComponent } from 'react';

import { PermissionTypes } from '@labkey/api';

import { List } from 'immutable';

import {
    EntityDeleteModal,
    GridPanel,
    ManageDropdownButton,
    QueryModel,
    RequiresPermission,
    SampleTypeDataType,
    SchemaQuery,
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

    afterAction = (): void => {
        const { actions, onSampleChangeInvalidate, queryModels } = this.props;
        const { model } = queryModels;

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
        return this.props.queryModels.model.hasSelections;
    }

    render() {
        const { actions, queryModels, storageButton, user } = this.props;
        const { model } = queryModels;

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
                    loadOnMount={false}
                    model={model}
                    showViewMenu={false}
                />

                {this.state.showConfirmDelete && (
                    <EntityDeleteModal
                        afterDelete={this.afterAction}
                        entityDataType={SampleTypeDataType}
                        onCancel={this.resetState}
                        queryModel={model}
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

    const queryConfigs = {
        model: getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            List(getOmittedSampleTypeColumns(user, omitCols))
        ),
    };

    return <SampleAliquotsGridPanelWithModel {...props} autoLoad queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
