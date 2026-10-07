import React, { Component, Fragment } from 'react';
import { Alert, Button, Form, Spinner, ListGroup, Tabs, Tab } from 'react-bootstrap';
import Cropper from 'react-cropper';
import * as tf from '@tensorflow/tfjs';
import LoadButton from '../components/LoadButton';
import { loadModels, disposeModels } from '../inference/models';
import { predictImage } from '../inference/predict';
import { SETTINGS } from '../inference/settings';
import './Classify.css';
import 'cropperjs/dist/cropper.css';

/** Owns UI state and browser resources; inference lives in src/inference. */
export default class Classify extends Component {
  videoRef = React.createRef();
  cropperRef = React.createRef();
  resultRef = React.createRef();
  models = null;
  webcam = null;
  active = false;
  busy = false;
  cameraRequest = 0;
  imageUrl = null;

  state = {
    loading: true,
    ready: false,
    classifying: false,
    cameraReady: false,
    cameraStarting: false,
    cameraError: '',
    error: '',
    tab: 'camera',
    file: null,
    filename: '',
    imageReady: false,
    result: null,
    photoControlsOpen: true,
  };

  componentDidMount() {
    this.active = true;
    this.initializeModels();
  }

  componentWillUnmount() {
    this.active = false;
    this.stopCamera();
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    // An in-flight prediction still owns the models until its finally block.
    if (!this.busy) disposeModels(this.models);
  }

  initializeModels = async (refresh = false) => {
    if (this.busy) return;
    this.busy = true;
    this.setState({ loading: true, error: '', result: null, photoControlsOpen: true });
    let nextModels;
    try {
      nextModels = await loadModels({ refresh });
      if (!this.active) {
        disposeModels(nextModels);
        return;
      }
      disposeModels(this.models);
      this.models = nextModels;
      this.setState({ ready: true });
    } catch (error) {
      if (this.active) this.setState({ error: 'Models could not be loaded. Check your connection and try again.' });
    } finally {
      this.busy = false;
      if (this.active) this.setState({ loading: false });
      else disposeModels(this.models);
    }
  };

  stopCamera = () => {
    this.cameraRequest += 1;
    if (this.webcam) this.webcam.stop();
    this.webcam = null;
  };

  startCamera = async () => {
    if (this.state.cameraStarting || this.webcam) return;
    const request = ++this.cameraRequest;
    this.setState({ cameraStarting: true, cameraError: '' });
    try {
      const webcam = await tf.data.webcam(this.videoRef.current, {
        resizeWidth: SETTINGS.cameraSize,
        resizeHeight: SETTINGS.cameraSize,
        facingMode: 'environment',
      });
      if (!this.active || request !== this.cameraRequest || this.state.tab !== 'camera') {
        webcam.stop();
        return;
      }
      this.webcam = webcam;
      this.setState({ cameraReady: true });
    } catch (error) {
      if (this.active && request === this.cameraRequest) {
        this.setState({ cameraError: 'Camera access is unavailable. Allow camera access or select an image file.' });
      }
    } finally {
      if (this.active && request === this.cameraRequest) this.setState({ cameraStarting: false });
    }
  };

  selectTab = tab => {
    if (this.busy) return;
    this.stopCamera();
    this.setState({ tab, cameraReady: false, cameraStarting: false, cameraError: '', error: '', result: null });
  };

  selectFile = event => {
    const file = event.target.files[0];
    if (!file || this.busy) return;
    if (file.type && !file.type.startsWith('image/')) {
      this.setState({ error: 'Select an image file.' });
      return;
    }
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    this.imageUrl = URL.createObjectURL(file);
    this.setState({ file: this.imageUrl, filename: file.name, imageReady: false, result: null, error: '' });
  };

  classify = async () => {
    if (this.busy || !this.models) return;
    this.busy = true;
    this.setState({ classifying: true, error: '', result: null });
    let capturedFrame;
    try {
      const camera = this.state.tab === 'camera';
      let source;
      if (camera) {
        if (!this.webcam) throw new Error('Start the camera before classifying.');
        capturedFrame = await this.webcam.capture();
        source = capturedFrame;
      } else {
        const cropper = this.cropperRef.current;
        if (!cropper || !this.state.imageReady) throw new Error('Select an image and wait for it to load.');
        // Preserve the original upload crop selection used before detection.
        cropper.setCropBoxData({ left: 0, top: 0, width: 281, height: 500 });
        source = cropper.getCroppedCanvas();
        if (!source) throw new Error('The image could not be read. Select another image.');
      }
      const result = await predictImage(this.models, source, camera);
      if (this.active) {
        this.setState({ result, photoControlsOpen: false }, () => {
          const resultPanel = this.resultRef.current;
          if (resultPanel) {
            resultPanel.focus({ preventScroll: true });
            resultPanel.scrollIntoView({ block: 'nearest' });
          }
        });
      }
    } catch (error) {
      if (this.active) this.setState({ error: error.message || 'Classification failed. Try another image.' });
    } finally {
      if (capturedFrame) capturedFrame.dispose();
      this.busy = false;
      if (this.active) this.setState({ classifying: false });
      else disposeModels(this.models);
    }
  };

  render() {
    const { loading, ready, error, tab, file, filename, imageReady, classifying,
      cameraReady, cameraStarting, cameraError, result, photoControlsOpen } = this.state;
    const disabled = loading || classifying;
    return (
      <div className="Classify container">
        {loading && <p role="status"><Spinner animation="border" size="sm" /> Loading models…</p>}
        {error && <Alert variant="danger">{error}</Alert>}
        {!loading && <Button variant="outline-secondary" disabled={classifying}
          onClick={() => this.initializeModels(true)}>
          {ready ? 'Reload bundled models' : 'Retry loading models'}
        </Button>}
        {ready && <Fragment>
          <Button className="classify-panel-header" disabled={disabled}
            aria-controls="photo-selection-pane" aria-expanded={photoControlsOpen}
            onClick={() => this.setState(state => ({ photoControlsOpen: !state.photoControlsOpen }))}>
            {photoControlsOpen ? 'Hide photo controls' : 'Take or select another photo'}
          </Button>
          <div id="photo-selection-pane" hidden={!photoControlsOpen}>
          <h2 className="mt-4">Take or select a photo</h2>
          <Tabs activeKey={tab} id="input-options" onSelect={this.selectTab}>
            <Tab eventKey="camera" title="Take photo" disabled={disabled}>
              {cameraError && <Alert variant="warning">{cameraError}</Alert>}
              <div className="webcam-box-outer">
                <div className="webcam-box-inner">
                  <video ref={this.videoRef} autoPlay playsInline muted id="webcam"
                    width="480" height="480" aria-label="Camera preview" />
                </div>
              </div>
              {!cameraReady && <div><Button onClick={this.startCamera} disabled={disabled || cameraStarting}>
                {cameraStarting ? 'Starting camera…' : 'Start camera'}
              </Button></div>}
            </Tab>
            <Tab eventKey="localfile" title="Select image" disabled={disabled}>
              <Form.Group controlId="assay-image">
                <Form.Label>Select an assay image</Form.Label>
                <Form.Control type="file" accept="image/*" disabled={disabled} onChange={this.selectFile} />
              </Form.Group>
              {file && <Cropper key={file} ref={this.cropperRef} src={file}
                style={{ height: 500, width: 281.25, maxWidth: '100%' }}
                guides={false} aspectRatio={9 / 16} viewMode={2}
                ready={() => this.active && this.setState({ imageReady: true })} />}
              {filename && <p>{filename}</p>}
            </Tab>
          </Tabs>
          <div className="button-container">
            <LoadButton onClick={this.classify} isLoading={classifying}
              disabled={loading || (tab === 'camera' ? !cameraReady : !imageReady)}
              text="Classify" loadingText="Classifying…" />
          </div>
          </div>
          {result && <section ref={this.resultRef} tabIndex={-1}
            className="classification-results" aria-label="Classification results" aria-live="polite">
            <h3>Prediction</h3>
            <img src={result.preview} alt="Detected assay region" style={{ maxWidth: '100%' }} />
            <ListGroup>{result.predictions.map(prediction => (
              <ListGroup.Item key={prediction.className}>
                <strong>{prediction.className}</strong> {prediction.probability}%
              </ListGroup.Item>
            ))}</ListGroup>
          </section>}
        </Fragment>}
      </div>
    );
  }
}
