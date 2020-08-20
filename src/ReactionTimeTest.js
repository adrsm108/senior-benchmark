import React, {Component} from 'react';
import {Button, Space, Statistic, Typography} from 'antd';
import {getTimerInfo, mapLength, mean} from './utils';
// import _ from 'lodash';
import * as d3 from 'd3';
import './ReactionTimeTest.less';
import {ScoreTable} from './ScoreTable';
import ResultsPanel from './ResultsPanel';

const {Text, Title} = Typography;

class ReactionTimeTest extends Component {
  constructor(props) {
    super(props);

    this.resultsId = null;
    this.triggerTime = null;
    this.timer = null;
    this.state = {
      testActive: false,
      roundActive: false,
      roundFailed: false,
      triggered: false,
      timeoutId: null,
      round: null,
      times: [],
      results: null,
    };
    this.timer = getTimerInfo();

/*
    //Test data
    this.state = {
      testActive: false,
      roundActive: false,
      roundFailed: false,
      triggered: false,
      timeoutId: null,
      round: null,
      times: [291.0750000155531, 281.27500001573935, 290.0750000262633, 270.9000000031665, 253.12499998835847,],
      results: {
        globalSummary: {n: 495, mean: 401.3, sd: 522.603, min: 1.03, q1: 259.137, median: 297.605, q3: 369.628, max: 5635.48},
        histogram: {
          bins: 202,
          binStart: 0,
          binWidth: 27.94,
          data: [{bin: 0, freq: 0.0263}, {bin: 1, freq: 0.0101}, {bin: 2, freq: 0.0061}, {bin: 3, freq: 0.0162,}, {bin: 4, freq: 0.0101}, {bin: 5, freq: 0.0121}, {bin: 6, freq: 0.0182}, {bin: 7, freq: 0.0384,}, {bin: 8, freq: 0.0848}, {bin: 9, freq: 0.1394}, {bin: 10, freq: 0.204}, {bin: 11, freq: 0.103,}, {bin: 12, freq: 0.0707}, {bin: 13, freq: 0.0465}, {bin: 14, freq: 0.0202}, {bin: 15, freq: 0.0364,}, {bin: 16, freq: 0.0263}, {bin: 17, freq: 0.0162}, {bin: 18, freq: 0.0101}, {bin: 19, freq: 0.0121,}, {bin: 20, freq: 0.0061}, {bin: 21, freq: 0.0081}, {bin: 22, freq: 0.0121}, {bin: 23, freq: 0.004,}, {bin: 24, freq: 0.002}, {bin: 25, freq: 0.002}, {bin: 26, freq: 0.002}, {bin: 28, freq: 0.002,}, {bin: 29, freq: 0.004}, {bin: 31, freq: 0.0061}, {bin: 34, freq: 0.002}, {bin: 36, freq: 0.002,}, {bin: 37, freq: 0.002}, {bin: 39, freq: 0.0061}, {bin: 41, freq: 0.002}, {bin: 46, freq: 0.004,}, {bin: 49, freq: 0.002}, {bin: 65, freq: 0.002}, {bin: 72, freq: 0.002}, {bin: 78, freq: 0.002,}, {bin: 79, freq: 0.002}, {bin: 80, freq: 0.002}, {bin: 101, freq: 0.002}, {bin: 105, freq: 0.002,}, {bin: 127, freq: 0.002}, {bin: 144, freq: 0.002}, {bin: 163, freq: 0.002}, {bin: 183, freq: 0.002,}, {bin: 201, freq: 0.002}],
        },
        query: {
          id: 124,
          times: [291.075, 281.275, 290.075, 270.9, 253.125],
          mean: 277.29,
          sd: 15.765,
          meanQuantile: 0.2551020408,
          sdQuantile: 0.0408163265,
        },
      },
      testComplete: false,
    };
*/
  }

  submitTimes = (user, times, timer) => {
    console.log('submitting times.');
    fetch('/api/reaction-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({user, times, resolution: timer.resolution}),
    })
      .then((response) => response.json())
      .then((data) => {
        this.updateResults(data.insertId);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  updateResults = (resultsId) => {
    this.resultsId = resultsId;
    console.log('updating results');
    this.setState({results: null}, () =>
      fetch(`/api/reaction-time?id=${resultsId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          this.setState({results: data});
        })
        .catch((error) => {
          console.log('a badness!');
          console.error(error);
        })
    );
  };

  generateStatusAndMessage() {
    const state = this.state;
    return state.roundFailed
      ? [
          'round-failed',
          <div className="reaction-area-message">
            <span className="message-main">Too quick!</span>
            <span className="message-subtitle">Click to try again!</span>
          </div>,
        ]
      : state.triggered
      ? [
          'triggered',
          <div className="reaction-area-message">
            <span className="message-main">Go! Go! Go!</span>
          </div>,
        ]
      : state.roundActive
      ? [
          'round-active',
          <div className="reaction-area-message">
            <span className="message-main">Wait for it...</span>
            <span className="message-subtitle">Click when you see green.</span>
          </div>,
        ]
      : state.testActive
      ? [
          'between-rounds',
          <div className="reaction-area-message">
            <Statistic
              className="result-time"
              value={this.state.times[this.state.times.length - 1]}
              precision={this.timer.precision}
              suffix="ms"
            />
            <ScoreTable
              data={this.state.times}
              rounds={this.props.rounds}
              precision={this.timer.precision}
            />
            <span className="message-small-subtitle">
              Click anywhere to continue...
            </span>
          </div>,
        ]
      : state.times.length > 0
      ? [
          'test-complete',
          <div className="reaction-area-message">
            <span className="message-main">Results</span>
            <div className="results-summary">
              <div className="big-stats">
                <div className="stat-label">Average</div>
                <Statistic
                  className="result-time"
                  value={mean(this.state.times)}
                  precision={Math.min(this.timer.precision + 2, 2)}
                  suffix="ms"
                />
                <div className="stat-label">Fastest</div>
                <Statistic
                  className="result-time"
                  value={Math.min(...this.state.times)}
                  precision={this.timer.precision}
                  suffix="ms"
                />
              </div>
              <div className="divider" />
              <ScoreTable
                data={this.state.times}
                rounds={this.props.rounds}
                precision={this.timer.precision}
              />
            </div>
            <span className="message-small-subtitle">
              Click anywhere to play again.
            </span>
          </div>,
        ]
      : [
          'test-unstarted',
          <div className="reaction-area-message">
            <span className="message-main">Click to begin.</span>
          </div>,
        ];
  }

  handleTestStart = () => {
    this.timer = getTimerInfo(); // assumes timer resolution won't change mid run.
    this.setState(
      (state) =>
        state.testActive
          ? null // won't trigger update
          : {
              round: 1,
              testActive: true,
              roundActive: false,
              testComplete: false,
              times: [],
            },
      this.handleRoundStart // callback for after state is set
    );
  };

  handleRoundStart = () => {
    this.setState((state, props) => {
      if (state.roundActive) return null;

      this.triggerTime = null;
      return {
        roundActive: true,
        roundFailed: false,
        triggered: false,
        timeoutId: setTimeout(
          () =>
            this.setState({
              triggered: true,
              timeoutId: null,
            }),
          Math.random() * (props.maxWait - props.minWait) + props.minWait
        ),
      };
    });
  };

  handleActiveTestClick = () => {
    const now = performance.now();
    const time = now - this.triggerTime;

    this.setState((state, props) => {
      if (!state.roundActive) return null;

      const newState = {
        roundActive: false,
        triggered: false,
      };

      if (state.triggered) {
        // Click arrived after test triggered; round passed
        newState.roundFailed = false;
        newState.times = [...state.times, time];

        if (state.round < props.rounds) {
          // more rounds to go
          newState.round = state.round + 1;
        } else {
          // test complete; submit scores
          this.submitTimes(null, newState.times, this.timer); //TODO: user?
          newState.testActive = false;
          newState.round = null;
        }
      } else {
        // Click arrived before test triggered; round failed
        clearTimeout(this.state.timeoutId); // stop test from triggering
        newState.roundFailed = true;
        newState.timeoutId = null;
      }
      return newState;
    });
  };

  render() {
    console.log(this.state);
    const [status, message] = this.generateStatusAndMessage();
    return (
      <div className="ReactionTimeTest">
        <Title className="page-title">Reaction Time Test</Title>
        <Text className="page-subtitle">"Subtitle!"</Text>
        <Space direction="vertical" size="large">
          <div
            className={'reaction-area ' + status}
            onMouseDown={
              this.state.roundActive
                ? this.handleActiveTestClick
                : this.state.testActive
                ? this.handleRoundStart
                : this.handleTestStart
            }
          >
            {message}
          </div>
          {this.state.results && (
            <ResultsPanel type="ReactionTimeTest" data={this.state.results} />
          )}
        </Space>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Fires (almost) immediately after newly triggered component renders. Use to set triggerTime
    if (this.state.triggered && !this.triggerTime) {
      this.triggerTime = performance.now();
    }
  }

  componentWillUnmount() {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
  }
}

ReactionTimeTest.defaultProps = {
  rounds: 5,
  minWait: 1000, // milliseconds
  maxWait: 5000,
  // test settings
  // minWait: 100, // milliseconds
  // maxWait: 1000,
};

export default ReactionTimeTest;
