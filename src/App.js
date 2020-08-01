import React, {Component} from 'react';
import './App.less';
import {Layout, Typography} from 'antd';
import ServerTest from './ServerTest';
import ClickTest from './ClickTest';

const {Title} = Typography;
const {Header, Content, Footer} = Layout;

class App extends Component {
  render() {
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <Title>web dev dot com</Title>
        </Header>
        <Layout id="content-layout">
          <Content id="main-content">
            {/*<ClickTest testLength={5} targetRadius={50} maxWidth="auto" />*/}
            <ServerTest />
          </Content>
        </Layout>
        <Footer id="app-footer">Jesus Christ is that a footer????</Footer>
      </Layout>
    );
  }
}

export default App;
