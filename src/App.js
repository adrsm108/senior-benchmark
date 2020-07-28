import React, {Component} from 'react';
import './App.less';
import {Layout, Typography} from 'antd';
import ServerTest from './ServerTest';

const {Title} = Typography;
const {Header, Content, Footer} = Layout;

class App extends Component {
  render() {
    return (
      <Layout id="app-layout">
        <Header id="app-header">
          <Title>Project Title</Title>
        </Header>
        <Layout id="content-layout">
          <Content id="main-content">
            <ServerTest />
          </Content>
        </Layout>
        <Footer id="app-footer">Jesus Christ is that a footer????</Footer>
      </Layout>
    );
  }
}

export default App;