import React, {Component, useRef} from 'react';
import {Route, Switch, Link as RouteLink, withRouter} from 'react-router-dom';
import {Divider, Layout, Typography, Button, Modal} from 'antd';
import ReactionTimeTest from './ReactionTimeTest';
import AimTest from './AimTest';
import Login from './Login';
import LandingPage from './LandingPage';
import {shuffleInPlace} from './utils';
import './App.less';
import {LoginModal, RegisterModal} from './FormModals';
import {ReactComponent as SeniorBenchmarkLogo} from './images/seniorbenchmark_logo.svg';
import {ReactComponent as NumberMemoryLogo} from './images/number_memory.svg';
import {ReactComponent as AimTestLogo} from './images/aim_test.svg';
import {ReactComponent as ReactionTimeLogo} from './images/reaction_time.svg';

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
      showModal: null,
    };
  }

  showModal = (modal) => {
    this.setState({showModal: modal});
  };

  render() {
    console.log(this.props);
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <div className="header-overlay">
            <div className="logo-and-title">
              <SeniorBenchmarkLogo className="app-logo" />
              <Title className="app-title">Senior Benchmark</Title>
            </div>
          </div>
          <div className="header-background">
            <div
              className="skewed-div"
              onClick={() => this.props.history.push('/')}
            />
            <div className="skewed-div">
              <div className="skewed-div-contents">
                <ReactionTimeLogo className="icon-image" />
                <span>Reaction Time</span>
              </div>
            </div>
            <div className="skewed-div">
              <div className="skewed-div-contents">
                <NumberMemoryLogo className="icon-image" />
                <span>Number Memory</span>
              </div>
            </div>
            <div className="skewed-div">
              <div className="skewed-div-contents">
                <AimTestLogo className="icon-image" />
                <span>Aim Testa</span>
              </div>
            </div>
            <div className="skewed-div" />
          </div>
          {/*<div id="account-actions">*/}
          {/*  <Link*/}
          {/*    type="link"*/}
          {/*    className="action"*/}
          {/*    onClick={() => this.showModal('login')}*/}
          {/*  >*/}
          {/*    Login*/}
          {/*  </Link>*/}
          {/*  <Link*/}
          {/*    type="link"*/}
          {/*    className="action"*/}
          {/*    onClick={() => this.showModal('register')}*/}
          {/*  >*/}
          {/*    Create account*/}
          {/*  </Link>*/}
          {/*</div>*/}
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
              <Route path="/login">
                <Login />
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
        <LoginModal
          visible={this.state.showModal === 'login'}
          onCancel={() => this.showModal(null)}
          onClickHeaderLink={() => this.showModal('register')}
        />
        <RegisterModal
          visible={this.state.showModal === 'register'}
          onCancel={() => this.showModal(null)}
          onClickHeaderLink={() => this.showModal('login')}
        />
      </Layout>
    );
  }
}

export default withRouter(App);
