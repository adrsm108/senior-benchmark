import React, {Component} from 'react';
import * as d3 from 'd3';
import {Table, Tooltip, Typography} from 'antd';
import {
  classConcat,
  dist2d,
  formatMilliseconds,
  getRandomPointAtDistanceFrom,
  getTimerInfo,
  mapLength,
  vecMinus,
} from './utils';
import Histogram from './Histogram';
import './AimTest.less';
import {HelpfulText, ResultsLayout} from './ResultFormatters';

const {Text, Title} = Typography;

const ROUNDS = 25;

function Target(props) {
  const {r, pos, rings, cr, points, ...rest} = props;
  const s = r - cr;
  const ringCircles = mapLength(rings + 1, (n) => (
    <circle
      key={n}
      r={(s * (rings - n)) / rings + cr}
      className={classConcat(
        'target-ring',
        n === 0 && 'target-body', // first circle
        n === rings && 'target-center' // last circle
      )}
    />
  ));
  return points ? (
    <svg className="Target results" viewBox={`-${r} -${r} ${2 * r} ${2 * r}`}>
      <g className="target-group" key={Date.now()}>
        {ringCircles}
        {points.map((pt, i) => (
          <Tooltip
            key={i}
            title={
              <div style={{color: 'black'}}>
                <div>Round {i + 1}</div>
                <div>{((100 * Math.hypot(...pt)) / r).toFixed(2)}%</div>
              </div>
            }
            color="#ffffff"
          >
            <circle className="target-point" cx={pt[0]} cy={pt[1]} r={2} />
          </Tooltip>
        ))}
      </g>
    </svg>
  ) : (
    <svg x={pos[0]} y={pos[1]} {...rest} className="Target">
      <g className="target-group" key={Date.now()}>
        {ringCircles}
      </g>
    </svg>
  );
}

Target.defaultProps = {
  pos: ['50%', '50%'], // x, y location
  r: 50, // target radius
  rings: 3, // number of rings
  cr: 4, // center radius
  points: null,
};

function StartButton(props) {
  return (
    <svg x="50%" y="50%" className="StartButton">
      <g className="start-button-group">
        <circle {...props} className="button-body" />
        <text className="button-text">{props.children}</text>
      </g>
    </svg>
  );
}

class AimTest extends Component {
  constructor(props) {
    super(props);

    this.targetSpawnTime = null;
    this.testArea = React.createRef();
    this.testLog = [];
    this.timer = null;
    this.state = {
      testUnplayed: true,
      testActive: false,
      round: null,
      targetPos: null,
      results: null,
      cmaTime: null, // cumulative moving averages
      cmaDist: null,
    };
  }

  submitTimes = () => {
    const bodyContent = {
      data: this.testLog.map(({time, spawnPos, clickPos}, i) => ({
        round: i + 1,
        time: time,
        targetDist: dist2d(
          spawnPos,
          i ? this.testLog[i - 1].clickPos : this.startPos
        ),
        relError: dist2d(spawnPos, clickPos) / this.props.targetRadius,
        tX: spawnPos[0],
        tY: spawnPos[1],
        cX: clickPos[0],
        cY: clickPos[1],
      })),
      timerResolution: this.timer.resolution,
      testAreaWidth: this.testArea.current.clientWidth,
      targetRadius: this.props.targetRadius,
    };

    fetch('/api/aim-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data) => {
        this.updateResults(data.testId);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  updateResults = (resultsId) => {
    resultsId = Number.isInteger(resultsId) ? resultsId : null;
    this.setState({results: null}, () =>
      fetch(`/api/aim-test?id=${resultsId}`)
        .then((response) => response.json())
        .then((data) => {
          this.setState({results: data});
        })
        .catch((error) => {
          console.error(error);
        })
    );
  };

  spawnRandomTarget = () => {
    this.targetSpawnTime = null;
    const {current} = this.testArea;
    return current
      ? getRandomPointAtDistanceFrom(
          current.clientWidth,
          current.clientHeight,
          this.state.targetPos,
          2 * this.props.targetRadius
        ).map(Math.floor)
      : [0, 0];
  };

  handleTestStart = ({nativeEvent: event}) => {
    this.setState((state) => {
      if (state.testActive) return null;
      this.testLog = [];
      this.timer = getTimerInfo();
      this.startPos = [event.offsetX, event.offsetY];
      return {
        testUnplayed: false,
        testActive: true,
        cmaTime: null,
        cmaDist: null,
        round: 1,
        results: null,
        targetPos: this.spawnRandomTarget(),
      };
    });
  };

  handleTargetClick = ({nativeEvent: event}) => {
    const clickTime = performance.now();
    const spawnTime = this.targetSpawnTime;
    if (!spawnTime) return null; // indicates duplicate click on target, since we clear targetSpawnTime in this function.
    this.targetSpawnTime = null;

    this.setState((state, props) => {
      const time = clickTime - spawnTime;
      const clickPos = [event.offsetX, event.offsetY];

      this.testLog.push({
        spawnPos: state.targetPos,
        clickPos,
        time,
      });

      const newState =
        state.round === 1
          ? {cmaTime: time, cmaDist: dist2d(state.targetPos, clickPos)}
          : {
              cmaTime: (time + state.round * state.cmaTime) / (state.round + 1),
              cmaDist:
                (dist2d(state.targetPos, clickPos) +
                  state.round * state.cmaDist) /
                (state.round + 1),
            };

      if (state.round < props.rounds) {
        newState.round = state.round + 1;
        newState.targetPos = this.spawnRandomTarget();
      } else {
        // Test finished
        this.submitTimes(null); // TODO: user

        newState.testActive = false;
        newState.round = null;
        newState.targetPos = null;
      }
      return newState;
    });
  };

  generateResultsPanel = () => {
    if (!this.state.results) return null;
    let {time, error, query} = this.state.results;
    const timePoints = {
      mean: d3.mean(query, (d) => d.time),
      data: query.map((d) => d.time),
    };
    const errorPoints = {
      mean: d3.mean(query, (d) => d.relError),
      data: query.map((d) => d.relError),
    };
    return (
      <>
        <Title className="page-title">Results</Title>
        <div className="results-divider">Time</div>
        <ResultsLayout
          className="time"
          stats={[
            {
              title: (
                <HelpfulText hint="Mean elapsed time between target spawn and target click.">
                  Average Time
                </HelpfulText>
              ),
              value: timePoints.mean,
              precision: 2,
              suffix: 'ms',
            },
            {
              title: (
                <HelpfulText hint="Median elapsed time between target spawn and target click.">
                  Median Time
                </HelpfulText>
              ),
              value: d3.median(timePoints.data),
              precision: 2,
              suffix: 'ms',
            },
          ]}
          statsTitle="Your Stats"
          histogram={
            <Histogram
              data={time.histogram}
              cutoff={time.q3 + 2 * (time.q3 - time.q1)}
              xAxis={{units: 'ms', digits: 0, title: 'Time'}}
              yAxis={{title: 'Frequency'}}
              points={timePoints}
              ascending={false}
            />
          }
          histogramTitle={
            <HelpfulText hint="Plots reaction times (x-axis) against the frequency with which similar times have been observed in other participants .">
              Time Histogram
            </HelpfulText>
          }
          table={
            <Table
              size="small"
              columns={[
                {
                  title: <span>Round</span>,
                  dataIndex: 'round',
                  align: 'center',
                },
                {
                  title: <span>Time</span>,
                  dataIndex: 'time',
                  align: 'center',
                  render: (t) => (
                    <div style={{textAlign: 'right', paddingRight: '28%'}}>
                      {t.toFixed(2)}ms
                    </div>
                  ),
                },
              ]}
              dataSource={query}
              useFixedHeader={true}
              rowKey="round"
              pagination={{hideOnSinglePage: true, pageSize: 50}}
            />
          }
          tableTitle="Your Times"
        />
        <div className="results-divider">Accurary</div>
        <ResultsLayout
          className="accuracy"
          stats={[
            {
              title: (
                <HelpfulText hint="The average distance between your clicks and the center of the target.">
                  Average Error
                </HelpfulText>
              ),
              // TODO this supposes targetRadius hasn't changed. To do it legit you would want to make the server
              //  pass back the targetRadius from when this test was inserted. Until we decide to start
              //  changing targetRadius, it's close enough.
              value: errorPoints.mean * this.props.targetRadius,
              precision: 2,
              suffix: 'px',
            },
            {
              title: (
                <HelpfulText hint="The average distance between your clicks and the center of the target, divided by the target radius, and expressed as a percentage.">
                  Average % Error
                </HelpfulText>
              ),
              value: 100 * errorPoints.mean,
              precision: 2,
              suffix: '%',
            },
          ]}
          statsTitle="Error Stats"
          histogram={
            <Histogram
              data={error.histogram}
              cutoff={1}
              points={errorPoints}
              xAxis={{digits: 2, title: 'Relative Error'}}
              yAxis={{digits: 2, title: 'Frequency'}}
              ascending={false}
            />
          }
          histogramTitle="Error Histogram"
          table={
            <div
              className="results-target"
              style={{maxWidth: 400, margin: 'auto'}}
            >
              <Target
                points={query.map(({clickPos, targetPos}) =>
                  vecMinus(clickPos, targetPos)
                )}
              />
            </div>
          }
          tableTitle="Click Plot"
        />
      </>
    );
  };

  generateTestStatus = () => {
    const {testUnplayed, testActive} = this.state;
    const {targetRadius: radius} = this.props;
    return testUnplayed ? (
      <div className="test-status" key="unplayed">
        <div />
        <Text strong className="label">
          Click START to begin.
        </Text>
        <div />
      </div>
    ) : testActive ? (
      <div className="test-status" key="active">
        <Text strong className="label">
          Average Time:{' '}
          <Text className="value">
            {formatMilliseconds(this.state.cmaTime)}
          </Text>
        </Text>
        <Text strong className="label">
          Round:{' '}
          <Text className="value">
            {this.state.round}/{this.props.rounds}
          </Text>
        </Text>
        <Text strong className="label">
          Average Accuracy:{' '}
          <Text className="value">
            {(100 * (1 - this.state.cmaDist / radius)).toFixed(1)}%
          </Text>
        </Text>
      </div>
    ) : (
      <div className="test-status" key="finished">
        <div />
        <Text strong className="label">
          Click START to play again.
        </Text>
        <div />
      </div>
    );
  };

  render() {
    const {style, targetRadius: radius} = this.props;
    return (
      <div className="AimTest" style={style}>
        <Title className="page-title">Aim Test</Title>
        <div className="test-and-status">
          {this.generateTestStatus()}
          <div className="test-area-container" style={{padding: radius}}>
            <svg
              className="test-area"
              ref={this.testArea}
              height={this.props.height - 2 * radius}
            >
              {this.state.testActive ? (
                <Target
                  onMouseDown={this.handleTargetClick}
                  pos={this.state.targetPos}
                  r={radius}
                />
              ) : (
                <StartButton onClick={this.handleTestStart} r={radius * 1.5}>
                  START
                </StartButton>
              )}
            </svg>
          </div>
          {this.generateResultsPanel()}
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.state.testActive && !this.targetSpawnTime) {
      this.targetSpawnTime = performance.now();
    }
  }
}

AimTest.defaultProps = {
  minWidth: 450,
  maxWidth: 1000,
  height: 500,
  targetRadius: 50,
  rounds: ROUNDS,
};

export default AimTest;
