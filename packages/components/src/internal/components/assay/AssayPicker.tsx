import React, {FC, memo, SyntheticEvent, useCallback, useState} from "react";
import { Col, Nav, NavItem, Row, Tab, TabContainer } from "react-bootstrap";
import {AssayContainerLocation} from "./AssayContainerLocation";
import {SpecialtyAssayPanel} from "./SpecialtyAssayPanel";
import {AssayDesignUploadPanel} from "./AssayDesignUploadPanel";
import {StandardAssayPanel} from "./StandardAssayPanel";


export const enum AssayPickerTabs {
    STANDARD_ASSAY_TAB = 'standard',
    SPECIALTY_ASSAY_TAB = 'specialty',
    XAR_IMPORT_TAB = 'import'
}

interface AssayPickerProps {

}

const values = [{value: 'first', display: 'First'}, {value: 'second', display: 'Second'}]
const specialty = [{value: 'first', display: 'First', description: 'This is the first', fileTypes: ['XLS', 'XLSX']},
    {value: 'second', display: 'Second', description: 'This is the second specialty assay type. This type is second in the list ' +
            'because it is in between the first and the third specialty assay type. Select the second dropdown option to select this assay.', fileTypes: ['XLS', 'XLSX']},
    {value: 'third', display: 'Third', description: 'Third description.', fileTypes: ['XLS', 'XLSX', 'Flow', 'TSV', 'CSV', 'txt', 'py', 'java', 'js', 'doc', 'docx']}]

export const AssayPicker: FC<AssayPickerProps> = memo(props => {

    const [ tabSelection, setTabSelection ] = useState(AssayPickerTabs.STANDARD_ASSAY_TAB)
    const [ containerValue, setContainerValue ] = useState<string>()
    const [ specialtyValue, setSpecialtyValue ] = useState<number>(0)

    const onTabChange = useCallback((event: SyntheticEvent<TabContainer, Event>) => {
        setTabSelection(event as any) // Crummy cast to make TS happy
    }, []);

    const onContainerChange = useCallback((value) => {
        setContainerValue(value)
    }, []);

    const onSpecialtyAssayChange = useCallback((value) => {
        const index = specialty.findIndex(val => val.value === value)
        if (index > -1)
            setSpecialtyValue(index);
    }, []);

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
                                    <AssayContainerLocation values={values} selected={containerValue} onChange={onContainerChange}/>
                                </StandardAssayPanel>
                            </Tab.Pane>
                            <Tab.Pane className={'margin-bottom margin-top'} eventKey={AssayPickerTabs.SPECIALTY_ASSAY_TAB}>
                                <SpecialtyAssayPanel values={specialty} selected={specialty[specialtyValue]} onChange={onSpecialtyAssayChange}>
                                    <AssayContainerLocation values={values} selected={containerValue} onChange={onContainerChange}/>
                                </SpecialtyAssayPanel>
                            </Tab.Pane>
                            <Tab.Pane className={'margin-bottom margin-top'} eventKey={AssayPickerTabs.XAR_IMPORT_TAB}>
                                <AssayDesignUploadPanel onUpload={onXarUpload}/>
                            </Tab.Pane>
                        </Tab.Content>
                    </Col>
                </Row>
            </Tab.Container>
        </div>
    )

});
