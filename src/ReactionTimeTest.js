import React, {Component} from 'react';
import {Card, Space, Statistic, Typography} from 'antd';
import {getTimerInfo, mean} from './utils';

import './ReactionTimeTest.less';
import {ScoreTable} from './ScoreTable';
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
      phase: 'unplayed',
      round: null,
      times: [],
      results: null,
    };
  }

  submitTimes = (times, timer) => {
    console.log('submitting times.');
    fetch('/api/reaction-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({times, resolution: timer.resolution}),
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

  startTest = () => {
    this.timer = getTimerInfo(); // assumes timer resolution won't change mid run.
    this.setState(
      (state) =>
        state.testActive
          ? null // won't trigger update
          : {
              round: 1,
              testActive: true,
              times: [],
            },
      this.startRound
    );
  };

  startRound = (roundNumber) => {
    this.setState((state, props) => {
      if (state.phase === 'waiting') return null;
      this.triggerTime = null;
      return {
        phase: 'waiting',
        round: roundNumber || state.round,
        timeoutId: setTimeout(
          () =>
            this.setState({
              phase: 'triggered',
              timeoutId: null,
            }),
          Math.random() * (props.maxWait - props.minWait) + props.minWait
        ),
      };
    });
  };

  handleClick = () => {
    const now = performance.now();
    const time = now - this.triggerTime;

    this.setState((state, props) => {
      switch (state.phase) {
        case 'unplayed':
          this.startTest();
          return null;
        case 'waiting': // a click was received before the test triggered.
          clearTimeout(state.timeoutId); // prevent test from triggering
          return {
            phase: 'failed',
            timeoutId: null,
          };
        case 'triggered': // test completed successfully
          const times = state.times.concat([time]);
          if (state.round < props.rounds) {
            return {phase: 'roundComplete', times};
          } else {
            this.submitTimes(times, this.timer);
            return {phase: 'results', times, testActive: false, round: null};
          }
        case 'failed':
          this.startRound();
          return null;
        case 'roundComplete':
          this.startRound(state.round + 1);
          return null;
        case 'results':
          this.startTest();
          return null;
        default:
          return null;
      }
    });
  };

  generateMessage = () => {
    switch (this.state.phase) {
      case 'unplayed':
        return <span className="message-main">Click to begin.</span>;
      case 'waiting':
        return (
          <>
            <span className="message-main">Wait for it...</span>
            <span className="message-subtitle">Click when you see green.</span>
          </>
        );
      case 'triggered':
        return <span className="message-main">Go! Go! Go!</span>;
      case 'failed':
        return (
          <>
            <span className="message-main">Too quick!</span>
            <span className="message-subtitle">Click to try again!</span>
          </>
        );
      case 'roundComplete':
        return (
          <>
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
          </>
        );
      case 'results':
        return (
          <>
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
          </>
        );
      default:
        return <span>adam made an oopsie.</span>;
    }
  };

  calculateCutoff = () => {
    if (!this.state.results) return 1;
    const {
      globalSummary: {q1, q3},
      query: {data},
    } = this.state.results;
    return Math.max(2 * (q3 - q1) + q3, ...data);
  };

  render() {
    console.log(this.state);
    const {results} = this.state;
    return (
      <div className="ReactionTimeTest">
        <Title className="page-title">Reaction Time Test</Title>
        <Text className="page-subtitle">"Subtitle!"</Text>
        <Space direction="vertical" size="large">
          <div
            className={'reaction-area ' + this.state.phase}
            onMouseDown={this.handleClick}
          >
            <div className="reaction-area-message">
              {this.generateMessage()}
            </div>
          </div>
          {results && (
            <div className="results">
              <Card className="stats-card">
                <div className="label-and-stat">
                  <Text strong>Mean Time</Text>{' '}
                  <Text>
                    {results.query['mean'].toFixed(2)}
                    ms
                  </Text>
                </div>
                <div className="label-and-stat">
                  <Text strong>Mean Percentile</Text>{' '}
                  <Text>
                    {((1 - results.query['meanQuantile']) * 100).toFixed(2)}
                  </Text>
                </div>
              </Card>
              <Histogram
                className="histogram-card"
                data={results.histogram}
                cutoff={this.calculateCutoff()}
                xAxis={{units: 'ms', digits: 0, title: 'Time'}}
                yAxis={{title: 'Frequency'}}
                points={results.query}
                title="Here's a Histogram!"
                ascending={false}
              />
            </div>
          )}
        </Space>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Fires (almost) immediately after newly triggered component renders. Use to set triggerTime
    if (this.state.phase === 'triggered' && !this.triggerTime) {
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
