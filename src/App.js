import React, {Component} from 'react';
import {Layout, Typography} from 'antd';
import {Route, Switch, BrowserRouter as Router} from 'react-router-dom';
import ReactionTimeTest from './ReactionTimeTest';
import AimTest from './AimTest';
import LandingPage from './LandingPage';
import {shuffleInPlace} from './utils';
import './App.less';
import NumberMemory from './NumberMemory';

const {Title, Text, Link} = Typography;
const {Header, Content, Footer} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    // Randomize order on initial load, but never change once the app has started.
    this.state = {
      footerLinks: shuffleInPlace([
        <Link key="Adam">Adam Smith</Link>,
        <Link key="Aaron">Aaron Zehm</Link>,
      ]),
    };
  }

  render() {
    return (
      <Router>
        <Layout id="app-layout">
          <Header id="app-header">
            <Title>Senior Benchmark</Title>
          </Header>
          <Layout id="content-layout">
            <Content id="main-content">
              <Switch>
                <Route path="/reaction-time">
                  <ReactionTimeTest />
                </Route>
                <Route path="/aim-test">
                  <AimTest />
                </Route>
                <Route path="/number-memory">
                  <NumberMemory />
                </Route>
                <Route path="/">
                  <LandingPage />
                </Route>
              </Switch>
            </Content>
          </Layout>
          <Footer id="app-footer">
            <div className="footer-content">
              <Text>2020</Text>
              {this.state.footerLinks}
            </div>
          </Footer>
        </Layout>
      </Router>
    );
  }
}

export default App;
