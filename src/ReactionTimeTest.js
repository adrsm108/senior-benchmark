import React, {Component} from 'react';
import {Space, Typography} from 'antd';
import './ReactionTimeTest.less';

const {Text, Title} = Typography;

const MAX_WAIT = 6000;
const MIN_WAIT = 1000;

class ReactionTimeTest extends Component {
  constructor(props) {
    super(props);

    this.triggerTime = null;
    this.state = {
      testActive: false,
      testFailed: false,
      triggered: false,
      resultTime: null,
      timeoutId: null,
    };
  }

  componentWillUnmount() {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
  }

  handleTestStart = () => {
    if (this.state.testActive) return;

    this.triggerTime = null;
    this.setState({
      testActive: true,
      testFailed: false,
      triggered: false,
      resultTime: null,
      timeoutId: setTimeout(
        () =>
          this.setState({
            triggered: true,
            timeoutId: null,
          }),
        Math.random() * (MAX_WAIT - MIN_WAIT) + MIN_WAIT
      ),
    });
  };

  handleActiveTestClick = () => {
    const now = performance.now();
    if (!this.state.testActive) return;

    if (this.state.triggered) {
      // Test has triggered
      this.setState({
        testActive: false,
        testFailed: false,
        triggered: false,
        resultTime: now - this.triggerTime,
      });
    } else {
      // Click arrives before test has triggered
      clearTimeout(this.state.timeoutId); // stop test from triggering
      this.setState({
        testActive: false,
        testFailed: true,
        triggered: false,
        timeoutId: null, // clear timeoutId
      });
    }
  };

  render() {
    const [statusClass, message] = this.state.testFailed
      ? ['failed', 'TOO QUICK']
      : this.state.resultTime
      ? ['complete', this.state.resultTime.toFixed(2) + 'ms']
      : this.state.triggered
      ? ['triggered', 'GO GO GO']
      : this.state.testActive
      ? ['active', 'WAIT FOR IT']
      : ['inactive', 'CLICK TO BEGIN'];

    // Precompute component expression to reduce latency between setting triggerTime and returning
    const result = (
      <div className="ReactionTimeTest">
        <Title className="page-title">Reaction Time Test</Title>
        <Text className="page-subtitle">"Subtitle!"</Text>
        <Space direction="vertical" size="large">
          <div
            className={'reaction-area ' + statusClass}
            onMouseDown={this.state.testActive ? this.handleActiveTestClick : this.handleTestStart}
          >
            {message}
          </div>
        </Space>
      </div>
    );
    // record triggerTime as late as possible before newly triggered component is sent to be rendered.
    if (this.state.triggered && !this.triggerTime) this.triggerTime = performance.now();
    return result;
  }
}

export default ReactionTimeTest;
