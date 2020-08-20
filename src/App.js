import React, {Component} from 'react';
import './App.less';
import {Divider, Layout, Typography, Space} from 'antd';
import ReactionTimeTest from './ReactionTimeTest';
import AimTest from './AimTest';

const {Title, Text, Link} = Typography;
const {Header, Content, Footer} = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    // Randomize order on initial load, but never change once the app has started.
    this.footerLinks = [
      <Link key="Adam">Adam Smith</Link>,
      <Link key="Aaron">Aaron Zehm</Link>,
    ];
    if (Math.random() < 0.5) this.footerLinks.reverse();
  }

  render() {
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <Title>Senior Benchmark</Title>
        </Header>
        <Layout id="content-layout">
          <Content id="main-content">
            <ReactionTimeTest />
          </Content>
        </Layout>
        <Footer id="app-footer">
          <div className="footer-content">
            <Text>2020</Text>
            {this.footerLinks}
          </div>
        </Footer>
      </Layout>
    );
  }
}

export default App;
