import React, {Component} from 'react';
import {classConcat, mapLength} from './utils';
import {Space, Typography, Button, Card} from 'antd';
import './ResultsPanel.less';
import Histogram from './Histogram';
import * as d3 from 'd3';
// import {scaleLinear} from 'd3-scale';

const {Title, Text} = Typography;

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
    return (
      <div className={classConcat('ResultsPanel', type)}>
        {/*<Title>RESULTS</Title>*/}
        <Card className="stats-card">
          <div className="label-and-stat">
            <Text strong>Mean Time</Text>
            <Text>{this.state.query['mean'].toFixed(2)}ms</Text>
          </div>
          <div className="label-and-stat">
            <Text strong>Mean Percentile</Text>
            <Text>{((1 - this.state.query['meanQuantile']) * 100).toFixed(2)}</Text>
          </div>
        </Card>

        {/*<Button*/}
        {/*  onClick={() => {*/}
        {/*    const newTimes = mapLength(5, () => Math.random() * 600 + 50);*/}
        {/*    this.setState({*/}
        {/*      query: {*/}
        {/*        id: null,*/}
        {/*        times: newTimes,*/}
        {/*        mean: d3.mean(newTimes),*/}
        {/*        sd: d3.deviation(newTimes),*/}
        {/*        meanQuantile: null,*/}
        {/*        sdQuantile: null,*/}
        {/*      },*/}
        {/*    });*/}
        {/*  }}*/}
        {/*>*/}
        {/*  Randomize Times*/}
        {/*</Button>*/}
        <Histogram
          className="histogram-card"
          data={this.state.data}
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
