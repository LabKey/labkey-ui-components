/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { fromJS, Map } from 'immutable';
import { Domain } from '@labkey/api';

import { DomainDesign, DomainDetails } from '../internal/components/domainproperties/models';
import { useRouteLeave } from '../internal/util/RouteLeave';
import { useServerContext } from '../internal/components/base/ServerContext';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { useContainerUser } from '../internal/components/container/actions';
import { MEDIA_KEY, SAMPLES_KEY } from '../internal/app/constants';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { AppURL } from '../internal/url/AppURL';
import { hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../internal/components/domainproperties/constants';
import { NotFound } from '../internal/components/base/NotFound';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { Alert } from '../internal/components/base/Alert';
import { getActionErrorMessage } from '../internal/util/messaging';
import { SampleTypeDesigner } from '../internal/components/domainproperties/samples/SampleTypeDesigner';

import { useAppContext } from '../internal/AppContext';
import { CommonPageProps } from '../internal/models';

import { isAppHomeFolder } from '../internal/app/utils';

import { SampleTypeBasePage } from './SampleTypeBasePage';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';
import { onSampleTypeChange } from './actions';

const DESIGNER_HEADER =
    'Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data.';
const BRAND_PRIMARY_COLOR = '#2980b9';

function createDefaultSampleType(
    domainDesign?: DomainDesign,
    prefix?: string,
    showStudyProperties = false
): DomainDetails {
    const nameExpressionVal = (prefix ?? '') + 'S-${genId}';

    return DomainDetails.create(
        Map<string, any>({
            domainDesign: {
                ...domainDesign?.toJS(),
                domainKindName: Domain.KINDS.SAMPLE_TYPE,
                allowTimepointProperties: showStudyProperties, // Because LKB is not yet integrated with Study, we do not display timepoint-related field Data Types
            },
            options: Map<string, any>(
                fromJS({
                    nameExpression: nameExpressionVal,
                    labelColor: BRAND_PRIMARY_COLOR,
                })
            ),
            domainKindName: Domain.KINDS.SAMPLE_TYPE,
        })
    );
}

type Props = CommonPageProps & WithRouterProps;

export const SampleTypeDesignPage: FC<Props> = memo(props => {
    const { params, menu, menuInit, navigate, router, routes } = props;
    const {
        dataClassAliasCaption,
        dataClassParentageLabel,
        dataClassTypeCaption,
        getMetricUnitOptions,
        hideConditionalFormatting,
        isValidParentOptionFn,
        readOnlyQueryNames,
        showStudyProperties,
        showParentLabelPrefix,
        useSeparateDataClassesAliasMenu,
        validateNewSampleTypeUnit,
    } = useSampleTypeAppContext();
    const [loadingSampleType, setLoadingSampleType] = useState<boolean>(true);
    const [sampleType, setSampleType] = useState<DomainDetails>();
    const [hasError, setHasError] = useState(false);
    const [_, setIsDirty] = useRouteLeave(router, routes);
    const [domainContainerPath, setDomainContainerPath] = useState<string>();
    const { api } = useAppContext();
    const { container, moduleContext } = useServerContext();
    const { createNotification } = useNotificationsContext();
    const domainContainerUser = useContainerUser(domainContainerPath);
    const isInOtherFolder = domainContainerPath !== container.path;
    const isMedia = useMemo(() => routes[1]?.path === MEDIA_KEY, [routes]);
    const queryName = useMemo(() => {
        let query = params.sampleType;
        if (isMedia) {
            query = routes[2]?.path;
        }
        return query;
    }, [isMedia, params, routes]);

    const schemaQuery = useMemo(() => new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, queryName), [queryName]);

    const init = async () => {
        if (queryName) {
            // Clear the current sample type so the Designer gets unmounted
            setSampleType(undefined);
            setLoadingSampleType(true);

            try {
                // Load the associated queryInfo to determine where the domain resides
                const details = await api.query.getQueryDetails({
                    queryName: schemaQuery.queryName,
                    schemaName: schemaQuery.schemaName,
                });
                setDomainContainerPath(details.domainContainerPath);

                // Request the DomainDetails from the domain's container path
                const sampleType_ = await api.samples.getSampleTypeDetails(
                    schemaQuery,
                    undefined,
                    details.domainContainerPath
                );
                setHasError(false);

                // Because LKB is not yet integrated with Study, we do not display timepoint-related field Data Types
                let updatedSampleType = sampleType_.setIn(
                    ['domainDesign', 'allowTimepointProperties'],
                    showStudyProperties
                ) as DomainDetails;

                if (readOnlyQueryNames?.map(q => q.toLowerCase()).indexOf(queryName.toLowerCase()) > -1) {
                    updatedSampleType = updatedSampleType.set('nameReadOnly', true) as DomainDetails;
                }

                setSampleType(updatedSampleType);
            } catch (reason) {
                console.error(reason);
                setHasError(true);
            }
        } else {
            try {
                const sampleType_ = await api.samples.getSampleTypeDetails();
                const expressionOptions = await api.entity.loadNameExpressionOptions();
                setDomainContainerPath(container.path);
                setSampleType(
                    createDefaultSampleType(sampleType_.domainDesign, expressionOptions.prefix, showStudyProperties)
                );
            } catch (reason) {
                console.error(reason);
                setSampleType(createDefaultSampleType());
            }
        }
        setLoadingSampleType(false);
    };

    useEffect(() => {
        init();
    }, [queryName]);

    const goToSampleType = useCallback(
        (name?: string) => {
            const queryName_ = name ?? schemaQuery.queryName;
            if (queryName_) {
                const key = isMedia ? MEDIA_KEY : SAMPLES_KEY;
                navigate(AppURL.create(key, queryName_), true);
            } else {
                router.goBack();
            }
        },
        [isMedia, navigate, router, schemaQuery.queryName]
    );

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onCancel = useCallback(() => {
        setIsDirty(false);
        router.goBack();
    }, [router, setIsDirty]);

    const onComplete = useCallback(
        (domain: DomainDesign) => {
            setIsDirty(false);
            onSampleTypeChange(schemaQuery, domainContainerPath);
            menuInit();

            const newName = domain.name;
            const hasNameChange = newName !== schemaQuery.queryName;
            goToSampleType(hasNameChange ? newName : undefined);

            // wait a bit for the invalidation to take
            const action = queryName ? 'updated' : 'created';
            createNotification(`Successfully ${action} sample type.`, true);
        },
        [setIsDirty, schemaQuery, domainContainerPath, menuInit, goToSampleType, queryName, createNotification]
    );

    const isUpdate = useMemo(() => {
        return !!params?.sampleType || isMedia;
    }, [params, isMedia]);

    const metricUnit = useMemo(() => {
        return sampleType?.get('options')?.get('metricUnit');
    }, [sampleType]);

    const title = sampleType?.domainDesign?.name ?? 'Sample Type';
    const pageTitle = isUpdate ? 'Edit Sample Type Design' : 'Create a New Sample Type';
    const saveButtonText = isUpdate ? `Finish Updating ${title}` : `Finish Creating ${title}`;
    const hasActiveJob = hasActivePipelineJob(menu, SAMPLES_KEY, queryName);

    const validateStorageUnit = useCallback(
        designerDetails => {
            const newUnit = designerDetails['metricUnit'];
            return validateNewSampleTypeUnit(sampleType, newUnit);
        },
        [sampleType]
    );

    const includeStorageOptions = useMemo(() => {
        return !isMedia;
    }, [isMedia]);

    const domainFormDisplayOptions = useMemo(() => {
        return {
            ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
            ...{
                domainKindDisplayName: 'sample type',
                hideConditionalFormatting,
            },
        };
    }, [hideConditionalFormatting]);

    if (menu.isLoaded && !loadingSampleType && !sampleType) {
        return <NotFound />;
    } else if (menu.isLoading || !domainContainerUser.isLoaded || !sampleType) {
        return <LoadingPage title={pageTitle} />;
    } else if (!domainContainerUser.user.hasDesignSampleTypesPermission()) {
        return <InsufficientPermissionsPage title={pageTitle} />;
    } else if (!isUpdate && !isAppHomeFolder(container, moduleContext)) {
        return <NotFound />;
    }

    return (
        <SampleTypeBasePage
            title={title}
            hasActiveJob={hasActiveJob}
            subtitle={pageTitle}
            description={DESIGNER_HEADER}
        >
            {hasError && (
                <Alert>
                    {getActionErrorMessage('There was a problem loading the sample type design.', 'sample type')}
                </Alert>
            )}
            {!hasError && sampleType && (
                <>
                    {isInOtherFolder && (
                        <Alert bsStyle="warning">
                            This is a shared sample type. Changes made here may affect other projects.
                        </Alert>
                    )}
                    <SampleTypeDesigner
                        initModel={sampleType}
                        saveBtnText={saveButtonText}
                        onChange={onChange}
                        onComplete={onComplete}
                        onCancel={onCancel}
                        includeDataClasses
                        useSeparateDataClassesAliasMenu={useSeparateDataClassesAliasMenu}
                        sampleAliasCaption="Parent Alias"
                        dataClassAliasCaption={dataClassAliasCaption}
                        dataClassTypeCaption={dataClassTypeCaption}
                        dataClassParentageLabel={dataClassParentageLabel}
                        isValidParentOptionFn={isValidParentOptionFn}
                        useTheme={false}
                        appPropertiesOnly={includeStorageOptions}
                        showAliquotOptions
                        showLinkToStudy={showStudyProperties}
                        showParentLabelPrefix={showParentLabelPrefix}
                        metricUnitProps={{
                            includeMetricUnitProperty: includeStorageOptions,
                            metricUnitLabel: 'Amount Display Units',
                            metricUnitRequired: includeStorageOptions && (!isUpdate || metricUnit != null), // allow existing sample types without unit to continue to have blank unit
                            metricUnitHelpMsg:
                                'Sample amount will be displayed using the selected metric unit.',
                            metricUnitOptions: getMetricUnitOptions(),
                        }}
                        aliquotNamePatternProps={{
                            showAliquotNameExpression: true,
                        }}
                        validateProperties={isUpdate && includeStorageOptions ? validateStorageUnit : undefined}
                        domainFormDisplayOptions={domainFormDisplayOptions}
                        showGenIdBanner={isUpdate}
                    />
                </>
            )}
        </SampleTypeBasePage>
    );
});
