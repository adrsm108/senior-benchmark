import React, {Component} from 'react';
import * as d3 from 'd3';
import {Typography} from 'antd';
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

const {Text, Title} = Typography;

const ROUNDS = 15;

function Target(props) {
  const {r, pos, rings, cr, points, ...rest} = props;
  const s = r - cr;
  return (
    <svg
      x={pos[0]}
      y={pos[1]}
      {...rest}
      className={classConcat('Target', points && 'result')}
    >
      <g className="target-group" key={Date.now()}>
        {mapLength(rings + 1, (n) => (
          <circle
            key={n}
            r={(s * (rings - n)) / rings + cr}
            className={classConcat(
              'target-ring',
              n === 0 && 'target-body', // first circle
              n === rings && 'target-center' // last circle
            )}
          />
        ))}
        {points &&
          points.map((pt, i) => (
            <circle
              className="target-point"
              key={i}
              cx={pt[0]}
              cy={pt[1]}
              r={2}
            />
          ))}
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

  submitTimes = (user) => {
    const bodyContent = {
      user,
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

    console.log('submitting times: ', bodyContent);
    fetch('/api/aim-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        this.updateResults(data.testId);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  updateResults = (resultsId) => {
    resultsId = Number.isInteger(resultsId) ? resultsId : null;
    console.log('updating results');
    this.setState({results: null}, () =>
      fetch(`/api/aim-test?id=${resultsId}`)
        .then((response) => response.json())
        .then((data) => {
          console.log('setting results to', data);
          this.setState({results: data});
        })
        .catch((error) => {
          console.log('a badness!');
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
      <div className="results-panel">
        <Histogram
          className="histogram-card time"
          data={time.histogram}
          cutoff={time.q3 + 2 * (time.q3 - time.q1)}
          xAxis={{units: 'ms', digits: 0, title: 'Time'}}
          yAxis={{title: 'Frequency'}}
          points={timePoints}
          title="Time"
        />
        <svg transform="scale(1.3)">
          <Target
            points={query.map(({clickPos, targetPos}) =>
              vecMinus(clickPos, targetPos)
            )}
          />
        </svg>
        <Histogram
          className="histogram-card error"
          data={error.histogram}
          cutoff={1}
          points={errorPoints}
          xAxis={{digits: 2, title: 'Relative Error'}}
          yAxis={{digits: 2, title: 'Frequency'}}
          title="Accuracy"
        />
      </div>
    );
  };

  render() {
    let {style, targetRadius: radius, minWidth, maxWidth} = this.props;
    console.log(this.state);
    return (
      <div className="AimTest" style={style}>
        <Title className="page-title">Aim Test</Title>
        <Text className="page-subtitle">"Subtitle!"</Text>
        <div className="test-and-status" style={{minWidth, maxWidth}}>
          <div className="test-status">
            {this.state.testUnplayed ? (
              <>
                <div />
                <Text strong className="label">
                  Click START to begin.
                </Text>
                <div />
              </>
            ) : (
              <>
                <Text strong className="label">
                  Average Time:{' '}
                  <Text className="value">
                    {formatMilliseconds(this.state.cmaTime)}
                  </Text>
                </Text>
                {this.state.testActive ? (
                  <Text strong className="label">
                    Round:{' '}
                    <Text className="value">
                      {this.state.round}/{this.props.rounds}
                    </Text>
                  </Text>
                ) : (
                  <Text strong className="label">
                    Click START to play again.
                  </Text>
                )}
                <Text strong className="label">
                  Average Accuracy:{' '}
                  <Text className="value">
                    {(100 * (1 - this.state.cmaDist / radius)).toFixed(1)}%
                  </Text>
                </Text>
              </>
            )}
          </div>
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

        {/*{this.state.results && [*/}
        {/*  <Divider key="divider">*/}
        {/*    <Title>Results</Title>*/}
        {/*  </Divider>,*/}
        {/*  <Table*/}
        {/*    key="table"*/}
        {/*    bordered*/}
        {/*    pagination={false}*/}
        {/*    columns={RESULTS_COLUMNS}*/}
        {/*    dataSource={this.state.results}*/}
        {/*    rowKey="spawnTime"*/}
        {/*  />,*/}
        {/*]}*/}
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
