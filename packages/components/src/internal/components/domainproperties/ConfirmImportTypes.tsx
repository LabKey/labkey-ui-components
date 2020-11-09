import React, { PureComponent } from 'react';

import {ConfirmModal} from "../../..";

interface Props {
    error: any;
    show: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    designerType: String;
}

export default class ConfirmImportTypes extends PureComponent<Props> {
    render() {
        const { error, onConfirm, onCancel, show, designerType } = this.props;

        return (
            <ConfirmModal
                show={show}
                title='Error Importing File'
                msg={
                    <>
                        <div>
                            <p>
                                There was an error while trying to import the selected file. <b> Should you choose to continue,
                                 no importable data will be present in your created {designerType}. </b> You may resolve the problem below by
                                returning to your Field Editor and rectifying the error.
                            </p>

                            <ul>
                                {error && error.errors.map((error, index) => <li key={index}> {error.exception} </li>)}
                            </ul>
                        </div>
                    </>
                }
                onConfirm={onConfirm}
                onCancel={onCancel}
                confirmButtonText={`Continue to ${designerType}`}
                cancelButtonText='Return'
            />
        );
    }
}
