import React from 'react';
import { convertRowDataIntoPreviewData } from '../files/actions';
import { ToggleWithInputField } from '../forms/input/ToggleWithInputField';
import { FilePreviewGrid } from '../files/FilePreviewGrid';
import { InferDomainResponse } from '../base/models/model';

interface Props {
    noun: string;
    filePreviewData: InferDomainResponse;
    setFileImportData: (file: File) => any;
    fileData: File;
}

interface State {
    importData: boolean;
}

export class ImportDataFilePreview extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            importData: false,
        };
    }

    onToggleClick = () => {
        const { setFileImportData, fileData } = this.props;

        this.setState(state => ({ importData: !state.importData }), () => {
            setFileImportData(this.state.importData ? fileData : undefined);
        });
    };

    render() {
        const { filePreviewData, noun } = this.props;
        const { importData } = this.state;

        if (filePreviewData == null) {
            return;
        }

        const data = convertRowDataIntoPreviewData(filePreviewData.get('data'), 4);

        return (
            <div className='domain-form__file-preview'>
                <div className="domain-form__file-preview__text">Import data from this file upon {noun} creation? </div>
                <div className="domain-form__file-preview__toggle">
                    <ToggleWithInputField
                        active={importData}
                        id="importData"
                        onClick={this.onToggleClick}
                        on="Import Data"
                        off="Don't Import"
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
