import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { boolean, number, text, withKnobs } from '@storybook/addon-knobs'
import data from "../data/example_browse_data_tree_api.json";
import { flattenApiResponse } from "../model";
import { ReportList, ReportItemModal } from "../components/ReportList";
import "./stories.scss";

const exampleReports = flattenApiResponse(data);

class ReportListContainer extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            selectedReport: null,
        };
    }

    onReportClicked = (report) => {
        this.setState(() => {
            return { selectedReport: report };
        })
    };

    onClose = () => {
        this.setState(() => {
            return {selectedReport: null};
        });
    };

    render() {
        const selectedReport = this.state.selectedReport;
        let modal = null;

        if (this.state.selectedReport !== null) {
            modal = <ReportItemModal report={selectedReport} onClose={this.onClose} />
        }

        return (
            <>
                <ReportList loading={false} reports={this.props.reports} onReportClicked={this.onReportClicked}/>
                {modal}
            </>
        );
    }
}

storiesOf('ReportList', module)
    .addDecorator(withKnobs)
    .add('No Data', () =>{
        return <ReportList loading={false} reports={[]} onReportClicked={() =>{}}/>
    })
    .add('With Data', () => {
        const onReportClicked = report => console.log('Report clicked:', report);

        return (
            <ReportList loading={false} reports={exampleReports} onReportClicked={onReportClicked}/>
        );
    })
    .add('Loading', () => {
        return <ReportList loading={true} reports={[]} onReportClicked={() =>{}}/>
    })
    .add('With Modal', () =>{
        return <ReportListContainer reports={exampleReports}/>;
    });
