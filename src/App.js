import React, {Component} from 'react';
import './App.less';
import {Button, Card, Divider, Slider, Space, Switch, Typography, Layout} from 'antd';
import {DownCircleOutlined} from '@ant-design/icons';

const {Text, Title, Link} = Typography;
const {Header, Content, Footer} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    // any class that extends React.Component and needs to maintain some internal state should do so by
    // defining its 'state' object.
    this.state = {
      numberRange: [-10, 10],
      fuckUpOnPurpose: false,
      loading: true,
      response: {
        ok: false,
        status: null,
        timestr: '',
        data: {},
      },
    };
    this.sliderRange = [-50, 50, 10]; // [min, max, step]
    this.sliderMarks = makeSliderMarks(this.sliderRange);
  }

  componentDidMount() {
    this.handleGetRandomNumber(); // Start fetching number immediately upon mounting.
  }

  /*
   * The syntax to defining handlers can be tricky, because js has some strange behavior for binding
   * the 'this' keyword. I prefer the following syntax, which uses arrow functions:
   */
  handleNumberRangeChange = (value) => {
    this.setState({numberRange: value});
  };
  /*
   * Note that the same function could be defined using more traditional function syntax
   *   handleNumberRangeChange(value) { ... };
   * The disadvantage is that you also need the line
   *   this.handleNumberRangeChange = this.handleNumberRangeChang.bind(this);
   * somewhere in your constructor to ensure 'this' is explicitly bound.
   * */

  handleSwitchChange = (value) => {
    this.setState({fuckUpOnPurpose: value}, this.handleGetRandomNumber);
  };

  handleGetRandomNumber = () => {
    this.setState({loading: true}, () => {
      const [min, max] = this.state.numberRange;
      fetch(
        this.state.fuckUpOnPurpose
          ? `/api/random-int?mim=${min}&maps=${max}`
          : `/api/random-int?min=${min}&max=${max}`
      )
        .then((response) => {
          if (!response.ok) {
            const err = new Error(response.statusText);
            err.response = response;
            throw err;
          }
          return response.json();
        })
        .then((data) => {
          this.setState({
            loading: false,
            response: {
              ok: true,
              status: null,
              timestr: new Date().toTimeString().split(' ', 1)[0],
              data: data,
            },
          });
        })
        .catch((error) => {
          console.log(error);
          this.setState({
            loading: false,
            response: {
              ok: false,
              status: error.response ? error.response.status : null,
              timestr: new Date().toTimeString().split(' ', 1)[0],
              data: error.response || error.message,
            },
          });
        });
    });
  };

  render() {
    const {loading, response} = this.state;
    const rc = collectResultsContent(loading, response);
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <Title>Project Title</Title>
        </Header>
        <Layout id="content-layout">
          <Content id="main-content">
            <Title className="pageTitle">Server Request Demo</Title>
            <Text style={{fontStyle: 'italic', textAlign: 'center', margin: '0 0 24px'}}>
              "To prove our back end works!"
            </Text>
            <Space direction="vertical" size="large">
              <Card
                className="input-card"
                title="Input"
                extra={
                  <Space>
                    Fuck up.
                    <Switch onChange={this.handleSwitchChange} />
                  </Space>
                }
              >
                <div
                  className="wrapper-div"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    width: '100%',
                  }}
                >
                  <Slider
                    range
                    min={this.sliderRange[0]}
                    max={this.sliderRange[1]}
                    marks={this.sliderMarks}
                    defaultValue={this.state.numberRange}
                    onChange={this.handleNumberRangeChange}
                    onAfterChange={this.handleGetRandomNumber}
                    style={{minWidth: '250px'}}
                  />
                  <Button
                    type="primary"
                    style={{margin: '20px auto 0'}}
                    onClick={this.handleGetRandomNumber}
                  >
                    Get Random Integer!
                  </Button>
                </div>
              </Card>
            </Space>
            <Divider style={{margin: '24px 0'}}>
              <DownCircleOutlined style={{fontSize: '2em', color: '#f0f0f0'}}/>
              {/*<Title level={2}>Results</Title>*/}
            </Divider>
            <Space direction="vertical" align="center" size="large">
              <Card
                className="results-card"
                loading={loading}
                title={rc.title}
                extra={<Text type="secondary">{response.timestr}</Text>}
              >
                <Space direction="vertical" align="center" style={{width: '100%'}}>
                  <Title className={`output-number ${rc.mainClass}`}>{rc.main}</Title>
                  <Text type="secondary" style={{fontSize: 16}}>
                    {rc.sub}
                  </Text>
                </Space>
                {rc.additional}
              </Card>
              <Link
                className="App-link"
                href="https://reactjs.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn React
              </Link>
            </Space>
          </Content>
        </Layout>
        <Footer id="app-footer">Jesus Christ is that a footer????</Footer>
      </Layout>
    );
  }
}

function makeSliderMarks([rmin, rmax, rstep]) {
  return [...Array(Math.floor((rmax - rmin) / rstep) + 1)]
    .map((_, i) => rmin + i * rstep)
    .reduce((m, x) => {
      m[x] = x;
      return m;
    }, {});
}

function collectResultsContent(loading, response) {
  const content = response.ok
    ? {
        main: response.data.number,
        mainClass: '',
        sub: `Generated ${response.data.generated}`,
      }
    : {
        main: response.status,
        mainClass: 'status-error',
        sub: response.data.statusText || '',
        additional: response.status === 500 && (
          <>
            <Divider />
            <Text>
              This could mean the server isn't up.
              <br />
              Try running <Text code>npm start-server</Text> from the project root directory, then
              reloading this page.
            </Text>
          </>
        ),
      };
  content.title = loading
    ? 'Fetching...'
    : response.ok
    ? response.data.message
    : 'Something Went Wrong.';

  return content;
}

export default App;
