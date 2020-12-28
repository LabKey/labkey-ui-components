import React, {FC, memo, SyntheticEvent, useCallback, useEffect, useState} from "react";
import { Col, Nav, NavItem, Row, Tab, TabContainer } from "react-bootstrap";
import {AssayContainerLocation} from "./AssayContainerLocation";
import {SpecialtyAssayPanel} from "./SpecialtyAssayPanel";
import {AssayDesignUploadPanel} from "./AssayDesignUploadPanel";
import {StandardAssayPanel} from "./StandardAssayPanel";
import {
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
    createNotification,
    deleteRows,
    Principal
} from "../../..";
import {ActionURL, Ajax, Utils} from "@labkey/api";
import {List} from "immutable";


export interface AssayProvider {
    name: string
    description: string
    fileTypes: Array<string>
}

interface AssayProvidersOptions {
    providers: Array<AssayProvider>
    locations: {[key: string]: string}
    defaultLocation: string
}

export const enum AssayPickerTabs {
    STANDARD_ASSAY_TAB = 'standard',
    SPECIALTY_ASSAY_TAB = 'specialty',
    XAR_IMPORT_TAB = 'import'
}

interface AssayPickerProps {
    showImport: boolean
}

const queryAssayProviders = (): Promise<AssayProvidersOptions> => {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('assay', 'getAssayDesignSelectOptions.api'),
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
}

const getAssayProviders = async(): Promise<AssayProvidersOptions> => {

    try {
        return await queryAssayProviders();
    } catch (error) {
        console.error(error);
        createNotification({message: error, alertClass: 'danger'})
    }
}

const getSelectedProvider = (providers: Array<AssayProvider>, name: string): AssayProvider => {
    return providers?.find((p) => {
        return p.name === name;
    })
}

export const AssayPicker: FC<AssayPickerProps> = memo(props => {
    const { showImport } = props;

    const [ providers, setProviders ] = useState<Array<AssayProvider>>()
    const [ containers, setContainers ] = useState<{[key: string]: string}>()
    const [ tabSelection, setTabSelection ] = useState(AssayPickerTabs.STANDARD_ASSAY_TAB)
    const [ containerValue, setContainerValue ] = useState<string>()
    const [ selectedProvider, setSelectedProvider ] = useState<AssayProvider>()

    useEffect(() => {
        getAssayProviders().then((options) => {
                setProviders(options.providers);
                setContainers(options.locations);
                setContainerValue(options.defaultLocation);
                setSelectedProvider(getSelectedProvider(options.providers,"General"))
            }
        );
    }, []);

    const onTabChange = useCallback((event: SyntheticEvent<TabContainer, Event>) => {
        setTabSelection(event as any) // Crummy cast to make TS happy
    }, []);

    const onContainerChange = useCallback((value) => {
        setContainerValue(value)
    }, []);

    const onSelectedProviderChange = useCallback((value) => {
        setSelectedProvider(getSelectedProvider(providers, value));
    }, [providers]);

    const onXarUpload = useCallback((file) => {

    }, []);

    return (
        <div>
            <Tab.Container id="assay-picker-tabs" onSelect={onTabChange} activeKey={tabSelection} defaultActiveKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>
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
                            <Tab.Pane className={'margin-bottom margin-top'} eventKey={AssayPickerTabs.STANDARD_ASSAY_TAB}>
                                <StandardAssayPanel>
                                    <AssayContainerLocation locations={containers} selected={containerValue} onChange={onContainerChange}/>
                                </StandardAssayPanel>
                            </Tab.Pane>
                            <Tab.Pane className={'margin-bottom margin-top'} eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>
                                <SpecialtyAssayPanel values={providers} selected={selectedProvider} onChange={onSelectedProviderChange}>
                                    <AssayContainerLocation locations={containers} selected={containerValue} onChange={onContainerChange}/>
                                </SpecialtyAssayPanel>
                            </Tab.Pane>
                            { showImport &&
                                <Tab.Pane className={'margin-bottom margin-top'} eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>
                                    <AssayDesignUploadPanel onUpload={onXarUpload}/>
                                </Tab.Pane>
                            }
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    )

});
