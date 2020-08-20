import React, {Component} from 'react';
import './AimTest.less';
import {
  classConcat,
  dist2d,
  formatMilliseconds,
  mapLength,
  takeValues,
} from './utils';
import {Divider, Space, Table, Typography} from 'antd';
import _ from 'lodash';

const {Text, Title} = Typography;

const ROUNDS = 5;

function Target(props) {
  const {r, pos, rings, cr, ...rest} = props;
  const s = r - cr;
  return (
    <svg x={pos[0]} y={pos[1]} {...rest} className="Target">
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
    </svg>
  );
}

Target.defaultProps = {
  pos: [0, 0], // x, y location
  r: 50, // target radius
  rings: 3, // number of rings
  cr: 4, // center radius
};

function StartButton(props) {
  return (
    <svg x="50%" y="50%" className="StartButton">
      <circle {...props} className="button-body" />
      <text className="button-text">{props.children}</text>
    </svg>
  );
}

const RESULTS_COLUMNS = [
  {
    title: 'Position',
    children: [
      {title: 'Spawn', dataIndex: 'pos', render: ([x, y]) => `[${x}, ${y}]`},
      {
        title: 'Click',
        dataIndex: 'clickPos',
        render: ([x, y]) => `[${x}, ${y}]`,
      },
      {
        title: 'Distance',
        key: 'elapsed',
        render: (text, row) => dist2d(row.pos, row.clickPos).toFixed(3),
      },
    ],
  },
  {
    title: 'Time',
    children: [
      {title: 'Spawn', dataIndex: 'spawnTime', render: (n) => n.toFixed(3)},
      {title: 'Click', dataIndex: 'clickTime', render: (n) => n.toFixed(3)},
      {
        title: 'Elapsed',
        key: 'elapsed',
        render: (text, row) =>
          formatMilliseconds(row.clickTime - row.spawnTime),
      },
    ],
  },
];

class AimTest extends Component {
  constructor(props) {
    super(props);

    /*
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
    * */

    this.targetSpawnTime = null;
    this.testArea = React.createRef();
    this.state = {
      testActive: false,
      round: null,
      targetPos: null,
      results: null,
    };
  }

  /*
  componentDidMount() {
    this.setState({
      target: this.createTarget(true),
    });
  }
*/

  componentWillUnmount() {
    if (!this.state.testTimeout) return;
    this.setState((state) => {
      clearTimeout(state.testTimeout);
      return {testTimeout: null};
    });
  }

  spawnRandomTarget = () => {
    this.targetSpawnTime = null;
    return this.testArea.current
      ? takeValues(
          this.testArea.current,
          ['clientWidth', 'clientHeight'],
          (x) => Math.floor(Math.random() * x) // integer coordinates
        )
      : [0, 0];
  };

  // createTarget = () => {
  //   return {
  //     pos: this.testArea.current
  //       ? takeValues(
  //           this.testArea.current,
  //           ['clientWidth', 'clientHeight'],
  //           (x) => Math.floor(Math.random() * x) // integer coordinates
  //         )
  //       : [0, 0],
  //   };
  // };

  handleTargetClick = ({nativeEvent: event}) => {
    const now = performance.now();
    const targetSpawnTime = this.targetSpawnTime;
    if (!targetSpawnTime) return; // indicates duplicate click on target, since we clear targetSpawnTime in this function.

    this.targetSpawnTime = null;
    this.setState((state, props) => {
      const newState = {
        testLog: [
          ...state.testLog,
          {
            spawnPos: state.targetPos,
            spawnTime: targetSpawnTime,
            clickPos: [event.offsetX, event.offsetY],
            clickTime: now,
          },
        ],
      };
      if (state.round < props.rounds) {
        newState.round = state.round + 1;
        newState.targetPos = this.spawnRandomTarget();
      } else {
        newState.testActive = false;
        newState.round = null;
        newState.targetPos = null;
        console.log('Test done', newState.testLog);
      }
      return newState;
    });
  };

  handleTestStart = () => {
    this.setState((state) =>
      state.testActive
        ? null
        : {
            testActive: true,
            round: 1,
            targetPos: this.spawnRandomTarget(),
            testLog: [],
          }
    );
  };

  render() {
    return (
      <div className="AimTest" style={this.props.style}>
        <Space direction="vertical">
          <Title className="main-title">Click Test</Title>
          <div
            className="test-area-container"
            style={{
              padding: this.props.targetRadius,
              ..._.pick(this.props, [
                'minWidth',
                'maxWidth',
                'minHeight',
                'maxHeight',
              ]),
            }}
          >
            <svg
              className="test-area"
              ref={this.testArea}
              height={this.props.height - 2 * this.props.targetRadius}
            >
              {this.state.testActive ? (
                <Target
                  onClick={this.handleTargetClick}
                  pos={this.state.targetPos}
                  r={this.props.targetRadius}
                />
              ) : (
                <StartButton
                  onClick={this.handleTestStart}
                  r={this.props.targetRadius}
                >
                  Start!
                </StartButton>
              )}
            </svg>
          </div>
          <Space>
            {this.state.testActive ? (
              <Text key="remaining">Remaining: {this.props.rounds - this.state.round}</Text>
            ) : (
              <Text key="status">Test Inactive</Text>
            )}
          </Space>
          {this.state.results && [
            <Divider key="divider">
              <Title>Results</Title>
            </Divider>,
            <Table
              key="table"
              bordered
              pagination={false}
              columns={RESULTS_COLUMNS}
              dataSource={this.state.results}
              rowKey="spawnTime"
            />,
          ]}
        </Space>
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
