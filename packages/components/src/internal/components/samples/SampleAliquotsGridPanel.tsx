import React, {FC, PureComponent} from 'react';

import {PermissionTypes} from '@labkey/api';

import {List} from 'immutable';

import {
    DisableableButton,
    EntityDeleteModal,
    getStateModelId,
    GridPanel,
    PicklistButton,
    QueryModel,
    RequiresPermission,
    ResponsiveMenuButtonGroup,
    SamplesAssayButton,
    SampleTypeDataType,
    SchemaQuery,
    SCHEMAS,
    User,
    hasPermissions,
} from '../../..';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

import { getOmittedSampleTypeColumns } from './utils';
import { getSampleAliquotsQueryConfig } from './actions';
import { JobsButton, SampleStorageButton } from './models';

interface AliquotGridButtonsProps {
    afterAction: () => void;
    onDelete: () => void;
    StorageButtonComponent?: SampleStorageButton;
    JobsButtonComponent?: JobsButton;
    user: User;
    lineageUpdateAllowed: boolean;
    assayProviderType?: string;
}

const AliquotGridButtons: FC<AliquotGridButtonsProps & RequiresModelAndActions> = props => {
    const {
        afterAction,
        lineageUpdateAllowed,
        model,
        onDelete,
        StorageButtonComponent,
        JobsButtonComponent,
        user,
        assayProviderType,
    } = props;
    const metricFeatureArea = 'sampleAliquots';
    const showStorageButton = hasPermissions(user, [PermissionTypes.EditStorageData], false);

    const moreItems = [];
    moreItems.push(<SamplesAssayButton model={model} providerType={assayProviderType} />);
    moreItems.push(<PicklistButton model={model} user={user} metricFeatureArea={metricFeatureArea} />);
    if (JobsButtonComponent) {
        moreItems.push(<JobsButtonComponent model={model} user={user} metricFeatureArea={metricFeatureArea} />);
    }
    if (StorageButtonComponent && showStorageButton) {
        moreItems.push(
            <StorageButtonComponent
                afterStorageUpdate={afterAction}
                queryModel={model}
                user={user}
                nounPlural="aliquots"
                metricFeatureArea={metricFeatureArea}
            />
        );
    }

    return (
        <div className="responsive-btn-group">
            <RequiresPermission
                permissionCheck="any"
                perms={[
                    PermissionTypes.Insert,
                    PermissionTypes.Update,
                    PermissionTypes.Delete,
                    PermissionTypes.ManagePicklists,
                    PermissionTypes.ManageSampleWorkflows,
                    PermissionTypes.EditStorageData,
                ]}
            >
                {lineageUpdateAllowed && (
                    <RequiresPermission perms={PermissionTypes.Delete}>
                        <DisableableButton
                            bsStyle="default"
                            onClick={onDelete}
                            disabledMsg={!model.hasSelections ? 'Select one or more aliquots.' : undefined}
                        >
                            <span className="fa fa-trash" />
                            <span>&nbsp;Delete</span>
                        </DisableableButton>
                    </RequiresPermission>
                )}
                <ResponsiveMenuButtonGroup items={moreItems} />
            </RequiresPermission>
        </div>
    );
};

interface Props {
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    storageButton?: SampleStorageButton;
    jobsButton?: JobsButton;
    user: User;
    lineageUpdateAllowed: boolean;
    assayProviderType?: string;
}

interface State {
    showConfirmDelete: boolean;
}

export class SampleAliquotsGridPanelImpl extends PureComponent<Props & InjectedQueryModels, State> {
    state: Readonly<State> = { showConfirmDelete: false };

    getQueryModel = (): QueryModel => {
        return Object.values(this.props.queryModels)[0];
    };

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
        const { actions, storageButton, jobsButton, ...buttonProps } = this.props;
        const queryModel = this.getQueryModel();

        return (
            <>
                <GridPanel
                    actions={actions}
                    ButtonsComponent={AliquotGridButtons}
                    buttonsComponentProps={{
                        ...buttonProps,
                        afterAction: this.afterAction,
                        onDelete: this.onDelete,
                        StorageButtonComponent: storageButton,
                        JobsButtonComponent: jobsButton,
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
    rootLsid?: string; // if sample is an aliquot, use the aliquot's root to find subaliquots
    sampleLsid: string;
    schemaQuery: SchemaQuery;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user } = props;
    const id = getStateModelId(
        'sample-aliquots',
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery())
    );

    const queryConfigs = {
        [id]: getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            List(getOmittedSampleTypeColumns(user))
        ),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
