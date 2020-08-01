import React, {Component} from 'react';
import {Button, Space, Typography} from 'antd';
import './ReactionTimeTest.less';

const {Text, Title} = Typography;

const MAX_WAIT = 8000;
const MIN_WAIT = 1000;

class ReactionTimeTest extends Component {
  constructor(props) {
    super(props);

    this.state = {
      testActive: false,
      testFailed: false,
      triggerTime: null,
      clickTime: null,
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
    this.setState({
      testActive: true,
      testFailed: false,
      triggerTime: null,
      clickTime: null,
      timeoutId: setTimeout(
        this.handleTestTrigger,
        Math.random() * (MAX_WAIT - MIN_WAIT) + MIN_WAIT
      ),
    });
  };

  handleTestTrigger = () => {
    this.setState({
      triggerTime: performance.now(),
      timeoutId: null,
    });
  };

  handleTestAreaClick = () => {
    const now = performance.now();
    if (this.state.triggerTime) {
      // Test has triggered
      this.setState({
        testActive: false,
        testFailed: false,
        clickTime: now,
      });
    } else {
      // Click arrives before test has triggered
      clearTimeout(this.state.timeoutId);
      this.setState({
        testActive: false,
        testFailed: true,
      });
    }
  };

  render() {
    const [bg, message] = this.state.testFailed
      ? ['orange', 'TOO QUICK!']
      : this.state.clickTime
      ? ['teal', (this.state.clickTime - this.state.triggerTime).toFixed(2) + 'ms']
      : this.state.triggerTime
      ? ['green', 'GO GO GO!']
      : this.state.testActive
      ? ['red', 'WAIT FOR IT']
      : ['gray', 'CLICK BUTTON TO BEGIN'];
    return (
      <div className="ReactionTimeTest">
        <Title className="page-title">Reaction Time Test</Title>
        <Text className="page-subtitle">"Subtitle!"</Text>
        <Space direction="vertical" size="large">
          <div
            className="reaction-area"
            onClick={this.handleTestAreaClick}
            style={{background: bg}}
          >
            {message}
          </div>
          <Button type="primary" className="start-button" onClick={this.handleTestStart}>
            Start Test
          </Button>
        </Space>
      </div>
    );
  }
}

export default ReactionTimeTest;
