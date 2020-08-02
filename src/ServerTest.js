import React, {Component} from 'react';
import './ServerTest.less';
import {Button, Card, Divider, Slider, Space, Switch, Typography} from 'antd'; // Components we'll use from antd
// They'll mostly appear in JSX.
import {DownCircleOutlined} from '@ant-design/icons';

const {Text, Title, Link} = Typography;

// Helper function to make marks object (https://ant.design/components/slider/#API)
function makeSliderMarks([rmin, rmax, rstep]) {
  return [...Array(Math.floor((rmax - rmin) / rstep) + 1)]
    .map((_, i) => rmin + i * rstep)
    .reduce((m, x) => {
      m[x] = x;
      return m;
    }, {});
}

// Helper function to identify the contents of the response card based on parsed json from the server. Returns an object
// with keys [title, main, mainClass, sub, additional].
// For generality, we will make the value of 'additional' something we can insert directly into a JSX expression.
// Note that in some situations, we return a component fragment, but in others it may evaluate to null or false.
// This is allowed: https://reactjs.org/docs/conditional-rendering.html
function collectResultsContent(loading, response) {
  return {
    title: loading ? 'Fetching...' : response.ok ? response.data.message : 'Something Went Wrong.',
    ...(response.ok
      ? {
          main: response.data.number,
          mainClass: '',
          sub: `Generated ${response.data.generated}`,
          additional: null,
        }
      : {
          main: response.status,
          mainClass: 'status-error',
          sub: response.data.statusText || '',
          additional: response.status === 500 && (
            // These <> ... </> tags delimit a component fragment.
            // The stuff inside the fragment gets spliced into any parent JSX expression.
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
        }),
  };
}

// Our main class ServerTest extends React.Component.
// In files that import this class (such as our App.js), this component can be included in a JSX expression.
class ServerTest extends Component {
  // The class is constructed from its props (the xml-like key="value" pairs in the JSX expression)
  constructor(props) {
    super(props); // Explicitly call component prototype constructor.
    // any Component that requires an internal state to decide its appearance or behavior should maintain a state object
    // with the 'state' key. How we choose to structure the state object is arbitrary, but the only place you should
    // directly assign this.state is in the constructor.
    // After construction, changes to a component's state must be made through the function this.setState, inherited
    // from React.Component. This ensures (among other things) that these changes are reflected in the DOM.
    // More info here: https://reactjs.org/docs/state-and-lifecycle.html#using-state-correctly
    this.state = {
      numberRange: [-10, 10], // represents our range of numbers selected on the slider.
      fuckUpOnPurpose: false, // should we mess up our api call? Use to test what happens when a request fails.
      loading: true, // is the component is currently loading a new server response?
      response: {
        // represents the latest response from the server. Initialize with nullish stuff.
        ok: false,
        status: null,
        timestr: '',
        data: {},
      },
    };
    // Properties that won't change or don't affect the component's rendering can be stored and manipulated like usual
    this.sliderRange = [-50, 50, 10]; // [min, max, step]
    this.sliderMarks = makeSliderMarks(this.sliderRange); // compute marks once in the constructor and store result
  }

  // This method will be called after the component is constructed, mounted to the DOM, and first rendered.
  // Part of the React.ComponentClass interface.
  // https://reactjs.org/docs/state-and-lifecycle.html#adding-lifecycle-methods-to-a-class
  componentDidMount() {
    this.handleGetRandomNumber(); // fetch first number right after mounting.
  }

  // Event handler for when the slider is changed.
  // It matters that we've used arrow function syntax here, because js is a language of reasonable behavior and
  // perfect clarity when it comes to binding the 'this' keyword.
  // https://www.freecodecamp.org/news/this-is-why-we-need-to-bind-event-handlers-in-class-components-in-react-f7ea1a6f93eb/
  handleNumberRangeChange = (value) => {
    this.setState({numberRange: value}); // state should always be changed with a call to setState.
  };

  // Event handler for when the switch is flipped
  handleSwitchChange = (value) => {
    this.setState({fuckUpOnPurpose: value}, this.handleGetRandomNumber);
  };

  // Event handler for when "Get Random Integer" button is clicked.
  // Uses fetch api to query the server for a random integer in the input slider's range, and then sets the component's
  // state based on the response.
  handleGetRandomNumber = () => {
    // Here, we use the 2 argument form of setState to pass a callback function for after state is updated.
    this.setState(
      {loading: true}, // begin by setting the loading state to true
      () => {
        const [min, max] = this.state.numberRange;
        fetch(
          '/api/random-int' +
            (this.state.fuckUpOnPurpose
              ? '' // omit query string if we want an error
              : `?min=${min}&max=${max}`)
        )
          .then((response) => {
            // bad status codes do not automatically raise errors, but I'd prefer to deal with them in the .catch callback.
            // So, when I get a response with a bad code, I throw an error object with the bad response attached,
            // which will find its way to the .catch callback.
            if (!response.ok) {
              const err = new Error(response.statusText);
              err.badResponse = response;
              throw err;
            }
            return response.json();
          })
          .then((data) => {
            // Callback for when json has been parsed from valid response.
            this.setState({
              loading: false, // set this.state.loading back to false; we were successful
              response: {
                ok: true, // valid response parsed successfully
                status: null,
                timestr: new Date().toTimeString().split(' ', 1)[0], // time string for when we finished.
                data: data,
              },
            });
          })
          .catch((error) => {
            // Any error raised in the previous two callbacks will be caught here.
            // To see if we're here b/c of a bad status code, we check the badResponse property of our error, which
            // should only be defined if we threw it ourselves from the first callback.
            const {badResponse} = error;
            this.setState({
              loading: false, // loading has still finished.
              response: {
                ok: false, // unsuccessful query
                status: badResponse ? badResponse.status : null, // Later, we can infer a bad server response when
                // (!this.response.ok && this.response.status !== null)
                timestr: new Date().toTimeString().split(' ', 1)[0],
                data: badResponse || error.message,
              },
            });
          });
      }
    );
  };

  // This function is called each time the component is redrawn.
  // Must return a ReactNode object, usually expressed in JSX.
  // Notice that we read from this.state a lot to determine the structure of the object that's returned.
  render() {
    const {loading, response} = this.state;
    const rc = collectResultsContent(loading, response);
    const sliderProps = {
      // extract properties of slider to a variable for readability
      min: this.sliderRange[0],
      max: this.sliderRange[1],
      marks: this.sliderMarks,
      defaultValue: this.state.numberRange,
      onChange: this.handleNumberRangeChange,
      onAfterChange: this.handleGetRandomNumber,
    };
    return (
      // Wrapping long JSX expressions in parens is usually a good idea, since it prevents the parser from helpfully
      // inserting semicolons where they should not be.
      <div className="ServerTest">
        <Title className="page-title">Server Request Demo</Title>
        <Text className="page-subtitle">"To prove our back end works!"</Text>
        <Space direction="vertical" size="large">
          <div className="card-wrapper">
            <Card
              className="server-test-card"
              title="Input"
              extra={
                <Space>
                  Fuck up.
                  <Switch onChange={this.handleSwitchChange} />
                </Space>
              }
            >
              <div className="input card-body-wrapper">
                <Slider range {...sliderProps} />
                <Button type="primary" onClick={this.handleGetRandomNumber}>
                  Get Random Integer!
                </Button>
              </div>
            </Card>
          </div>
          <Divider className="main-divider">
            <DownCircleOutlined />
          </Divider>
          <div className="card-wrapper">
            <Card
              className="server-test-card results-card"
              loading={loading}
              title={rc.title}
              extra={<Text type="secondary">{response.timestr}</Text>}
            >
              <div className="results card-body-wrapper">
                <Title className={rc.mainClass}>{rc.main}</Title>
                <Title level={2}>{rc.sub}</Title>
              </div>
              {rc.additional /* Directly embed fragment or falsy value.*/}
            </Card>
          </div>
          <Link
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="react-link"
          >
            More About React
          </Link>
        </Space>
      </div>
    );
  }
}

export default ServerTest;
