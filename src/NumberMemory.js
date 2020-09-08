import React, {Component} from 'react';
import {Button, Input, Statistic, Typography} from 'antd';
import './NumberMemory.less';
import Histogram from './Histogram';
import {ordinalEnding} from './utils';
import {ResultsLayout} from './ResultFormatters';

const {Title, Text} = Typography;

class NumberMemory extends Component {
  constructor(props) {
    super(props);
    this.state = {
      round: null,
      number: null,
      input: null,
      active: null,
      phase: 'Begin',
      timerId: null,
      results: null,
    };
  }

  submitResults = () => {
    const bodyContent = {round: this.state.round - 1};
    console.log('POSTing', bodyContent);
    fetch('/api/number-memory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyContent),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('GOT RESPONSE', data);
        this.updateResults(data.insertId);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  updateResults = (id) => {
    console.log('updating results');
    fetch(`/api/number-memory?id=${id}`)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        this.setState({results: data});
      })
      .catch((error) => {
        console.log('a badness!');
        console.error(error);
      });
  };

  numberGenerator = () => {
    return Math.floor(Math.random() * 10);
  };

  digitCoordinator = (n) => {
    let number = String(Math.floor(Math.random() * 9) + 1);
    for (let i = 0; i < n - 1; i++) {
      number += this.numberGenerator();
    }
    return number;
  };

  compareInput = (event) => {
    event.preventDefault();
    this.setState((state) => {
      if (state.input === state.number) {
        return {phase: 'resultsPass'};
      }
      this.submitResults();
      return {phase: 'resultsFail'};
    });
  };

  handleChange = (event) => {
    this.setState({input: event.target.value});
  };

  startGame = () => {
    this.setState({round: 0, active: true}, this.nextChallenge);
  };

  nextChallenge = () => {
    this.setState((state) => {
      return {
        number: this.digitCoordinator(state.round + 1),
        phase: 'Challenge',
        timerId: setTimeout(this.startPrompt, (state.round + 1) * 800),
        round: state.round + 1,
        input: '',
      };
    });
  };

  startPrompt = () => {
    this.setState({phase: 'Prompt', timerId: null});
  };

  letTheGamesBegin = () => {
    // eslint-disable-next-line default-case
    switch (this.state.phase) {
      case 'Begin':
        return (
          <>
            <h2>Welcome to the Number Memory Benchmark</h2>
            <h2>How Many Digits Can You Remember!?</h2>
            <p />
            <p />
            <Button onClick={this.startGame} type="primary" size="large">
              Begin!
            </Button>
          </>
        );
      case 'Challenge':
        return (
          <>
            <h2 className="Challenge">Memorize Me!</h2>
            <div className="Number">{this.state.number}</div>
          </>
        );
      case 'Prompt':
        return (
          <>
            <h2 className="Prompt">Did you memorize the number?</h2>
            <Text type="secondary">You can press enter to submit</Text>
            <p />
            <p />
            <Input
              autoFocus
              className="promptInput"
              size="large"
              onPressEnter={this.compareInput}
              onChange={this.handleChange}
              value={this.state.input}
            />
            <p />
            <p />
            <Button onClick={this.compareInput} type="primary">
              Submit
            </Button>
          </>
        );
      case 'resultsPass':
        return (
          <>
            <Text className="Text">Number: {this.state.number}</Text>
            <p />
            <Text className="Text">
              Your Correct Answer: {this.state.input}
            </Text>
            <p />
            <Text className="Text">Round: {this.state.round}</Text>
            <p />
            <Button autoFocus onClick={this.nextChallenge} type="primary">
              Next Challenge
            </Button>
          </>
        );
      case 'resultsFail':
        return (
          <>
            <Text className="Text">Number: {this.state.number}</Text>
            <p />
            <Text className="Text">
              Your Wrong Answer:{' '}
              <Text className="Text" delete>
                {this.state.input}
              </Text>
            </Text>
            <p />
            <Text className="Text">Round: {this.state.round}</Text>
            <p />
            <Button onClick={this.startGame} type="primary" autoFocus>
              Try Again?
            </Button>
          </>
        );
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
      <div className="NumberMemory">
        <Title className="Title">Number Memory</Title>
        <div className="Main">{this.letTheGamesBegin()}</div>
        {results && (
          <>
            <Title className="page-title">Results</Title>
            <ResultsLayout
              stats={[
                <Statistic
                  title="Longest Number"
                  precision={0}
                  value={results.query['max_round']}
                  suffix="digits"
                />,
                <Statistic
                  title="Percentile"
                  value={Math.round(100 * results.query['quantile'])}
                  suffix={ordinalEnding(
                    Math.round(100 * results.query['quantile'])
                  )}
                />,
              ]}
              statsTitle="Your Stats"
              histogram={
                <Histogram
                  className="histogram-card"
                  discreteQuantile={true}
                  data={results.histogram}
                  cutoff={this.calculateCutoff()}
                  xAxis={{digits: 0, title: 'Digits Memorized'}}
                  yAxis={{title: 'Frequency'}}
                  points={results.query}
                  // title="Global Performance"
                  // ascending={false}
                />
              }
              histogramTitle="Global Performance"
            />
          </>
        )}
      </div>
    );
  }
}

export default NumberMemory;
