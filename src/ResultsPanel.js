import React, {Component} from 'react';
import {classConcat} from './utils';
import {Card, Typography} from 'antd';
import './ResultsPanel.less';
import Histogram from './Histogram';

const {Text} = Typography;

class ResultsPanel extends Component {
  constructor(props) {
    super(props);
    const {query, ...data} = props.data;
    this.state = {
      bandwidth: props.bandwidth,
      kernel: 'quadratic',
      query: query,
      data: data,
    };
    console.log(query);
    console.log(data);
  }

  render() {
    const type = this.props.type;
    console.log('from respan', this.props.data);
    const {q1, q3} = this.props.data.globalSummary;
    const cutoff = Math.max(q3 + 2 * (q3 - q1), ...this.props.data.query.times);
    return (
      <div className={classConcat('ResultsPanel', type)}>
        <Card className="stats-card">
          <div className="label-and-stat">
            <Text strong>Mean Time</Text>
            <Text>
              {this.state.query['mean'].toFixed(
                2
              )}
              ms
            </Text>
          </div>
          <div className="label-and-stat">
            <Text strong>Mean Percentile</Text>
            <Text>
              {((1 - this.state.query['meanQuantile']) * 100).toFixed(2)}
            </Text>
          </div>
        </Card>
        <Histogram
          className="histogram-card"
          data={this.state.data.histogram}
          cutoff={cutoff}
          points={this.state.query}
          padding={30}
          bandwidth={this.state.bandwidth}
          kernel={this.state.kernel}
          title="Here's a Histogram!"
        />
      </div>
    );
  }
}

ResultsPanel.defaultProps = {
  type: 'ReactionTimeTest',
  data: {},
  bandwidth: 2.1,
};

export default ResultsPanel;
