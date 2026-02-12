import { Modal } from '../../../Modal';
import React, { FC, useCallback, useState } from 'react';
import { sendNamingPatternPrompt } from '../entities/EntityDetailsForm';
import { SampleTypeModel } from './models';
import { LoadingSpinner } from '../../base/LoadingSpinner';

interface Props {
    onClose: () => void;
    sampleType: SampleTypeModel;
}

export const NamingPatternOptionsModal: FC<Props> = props => {
    const { onClose, sampleType } = props;
    const [includeDate, setIncludeDate] = useState<boolean>(false);
    const [includeAncestors, setIncludeAncestors] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [response, setResponse] = useState<string>(undefined);

    const toggleIncludeDate = useCallback(() => {
        setIncludeDate(!includeDate);
        setResponse(undefined);
    }, [includeDate]);

    const toggleIncludeAncestors = useCallback(() => {
        setIncludeAncestors(!includeAncestors);
        setResponse(undefined);
    }, [includeAncestors]);

    const onConfirm = useCallback(async () => {
        setLoading(true);
        let prompt = ' aliquots in samples.' + sampleType.name + ' that includes ';
        if (includeDate) {
            prompt += ' the created date ';
        }
        if (includeAncestors) {
            prompt += ' ancestors of the sample';
        }
        console.log('Sending aliquot naming pattern prompt: ', prompt);
        const response_ = await sendNamingPatternPrompt(prompt, 'SampleType', sampleType.rowId);
        console.log('Response is ', response_);
        setResponse(response_);
        setLoading(false);
    }, [includeAncestors, includeDate, sampleType.name, sampleType.rowId]);

    return (
        <Modal
            cancelText="Thanks"
            canConfirm={!loading}
            confirmText="Suggest Something"
            onCancel={onClose}
            onConfirm={onConfirm}
            title="Aliquot Naming Pattern Helper"
        >
            What kinds of features do you want in your Aliquot naming pattern?
            <div className="row">
                <div className="col-xs-1">
                    <input
                        checked={includeDate}
                        name="includeDate"
                        onChange={toggleIncludeDate}
                        type="checkbox"
                    />
                </div>
                <div className="col">Creation Date</div>
            </div>
            <div className="row">
                <div className="col-xs-1">
                    <input
                        checked={includeAncestors}
                        name="includeAncestors"
                        onChange={toggleIncludeAncestors}
                        type="checkbox"
                    />
                </div>
                <div className="col">Ancestors</div>

            </div>
            {loading && <LoadingSpinner msg={"Generating a suggestion..."} />}
            {!loading && !!response && (
                <div>
                    {response}
                </div>
            )}
        </Modal>
    );
};
