import React, { FC, PureComponent } from 'react';
import { List } from 'immutable';
import { PermissionTypes } from '@labkey/api';

import {
    DisableableButton,
    EntityDeleteModal,
    createGridModelId,
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
    JobsButtonComponent?: JobsButton;
    StorageButtonComponent?: SampleStorageButton;
    afterAction: () => void;
    assayProviderType?: string;
    lineageUpdateAllowed: boolean;
    onDelete: () => void;
    user: User;
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

    const moreItems = [];
    moreItems.push({
        button: <SamplesAssayButton model={model} providerType={assayProviderType} />,
        perm: PermissionTypes.Insert,
    });
    moreItems.push({
        button: <PicklistButton model={model} user={user} metricFeatureArea={metricFeatureArea} />,
        perm: PermissionTypes.ManagePicklists,
    });
    if (JobsButtonComponent) {
        moreItems.push({
            button: <JobsButtonComponent model={model} user={user} metricFeatureArea={metricFeatureArea} />,
            perm: PermissionTypes.ManageSampleWorkflows,
        });
    }
    if (StorageButtonComponent) {
        moreItems.push({
            button: (
                <StorageButtonComponent
                    afterStorageUpdate={afterAction}
                    queryModel={model}
                    user={user}
                    nounPlural="aliquots"
                    metricFeatureArea={metricFeatureArea}
                />
            ),
            perm: PermissionTypes.EditStorageData,
        });
    }

    return (
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
            <div className="responsive-btn-group">
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
                <ResponsiveMenuButtonGroup user={user} items={moreItems} />
            </div>
        </RequiresPermission>
    );
};

interface Props {
    assayProviderType?: string;
    jobsButton?: JobsButton;
    lineageUpdateAllowed: boolean;
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    storageButton?: SampleStorageButton;
    user: User;
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
    omittedColumns?: string[];
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user, omittedColumns } = props;
    const id = createGridModelId(
        'sample-aliquots',
        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, schemaQuery.getQuery())
    );
    const omitted = [...getOmittedSampleTypeColumns(user), ...omittedColumns];

    const queryConfigs = {
        [id]: getSampleAliquotsQueryConfig(
            schemaQuery.getQuery(),
            sampleLsid,
            true,
            rootLsid,
            omitted
        ),
    };

    return <SampleAliquotsGridPanelWithModel {...props} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
