import React, {Component} from 'react';
import {Card, Space, Statistic, Typography} from 'antd';
import {getTimerInfo, mean} from './utils';

import './ReactionTimeTest.less';
import {ScoreTable} from './ScoreTable';
import ResultsPanel from './ResultsPanel';
import Histogram from './Histogram';

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
    const {globalSummary, histogram, query} = this.state.results || {};
    const {q1, q3} = globalSummary || {};
    const cutoff = globalSummary
      ? Math.max(2 * (q3 - q1) + q3, ...query.data)
      : 1;
    console.log(cutoff);
    console.log(q1, q3);
    console.log(2 * (q3 - q1) + q3);
    console.log(globalSummary);
    console.log(this.state.results);
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
            <div className="results">
              <Card className="stats-card">
                <div className="label-and-stat">
                  <Text strong>Mean Time</Text>
                  <Text>
                    {this.state.results.query['mean'].toFixed(2)}
                    ms
                  </Text>
                </div>
                <div className="label-and-stat">
                  <Text strong>Mean Percentile</Text>
                  <Text>
                    {(
                      (1 - this.state.results.query['meanQuantile']) *
                      100
                    ).toFixed(2)}
                  </Text>
                </div>
              </Card>
              <Histogram
                className="histogram-card"
                data={histogram}
                cutoff={cutoff}
                xAxis={{units: 'ms', digits: 0, title: 'Time'}}
                yAxis={{title: 'Frequency'}}
                points={query}
                title="Here's a Histogram!"
              />
            </div>
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
