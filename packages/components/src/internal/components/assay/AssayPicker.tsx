import React, { FC, memo, SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Nav, NavItem, Row, Tab, TabContainer } from 'react-bootstrap';

import { ActionURL, Ajax, Utils } from '@labkey/api';

import { Map } from 'immutable';

import { createNotification } from '../../..';

import { AssayContainerLocation } from './AssayContainerLocation';
import { SpecialtyAssayPanel } from './SpecialtyAssayPanel';
import { AssayDesignUploadPanel } from './AssayDesignUploadPanel';
import { StandardAssayPanel } from './StandardAssayPanel';

export interface AssayProvider {
    name: string;
    description: string;
    fileTypes: string[];
}

interface AssayProvidersOptions {
    providers: AssayProvider[];
    locations: { [key: string]: string };
    defaultLocation: string;
}

export const enum AssayPickerTabs {
    STANDARD_ASSAY_TAB = 'standard',
    SPECIALTY_ASSAY_TAB = 'specialty',
    XAR_IMPORT_TAB = 'import',
}

interface AssayPickerProps {
    showImport: boolean;
    onProviderSelect: (provider: string) => void;
    onContainerSelect: (container: string) => void;
    onFileChange: (file: File) => void;
    setIsFileUpload: (upload: boolean) => void;
    selectedTab?: AssayPickerTabs
}

const queryAssayProviders = (): Promise<AssayProvidersOptions> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'getAssayTypeSelectOptions.api'),
            method: 'GET',
            scope: this,
            success: Utils.getCallbackWrapper(data => {
                resolve(data);
            }),
            failure: Utils.getCallbackWrapper(error => {
                reject(error);
            }),
        });
    });
};

const getAssayProviders = async (): Promise<AssayProvidersOptions> => {
    try {
        return await queryAssayProviders();
    } catch (error) {
        console.error(error);
        createNotification({ message: error, alertClass: 'danger' });
    }
};

const getSelectedProvider = (providers: AssayProvider[], name: string): AssayProvider => {
    return providers?.find(p => {
        return p.name === name;
    });
};

export const AssayPicker: FC<AssayPickerProps> = memo(props => {
    const { showImport, onProviderSelect, onContainerSelect, onFileChange, setIsFileUpload, selectedTab } = props;

    const [providers, setProviders] = useState<AssayProvider[]>();
    const [containers, setContainers] = useState<{ [key: string]: string }>();
    const [tabSelection, setTabSelection] = useState<AssayPickerTabs>(AssayPickerTabs.STANDARD_ASSAY_TAB);
    const [containerValue, setContainerValue] = useState<string>();
    const [selectedProvider, setSelectedProvider] = useState<AssayProvider>();

    useEffect(() => {
        getAssayProviders().then(options => {
            setProviders(options.providers);
            setContainers(options.locations);
            setContainerValue(options.defaultLocation);
            setSelectedProvider(getSelectedProvider(options.providers, 'General'));

            onContainerSelect(Object.keys(options.locations)[0]);
        });
    }, []);

    useEffect(() => {
        onTabChange((selectedTab ?? AssayPickerTabs.STANDARD_ASSAY_TAB) as any);
    }, [providers])

    const onSelectedProviderChange = useCallback(
        value => {
            const provider = getSelectedProvider(providers, value);
            setSelectedProvider(provider);
            onProviderSelect(provider.name);
        },
        [providers]
    );

    const onTabChange = useCallback(
        (event: SyntheticEvent<TabContainer, Event>) => {
            const tab: AssayPickerTabs = event as any; // Crummy cast to make TS happy
            setTabSelection(tab);
            if (tab === AssayPickerTabs.STANDARD_ASSAY_TAB) {
                onProviderSelect('General');
                setIsFileUpload(false);
            } else if (tab === AssayPickerTabs.SPECIALTY_ASSAY_TAB) {
                if (providers) {
                    if (!selectedProvider || selectedProvider.name == 'General')
                    {
                        onSelectedProviderChange(providers[0].name);
                    } else
                    {
                        onProviderSelect(selectedProvider.name);
                    }
                }
                setIsFileUpload(false);
            } else {
                setIsFileUpload(true);
            }
        },
        [onSelectedProviderChange, onProviderSelect, providers, selectedProvider, setIsFileUpload]
    );

    const onContainerChange = useCallback(value => {
        setContainerValue(value);
        onContainerSelect(value);
    }, []);

    const standardProvider = useMemo((): AssayProvider => {
        if (providers) {
            return getSelectedProvider(providers, 'General');
        }
        return undefined;
    }, [providers]);

    const onFileRemove = useCallback(
        (name: string) => {
            onFileChange(undefined);
        },
        [onFileChange]
    );

    const onFileSelect = useCallback(
        (files: Map<string, File>): void => {
            const file = files.values().next().value;
            onFileChange(file);
        },
        [onFileChange]
    );

    return (
        <div>
            <Tab.Container
                id="assay-picker-tabs"
                onSelect={onTabChange}
                activeKey={tabSelection}
                defaultActiveKey={AssayPickerTabs.STANDARD_ASSAY_TAB}
            >
                <Row className="clearfix">
                    <Col sm={12}>
                        <Nav bsStyle="tabs">
                            <NavItem eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>Standard Assay</NavItem>
                            <NavItem eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>Specialty Assays</NavItem>
                            <NavItem eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>Import Assay Design</NavItem>
                        </Nav>
                    </Col>
                    <Col sm={12}>
                        <Tab.Content animation>
                            <Tab.Pane
                                className="margin-bottom margin-top"
                                eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}
                            >
                                <StandardAssayPanel provider={standardProvider}>
                                    <AssayContainerLocation
                                        locations={containers}
                                        selected={containerValue}
                                        onChange={onContainerChange}
                                    />
                                </StandardAssayPanel>
                            </Tab.Pane>
                            <Tab.Pane
                                className="margin-bottom margin-top"
                                eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                            >
                                <SpecialtyAssayPanel
                                    values={providers}
                                    selected={selectedProvider}
                                    onChange={onSelectedProviderChange}
                                >
                                    <AssayContainerLocation
                                        locations={containers}
                                        selected={containerValue}
                                        onChange={onContainerChange}
                                    />
                                </SpecialtyAssayPanel>
                            </Tab.Pane>
                            {showImport && (
                                <Tab.Pane
                                    className="margin-bottom margin-top"
                                    eventKey={AssayPickerTabs.XAR_IMPORT_TAB}
                                >
                                    <AssayDesignUploadPanel onFileChange={onFileSelect} onFileRemove={onFileRemove} />
                                </Tab.Pane>
                            )}
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    );
});
