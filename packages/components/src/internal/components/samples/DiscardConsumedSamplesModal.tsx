import React from 'react';
import { Button, Col, Modal, Row } from 'react-bootstrap';

interface Props {
    consumedSampleCount: number
    totalSampleCount: number
    onConfirm: (shouldDiscard: boolean, comment: string) => any
    onCancel: () => any
}

interface State {
    shouldDiscard: boolean
    comment: string
    submitting: boolean
}

export class DiscardConsumedSamplesModal extends React.PureComponent<Props, State> {
    _noun: string;
    _lcNoun: string;
    _nounTotal: string;
    _lcNounTotal: string;

    constructor(props: Props) {
        super(props);
        this._noun = props.consumedSampleCount > 1 ? "Samples" : "Sample";
        this._lcNoun = this._noun.toLowerCase();
        this._nounTotal = props.totalSampleCount > 1 ? "Samples" : "Sample";
        this._lcNounTotal = this._nounTotal.toLowerCase();

        this.state = {
            shouldDiscard: true,
            comment: undefined,
            submitting: false,
        }
    }

    onCancel = () => {
        this.props.onCancel();
    };

    onCommentChange = (event) => {
        const comment = event.target.value;
        this.setState(() => ({comment}));
    };

    toggleShouldDiscard = () => {
        this.setState((state) => ({shouldDiscard: !state.shouldDiscard}))
    };

    onConfirm = () => {
        const { shouldDiscard, comment } = this.state;
        this.props.onConfirm(shouldDiscard, comment);
        this.setState((state) => ({submitting: true}))
    };

    render() {
        const { consumedSampleCount, totalSampleCount } = this.props;
        const { shouldDiscard, submitting } = this.state;

        const confirmBtnText = shouldDiscard ? ("Save changes and discard consumed " + this._lcNoun) : "Update " + this._lcNounTotal + " only";
        const consumedNounDisplay = totalSampleCount === consumedSampleCount ? (totalSampleCount > 1 ? 'them' : 'it') : `${consumedSampleCount} in storage ${this._lcNoun}`;
        return (
            <Modal show={true} onHide={this.onCancel} >
                <Modal.Header closeButton>
                    <Modal.Title>{"Setting " + (consumedSampleCount > 1 ? consumedSampleCount : '') + " " + this._noun + " to Consumed"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <>
                        <div className="margin-bottom">
                            <b>
                                You are updating {totalSampleCount} {this._lcNounTotal} and setting {consumedNounDisplay} to consumed.
                                Would you like to also discard the {consumedSampleCount > 1 ? consumedSampleCount : ''} consumed {this._lcNoun} from storage?
                            </b>
                        </div>
                        {
                            <Row>
                                <Col xs={5}>
                                    <div className="form-group">
                                        <div className="form-check">
                                            <input className="form-check-input" type="checkbox"
                                                   id="discardconsumedsamples"
                                                   onChange={this.toggleShouldDiscard}
                                                   checked={shouldDiscard}/>
                                            <span className="left-spacing">Yes, discard the {this._lcNoun}</span>
                                        </div>
                                    </div>
                                </Col>
                                <Col xs={7}/>
                            </Row>
                        }
                        <div className="form-group">
                            <div className="storage-item-data">Reason for discarding</div>
                            <textarea
                                className="form-control textarea-noresize"
                                id="actionComments"
                                placeholder="Enter comments (optional)"
                                rows={5}
                                onChange={this.onCommentChange}
                                disabled={!shouldDiscard}
                            />
                        </div>
                    </>
                </Modal.Body>
                <Modal.Footer>
                    <>
                        <Button className="pull-left" disabled={submitting} onClick={this.onCancel} >Cancel</Button>
                        <Button
                            className="pull-right"
                            disabled={submitting}
                            bsStyle={shouldDiscard ? "danger" : "success"}
                            onClick={this.onConfirm}>
                            {submitting ? "Saving...": confirmBtnText}
                        </Button>
                    </>
                </Modal.Footer>
            </Modal>
        )
    }
}
