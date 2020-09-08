import React, {Component} from 'react';
import {Link as RouteLink, Route, Switch, withRouter} from 'react-router-dom';
import {Button, Layout, Typography} from 'antd';
import ReactionTimeTest from './ReactionTimeTest';
import AimTest from './AimTest';
import LandingPage from './LandingPage';
import {shuffleInPlace} from './utils';
import './App.less';
import NumberMemory from './NumberMemory';
import {LoginModal, RegisterModal} from './FormModals';
import {ReactComponent as SeniorBenchmarkLogo} from './images/seniorbenchmark_logo.svg';
import {ReactComponent as NumberMemoryLogo} from './images/number_memory.svg';
import {ReactComponent as AimTestLogo} from './images/aim_test.svg';
import {ReactComponent as ReactionTimeLogo} from './images/reaction_time.svg';
import UserPage from './UserPage';

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
      activeModal: null,
      confirmLoading: false,
      loggedin: false,
      username: false,
    };
  }

  componentDidMount() {
    fetch('/api/session')
      .then((response) => response.json())
      .then((data) => {
        if (data.loggedin) {
          this.setState({loggedin: true, username: data.username});
        } else {
          this.setState({loggedin: false, username: null});
        }
      })
      .catch((error) => {
        console.error(error);
        this.setState({loggedin: false, username: null});
      });
  }

  showModal = (modal) => {
    this.setState({activeModal: modal});
  };

  handleLogout = () => {
    fetch('/api/logout')
      .then((response) => {
        console.log(response);
        if (response.ok) {
          this.setState({loggedin: false, username: null});
          this.props.history.push('/');
        } else {
          console.error('bad response');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <div className="header-overlay">
            <div className="logo-and-title">
              <SeniorBenchmarkLogo className="app-logo" />
              <Title className="app-title">Senior Benchmark</Title>
            </div>
            <div
              id="account-actions"
              className={this.state.loggedin ? 'loggedin' : 'not-loggedin'}
            >
              {this.state.loggedin ? (
                <>
                  <RouteLink
                    className="username"
                    to="/user-page"
                    component={Link}
                  >
                    {this.state.username}
                  </RouteLink>
                  <Button
                    type="ghost"
                    size="small"
                    className="account-action-button"
                    onClick={this.handleLogout}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    type="ghost"
                    className="account-action-button"
                    onClick={() => this.showModal('register')}
                  >
                    Register
                  </Button>
                  <Button
                    size="small"
                    type="ghost"
                    className="account-action-button"
                    onClick={() => this.showModal('login')}
                  >
                    Login
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="header-background">
            <div
              className="skewed-div"
              onClick={() => this.props.history.push('/')}
            />
            <div
              className="skewed-div"
              onClick={() => this.props.history.push('/reaction-time')}
            >
              <div className="skewed-div-contents">
                  <ReactionTimeLogo className="icon-image"/>
                <div className="icon-text">Reaction Time</div>
              </div>
            </div>
            <div
              className="skewed-div"
              onClick={() => this.props.history.push('/number-memory')}
            >
              <div className="skewed-div-contents">
                <NumberMemoryLogo className="icon-image" />
                <div className="icon-text">Number Memory</div>
              </div>
            </div>
            <div
              className="skewed-div"
              onClick={() => this.props.history.push('/aim-test')}
            >
              <div className="skewed-div-contents">
                <AimTestLogo className="icon-image" />
                <div className="icon-text">Aim Test</div>
              </div>
            </div>
            <div className="skewed-div" />
          </div>
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
              <Route path="/user-page">
                <UserPage
                  session={{
                    username: this.state.username,
                    loggedin: this.state.loggedin,
                  }}
                />
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
          visible={this.state.activeModal === 'login'}
          onCancel={() => this.showModal(null)}
          onClickHeaderLink={() => this.showModal('register')}
          onFinish={console.log}
          afterFinish={(v) => this.setState(v)}
        />
        <RegisterModal
          visible={this.state.activeModal === 'register'}
          onCancel={() => this.showModal(null)}
          onClickHeaderLink={() => this.showModal('login')}
          onFinish={console.log}
          afterFinish={(v) => this.setState(v)}
        />
      </Layout>
    );
  }
}

export default withRouter(App);
