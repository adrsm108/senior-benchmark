import React, {Component} from 'react';
import {Space, Statistic, Typography} from 'antd';
import {mapLength, mean} from './utils';
import './ReactionTimeTest.less';

const {Text, Title} = Typography;

const MAX_WAIT = 1000; // milliseconds
const MIN_WAIT = 200;
const ROUNDS = 5;

function submitTimes(user, times) {
  console.log('submitting times.');
  fetch('/api/reaction-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({user, times}),
  })
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
}

function ScoreTable(props) {
  const {data, rounds} = props;
  const xbar = mean(data);
  const formatDelta = (delta) =>
    delta > 0 ? (
      <td className="delta positive">{'+' + delta.toFixed(2)}</td>
    ) : delta < 0 ? (
      <td className="delta negative">{delta.toFixed(2)}</td>
    ) : delta > 0 ? (
      <td className="delta zero">0.00</td>
    ) : (
      <td className="delta" />
    );
  return (
    <div className="ScoreTable">
      <table>
        <thead>
          <tr>
            <th>ROUND</th>
            <th>TIME (ms)</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {mapLength(rounds, (i) =>
            i < data.length ? (
              <tr key={i + 1}>
                <td>{i + 1}</td>
                <td>{data[i].toFixed(2)}</td>
                {formatDelta(
                  // when only one data point, delta is NaN, and formatDelta returns empty tag.
                  i === data.length - 1 && data[i] - data[i - 1]
                )}
              </tr>
            ) : (
              <tr key={i + 1}>
                <td>{i + 1}</td>
                <td />
                <td />
              </tr>
            )
          )}
        </tbody>
        <tfoot>
          <tr>
            <td />
            <td>{xbar.toFixed(2) /* mean */}</td>
            {formatDelta(
              // change in mean from last round
              (data[data.length - 1] - xbar) / (data.length - 1)
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

ScoreTable.defaultProps = {
  data: [],
  rounds: ROUNDS,
};

class ReactionTimeTest extends Component {
  constructor(props) {
    super(props);

    this.triggerTime = null;
    this.state = {
      testActive: false,
      roundActive: false,
      roundFailed: false,
      triggered: false,
      resultTime: null,
      timeoutId: null,
      round: null,
      times: [],
    };

    /*
    this.state = {
      // Test results screen
      testActive: false,
      roundActive: false,
      roundFailed: false,
      triggered: false,
      resultTime: 351.47500003222376,
      timeoutId: null,
      round: null,
      times: [
        387.5499999849126,
        380.89500000933185,
        69.5799999642186,
        279.89000000525266,
        351.47500003222376,
      ],
      testComplete: false,
    };
     */
  }

  componentWillUnmount() {
    if (this.state.timeoutId) {
      clearTimeout(this.state.timeoutId);
    }
  }

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
              value={this.state.resultTime}
              precision={2}
              suffix="ms"
            />
            <ScoreTable data={this.state.times} rounds={ROUNDS} />
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
                  precision={2}
                  suffix="ms"
                />
                <div className="stat-label">Fastest</div>
                <Statistic
                  className="result-time"
                  value={Math.min(...this.state.times)}
                  precision={2}
                  suffix="ms"
                />
              </div>
              <div className="divider" />
              <ScoreTable data={this.state.times} rounds={ROUNDS} />
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
    this.setState(
      (state) =>
        state.testActive
          ? null // returning null in setState prevents update from being triggered.
          : {
              round: 1,
              testActive: true,
              roundActive: false,
              testComplete: false,
              times: [],
            },
      this.handleRoundStart
    );
  };

  handleRoundStart = () => {
    this.setState((state) => {
      if (state.roundActive) return null;

      this.triggerTime = null;
      return {
        roundActive: true,
        roundFailed: false,
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
      };
    });
  };

  handleActiveTestClick = () => {
    const now = performance.now();
    const time = now - this.triggerTime;

    this.setState((state) => {
      if (!state.roundActive) return null;

      const newState = {
        roundActive: false,
        triggered: false,
      };

      if (state.triggered) {
        // Click arrived after test triggered; round passed
        newState.roundFailed = false;
        newState.resultTime = time;
        newState.times = [...state.times, time];

        if (state.round < ROUNDS) {
          newState.round = state.round + 1;
        } else {
          // test complete; submit scores
          submitTimes(null, newState.times); //TODO: user?
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
        </Space>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.triggered && !this.triggerTime) {
      // Record triggerTime immediately after newly triggered component renders.
      this.triggerTime = performance.now();
    }
  }
}

export default ReactionTimeTest;
