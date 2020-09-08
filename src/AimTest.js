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

const ROUNDS = 15;

function Target(props) {
  const {r, pos, rings, cr, points, ...rest} = props;
  const s = r - cr;
  console.log(points);
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
    // this.state = {
    //   testUnplayed: true,
    //   testActive: false,
    //   round: null,
    //   targetPos: null,
    //   results: null,
    //   cmaTime: null, // cumulative moving averages
    //   cmaDist: null,
    // };
    this.state = {
      testUnplayed: false,
      testActive: false,
      round: null,
      targetPos: null,
      results: {
        time: {
          stat: 'time',
          n: 1053,
          mean: 917.627,
          sd: 506.481,
          min: 315.11,
          q1: 686.23,
          median: 809.83,
          q3: 994.53,
          max: 8293.6,
          histogram: {
            bins: 137,
            binStart: 0,
            binWidth: 60.61,
            data: [
              {bin: 5, freq: 0.0009},
              {bin: 6, freq: 0.0038},
              {bin: 7, freq: 0.0133},
              {bin: 8, freq: 0.0275},
              {bin: 9, freq: 0.0722},
              {bin: 10, freq: 0.1007},
              {bin: 11, freq: 0.133},
              {bin: 12, freq: 0.1121},
              {bin: 13, freq: 0.1073},
              {bin: 14, freq: 0.0912},
              {bin: 15, freq: 0.0665},
              {bin: 16, freq: 0.0503},
              {bin: 17, freq: 0.0418},
              {bin: 18, freq: 0.0323},
              {bin: 19, freq: 0.0294},
              {bin: 20, freq: 0.0152},
              {bin: 21, freq: 0.0104},
              {bin: 22, freq: 0.0152},
              {bin: 23, freq: 0.0076},
              {bin: 24, freq: 0.0076},
              {bin: 25, freq: 0.0123},
              {bin: 26, freq: 0.0057},
              {bin: 27, freq: 0.0066},
              {bin: 28, freq: 0.0038},
              {bin: 29, freq: 0.0009},
              {bin: 30, freq: 0.0019},
              {bin: 31, freq: 0.0019},
              {bin: 32, freq: 0.0019},
              {bin: 33, freq: 0.0019},
              {bin: 35, freq: 0.0028},
              {bin: 37, freq: 0.0028},
              {bin: 38, freq: 0.0009},
              {bin: 39, freq: 0.0038},
              {bin: 41, freq: 0.0019},
              {bin: 43, freq: 0.0009},
              {bin: 44, freq: 0.0019},
              {bin: 46, freq: 0.0019},
              {bin: 49, freq: 0.0009},
              {bin: 50, freq: 0.0009},
              {bin: 56, freq: 0.0009},
              {bin: 58, freq: 0.0009},
              {bin: 74, freq: 0.0009},
              {bin: 106, freq: 0.0019},
              {bin: 136, freq: 0.0009},
            ],
          },
        },
        error: {
          stat: 'error',
          n: 1053,
          mean: 0.428311,
          sd: 0.232856,
          min: 0.02,
          q1: null,
          median: null,
          q3: null,
          max: 1.02,
          histogram: {
            bins: 21,
            binStart: 0,
            binWidth: 0.05,
            data: [
              {bin: 0, freq: 0.0218},
              {bin: 1, freq: 0.0361},
              {bin: 2, freq: 0.056},
              {bin: 3, freq: 0.0617},
              {bin: 4, freq: 0.0788},
              {bin: 5, freq: 0.0788},
              {bin: 6, freq: 0.0883},
              {bin: 7, freq: 0.076},
              {bin: 8, freq: 0.0684},
              {bin: 9, freq: 0.075},
              {bin: 10, freq: 0.0598},
              {bin: 11, freq: 0.0598},
              {bin: 12, freq: 0.0551},
              {bin: 13, freq: 0.038},
              {bin: 14, freq: 0.0313},
              {bin: 15, freq: 0.0332},
              {bin: 16, freq: 0.0256},
              {bin: 17, freq: 0.0256},
              {bin: 18, freq: 0.0171},
              {bin: 19, freq: 0.0104},
              {bin: 20, freq: 0.0028},
            ],
          },
        },
        query: [
          {
            targetPos: [635, 99],
            clickPos: [641, 83],
            round: 1,
            time: 747.605,
            targetDist: 303.727,
            relError: 0.34176,
          },
          {
            targetPos: [61, 204],
            clickPos: [85, 203],
            round: 2,
            time: 932.41,
            targetDist: 592.487,
            relError: 0.480416,
          },
          {
            targetPos: [386, 338],
            clickPos: [395, 333],
            round: 3,
            time: 771.84,
            targetDist: 329.888,
            relError: 0.205913,
          },
          {
            targetPos: [68, 399],
            clickPos: [63, 396],
            round: 4,
            time: 883.7,
            targetDist: 333.594,
            relError: 0.116619,
          },
          {
            targetPos: [633, 57],
            clickPos: [657, 60],
            round: 5,
            time: 957.36,
            targetDist: 663.19,
            relError: 0.483735,
          },
          {
            targetPos: [545, 348],
            clickPos: [531, 330],
            round: 6,
            time: 568.245,
            targetDist: 309.011,
            relError: 0.45607,
          },
          {
            targetPos: [3, 69],
            clickPos: [10, 65],
            round: 7,
            time: 1423.33,
            targetDist: 588.986,
            relError: 0.161245,
          },
          {
            targetPos: [530, 69],
            clickPos: [492, 62],
            round: 8,
            time: 766.815,
            targetDist: 520.015,
            relError: 0.772787,
          },
          {
            targetPos: [116, 338],
            clickPos: [114, 336],
            round: 9,
            time: 829.545,
            targetDist: 466.425,
            relError: 0.0565685,
          },
          {
            targetPos: [500, 17],
            clickPos: [507, 43],
            round: 10,
            time: 1392.18,
            targetDist: 500.756,
            relError: 0.538516,
          },
          {
            targetPos: [166, 291],
            clickPos: [195, 279],
            round: 11,
            time: 734.615,
            targetDist: 421.646,
            relError: 0.627694,
          },
          {
            targetPos: [602, 52],
            clickPos: [608, 63],
            round: 12,
            time: 632.23,
            targetDist: 466.024,
            relError: 0.250599,
          },
          {
            targetPos: [717, 365],
            clickPos: [719, 363],
            round: 13,
            time: 946.175,
            targetDist: 321.069,
            relError: 0.0565685,
          },
          {
            targetPos: [35, 65],
            clickPos: [75, 85],
            round: 14,
            time: 905.58,
            targetDist: 746.096,
            relError: 0.894427,
          },
          {
            targetPos: [304, 384],
            clickPos: [300, 370],
            round: 15,
            time: 723.97,
            targetDist: 376.619,
            relError: 0.291204,
          },
        ],
      },
      cmaTime: 872.6999999994405,
      cmaDist: 18.98714064604657,
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
    console.log(query);
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
          histogramTitle={<HelpfulText hint="Plots reaction times (x-axis) against the frequency with which similar times have been observed in other participants .">Time Histogram</HelpfulText>}
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
              value:
                100 * errorPoints.mean,
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
    const {testUnplayed, testActive, targetRadius: radius} = this.state;
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
    console.log(this.state);
    let {style, targetRadius: radius, minWidth, maxWidth} = this.props;
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
