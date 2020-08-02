import React, {Component} from 'react';
import './ClickTest.less';
import {classConcat, dist2d, formatMilliseconds, mapLength, takeValues} from './utils';
import {Divider, Space, Table, Typography} from 'antd';
import _ from 'lodash-es';

const {Text, Title} = Typography;

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
  cr: 4 // center radius
};

function StartButton(props) {
  return (
    <svg x="50%" y="50%" className="StartButton">
      <circle {...props} className="button-body"/>
      <text className="button-text">{props.children}</text>
    </svg>
  );
}

const RESULTS_COLUMNS = [
  {
    title: 'Position',
    children: [
      {title: 'Spawn', dataIndex: 'pos', render: ([x, y]) => `[${x}, ${y}]`},
      {title: 'Click', dataIndex: 'clickPos', render: ([x, y]) => `[${x}, ${y}]`},
      {
        title: 'Distance',
        key: 'elapsed',
        render: (text, row) => dist2d(row.pos, row.clickPos).toFixed(3)
      }
    ]
  },
  {
    title: 'Time',
    children: [
      {title: 'Spawn', dataIndex: 'spawnTime', render: (n) => n.toFixed(3)},
      {title: 'Click', dataIndex: 'clickTime', render: (n) => n.toFixed(3)},
      {
        title: 'Elapsed',
        key: 'elapsed',
        render: (text, row) => formatMilliseconds(row.clickTime - row.spawnTime)
      }
    ]
  }
];

class ClickTest extends Component {
  constructor(props) {
    super(props);
    this.testLog = [];
    this.targetSpawnTime = null;
    this.testArea = React.createRef();
    this.state = {
      testActive: false,
      target: null,
      remainingTargets: null,
      testTimeout: null,
      results: null
    };
  }

  componentDidMount() {
    this.setState({
      target: this.createTarget(true)
    });
  }

  componentWillUnmount() {
    if (!this.state.testTimeout) return;
    this.setState((state) => {
      clearTimeout(state.testTimeout);
      return {testTimeout: null};
    });
  }

  createTarget = () => {
    return {
      pos: this.testArea.current
        ? takeValues(
          this.testArea.current,
          ['clientWidth', 'clientHeight'],
          (x) => Math.floor(Math.random() * x) // integer coordinates
        )
        : [0, 0]
    };
  };

  handleTargetClick = ({nativeEvent: event}) => {
    const now = performance.now();
    if (this.state.target.clickTime) {
      console.log('duplicate click on target');
      return;
    }
    this.testLog.push(
      Object.assign(this.state.target, {
        spawnTime: this.targetSpawnTime,
        clickPos: [event.offsetX, event.offsetY],
        clickTime: now
      })
    );
    this.targetSpawnTime = null;
    this.setState((state) => {
      return state.remainingTargets > 0
        ? {
          remainingTargets: state.remainingTargets - 1,
          testActive: true,
          target: this.createTarget()
        }
        : {
          testActive: false,
          remainingTargets: null,
          target: null,
          results: this.testLog
        };
    });
  };

  handleTestStart = () => {
    if (this.testActive) return;
    console.log('starting test.');
    this.testLog = [];
    this.targetSpawnTime = null;
    this.setState({
      testActive: true,
      remainingTargets: this.props.testLength - 1,
      target: this.createTarget(),
      results: null
    });
  };

  render() {
    const result = (
      <div className="ClickTest" style={this.props.style}>
        <Space direction="vertical">
          <Title className="main-title">Click Test</Title>
          <div
            className="test-area-container"
            style={{
              padding: this.props.targetRadius,
              ..._.pick(this.props, ['minWidth', 'maxWidth', 'minHeight', 'maxHeight'])
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
                  pos={this.state.target.pos}
                  r={this.props.targetRadius}
                />
              ) : (
                <StartButton onClick={this.handleTestStart} r={this.props.targetRadius}>
                  Start!
                </StartButton>
              )}
            </svg>
          </div>
          <Space>
            {this.state.testActive ? (
              <Text key="remaining">Remaining: {this.state.remainingTargets}</Text>
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
            />
          ]}
        </Space>
      </div>
    );
    if (this.state.target && !this.targetSpawnTime) {
      this.targetSpawnTime = performance.now();
    }
    return result;
  }
}

ClickTest.defaultProps = {
  minWidth: 450,
  maxWidth: 1000,
  height: 500,
  targetRadius: 50,
  testLength: 5
};

export default ClickTest;
