import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { WithRouterProps } from 'react-router';

import { ActionURL } from '@labkey/api';

import { Button } from 'react-bootstrap';

import { AssayPicker, AssayPickerSelectionModel } from '../internal/components/assay/AssayPicker';
import { AppURL } from '../internal/url/AppURL';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/constants';
import { useServerContext } from '../internal/components/base/ServerContext';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { Page } from '../internal/components/base/Page';
import { Section } from '../internal/components/base/Section';

export const excludedAssayProviders = ['Protein Expression Matrix', 'Expression Matrix'];

export const AssayDesignSelectPage: FC<WithRouterProps> = memo(props => {
    const { router } = props;
    const [assayPickerSelection, setAssayPickerSelection] = useState<Partial<AssayPickerSelectionModel>>(() => ({
        container: '',
        file: undefined,
        provider: undefined,
        tab: undefined,
    }));

    const tab = useMemo(() => ActionURL.getParameter('tab'), []);

    const onChange = useCallback((model: AssayPickerSelectionModel) => {
        setAssayPickerSelection(model);
    }, []);

    const onSubmit = useCallback(() => {
        router.push(AppURL.create('assaydesign', assayPickerSelection.provider.name).toString());
    }, [assayPickerSelection]);

    const label =
        !assayPickerSelection.provider || assayPickerSelection.provider.name === GENERAL_ASSAY_PROVIDER_NAME
            ? 'Standard'
            : assayPickerSelection.provider.name;

    const { user } = useServerContext();
    const subTitle = 'New Assay';

    if (!user.hasDesignAssaysPermission()) {
        return <InsufficientPermissionsPage title={subTitle} />;
    }

    return (
        <Page hasHeader={false} title={subTitle}>
            <Section caption="Choose Assay Type" panelClassName="assay-designer-section" title="Assay Type">
                <AssayPicker
                    defaultTab={tab}
                    excludedProviders={excludedAssayProviders}
                    hasPremium
                    onChange={onChange}
                    showContainerSelect={false}
                    showImport={false}
                />

                <div className="margin-top">
                    <Button onClick={router.goBack}>Cancel</Button>
                    <Button bsStyle="success" className="pull-right" onClick={onSubmit}>
                        Choose {label} Assay
                    </Button>
                </div>
            </Section>
        </Page>
    );
});
