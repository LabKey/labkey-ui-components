import React, { FC, memo, ReactNode, useCallback, useState } from 'react';
import { Col, FormControl, Panel, Row } from 'react-bootstrap';

import { Container } from '@labkey/api';

import { DATE_FORMATS_TOPIC, HelpLink, JavaDocsLink } from '../../util/helpLinks';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { getDateFormat, getDateTimeFormat, getTimeFormat } from '../../util/Date';
import { Alert } from '../base/Alert';
import { FolderAPIWrapper, UpdateProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { incrementClientSideMetricCount } from '../../actions';
import { LOOK_AND_FEEL_METRIC } from '../productnavigation/constants';

interface Props {
    api: FolderAPIWrapper;
    container?: Container;
    onChange?: () => void;
    onSuccess?: (reload?: boolean) => void; // used by react-test only
}

const DATETIME_HELP_CONTENT = (
    <>
        <p>Examples for Jan 20, 2023 01:45 PM:</p>
        <table className="table-bordered margin-bottom help-table">
            <thead>
                <tr>
                    <th>Format String</th>
                    <th>Display Result</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>yyyy-MM-dd HH:mm</td>
                    <td>2023-01-20 13:45</td>
                </tr>
                <tr>
                    <td>MM/dd/yyyy hh:mm aa</td>
                    <td>01/20/2023 01:45 PM</td>
                </tr>
                <tr>
                    <td>dd-MM-yy</td>
                    <td>20-01-23</td>
                </tr>
                <tr>
                    <td>dd-MMM-yyyy</td>
                    <td>20-Jan-2023</td>
                </tr>
            </tbody>
        </table>
    </>
);

const TIME_HELP_CONTENT = (
    <>
        <p>Examples for 01:45:15 PM:</p>
        <table className="table-bordered margin-bottom help-table">
            <thead>
                <tr>
                    <th>Format String</th>
                    <th>Display Result</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>HH:mm</td>
                    <td>13:45</td>
                </tr>
                <tr>
                    <td>hh:mm aa</td>
                    <td>01:45 PM</td>
                </tr>
                <tr>
                    <td>HH:mm:ss</td>
                    <td>13:45:15</td>
                </tr>
                <tr>
                    <td>hh:mm:ss</td>
                    <td>01:45:15 PM</td>
                </tr>
            </tbody>
        </table>
    </>
);

const getProjectDateTimeHelp = (content: ReactNode): ReactNode => {
    return (
        <LabelHelpTip title="Date-time format">
            <p>
                To control how a date or time value is displayed, provide a string format compatible with the Java{' '}
                <JavaDocsLink urlSuffix="java/text/SimpleDateFormat.html">SimpleDateFormat</JavaDocsLink> class.
            </p>
            {content}
            <p>
                Learn more about using <HelpLink topic={DATE_FORMATS_TOPIC}>Date and Time formats</HelpLink> in LabKey.
            </p>
        </LabelHelpTip>
    );
};

export const ProjectLookAndFeelForm: FC<Props> = memo(props => {
    const { api, onSuccess, container, onChange } = props;
    const [dateTimeFormat, setDateTimeFormat] = useState<string>(() => getDateTimeFormat(container));
    const [dateFormat, setDateFormat] = useState<string>(() => getDateFormat(container));
    const [timeFormat, setTimeFormat] = useState<string>(() => getTimeFormat(container));
    const [dirty, setDirty] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const _onChange = useCallback(evt => {
        const name = evt.target.name;
        switch (name) {
            case 'datetime':
                setDateTimeFormat(evt.target.value);
                break;
            case 'date':
                setDateFormat(evt.target.value);
                break;
            case 'time':
                setTimeFormat(evt.target.value);
                break;
        }
        setDirty(true);
        onChange?.();
    }, []);

    const onSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError(undefined);

        try {
            const options: UpdateProjectSettingsOptions = {
                defaultDateFormat: dateFormat,
                defaultDateTimeFormat: dateTimeFormat,
                defaultTimeFormat: timeFormat,
            };

            await api.updateProjectLookAndFeelSettings(options, container.path);
            incrementClientSideMetricCount(LOOK_AND_FEEL_METRIC, 'defaultDateTimeFormat');
            setDirty(false);
            onSuccess?.(true);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to update display settings');
        } finally {
            setIsSaving(false);
        }
    }, [api, isSaving, onSuccess, dateTimeFormat, dateFormat, timeFormat, container]);

    return (
        <Row>
            <Col xs={12}>
                <Panel title="Display Settings">
                    <Panel.Heading>Display Settings</Panel.Heading>
                    <Panel.Body>
                        <Alert>{error}</Alert>
                        <Row className="form-group">
                            <Col xs={12} md={3}>
                                <div>
                                    Default display format for date-times
                                    {getProjectDateTimeHelp(DATETIME_HELP_CONTENT)}
                                </div>
                            </Col>
                            <Col xs={12} md={9}>
                                <FormControl
                                    type="text"
                                    id="datetime-format-input"
                                    name="datetime"
                                    value={dateTimeFormat}
                                    onChange={_onChange}
                                    placeholder="Enter display format for date-times"
                                />
                            </Col>
                        </Row>
                        <Row className="form-group">
                            <Col xs={12} md={3}>
                                <div>
                                    Default display format for date
                                    {getProjectDateTimeHelp(DATETIME_HELP_CONTENT)}
                                </div>
                            </Col>
                            <Col xs={12} md={9}>
                                <FormControl
                                    type="text"
                                    id="date-format-input"
                                    name="date"
                                    value={dateFormat}
                                    onChange={_onChange}
                                    placeholder="Enter display format for date"
                                />
                            </Col>
                        </Row>
                        <Row className="form-group">
                            <Col xs={12} md={3}>
                                <div>
                                    Default display format for time values
                                    {getProjectDateTimeHelp(TIME_HELP_CONTENT)}
                                </div>
                            </Col>
                            <Col xs={12} md={9}>
                                <FormControl
                                    type="text"
                                    id="time-format-input"
                                    name="time"
                                    value={timeFormat}
                                    onChange={_onChange}
                                    placeholder="Enter display format for time-only values"
                                />
                            </Col>
                        </Row>
                        <div className="pull-right">
                            <button
                                className="pull-right alert-button btn btn-success"
                                disabled={isSaving || !dirty}
                                onClick={onSave}
                                type="button"
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </Panel.Body>
                </Panel>
            </Col>
        </Row>
    );
});
