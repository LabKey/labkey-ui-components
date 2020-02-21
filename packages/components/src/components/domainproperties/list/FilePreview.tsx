import React from 'react';

import { convertRowDataIntoPreviewData } from '../../files/actions';
import { ToggleWithInputField } from '../../forms/input/ToggleWithInputField';
import { FilePreviewGrid } from '../../files/FilePreviewGrid';
import { InferDomainResponse } from '../../..';

interface Props {
    filePreviewData: InferDomainResponse;
    setFileImportData: any;
    fileData: File;
}

interface State {
    importData: boolean;
}

export class FilePreview extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            importData: false,
        };
    }

    render() {
        const { filePreviewData, setFileImportData, fileData } = this.props;
        const { importData } = this.state;

        if (filePreviewData == null) {
            return;
        }

        const data = convertRowDataIntoPreviewData(filePreviewData.get('data'), 4);

        return (
            <div style={{ marginTop: '15px' }}>
                <div className="domain-form__file-preview__text"> Import data from this file upon list creation? </div>
                <div className="domain-form__file-preview__toggle">
                    <ToggleWithInputField
                        active={this.state.importData}
                        id="importData"
                        onClick={() => {
                            this.setState(state => {
                                if (!state.importData) {
                                    setFileImportData(fileData);
                                }
                                return { importData: !state.importData };
                            });
                        }}
                        on="Enabled"
                        off="Disabled"
                    />
                </div>

                {importData && (
                    <div>
                        <FilePreviewGrid previewCount={4} data={data} header={null} />
                    </div>
                )}
            </div>
        );
    }
}
