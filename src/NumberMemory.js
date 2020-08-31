import React, {Component} from 'react';
import {Button, Input, Typography} from 'antd';
import './NumberMemory.less';

const {Title, Text} = Typography;

class NumberMemory extends Component {
  constructor(props) {
    super(props);
    this.state = {round: null, number: null, input: null, active: null, phase: 'Begin', timerId: null};
  }

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
    this.setState(state => ({
      phase: state.input === state.number ? 'resultsPass' : 'resultsFail',
    }));
  };

  handleChange = event => {
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
    this.setState({phase: 'Prompt'});
  };

  letTheGamesBegin = () => {
    // eslint-disable-next-line default-case
    switch (this.state.phase) {
      case 'Begin':
        return (
          <>
            <h2>Welcome to the Number Memory Benchmark</h2>
            <h2>How Many Digits Can You Remember!?</h2>
            <p/>
            <p/>
            <Button onClick={this.startGame} type="primary" size="large">Begin!</Button>
          </>
        );
      case 'Challenge':
        return (
          <>
            <h2 className="Challenge">Memorize Me!</h2>
            <div className="Number">
              {this.state.number}
            </div>
          </>
        );
      case 'Prompt':
        return (
          <>
            <h2 className="Prompt">Did you memorize the number?</h2>
            <Text type="secondary">You can press enter to submit</Text>
            <p/>
            <p/>
            <Input
              className="promptInput"
              size="large"
              onPressEnter={this.compareInput}
              onChange={this.handleChange}
              value={this.state.input}
            />
            <p/>
            <p/>
            <Button onClick={this.compareInput} type="primary">Submit</Button>
          </>
        );
      case 'resultsPass':
        return (
          <>
            <Text className="Text">Number: {this.state.number}</Text>
            <p/>
            <Text className="Text">Your Correct Answer: {this.state.input}</Text>
            <p/>
            <Text className="Text">Round: {this.state.round}</Text>
            <p/>
            <Button onClick={this.nextChallenge} type="primary">Next Challenge</Button>
          </>
        );
      case 'resultsFail':
        return (
          <>
            <Text className="Text">Number: {this.state.number}</Text>
            <p/>
            <Text className="Text">Your Wrong Answer: {" "}
              <Text className="Text" delete>{this.state.input}</Text>
            </Text>
            <p/>
            <Text className="Text">Round: {this.state.round}</Text>
            <p/>
            <Button onClick={this.startGame} type="primary">Try Again?</Button>
          </>
        );
    }
  };

  render() {
    return (
      <div className="NumberMemory">
        <Title className="Title">Number Memory</Title>
        <div className="Main">
          {this.letTheGamesBegin()}
        </div>
      </div>
    );
  }
}

export default NumberMemory;