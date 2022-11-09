import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { List, Map } from 'immutable';
import { WithRouterProps } from 'react-router';

import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { InjectedRouteLeaveProps, useRouteLeave } from '../internal/util/RouteLeave';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { useServerContext } from '../internal/components/base/ServerContext';
import { fetchProtocol } from '../internal/components/domainproperties/assay/actions';
import { DomainDesign, IDomainField } from '../internal/components/domainproperties/models';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';
import { clearAssayDefinitionCache } from '../internal/components/assay/actions';

import { AppURL } from '../internal/url/AppURL';
import { ASSAYS_KEY } from '../internal/app/constants';
import { hasPremiumModule, sampleManagerIsPrimaryApp } from '../internal/app/utils';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { Page } from '../internal/components/base/Page';

import { Alert } from '../internal/components/base/Alert';
import { getActionErrorMessage } from '../internal/util/messaging';
import { AssayDesignerPanels } from '../internal/components/domainproperties/assay/AssayDesignerPanels';
import { ProductMenuModel } from '../internal/components/navigation/model';

import { DEFAULT_SAMPLE_FIELD_CONFIG } from '../internal/components/samples/constants';

import { protocolHasSample, renderSampleRequiredPanelHeader } from './SampleRequiredDomainHeader';
import { AssayHeader } from './AssayHeader';
import { onAssayDesignChange } from './actions';

const ASSAY_DESIGNER_HEADER = 'Connect your experimental results to samples for rich data connections.';

// Need to do an exclusion list to allow unknown file-based assays to have batch fields
const REMOVE_BATCH_DOMAIN_ASSAYS = [
    'General',
    'ELISA',
    'ELISpot',
    'Noblis Simple',
    'NAb',
    'Viability',
    'TZM-bl Neutralization (NAb)',
    'TZM-bl Neutralization (NAb), High-throughput (Cross Plate Dilution)',
    'TZM-bl Neutralization (NAb), High-throughput (Single Plate Dilution)',
];

interface OwnProps {
    goBack: (n?: number) => void;
    menu: ProductMenuModel;
    menuInit: (invalidate?: boolean) => void;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    requireSampleField?: boolean;
    showProviderName?: boolean;
}

type Props = OwnProps & InjectedAssayModel & WithRouterProps & InjectedRouteLeaveProps;

export const AssayDesignPageBody: FC<Props> = memo(props => {
    const {
        assayDefinition,
        assayProtocol,
        reloadAssays,
        router,
        routes,
        goBack,
        menu,
        menuInit,
        navigate,
        requireSampleField,
        showProviderName,
        params,
    } = props;
    const [hasError, setHasError] = useState(false);
    const [protocol, setProtocol] = useState<AssayProtocolModel>(undefined);
    const { user } = useServerContext();
    const [_, setIsDirty] = useRouteLeave(router, routes);
    const { createNotification } = useNotificationsContext();

    useEffect(() => {
        async function getProtocol(protocolId, providerName, copy) {
            try {
                let protocol = await fetchProtocol(protocolId, providerName, copy);
                setHasError(false);

                // Update pre-populated fields and batch fields if we aren't copying the assay design
                if (!assayProtocol) {
                    let newDomains = List<DomainDesign>();
                    protocol.domains.forEach(dom => {
                        let newDomain = dom;

                        // Clear all pre-populated fields for general assay
                        if (
                            protocol.providerName === GENERAL_ASSAY_PROVIDER_NAME ||
                            (REMOVE_BATCH_DOMAIN_ASSAYS.indexOf(protocol.providerName) !== -1 &&
                                dom.name.indexOf('Batch') !== -1)
                        ) {
                            newDomain = newDomain.set('fields', List()) as DomainDesign;
                        }

                        // special case for the Results Domain to default in a sample field when using "manually define fields"
                        if (requireSampleField && newDomain.isNameSuffixMatch('Data'))
                            newDomain = newDomain.set(
                                'newDesignFields',
                                List<Partial<IDomainField>>([DEFAULT_SAMPLE_FIELD_CONFIG])
                            ) as DomainDesign;

                        newDomains = newDomains.push(newDomain) as List<DomainDesign>;
                    });
                    protocol = protocol.set('domains', newDomains) as AssayProtocolModel;
                }

                setProtocol(protocol);
            } catch (error) {
                console.error(error);
                setHasError(true);
            }
        }

        if (params?.copy && assayProtocol?.protocolId) {
            getProtocol(assayProtocol.protocolId, assayProtocol.name, true);
        } else if (!assayProtocol && params?.provider) {
            getProtocol(undefined, params.provider, false);
        } else if (assayProtocol) {
            setProtocol(assayProtocol);
        }
    }, []);

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onCancel = useCallback(() => {
        setIsDirty(false);
        goBack();
    }, [setIsDirty, goBack]);

    const onComplete = useCallback(
        (model: AssayProtocolModel) => {
            const action = protocol?.name ? 'updated' : 'created';
            const type = protocol?.name ?? 'assay design';

            // set dirty state to false, so we don't check on navigation
            setIsDirty(false);
            reloadAssays();
            menuInit();
            clearAssayDefinitionCache();
            onAssayDesignChange(assayDefinition?.protocolSchemaName); // Issue 39097

            // wait a bit for the menu invalidate to take
            createNotification(`Successfully ${action} ${type}.`, true, () =>
                navigate(
                    model?.providerName && model?.name
                        ? AppURL.create(ASSAYS_KEY, model.providerName, model.name)
                        : AppURL.create(ASSAYS_KEY)
                )
            );
        },
        [assayDefinition, protocol, reloadAssays, menuInit, createNotification, navigate]
    );

    const subtitle = protocol?.protocolId ? 'Edit Assay Design' : 'Create a New Assay Design';
    const hideAdvancedProperties = sampleManagerIsPrimaryApp() && !hasPremiumModule();

    // Assay design page title is protocol or provider name
    let title = 'Assay Design';
    if (protocol?.name) {
        title = protocol.name;
    } else if (showProviderName && protocol?.providerName) {
        if (protocol.providerName === GENERAL_ASSAY_PROVIDER_NAME) {
            title = 'Standard';
        } else {
            title = protocol.providerName;
        }
        title += ' Assay';
    }
    const saveButtonText = protocol?.protocolId ? `Finish Updating ${title}` : `Finish Creating ${title}`;

    // Show empty batches in non-excluded assay providers
    const hideEmptyBatches = protocol && REMOVE_BATCH_DOMAIN_ASSAYS.indexOf(protocol.providerName) !== -1;

    if (!user.hasDesignAssaysPermission()) {
        return <InsufficientPermissionsPage title={subtitle} />;
    } else if (!protocol && !hasError) {
        return <LoadingPage title={title} />;
    }

    // Intentionally not showing buttons in header, for consistency with other domain editing pages
    return (
        <Page title={title + ' - ' + subtitle} hasHeader>
            <AssayHeader menu={menu} title={title} subTitle={subtitle} description={ASSAY_DESIGNER_HEADER} />
            {(protocol.exception || hasError) && (
                <Alert>{getActionErrorMessage('There was a problem loading the assay design.', 'assay design')}</Alert>
            )}
            {!protocol.exception && !hasError && (
                <AssayDesignerPanels
                    appPropertiesOnly={hideAdvancedProperties}
                    appDomainHeaders={requireSampleField ? Map({ Data: renderSampleRequiredPanelHeader }) : undefined}
                    appIsValidMsg={requireSampleField ? protocolHasSample : undefined}
                    hideEmptyBatchDomain={hideEmptyBatches}
                    initModel={protocol}
                    onChange={onChange}
                    onCancel={onCancel}
                    onComplete={onComplete}
                    domainFormDisplayOptions={{
                        hideConditionalFormatting: hideAdvancedProperties,
                        hideStudyPropertyTypes: true,
                        hideFilePropertyType: hideAdvancedProperties,
                    }}
                    saveBtnText={saveButtonText}
                    useTheme={false}
                />
            )}
        </Page>
    );
});
