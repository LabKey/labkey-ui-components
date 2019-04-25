import * as React from 'react';
import { Modal } from "react-bootstrap";
import { ReactNode } from "react";
import { QueryInfoForm, QueryInfoFormProps } from "../forms/QueryInfoForm";

interface BulkUpdateModalProps extends QueryInfoFormProps {
    maxNumber?: number,
    title?: string,
    header?: ReactNode
}

interface State {
    show: boolean
}

export class BulkUpdateModal extends React.Component<BulkUpdateModalProps, State> {

    static defaultProps = {
        maxNumber: 100
    };

    constructor(props: BulkUpdateModalProps) {
        super(props);
        this.onHide = this.onHide.bind(this);

        this.state = {
            show: true
        }
    }

    onHide() {
        this.setState( () => ({show:  false}));
    }

    render() {
        const { queryInfo, schemaQuery, title, header } = this.props;

        return (
            <Modal show={this.state.show} onHide={this.onHide}>
                {title && (
                    <Modal.Header>
                        <Modal.Title>{title}</Modal.Title>
                    </Modal.Header>

                )}
                <Modal.Body>
                    {header}
                    <QueryInfoForm
                        queryInfo={queryInfo}
                        schemaQuery={schemaQuery}
                    />
                </Modal.Body>
            </Modal>
        )
    }
}